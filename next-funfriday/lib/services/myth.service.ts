import { prisma } from '@/lib/prisma';
import { createNotFoundError, createValidationError } from '@/lib/errors';
import { MythVoteInput } from '@/lib/validations/game';
import { GLOBAL_STATE_ID } from '@/constants';

export const submitVote = async (userId: string, payload: MythVoteInput) => {
    const { vote } = payload;

    const globalState = await prisma.gameState.findUnique({ where: { id: GLOBAL_STATE_ID } });
    if (!globalState || !globalState.activeMythId) {
        throw createValidationError('No active myth statement');
    }

    const mythStatement = await prisma.mythStatement.findUnique({
        where: { id: globalState.activeMythId }
    });

    if (!mythStatement) {
        throw createNotFoundError('Myth statement not found');
    }

    if (mythStatement.revealed) {
        throw createValidationError('Voting is closed for this statement');
    }

    await prisma.mythVote.upsert({
        where: {
            mythStatementId_memberId: {
                mythStatementId: mythStatement.id,
                memberId: userId
            }
        },
        update: { vote },
        create: {
            vote,
            mythStatementId: mythStatement.id,
            memberId: userId
        }
    });

    return { success: true };
};
