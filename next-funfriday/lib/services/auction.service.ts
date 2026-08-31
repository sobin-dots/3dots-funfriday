import { prisma } from '@/lib/prisma';
import { AppError, NotFoundError, ValidationError } from '@/lib/errors';
import { AuctionReasonInput } from '@/lib/validations/game';
import { GLOBAL_STATE_ID } from '@/constants';

export class AuctionService {
    static async submitReason(userId: string, payload: AuctionReasonInput) {
        const { itemId, reason } = payload;

        const globalState = await prisma.gameState.findUnique({ where: { id: GLOBAL_STATE_ID } });
        if (!globalState || !globalState.activeAuctionId) {
            throw new ValidationError('No active auction');
        }

        const auctionItem = await prisma.auctionItem.findUnique({
            where: { no: itemId }
        });

        if (!auctionItem) {
            throw new NotFoundError('Auction item not found');
        }

        if (auctionItem.winnerId !== userId) {
            throw new ValidationError('You can only add a reason to items you have won');
        }

        await prisma.auctionItem.update({
            where: { id: auctionItem.id },
            data: { reason }
        });

        return { success: true };
    }
}
