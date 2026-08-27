import { Socket } from 'socket.io';
import { prisma } from '../lib/prisma';
import { adminOnly, memberOnly } from './utils';

export const setupLogoHandlers = (socket: Socket, broadcast: () => Promise<void>) => {
    socket.on('logo:open', adminOnly(socket, async ({ logoId }: { logoId: number }) => {
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
    }));

    socket.on('logo:vote', memberOnly(socket, async ({ vote }: { vote: string }, ack: Function) => {
        const globalState = await prisma.gameState.findUnique({ where: { id: 'global' } });
        if (!globalState?.activeLogoId) return;

        const logo = await prisma.logoItem.findUnique({ where: { id: globalState.activeLogoId } });
        if (!logo || logo.status !== 'active') return;

        await prisma.logoVote.upsert({
            where: {
                logoItemId_memberId: {
                    memberId: socket.data.memberId,
                    logoItemId: logo.id
                }
            },
            update: { vote },
            create: {
                vote,
                memberId: socket.data.memberId,
                logoItemId: logo.id
            }
        });

        if (ack) ack({ ok: true });
        broadcast();
    }));

    socket.on('logo:reveal', adminOnly(socket, async () => {
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
    }));
};
