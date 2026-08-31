import { Socket } from 'socket.io';
import { prisma } from '../lib/prisma';
import { adminOnly, memberOnly } from './utils';
import { GLOBAL_STATE_ID, GAME_PHASES, GAME_STATUS, SOCKET_EVENTS } from '../constants';

export const setupConnectionHandlers = (socket: Socket, broadcast: () => Promise<void>) => {
    socket.on(SOCKET_EVENTS.CONNECTION_OPEN, adminOnly(socket, async ({ puzzleId }: { puzzleId: number }) => {
        const puzzle = await prisma.connectionPuzzle.findUnique({ where: { no: Number(puzzleId) } });
        if (!puzzle || puzzle.status === GAME_STATUS.COMPLETED) return;

        await prisma.connectionPuzzle.updateMany({
            where: { status: GAME_STATUS.ACTIVE },
            data: { status: GAME_STATUS.PENDING }
        });

        await prisma.connectionPuzzle.update({
            where: { id: puzzle.id },
            data: { status: GAME_STATUS.ACTIVE }
        });

        await prisma.gameState.update({
            where: { id: GLOBAL_STATE_ID },
            data: { phase: GAME_PHASES.CONNECTION, activeConnectionId: puzzle.id }
        });

        broadcast();
    }));


    socket.on(SOCKET_EVENTS.CONNECTION_REVEAL_GROUP, adminOnly(socket, async ({ categoryName }: { categoryName: string }) => {
        const globalState = await prisma.gameState.findUnique({ where: { id: GLOBAL_STATE_ID } });
        if (!globalState?.activeConnectionId) return;

        const puzzle = await prisma.connectionPuzzle.findUnique({
            where: { id: globalState.activeConnectionId },
            include: { categories: true }
        });

        if (!puzzle || puzzle.status !== GAME_STATUS.ACTIVE) return;
        if (puzzle.revealedCategories.includes(categoryName)) return;

        const newRevealed = [...puzzle.revealedCategories, categoryName];
        const isCompleted = newRevealed.length === puzzle.categories.length;

        await prisma.connectionPuzzle.update({
            where: { id: puzzle.id },
            data: {
                revealedCategories: newRevealed,
                status: isCompleted ? GAME_STATUS.COMPLETED : GAME_STATUS.ACTIVE
            }
        });

        if (isCompleted) {
            await prisma.gameState.update({
                where: { id: GLOBAL_STATE_ID },
                data: { activeConnectionId: null }
            });
        }

        broadcast();
    }));
};
