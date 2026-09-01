import { prisma } from '@/lib/prisma';
import { createNotFoundError, createValidationError } from '@/lib/errors';
import { LogoVoteInput } from '@/lib/validations/game';
import { GLOBAL_STATE_ID } from '@/constants';

export const submitGuess = async (userId: string, payload: LogoVoteInput) => {
    const { vote } = payload;

    const globalState = await prisma.gameState.findUnique({ where: { id: GLOBAL_STATE_ID } });
    if (!globalState || !globalState.activeLogoId) {
        throw createValidationError('No active logo finder');
    }

    const logoItem = await prisma.logoItem.findUnique({
        where: { id: globalState.activeLogoId }
    });

    if (!logoItem) {
        throw createNotFoundError('Logo item not found');
    }

    if (logoItem.revealed) {
        throw createValidationError('Voting is closed for this logo');
    }

    await prisma.logoVote.upsert({
        where: {
            logoItemId_memberId: {
                logoItemId: logoItem.id,
                memberId: userId
            }
        },
        update: { vote },
        create: {
            vote,
            logoItemId: logoItem.id,
            memberId: userId
        }
    });

    return { success: true };
};
