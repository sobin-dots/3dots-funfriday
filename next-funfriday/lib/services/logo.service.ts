import { prisma } from '@/lib/prisma';
import { AppError, NotFoundError, ValidationError } from '@/lib/errors';
import { LogoVoteInput } from '@/lib/validations/game';
import { GLOBAL_STATE_ID } from '@/constants';

export class LogoService {
    static async submitGuess(userId: string, payload: LogoVoteInput) {
        const { vote } = payload;

        const globalState = await prisma.gameState.findUnique({ where: { id: GLOBAL_STATE_ID } });
        if (!globalState || !globalState.activeLogoId) {
            throw new ValidationError('No active logo finder');
        }

        const logoItem = await prisma.logoItem.findUnique({
            where: { id: globalState.activeLogoId }
        });

        if (!logoItem) {
            throw new NotFoundError('Logo item not found');
        }

        if (logoItem.revealed) {
            throw new ValidationError('Voting is closed for this logo');
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
    }
}
