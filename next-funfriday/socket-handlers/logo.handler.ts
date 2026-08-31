import { Socket } from 'socket.io';
import { prisma } from '../lib/prisma';
import { adminOnly, memberOnly } from './utils';
import { GLOBAL_STATE_ID, GAME_PHASES, GAME_STATUS, SOCKET_EVENTS } from '../constants';

export const setupLogoHandlers = (socket: Socket, broadcast: () => Promise<void>) => {
    socket.on(SOCKET_EVENTS.LOGO_OPEN, adminOnly(socket, async ({ logoId }: { logoId: number }) => {
        const logo = await prisma.logoItem.findUnique({ where: { no: Number(logoId) } });
        if (!logo || logo.status === GAME_STATUS.COMPLETED) return;

        await prisma.logoItem.updateMany({
            where: { status: GAME_STATUS.ACTIVE },
            data: { status: GAME_STATUS.PENDING }
        });

        await prisma.logoItem.update({
            where: { id: logo.id },
            data: { status: GAME_STATUS.ACTIVE }
        });

        await prisma.gameState.update({
            where: { id: GLOBAL_STATE_ID },
            data: { phase: GAME_PHASES.LOGO, activeLogoId: logo.id }
        });

        broadcast();
    }));


    socket.on(SOCKET_EVENTS.LOGO_REVEAL, adminOnly(socket, async () => {
        const globalState = await prisma.gameState.findUnique({ where: { id: GLOBAL_STATE_ID } });
        if (!globalState?.activeLogoId) return;

        const logo = await prisma.logoItem.findUnique({
            where: { id: globalState.activeLogoId },
            include: { votes: true }
        });

        if (!logo || logo.status !== GAME_STATUS.ACTIVE) return;

        await prisma.logoItem.update({
            where: { id: logo.id },
            data: { status: GAME_STATUS.COMPLETED, revealed: true, scored: true }
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
            where: { id: GLOBAL_STATE_ID },
            data: { activeLogoId: null }
        });

        broadcast();
    }));
};
