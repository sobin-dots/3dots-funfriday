import { prisma } from '@/lib/prisma';
import { AppError, NotFoundError, ValidationError } from '@/lib/errors';
import { MythVoteInput } from '@/lib/validations/game';
import { GLOBAL_STATE_ID } from '@/constants';

export class MythService {
    static async submitVote(userId: string, payload: MythVoteInput) {
        const { vote } = payload;

        const globalState = await prisma.gameState.findUnique({ where: { id: GLOBAL_STATE_ID } });
        if (!globalState || !globalState.activeMythId) {
            throw new ValidationError('No active myth statement');
        }

        const mythStatement = await prisma.mythStatement.findUnique({
            where: { id: globalState.activeMythId }
        });

        if (!mythStatement) {
            throw new NotFoundError('Myth statement not found');
        }

        if (mythStatement.revealed) {
            throw new ValidationError('Voting is closed for this statement');
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
    }
}
