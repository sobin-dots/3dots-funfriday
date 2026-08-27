import { Socket } from 'socket.io';
import { prisma } from '../lib/prisma';
import { adminOnly, memberOnly } from './utils';

export const setupConnectionHandlers = (socket: Socket, broadcast: () => Promise<void>) => {
    socket.on('connection:open', adminOnly(socket, async ({ puzzleId }: { puzzleId: number }) => {
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
    }));

    socket.on('connection:guess', memberOnly(socket, async ({ words }: { words: string[] }, ack: Function) => {
        const globalState = await prisma.gameState.findUnique({ where: { id: 'global' } });
        if (!globalState?.activeConnectionId) return;

        const puzzle = await prisma.connectionPuzzle.findUnique({
            where: { id: globalState.activeConnectionId },
            include: { categories: true }
        });

        if (!puzzle || puzzle.status !== 'active') return;

        // Find matching category
        const sortedGuess = [...words].sort().join(',');
        const matchedCategory = puzzle.categories.find(category => [...category.words].sort().join(',') === sortedGuess);

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
                    connectionCategoryId: matchedCategory.id
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
            for (const category of puzzle.categories) {
                if (puzzle.revealedCategories.includes(category.name)) continue;
                const overlap = words.filter((word: string) => category.words.includes(word)).length;
                if (overlap > maxOverlap) maxOverlap = overlap;
            }

            if (maxOverlap === 3) {
                if (ack) ack({ ok: false, error: 'One away!' });
            } else {
                if (ack) ack({ ok: false, error: 'Incorrect.' });
            }
        }
    }));

    socket.on('admin:revealConnection', adminOnly(socket, async ({ categoryName }: { categoryName: string }) => {
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
    }));
};
