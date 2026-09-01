import { prisma } from '@/lib/prisma';
import { createNotFoundError, createValidationError } from '@/lib/errors';
import { ConnectionSubmitInput } from '@/lib/validations/game';
import { ConnectionPuzzle, ConnectionCategory } from '@prisma/client';
import { GLOBAL_STATE_ID, GAME_STATUS } from '@/constants';

// ─── private helpers (not exported – internal to this module) ────────────────

const checkCategoryMatch = (categories: ConnectionCategory[], words: string[]) => {
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
};

const awardPoints = async (userId: string, points: number) => {
    await prisma.member.update({
        where: { id: userId },
        data: { quizScore: { increment: points } }
    });
};

const checkPuzzleCompletion = async (userId: string, puzzleId: string, totalCategories: number) => {
    const memberSolves = await prisma.solvedCategory.count({
        where: {
            memberId: userId,
            connectionCategory: { connectionPuzzleId: puzzleId }
        }
    });

    return memberSolves === totalCategories;
};

const handleSuccessfulMatch = async (
    userId: string,
    puzzle: ConnectionPuzzle & { categories: ConnectionCategory[] },
    matchedCategory: ConnectionCategory
) => {
    const existingSolve = await prisma.solvedCategory.findUnique({
        where: {
            memberId_connectionCategoryId: {
                memberId: userId,
                connectionCategoryId: matchedCategory.id
            }
        }
    });

    if (existingSolve) {
        throw createValidationError('You already solved this category');
    }

    await prisma.solvedCategory.create({
        data: {
            memberId: userId,
            connectionCategoryId: matchedCategory.id
        }
    });

    await awardPoints(userId, 25);

    const isCompleted = await checkPuzzleCompletion(userId, puzzle.id, puzzle.categories.length);

    return {
        success: true,
        matched: true,
        category: matchedCategory.name,
        isCompleted
    };
};

// ─── public export ────────────────────────────────────────────────────────────

export const submitGroup = async (userId: string, payload: ConnectionSubmitInput) => {
    const { words } = payload;

    const globalState = await prisma.gameState.findUnique({ where: { id: GLOBAL_STATE_ID } });
    if (!globalState || !globalState.activeConnectionId) {
        throw createValidationError('No active connection puzzle');
    }

    const puzzle = await prisma.connectionPuzzle.findUnique({
        where: { id: globalState.activeConnectionId },
        include: { categories: true }
    });

    if (!puzzle) {
        throw createNotFoundError('Puzzle not found');
    }

    if (puzzle.status === GAME_STATUS.COMPLETED) {
        throw createValidationError('Puzzle is already completed');
    }

    const matchResult = checkCategoryMatch(puzzle.categories, words);

    if (matchResult.matchedCategory) {
        return await handleSuccessfulMatch(userId, puzzle, matchResult.matchedCategory);
    }

    return {
        success: true,
        matched: false,
        oneAway: matchResult.maxMatches === 3
    };
};
