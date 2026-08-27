import { Socket } from 'socket.io';
import { prisma } from '../lib/prisma';
import { adminOnly, memberOnly } from './utils';

export const setupMythHandlers = (socket: Socket, broadcast: () => Promise<void>) => {
    socket.on('myth:open', adminOnly(socket, async ({ mythId }: { mythId: number }) => {
        const mythStatement = await prisma.mythStatement.findUnique({ where: { no: Number(mythId) } });
        if (!mythStatement || mythStatement.status === 'completed') return;

        await prisma.mythStatement.updateMany({
            where: { status: 'active' },
            data: { status: 'pending' }
        });

        await prisma.mythStatement.update({
            where: { id: mythStatement.id },
            data: { status: 'active' }
        });

        await prisma.gameState.update({
            where: { id: 'global' },
            data: { phase: 'myth', activeMythId: mythStatement.id }
        });

        broadcast();
    }));

    socket.on('myth:vote', memberOnly(socket, async ({ vote }: { vote: string }, ack: Function) => {
        const globalState = await prisma.gameState.findUnique({ where: { id: 'global' } });
        if (!globalState?.activeMythId) return;

        const mythStatement = await prisma.mythStatement.findUnique({ where: { id: globalState.activeMythId } });
        if (!mythStatement || mythStatement.status !== 'active') return;

        await prisma.mythVote.upsert({
            where: {
                mythStatementId_memberId: {
                    memberId: socket.data.memberId,
                    mythStatementId: mythStatement.id
                }
            },
            update: { vote },
            create: {
                vote,
                memberId: socket.data.memberId,
                mythStatementId: mythStatement.id
            }
        });

        if (ack) ack({ ok: true });
        broadcast();
    }));

    socket.on('myth:reveal', adminOnly(socket, async () => {
        const globalState = await prisma.gameState.findUnique({ where: { id: 'global' } });
        if (!globalState?.activeMythId) return;

        const mythStatement = await prisma.mythStatement.findUnique({
            where: { id: globalState.activeMythId },
            include: { votes: true }
        });

        if (!mythStatement || mythStatement.status !== 'active') return;

        await prisma.mythStatement.update({
            where: { id: mythStatement.id },
            data: { status: 'completed', revealed: true, scored: true }
        });

        // Award points
        for (const voteRecord of mythStatement.votes) {
            if (voteRecord.vote === mythStatement.answer) {
                await prisma.member.update({
                    where: { id: voteRecord.memberId },
                    data: { quizScore: { increment: 10 } }
                });
            }
        }

        await prisma.gameState.update({
            where: { id: 'global' },
            data: { activeMythId: null }
        });

        broadcast();
    }));
};
