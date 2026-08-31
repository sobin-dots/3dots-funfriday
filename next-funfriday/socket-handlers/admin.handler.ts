import { Socket } from 'socket.io';
import { prisma } from '../lib/prisma';
import { adminOnly } from './utils';
import { GLOBAL_STATE_ID, GAME_PHASES, SOCKET_EVENTS } from '../constants';

export const setupAdminHandlers = (socket: Socket, broadcast: () => Promise<void>) => {
    socket.on(SOCKET_EVENTS.ADMIN_SET_PHASE, adminOnly(socket, async ({ phase }: { phase: string }) => {
        await prisma.gameState.update({
            where: { id: GLOBAL_STATE_ID },
            data: { phase }
        });
        broadcast();
    }));

    socket.on(SOCKET_EVENTS.ADMIN_RESET, adminOnly(socket, async ({ what }: { what: string }) => {

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
            await prisma.gameState.update({ where: { id: GLOBAL_STATE_ID }, data: { phase: GAME_PHASES.LOBBY, activeAuctionId: null, activeMythId: null, activeLogoId: null, activeConnectionId: null } });
        }

        broadcast();
    }));
};
