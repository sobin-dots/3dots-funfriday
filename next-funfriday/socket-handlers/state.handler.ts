import { Server } from 'socket.io';
import { prisma } from '../lib/prisma';

export const createBroadcast = (io: Server) => {
    return async () => {
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
        membersList.forEach((member) => {
            members[member.id] = {
                id: member.id,
                name: member.name,
                team: member.team,
                points: member.points,
                quizScore: member.quizScore,
                connected: member.connected,
                wonItems: member.wonItems.map((item) => item.no)
            };
        });

        // Build Auction State
        const allAuctionItems = await prisma.auctionItem.findMany({
            orderBy: { no: 'asc' },
            include: { bids: { orderBy: { amount: 'desc' }, take: 1 } }
        });
        const auctionState = {
            activeItemId: globalState.activeAuctionId ? allAuctionItems.find(item => item.id === globalState.activeAuctionId)?.no || null : null,
            items: allAuctionItems.map(item => {
                const [topBid] = item.bids;
                return {
                    id: item.id,
                    no: item.no,
                    name: item.name,
                    why: item.why,
                    status: item.status,
                    currentBid: item.currentBid,
                    currentBidderId: topBid?.memberId || null,
                    winnerId: item.winnerId,
                    winningBid: item.winningBid,
                    reason: item.reason
                };
            })
        };

        // Build Myth State
        const allMythStatements = await prisma.mythStatement.findMany({
            orderBy: { no: 'asc' },
            include: { votes: true }
        });
        const mythState = {
            activeStatementId: globalState.activeMythId ? allMythStatements.find(stmt => stmt.id === globalState.activeMythId)?.no || null : null,
            statements: allMythStatements.map(stmt => {
                const votes: Record<string, string> = {};
                stmt.votes.forEach((voteRecord) => votes[voteRecord.memberId] = voteRecord.vote);
                return {
                    id: stmt.id,
                    no: stmt.no,
                    text: stmt.text,
                    answer: stmt.answer,
                    explanation: stmt.explanation,
                    status: stmt.status,
                    revealed: stmt.revealed,
                    totalVotes: stmt.votes.length,
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
            activeLogoId: globalState.activeLogoId ? allLogoItems.find(logo => logo.id === globalState.activeLogoId)?.no || null : null,
            items: allLogoItems.map(logo => {
                const votes: Record<string, string> = {};
                logo.votes.forEach((voteRecord) => votes[voteRecord.memberId] = voteRecord.vote);
                return {
                    id: logo.id,
                    no: logo.no,
                    level: logo.level,
                    svg: logo.svg,
                    hint: logo.hint,
                    answer: logo.answer,
                    options: logo.options,
                    explanation: logo.explanation,
                    status: logo.status,
                    revealed: logo.revealed,
                    totalVotes: logo.votes.length,
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
            activePuzzleId: globalState.activeConnectionId ? allConnectionPuzzles.find(puzzle => puzzle.id === globalState.activeConnectionId)?.no || null : null,
            puzzles: allConnectionPuzzles.map(puzzle => {
                return {
                    id: puzzle.id,
                    no: puzzle.no,
                    title: puzzle.title,
                    status: puzzle.status,
                    revealedCategories: puzzle.revealedCategories,
                    categories: puzzle.categories.map((category) => ({
                        id: category.id,
                        name: category.name,
                        level: category.level,
                        words: category.words,
                        solvedBy: category.solvedBy.map((solver) => solver.memberId)
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
};
