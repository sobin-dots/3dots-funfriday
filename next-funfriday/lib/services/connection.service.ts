import { prisma } from '@/lib/prisma';
import { AppError, NotFoundError, ValidationError } from '@/lib/errors';
import { ConnectionSubmitInput } from '@/lib/validations/game';
import { ConnectionPuzzle, ConnectionCategory } from '@prisma/client';
import { GLOBAL_STATE_ID, GAME_STATUS } from '@/constants';

export class ConnectionService {
    static async submitGroup(userId: string, payload: ConnectionSubmitInput) {
        const { words } = payload;

        const globalState = await prisma.gameState.findUnique({ where: { id: GLOBAL_STATE_ID } });
        if (!globalState || !globalState.activeConnectionId) {
            throw new ValidationError('No active connection puzzle');
        }

        const puzzle = await prisma.connectionPuzzle.findUnique({
            where: { id: globalState.activeConnectionId },
            include: { categories: true }
        });

        if (!puzzle) {
            throw new NotFoundError('Puzzle not found');
        }

        if (puzzle.status === GAME_STATUS.COMPLETED) {
            throw new ValidationError('Puzzle is already completed');
        }

        const matchResult = this.checkCategoryMatch(puzzle.categories, words);

        if (matchResult.matchedCategory) {
            return await this.handleSuccessfulMatch(userId, puzzle, matchResult.matchedCategory);
        }

        return {
            success: true,
            matched: false,
            oneAway: matchResult.maxMatches === 3
        };
    }

    private static checkCategoryMatch(categories: ConnectionCategory[], words: string[]) {
        let matchedCategory: ConnectionCategory | null = null;
        let maxMatches = 0;

        for (const category of categories) {
            const matchCount = words.filter(w => category.words.includes(w)).length;
            if (matchCount === 4) {
                matchedCategory = category;
                break;
            }
            if (matchCount > maxMatches) {
                maxMatches = matchCount;
            }
        }

        return { matchedCategory, maxMatches };
    }

    private static async handleSuccessfulMatch(userId: string, puzzle: ConnectionPuzzle & { categories: ConnectionCategory[] }, matchedCategory: ConnectionCategory) {
        const existingSolve = await prisma.solvedCategory.findUnique({
            where: {
                memberId_connectionCategoryId: {
                    memberId: userId,
                    connectionCategoryId: matchedCategory.id
                }
            }
        });

        if (existingSolve) {
            throw new ValidationError('You already solved this category');
        }

        await prisma.solvedCategory.create({
            data: {
                memberId: userId,
                connectionCategoryId: matchedCategory.id
            }
        });

        await this.awardPoints(userId, 25);

        const isCompleted = await this.checkPuzzleCompletion(userId, puzzle.id, puzzle.categories.length);

        return {
            success: true,
            matched: true,
            category: matchedCategory.name,
            isCompleted
        };
    }

    private static async awardPoints(userId: string, points: number) {
        await prisma.member.update({
            where: { id: userId },
            data: { quizScore: { increment: points } }
        });
    }

    private static async checkPuzzleCompletion(userId: string, puzzleId: string, totalCategories: number) {
        const memberSolves = await prisma.solvedCategory.count({
            where: {
                memberId: userId,
                connectionCategory: { connectionPuzzleId: puzzleId }
            }
        });

        return memberSolves === totalCategories;
    }
}
