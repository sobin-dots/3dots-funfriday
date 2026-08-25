import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import { verifyToken } from './lib/jwt';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Initialize Prisma
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

app.prepare().then(() => {
    const httpServer = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url!, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    });

    const io = new Server(httpServer);

    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (token) {
            const decoded = verifyToken(token) as any;
            if (decoded) {
                socket.data.user = decoded;
            }
        }
        next();
    });

    io.on('connection', async (socket) => {
        socket.data.role = socket.data.role || 'spectator';
        socket.data.memberId = socket.data.memberId || null;
        
        if (socket.data.user) {
            socket.data.role = socket.data.user.role === 'ADMIN' ? 'admin' : 'member';
            socket.data.memberId = socket.data.user.id;
            
            await prisma.member.update({
                where: { id: socket.data.user.id },
                data: { connected: true }
            });
        }

        console.log('A user connected:', socket.id, 'Role:', socket.data.role);

        // Helper to broadcast state to everyone
        const broadcast = async () => {
            const globalState = await prisma.gameState.findUnique({ where: { id: 'global' } });
            if (!globalState) return;

            // Fetch all members
            const membersList = await prisma.member.findMany({
                include: {
                    bids: true,
                    wonItems: true,
                    mythVotes: true,
                    logoVotes: true,
                    solvedCategories: { include: { connectionCategory: true } }
                }
            });

            const members: Record<string, { id: string; name: string; team: string; points: number; quizScore: number; connected: boolean; wonItems: number[] }> = {};
            membersList.forEach((m) => {
                members[m.id] = {
                    id: m.id,
                    name: m.name,
                    team: m.team,
                    points: m.points,
                    quizScore: m.quizScore,
                    connected: m.connected,
                    wonItems: m.wonItems.map((i) => i.no)
                };
            });

            // Build Auction State
            const allAuctionItems = await prisma.auctionItem.findMany({
                orderBy: { no: 'asc' },
                include: { bids: { orderBy: { amount: 'desc' }, take: 1 } }
            });
            const auctionState = {
                activeItemId: globalState.activeAuctionId ? allAuctionItems.find(i => i.id === globalState.activeAuctionId)?.no || null : null,
                items: allAuctionItems.map(i => ({
                    id: i.id,
                    no: i.no,
                    name: i.name,
                    why: i.why,
                    status: i.status,
                    currentBid: i.currentBid,
                    currentBidderId: i.bids[0]?.memberId || null,
                    winnerId: i.winnerId,
                    winningBid: i.winningBid,
                    reason: i.reason
                }))
            };

            // Build Myth State
            const allMythStatements = await prisma.mythStatement.findMany({
                orderBy: { no: 'asc' },
                include: { votes: true }
            });
            const mythState = {
                activeStatementId: globalState.activeMythId ? allMythStatements.find(m => m.id === globalState.activeMythId)?.no || null : null,
                statements: allMythStatements.map(m => {
                    const votes: Record<string, string> = {};
                    m.votes.forEach((v) => votes[v.memberId] = v.vote);
                    return {
                        id: m.id,
                        no: m.no,
                        text: m.text,
                        answer: m.answer,
                        explanation: m.explanation,
                        status: m.status,
                        revealed: m.revealed,
                        totalVotes: m.votes.length,
                        votes
                    };
                })
            };

            // Build Logo State
            const allLogoItems = await prisma.logoItem.findMany({
                orderBy: { no: 'asc' },
                include: { votes: true }
            });
            const logoState = {
                activeLogoId: globalState.activeLogoId ? allLogoItems.find(l => l.id === globalState.activeLogoId)?.no || null : null,
                items: allLogoItems.map(l => {
                    const votes: Record<string, string> = {};
                    l.votes.forEach((v) => votes[v.memberId] = v.vote);
                    return {
                        id: l.id,
                        no: l.no,
                        level: l.level,
                        svg: l.svg,
                        hint: l.hint,
                        answer: l.answer,
                        options: l.options,
                        explanation: l.explanation,
                        status: l.status,
                        revealed: l.revealed,
                        totalVotes: l.votes.length,
                        votes
                    };
                })
            };

            // Build Connection State
            const allConnectionPuzzles = await prisma.connectionPuzzle.findMany({
                orderBy: { no: 'asc' },
                include: { categories: { include: { solvedBy: true } } }
            });
            const connectionState = {
                activePuzzleId: globalState.activeConnectionId ? allConnectionPuzzles.find(p => p.id === globalState.activeConnectionId)?.no || null : null,
                puzzles: allConnectionPuzzles.map(p => {
                    return {
                        id: p.id,
                        no: p.no,
                        title: p.title,
                        status: p.status,
                        revealedCategories: p.revealedCategories,
                        categories: p.categories.map((c) => ({
                            id: c.id,
                            name: c.name,
                            level: c.level,
                            words: c.words,
                            solvedBy: c.solvedBy.map((s) => s.memberId)
                        }))
                    };
                })
            };

            const fullState = {
                phase: globalState.phase,
                members,
                auction: auctionState,
                myth: mythState,
                logo: logoState,
                connection: connectionState
            };

            io.emit('state-update', fullState);
        };

        // Send initial state to the connected user and update others
        broadcast();

        // -- Identity --
        socket.on('spectator:join', (ack) => {
            socket.data.role = 'spectator';
            if (ack) ack({ ok: true });
            broadcast();
        });

        // -- Phase Control --
        socket.on('admin:setPhase', async ({ phase }) => {
            if (socket.data.role !== 'admin') return;
            await prisma.gameState.update({
                where: { id: 'global' },
                data: { phase }
            });
            broadcast();
        });

        // -- Auction Logic --
        socket.on('auction:open', async ({ itemId }) => {
            if (socket.data.role !== 'admin') return;

            const item = await prisma.auctionItem.findUnique({ where: { no: Number(itemId) } });
            if (!item || item.status === 'sold') return;

            // Close any currently active item
            await prisma.auctionItem.updateMany({
                where: { status: 'active' },
                data: { status: 'pending', currentBid: 0 }
            });

            // Open the new item
            await prisma.auctionItem.update({
                where: { id: item.id },
                data: { status: 'active', currentBid: 0 }
            });

            // Update global state
            await prisma.gameState.update({
                where: { id: 'global' },
                data: { phase: 'auction', activeAuctionId: item.id }
            });

            broadcast();
        });

        socket.on('auction:bid', async ({ amount }, ack) => {
            if (socket.data.role !== 'member') return;

            const globalState = await prisma.gameState.findUnique({ where: { id: 'global' } });
            if (!globalState?.activeAuctionId) {
                if (ack) ack({ ok: false, error: 'No active auction.' });
                return;
            }

            const item = await prisma.auctionItem.findUnique({ where: { id: globalState.activeAuctionId } });
            const member = await prisma.member.findUnique({ where: { id: socket.data.memberId } });

            if (!item || !member || item.status !== 'active') return;

            if (member.points < amount) {
                if (ack) ack({ ok: false, error: 'Not enough points.' });
                return;
            }

            if (amount <= item.currentBid) {
                if (ack) ack({ ok: false, error: 'Bid must be higher than current bid.' });
                return;
            }

            await prisma.auctionBid.create({
                data: {
                    amount,
                    memberId: member.id,
                    itemId: item.id
                }
            });

            await prisma.auctionItem.update({
                where: { id: item.id },
                data: { currentBid: amount }
            });

            if (ack) ack({ ok: true });
            broadcast();
        });

        socket.on('auction:sell', async () => {
            if (socket.data.role !== 'admin') return;

            const globalState = await prisma.gameState.findUnique({ where: { id: 'global' } });
            if (!globalState?.activeAuctionId) return;

            const item = await prisma.auctionItem.findUnique({
                where: { id: globalState.activeAuctionId },
                include: { bids: { orderBy: { amount: 'desc' }, take: 1 } }
            });

            if (!item || item.status !== 'active') return;

            const highestBid = item.bids[0];
            if (highestBid) {
                await prisma.auctionItem.update({
                    where: { id: item.id },
                    data: {
                        status: 'sold',
                        winnerId: highestBid.memberId,
                        winningBid: highestBid.amount
                    }
                });

                await prisma.member.update({
                    where: { id: highestBid.memberId },
                    data: { points: { decrement: highestBid.amount } }
                });
            } else {
                await prisma.auctionItem.update({
                    where: { id: item.id },
                    data: { status: 'sold' }
                });
            }

            await prisma.gameState.update({
                where: { id: 'global' },
                data: { activeAuctionId: null }
            });

            broadcast();
        });

        // -- Myth Buster Logic --
        socket.on('myth:open', async ({ mythId }) => {
            if (socket.data.role !== 'admin') return;

            const stmt = await prisma.mythStatement.findUnique({ where: { no: Number(mythId) } });
            if (!stmt || stmt.status === 'completed') return;

            await prisma.mythStatement.updateMany({
                where: { status: 'active' },
                data: { status: 'pending' }
            });

            await prisma.mythStatement.update({
                where: { id: stmt.id },
                data: { status: 'active' }
            });

            await prisma.gameState.update({
                where: { id: 'global' },
                data: { phase: 'myth', activeMythId: stmt.id }
            });

            broadcast();
        });

        socket.on('myth:vote', async ({ vote }, ack) => {
            if (socket.data.role !== 'member') return;

            const globalState = await prisma.gameState.findUnique({ where: { id: 'global' } });
            if (!globalState?.activeMythId) return;

            const stmt = await prisma.mythStatement.findUnique({ where: { id: globalState.activeMythId } });
            if (!stmt || stmt.status !== 'active') return;

            await prisma.mythVote.upsert({
                where: {
                    memberId_statementId: {
                        memberId: socket.data.memberId,
                        statementId: stmt.id
                    }
                },
                update: { vote },
                create: {
                    vote,
                    memberId: socket.data.memberId,
                    statementId: stmt.id
                }
            });

            if (ack) ack({ ok: true });
            broadcast();
        });

        socket.on('myth:reveal', async () => {
            if (socket.data.role !== 'admin') return;

            const globalState = await prisma.gameState.findUnique({ where: { id: 'global' } });
            if (!globalState?.activeMythId) return;

            const stmt = await prisma.mythStatement.findUnique({
                where: { id: globalState.activeMythId },
                include: { votes: true }
            });

            if (!stmt || stmt.status !== 'active') return;

            await prisma.mythStatement.update({
                where: { id: stmt.id },
                data: { status: 'completed', revealed: true, scored: true }
            });

            // Award points
            for (const v of stmt.votes) {
                if (v.vote === stmt.answer) {
                    await prisma.member.update({
                        where: { id: v.memberId },
                        data: { quizScore: { increment: 10 } }
                    });
                }
            }

            await prisma.gameState.update({
                where: { id: 'global' },
                data: { activeMythId: null }
            });

            broadcast();
        });

        // -- Logo Finder Logic --
        socket.on('logo:open', async ({ logoId }) => {
            if (socket.data.role !== 'admin') return;

            const logo = await prisma.logoItem.findUnique({ where: { no: Number(logoId) } });
            if (!logo || logo.status === 'completed') return;

            await prisma.logoItem.updateMany({
                where: { status: 'active' },
                data: { status: 'pending' }
            });

            await prisma.logoItem.update({
                where: { id: logo.id },
                data: { status: 'active' }
            });

            await prisma.gameState.update({
                where: { id: 'global' },
                data: { phase: 'logo', activeLogoId: logo.id }
            });

            broadcast();
        });

        socket.on('logo:vote', async ({ vote }, ack) => {
            if (socket.data.role !== 'member') return;

            const globalState = await prisma.gameState.findUnique({ where: { id: 'global' } });
            if (!globalState?.activeLogoId) return;

            const logo = await prisma.logoItem.findUnique({ where: { id: globalState.activeLogoId } });
            if (!logo || logo.status !== 'active') return;

            await prisma.logoVote.upsert({
                where: {
                    memberId_logoId: {
                        memberId: socket.data.memberId,
                        logoId: logo.id
                    }
                },
                update: { vote },
                create: {
                    vote,
                    memberId: socket.data.memberId,
                    logoId: logo.id
                }
            });

            if (ack) ack({ ok: true });
            broadcast();
        });

        socket.on('logo:reveal', async () => {
            if (socket.data.role !== 'admin') return;

            const globalState = await prisma.gameState.findUnique({ where: { id: 'global' } });
            if (!globalState?.activeLogoId) return;

            const logo = await prisma.logoItem.findUnique({
                where: { id: globalState.activeLogoId },
                include: { votes: true }
            });

            if (!logo || logo.status !== 'active') return;

            await prisma.logoItem.update({
                where: { id: logo.id },
                data: { status: 'completed', revealed: true, scored: true }
            });

            // Award points
            const pointsToAward = logo.level === 'hard' ? 20 : logo.level === 'medium' ? 15 : 10;
            for (const v of logo.votes) {
                if (v.vote === logo.answer) {
                    await prisma.member.update({
                        where: { id: v.memberId },
                        data: { quizScore: { increment: pointsToAward } }
                    });
                }
            }

            await prisma.gameState.update({
                where: { id: 'global' },
                data: { activeLogoId: null }
            });

            broadcast();
        });

        // -- Connection Logic --
        socket.on('connection:open', async ({ puzzleId }) => {
            if (socket.data.role !== 'admin') return;

            const puzzle = await prisma.connectionPuzzle.findUnique({ where: { no: Number(puzzleId) } });
            if (!puzzle || puzzle.status === 'completed') return;

            await prisma.connectionPuzzle.updateMany({
                where: { status: 'active' },
                data: { status: 'pending' }
            });

            await prisma.connectionPuzzle.update({
                where: { id: puzzle.id },
                data: { status: 'active' }
            });

            await prisma.gameState.update({
                where: { id: 'global' },
                data: { phase: 'connection', activeConnectionId: puzzle.id }
            });

            broadcast();
        });

        socket.on('connection:guess', async ({ words }, ack) => {
            if (socket.data.role !== 'member') return;

            const globalState = await prisma.gameState.findUnique({ where: { id: 'global' } });
            if (!globalState?.activeConnectionId) return;

            const puzzle = await prisma.connectionPuzzle.findUnique({
                where: { id: globalState.activeConnectionId },
                include: { categories: true }
            });

            if (!puzzle || puzzle.status !== 'active') return;

            // Find matching category
            const sortedGuess = [...words].sort().join(',');
            const matchedCategory = puzzle.categories.find(c => [...c.words].sort().join(',') === sortedGuess);

            if (matchedCategory) {
                // Check if already revealed
                if (puzzle.revealedCategories.includes(matchedCategory.name)) {
                    if (ack) ack({ ok: false, error: 'Already solved!' });
                    return;
                }

                // Mark as solved by this member
                await prisma.solvedCategory.create({
                    data: {
                        memberId: socket.data.memberId,
                        categoryId: matchedCategory.id
                    }
                });

                // Update puzzle revealed categories
                const newRevealed = [...puzzle.revealedCategories, matchedCategory.name];
                const isCompleted = newRevealed.length === puzzle.categories.length;

                await prisma.connectionPuzzle.update({
                    where: { id: puzzle.id },
                    data: {
                        revealedCategories: newRevealed,
                        status: isCompleted ? 'completed' : 'active'
                    }
                });

                if (isCompleted) {
                    await prisma.gameState.update({
                        where: { id: 'global' },
                        data: { activeConnectionId: null }
                    });
                }

                // Award points
                await prisma.member.update({
                    where: { id: socket.data.memberId },
                    data: { quizScore: { increment: 25 } }
                });

                if (ack) ack({ ok: true });
                broadcast();
            } else {
                // Check if 1 away
                let maxOverlap = 0;
                for (const c of puzzle.categories) {
                    if (puzzle.revealedCategories.includes(c.name)) continue;
                    const overlap = words.filter((w: string) => c.words.includes(w)).length;
                    if (overlap > maxOverlap) maxOverlap = overlap;
                }

                if (maxOverlap === 3) {
                    if (ack) ack({ ok: false, error: 'One away!' });
                } else {
                    if (ack) ack({ ok: false, error: 'Incorrect.' });
                }
            }
        });

        socket.on('admin:revealConnection', async ({ categoryName }) => {
            if (socket.data.role !== 'admin') return;

            const globalState = await prisma.gameState.findUnique({ where: { id: 'global' } });
            if (!globalState?.activeConnectionId) return;

            const puzzle = await prisma.connectionPuzzle.findUnique({
                where: { id: globalState.activeConnectionId },
                include: { categories: true }
            });

            if (!puzzle || puzzle.status !== 'active') return;
            if (puzzle.revealedCategories.includes(categoryName)) return;

            const newRevealed = [...puzzle.revealedCategories, categoryName];
            const isCompleted = newRevealed.length === puzzle.categories.length;

            await prisma.connectionPuzzle.update({
                where: { id: puzzle.id },
                data: {
                    revealedCategories: newRevealed,
                    status: isCompleted ? 'completed' : 'active'
                }
            });

            if (isCompleted) {
                await prisma.gameState.update({
                    where: { id: 'global' },
                    data: { activeConnectionId: null }
                });
            }

            broadcast();
        });

        // -- Reset --
        socket.on('admin:reset', async ({ what }) => {
            if (socket.data.role !== 'admin') return;

            if (what === 'auction' || what === 'all') {
                await prisma.auctionItem.updateMany({ data: { status: 'pending', currentBid: 0, winningBid: 0, winnerId: null } });
                await prisma.auctionBid.deleteMany();
            }
            if (what === 'myth' || what === 'all') {
                await prisma.mythStatement.updateMany({ data: { status: 'pending', revealed: false, scored: false } });
                await prisma.mythVote.deleteMany();
            }
            if (what === 'logo' || what === 'all') {
                await prisma.logoItem.updateMany({ data: { status: 'pending', revealed: false, scored: false } });
                await prisma.logoVote.deleteMany();
            }
            if (what === 'connection' || what === 'all') {
                await prisma.connectionPuzzle.updateMany({ data: { status: 'pending', revealedCategories: [] } });
                await prisma.solvedCategory.deleteMany();
            }
            if (what === 'all') {
                await prisma.member.updateMany({ data: { points: 100, quizScore: 0 } });
                await prisma.gameState.update({ where: { id: 'global' }, data: { phase: 'lobby', activeAuctionId: null, activeMythId: null, activeLogoId: null, activeConnectionId: null } });
            }

            broadcast();
        });

        socket.on('disconnect', async () => {
            console.log('User disconnected:', socket.id);
            if (socket.data.memberId) {
                await prisma.member.update({
                    where: { id: socket.data.memberId },
                    data: { connected: false }
                });
                broadcast();
            }
        });
    });

    httpServer.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
    });
});
