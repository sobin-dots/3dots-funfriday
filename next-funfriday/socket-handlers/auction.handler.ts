import { Socket } from 'socket.io';
import { prisma } from '../lib/prisma';
import { adminOnly, memberOnly } from './utils';
import { GLOBAL_STATE_ID, GAME_PHASES, GAME_STATUS, SOCKET_EVENTS } from '../constants';

export const setupAuctionHandlers = (socket: Socket, broadcast: () => Promise<void>) => {
    socket.on(SOCKET_EVENTS.AUCTION_OPEN, adminOnly(socket, async ({ itemId }: { itemId: number }) => {
        const item = await prisma.auctionItem.findUnique({ where: { no: Number(itemId) } });
        if (!item || item.status === GAME_STATUS.SOLD) return;

        // Close any currently active item
        await prisma.auctionItem.updateMany({
            where: { status: GAME_STATUS.ACTIVE },
            data: { status: GAME_STATUS.PENDING, currentBid: 0 }
        });

        // Open the new item
        await prisma.auctionItem.update({
            where: { id: item.id },
            data: { status: GAME_STATUS.ACTIVE, currentBid: 0 }
        });

        // Update global state
        await prisma.gameState.update({
            where: { id: GLOBAL_STATE_ID },
            data: { phase: GAME_PHASES.AUCTION, activeAuctionId: item.id }
        });

        broadcast();
    }));

    socket.on(SOCKET_EVENTS.AUCTION_BID, memberOnly(socket, async ({ amount }: { amount: number }, ack: Function) => {
        const globalState = await prisma.gameState.findUnique({ where: { id: GLOBAL_STATE_ID } });
        if (!globalState?.activeAuctionId) {
            if (ack) ack({ ok: false, error: 'No active auction.' });
            return;
        }

        const item = await prisma.auctionItem.findUnique({ where: { id: globalState.activeAuctionId } });
        const member = await prisma.member.findUnique({ where: { id: socket.data.memberId } });

        if (!item || !member || item.status !== GAME_STATUS.ACTIVE) return;

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

    socket.on(SOCKET_EVENTS.AUCTION_SELL, adminOnly(socket, async () => {
        const globalState = await prisma.gameState.findUnique({ where: { id: GLOBAL_STATE_ID } });
        if (!globalState?.activeAuctionId) return;

        const item = await prisma.auctionItem.findUnique({
            where: { id: globalState.activeAuctionId },
            include: { bids: { orderBy: { amount: 'desc' }, take: 1 } }
        });

        if (!item || item.status !== GAME_STATUS.ACTIVE) return;

        const [highestBid] = item.bids;
        if (highestBid) {
            await prisma.auctionItem.update({
                where: { id: item.id },
                data: {
                    status: GAME_STATUS.SOLD,
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
                data: { status: GAME_STATUS.SOLD }
            });
        }

        await prisma.gameState.update({
            where: { id: GLOBAL_STATE_ID },
            data: { activeAuctionId: null }
        });

        broadcast();
    }));
};
