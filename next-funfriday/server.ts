import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

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

    io.on('connection', (socket) => {
        socket.data = { role: 'spectator', memberId: null };
        console.log('A user connected:', socket.id);

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

        // -- Identity --
        socket.on('member:join', async ({ name, team }, ack) => {
            if (!name) {
                if (ack) ack({ ok: false, error: 'Please enter your name.' });
                return;
            }

            // Create or update member in DB
            const member = await prisma.member.create({
                data: {
                    name: name.trim().slice(0, 40),
                    team: (team || '').toString().trim().slice(0, 40) || 'No team',
                    connected: true,
                }
            });

            socket.data.role = 'member';
            socket.data.memberId = member.id;
            if (ack) ack({ ok: true, memberId: member.id });
            broadcast();
        });

        socket.on('spectator:join', (ack) => {
            socket.data.role = 'spectator';
            if (ack) ack({ ok: true });
            broadcast();
        });

        socket.on('admin:login', ({ password }, ack) => {
            if (password !== (process.env.ADMIN_PASSWORD || 'funfriday')) {
                if (ack) ack({ ok: false, error: 'Incorrect admin password.' });
                return;
            }
            socket.data.role = 'admin';
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

            if (amount <= item.currentBid) {
                if (ack) ack({ ok: false, error: `Bid must be higher than ${item.currentBid}.` });
                return;
            }
            if (amount > member.points) {
                if (ack) ack({ ok: false, error: `You only have ${member.points} points.` });
                return;
            }

            // Update bid in DB
            await prisma.auctionItem.update({
                where: { id: item.id },
                data: { currentBid: amount }
            });

            // Record the bid
            await prisma.auctionBid.create({
                data: {
                    amount,
                    auctionItemId: item.id,
                    memberId: member.id
                }
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
                const winner = await prisma.member.findUnique({ where: { id: highestBid.memberId } });
                if (winner) {
                    // Deduct points from winner
                    await prisma.member.update({
                        where: { id: winner.id },
                        data: { points: Math.max(0, winner.points - highestBid.amount) }
                    });

                    // Mark item as sold to winner
                    await prisma.auctionItem.update({
                        where: { id: item.id },
                        data: {
                            status: 'sold',
                            winnerId: winner.id,
                            winningBid: highestBid.amount
                        }
                    });
                }
            } else {
                // No bids, just mark as pending again
                await prisma.auctionItem.update({
                    where: { id: item.id },
                    data: { status: 'pending' }
                });
            }

            // Clear active auction
            await prisma.gameState.update({
                where: { id: 'global' },
                data: { activeAuctionId: null }
            });

            broadcast();
        });

        socket.on('auction:cancel', async () => {
            if (socket.data.role !== 'admin') return;

            const globalState = await prisma.gameState.findUnique({ where: { id: 'global' } });
            if (!globalState?.activeAuctionId) return;

            await prisma.auctionItem.update({
                where: { id: globalState.activeAuctionId },
                data: { status: 'pending', currentBid: 0 }
            });

            await prisma.gameState.update({
                where: { id: 'global' },
                data: { activeAuctionId: null }
            });

            broadcast();
        });

        socket.on('auction:reason', async ({ itemId, reason }) => {
            if (socket.data.role !== 'member') return;

            const item = await prisma.auctionItem.findUnique({ where: { no: Number(itemId) } });
            if (!item || item.winnerId !== socket.data.memberId) return;

            await prisma.auctionItem.update({
                where: { id: item.id },
                data: { reason: (reason || '').toString().trim().slice(0, 240) }
            });

            broadcast();
        });

        // -- Myth Buster Logic --
        socket.on('myth:open', async ({ mythId }) => {
            if (socket.data.role !== 'admin') return;

            const myth = await prisma.mythStatement.findUnique({ where: { no: Number(mythId) } });
            if (!myth) return;

            await prisma.mythStatement.updateMany({
                where: { status: 'active' },
                data: { status: 'pending' }
            });

            await prisma.mythStatement.update({
                where: { id: myth.id },
                data: { status: 'active' }
            });

            await prisma.gameState.update({
                where: { id: 'global' },
                data: { phase: 'myth', activeMythId: myth.id }
            });

            broadcast();
        });

        socket.on('myth:vote', async ({ vote }, ack) => {
            if (socket.data.role !== 'member') return;

            const globalState = await prisma.gameState.findUnique({ where: { id: 'global' } });
            if (!globalState?.activeMythId) return;

            const myth = await prisma.mythStatement.findUnique({ where: { id: globalState.activeMythId } });
            if (!myth || myth.status !== 'active' || myth.revealed) return;

            // Upsert the vote (create or update if already voted)
            await prisma.mythVote.upsert({
                where: {
                    mythStatementId_memberId: {
                        mythStatementId: myth.id,
                        memberId: socket.data.memberId
                    }
                },
                update: { vote },
                create: {
                    vote,
                    mythStatementId: myth.id,
                    memberId: socket.data.memberId
                }
            });

            if (ack) ack({ ok: true });
            broadcast();
        });

        socket.on('myth:reveal', async () => {
            if (socket.data.role !== 'admin') return;

            const globalState = await prisma.gameState.findUnique({ where: { id: 'global' } });
            if (!globalState?.activeMythId) return;

            const myth = await prisma.mythStatement.findUnique({
                where: { id: globalState.activeMythId },
                include: { votes: true }
            });

            if (!myth || myth.revealed) return;

            // Mark as revealed and scored
            await prisma.mythStatement.update({
                where: { id: myth.id },
                data: { revealed: true, scored: true }
            });

            // Award points to correct voters (10 points)
            for (const vote of myth.votes) {
                if (vote.vote === myth.answer) {
                    const member = await prisma.member.findUnique({ where: { id: vote.memberId } });
                    if (member) {
                        await prisma.member.update({
                            where: { id: member.id },
                            data: {
                                points: member.points + 10,
                                quizScore: member.quizScore + 10
                            }
                        });
                    }
                }
            }

            broadcast();
        });

        // -- Logo Finder Logic --
        socket.on('logo:open', async ({ logoId }) => {
            if (socket.data.role !== 'admin') return;

            const logo = await prisma.logoItem.findUnique({ where: { no: Number(logoId) } });
            if (!logo) return;

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
            if (!logo || logo.status !== 'active' || logo.revealed) return;

            // Upsert the vote
            await prisma.logoVote.upsert({
                where: {
                    logoItemId_memberId: {
                        logoItemId: logo.id,
                        memberId: socket.data.memberId
                    }
                },
                update: { vote },
                create: {
                    vote,
                    logoItemId: logo.id,
                    memberId: socket.data.memberId
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

            if (!logo || logo.revealed) return;

            // Mark as revealed and scored
            await prisma.logoItem.update({
                where: { id: logo.id },
                data: { revealed: true, scored: true }
            });

            // Award points to correct voters (10 points)
            for (const vote of logo.votes) {
                if (vote.vote === logo.answer) {
                    const member = await prisma.member.findUnique({ where: { id: vote.memberId } });
                    if (member) {
                        await prisma.member.update({
                            where: { id: member.id },
                            data: {
                                points: member.points + 10,
                                quizScore: member.quizScore + 10
                            }
                        });
                    }
                }
            }

            broadcast();
        });

        // -- Connections Puzzle Logic --
        socket.on('connection:open', async ({ puzzleId }) => {
            if (socket.data.role !== 'admin') return;

            const puzzle = await prisma.connectionPuzzle.findUnique({ where: { no: Number(puzzleId) } });
            if (!puzzle) return;

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

        socket.on('connection:submit', async ({ words }, ack) => {
            if (socket.data.role !== 'member') return;
            if (!Array.isArray(words) || words.length !== 4) {
                if (ack) ack({ ok: false, error: 'Please select exactly 4 words.' });
                return;
            }

            const globalState = await prisma.gameState.findUnique({ where: { id: 'global' } });
            if (!globalState?.activeConnectionId) return;

            const puzzle = await prisma.connectionPuzzle.findUnique({
                where: { id: globalState.activeConnectionId },
                include: { categories: true }
            });

            if (!puzzle || puzzle.status !== 'active') return;

            // Sort words to make comparison easy
            const submittedWords = [...words].sort();
            let matchedCategory = null;

            for (const category of puzzle.categories) {
                const categoryWords = [...category.words].sort();
                if (JSON.stringify(submittedWords) === JSON.stringify(categoryWords)) {
                    matchedCategory = category;
                    break;
                }
            }

            if (matchedCategory) {
                // Check if already solved by this member
                const existingSolve = await prisma.solvedCategory.findUnique({
                    where: {
                        memberId_connectionCategoryId: {
                            memberId: socket.data.memberId,
                            connectionCategoryId: matchedCategory.id
                        }
                    }
                });

                if (existingSolve) {
                    if (ack) ack({ ok: false, error: 'You already found this group!' });
                    return;
                }

                // Record the solve
                await prisma.solvedCategory.create({
                    data: {
                        memberId: socket.data.memberId,
                        connectionCategoryId: matchedCategory.id
                    }
                });

                // Award points (20 points)
                const member = await prisma.member.findUnique({ where: { id: socket.data.memberId } });
                if (member) {
                    await prisma.member.update({
                        where: { id: member.id },
                        data: {
                            points: member.points + 20,
                            quizScore: member.quizScore + 20
                        }
                    });
                }

                if (ack) ack({ ok: true, matched: true, category: matchedCategory.name });
                broadcast();
            } else {
                // Check for one away
                let oneAway = false;
                for (const category of puzzle.categories) {
                    const intersection = submittedWords.filter(w => category.words.includes(w));
                    if (intersection.length === 3) {
                        oneAway = true;
                        break;
                    }
                }
                if (ack) ack({ ok: true, matched: false, oneAway });
            }
        });

        socket.on('connection:revealGroup', async ({ categoryName }) => {
            if (socket.data.role !== 'admin') return;

            const globalState = await prisma.gameState.findUnique({ where: { id: 'global' } });
            if (!globalState?.activeConnectionId) return;

            const puzzle = await prisma.connectionPuzzle.findUnique({ where: { id: globalState.activeConnectionId } });
            if (!puzzle) return;

            // Add category to revealed list if not already there
            if (!puzzle.revealedCategories.includes(categoryName)) {
                await prisma.connectionPuzzle.update({
                    where: { id: puzzle.id },
                    data: { revealedCategories: { push: categoryName } }
                });
                broadcast();
            }
        });

        socket.on('admin:reset', async () => {
            if (socket.data.role !== 'admin') return;

            // Delete all dynamic data
            await prisma.auctionBid.deleteMany({});
            await prisma.mythVote.deleteMany({});
            await prisma.logoVote.deleteMany({});
            await prisma.solvedCategory.deleteMany({});
            await prisma.member.deleteMany({});

            // Reset statuses
            await prisma.auctionItem.updateMany({ data: { status: 'pending', currentBid: 0, winnerId: null, winningBid: 0, reason: '' } });
            await prisma.mythStatement.updateMany({ data: { status: 'pending', revealed: false, scored: false } });
            await prisma.logoItem.updateMany({ data: { status: 'pending', revealed: false, scored: false } });
            await prisma.connectionPuzzle.updateMany({ data: { status: 'pending', revealedCategories: [] } });

            // Reset global state
            await prisma.gameState.update({
                where: { id: 'global' },
                data: { phase: 'lobby', activeAuctionId: null, activeMythId: null, activeLogoId: null, activeConnectionId: null }
            });

            // Force disconnect all members
            const sockets = await io.fetchSockets();
            for (const s of sockets) {
                if (s.data.role === 'member') {
                    s.disconnect(true);
                }
            }

            broadcast();
        });

        socket.on('admin:kick', async ({ memberId }) => {
            if (socket.data.role !== 'admin') return;

            // Delete related records first to avoid foreign key constraint errors
            await prisma.auctionBid.deleteMany({ where: { memberId } });
            await prisma.mythVote.deleteMany({ where: { memberId } });
            await prisma.logoVote.deleteMany({ where: { memberId } });
            await prisma.solvedCategory.deleteMany({ where: { memberId } });

            await prisma.member.delete({ where: { id: memberId } }).catch(() => { });

            // Force disconnect the specific member
            const sockets = await io.fetchSockets();
            for (const s of sockets) {
                if (s.data.memberId === memberId) {
                    s.disconnect(true);
                }
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

    httpServer
        .once('error', (err) => {
            console.error(err);
            process.exit(1);
        })
        .listen(port, () => {
            console.log(`> Ready on http://${hostname}:${port}`);
        });
});
