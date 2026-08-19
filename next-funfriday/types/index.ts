export interface Member {
    id: string;
    name: string;
    team: string;
    points: number;
    quizScore: number;
    connected: boolean;
    wonItems: number[];
}

export interface AuctionItem {
    id: string;
    no: number;
    name: string;
    why: string;
    status: 'pending' | 'active' | 'sold';
    currentBid: number;
    currentBidderId: string | null;
    winnerId: string | null;
    winningBid: number;
    reason: string | null;
}

export interface MythStatement {
    id: string;
    no: number;
    text: string;
    answer: string;
    explanation: string;
    status: 'pending' | 'active' | 'revealed';
    revealed: boolean;
    totalVotes: number;
    votes: Record<string, string>;
}

export interface LogoItem {
    id: string;
    no: number;
    level: 'easy' | 'medium' | 'hard';
    svg: string;
    hint: string;
    answer: string;
    options: string[];
    explanation: string;
    status: 'pending' | 'active' | 'revealed';
    revealed: boolean;
    totalVotes: number;
    votes: Record<string, string>;
}

export interface ConnectionCategory {
    id: string;
    name: string;
    level: 'blue' | 'green' | 'purple' | 'yellow';
    words: string[];
    solvedBy: string[];
}

export interface ConnectionPuzzle {
    id: string;
    no: number;
    title: string;
    status: 'pending' | 'active' | 'solved';
    revealedCategories: string[];
    categories: ConnectionCategory[];
}

export interface GameState {
    phase: string;
    members: Record<string, Member>;
    auction: { items: AuctionItem[]; activeItemId: number | null };
    myth: { statements: MythStatement[]; activeStatementId: number | null };
    logo: { items: LogoItem[]; activeLogoId: number | null };
    connection: { puzzles: ConnectionPuzzle[]; activePuzzleId: number | null };
}
