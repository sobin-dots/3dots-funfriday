import { Socket } from 'socket.io';
import { prisma } from '../lib/prisma';
import { adminOnly, memberOnly } from './utils';

export const setupAuctionHandlers = (socket: Socket, broadcast: () => Promise<void>) => {
    socket.on('auction:open', adminOnly(socket, async ({ itemId }: { itemId: number }) => {
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
    }));

    socket.on('auction:bid', memberOnly(socket, async ({ amount }: { amount: number }, ack: Function) => {
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
                auctionItemId: item.id
            }
        });

        await prisma.auctionItem.update({
            where: { id: item.id },
            data: { currentBid: amount }
        });

        if (ack) ack({ ok: true });
        broadcast();
    }));

    socket.on('auction:sell', adminOnly(socket, async () => {
        const globalState = await prisma.gameState.findUnique({ where: { id: 'global' } });
        if (!globalState?.activeAuctionId) return;

        const item = await prisma.auctionItem.findUnique({
            where: { id: globalState.activeAuctionId },
            include: { bids: { orderBy: { amount: 'desc' }, take: 1 } }
        });

        if (!item || item.status !== 'active') return;

        const [highestBid] = item.bids;
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
    }));
};
