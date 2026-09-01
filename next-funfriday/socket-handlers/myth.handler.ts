import { Socket } from 'socket.io';
import { prisma } from '../lib/prisma';
import { adminOnly, memberOnly } from './utils';
import { GLOBAL_STATE_ID, GAME_PHASES, GAME_STATUS, SOCKET_EVENTS } from '../constants';

export const setupMythHandlers = (socket: Socket, broadcast: () => Promise<void>) => {
    socket.on(SOCKET_EVENTS.MYTH_OPEN, adminOnly(socket, async ({ mythId }: { mythId: number }) => {
        const mythStatement = await prisma.mythStatement.findUnique({ where: { no: Number(mythId) } });
        if (!mythStatement || mythStatement.status === GAME_STATUS.COMPLETED) return;

        await prisma.mythStatement.updateMany({
            where: { status: GAME_STATUS.ACTIVE },
            data: { status: GAME_STATUS.PENDING }
        });

        await prisma.mythStatement.update({
            where: { id: mythStatement.id },
            data: { status: GAME_STATUS.ACTIVE }
        });

        await prisma.gameState.update({
            where: { id: GLOBAL_STATE_ID },
            data: { phase: GAME_PHASES.MYTH, activeMythId: mythStatement.id }
        });

        broadcast();
    }));


    socket.on(SOCKET_EVENTS.MYTH_REVEAL, adminOnly(socket, async () => {
        const globalState = await prisma.gameState.findUnique({ where: { id: GLOBAL_STATE_ID } });
        if (!globalState?.activeMythId) return;

        const mythStatement = await prisma.mythStatement.findUnique({
            where: { id: globalState.activeMythId },
            include: { votes: true }
        });

        if (!mythStatement || mythStatement.status !== GAME_STATUS.ACTIVE) return;

        await prisma.mythStatement.update({
            where: { id: mythStatement.id },
            data: { status: GAME_STATUS.COMPLETED, revealed: true, scored: true }
        });

        // Award points
        const correctMemberIds = mythStatement.votes
            .filter(voteRecord => voteRecord.vote === mythStatement.answer)
            .map(voteRecord => voteRecord.memberId);

        if (correctMemberIds.length > 0) {
            await prisma.member.updateMany({
                where: { id: { in: correctMemberIds } },
                data: { quizScore: { increment: 10 } }
            });
        }

        broadcast();
    }));
    socket.on(SOCKET_EVENTS.MYTH_CLOSE, adminOnly(socket, async () => {
        await prisma.gameState.update({
            where: { id: GLOBAL_STATE_ID },
            data: { activeMythId: null }
        });

        broadcast();
    }));
};
