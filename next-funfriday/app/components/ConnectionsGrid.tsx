'use client';

import { useState } from 'react';

interface ConnectionCategory {
    id: string;
    name: string;
    level: 'yellow' | 'green' | 'blue' | 'purple';
    words: string[];
    solvedBy: string[]; // array of memberIds
}

interface ConnectionPuzzle {
    id: string;
    no: number;
    title: string;
    status: 'pending' | 'active' | 'solved';
    revealedCategories: string[];
    categories: ConnectionCategory[];
}

interface ConnectionState {
    activePuzzleId: number | null;
    puzzles: ConnectionPuzzle[];
}

interface ConnectionsGridProps {
    role: 'member' | 'admin';
    connection: ConnectionState;
    memberId?: string;
    onSubmit?: (words: string[]) => void;
    onOpen?: (puzzleId: number) => void;
    onRevealCategory?: (categoryName: string) => void;
    onReset?: () => void;
}

export default function ConnectionsGrid({
    role,
    connection,
    memberId,
    onSubmit,
    onOpen,
    onRevealCategory,
    onReset
}: ConnectionsGridProps) {
    const [selectedWords, setSelectedWords] = useState<string[]>([]);

    const activePuzzle = connection.puzzles.find((p) => p.no === connection.activePuzzleId);

    if (role === 'member') {
        if (!activePuzzle) {
            return <div className="card empty">🧩 Connection Game is open. Waiting for the facilitator to start a puzzle…</div>;
        }

        // Find which categories this member has solved (or admin has revealed)
        const solvedCatNames = activePuzzle.categories
            .filter((c) => c.solvedBy.includes(memberId || '') || activePuzzle.revealedCategories.includes(c.name))
            .map((c) => c.name);

        const solvedCategories = activePuzzle.categories.filter((c) => solvedCatNames.includes(c.name));

        // Get all remaining unsolved words
        const unsolvedWords = activePuzzle.categories
            .filter((c) => !solvedCatNames.includes(c.name))
            .flatMap((c) => c.words);

        const toggleWord = (word: string) => {
            if (selectedWords.includes(word)) {
                setSelectedWords(selectedWords.filter((w) => w !== word));
            } else {
                if (selectedWords.length >= 4) return;
                setSelectedWords([...selectedWords, word]);
            }
        };

        const handleSubmit = () => {
            if (selectedWords.length === 4 && onSubmit) {
                onSubmit(selectedWords);
                setSelectedWords([]); // Reset selection after submit
            }
        };

        return (
            <div className="card">
                <h3>{activePuzzle.title} · Create 4 groups of 4 words</h3>
                <p className="muted center">Select 4 related words and tap <b>Submit Group</b>.</p>

                {/* Solved Banners */}
                {solvedCategories.map((c) => (
                    <div key={c.name} className={`cat-banner cat-${c.level}`}>
                        <div className="cat-title">{c.name}</div>
                        <div className="cat-words">{c.words.join(' • ')}</div>
                    </div>
                ))}

                {/* Unsolved Words Grid */}
                {unsolvedWords.length > 0 ? (
                    <div className="conn-grid">
                        {unsolvedWords.map((word) => (
                            <div
                                key={word}
                                className={`word-tile ${selectedWords.includes(word) ? 'selected' : ''}`}
                                onClick={() => toggleWord(word)}
                            >
                                {word}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="answer-box true center" style={{ fontSize: '1.2rem', margin: '16px 0' }}>
                        🎉 Incredible! You solved all 4 categories! +100 Total Quiz Points!
                    </div>
                )}

                {/* Action Buttons */}
                {unsolvedWords.length > 0 && (
                    <div className="row" style={{ marginTop: '14px' }}>
                        <button
                            className="good grow"
                            disabled={selectedWords.length !== 4}
                            onClick={handleSubmit}
                        >
                            Submit Group ({selectedWords.length}/4)
                        </button>
                        <button
                            className="secondary"
                            disabled={selectedWords.length === 0}
                            onClick={() => setSelectedWords([])}
                        >
                            Deselect All
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // Admin View
    return (
        <>
            {activePuzzle && (
                <div className="card">
                    <h2>🔴 Live now — {activePuzzle.title}</h2>
                    <p className="muted">Categories in this puzzle:</p>

                    {activePuzzle.categories.map((cat) => {
                        const isRevealed = activePuzzle.revealedCategories.includes(cat.name);
                        return (
                            <div key={cat.name} className={`cat-banner cat-${cat.level}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
                                <div style={{ textAlign: 'left' }}>
                                    <div className="cat-title">{cat.name}</div>
                                    <div className="cat-words">{cat.words.join(' • ')}</div>
                                </div>
                                <button
                                    className="secondary small"
                                    disabled={isRevealed}
                                    onClick={() => onRevealCategory && onRevealCategory(cat.name)}
                                >
                                    {isRevealed ? 'Revealed' : 'Reveal category'}
                                </button>
                            </div>
                        );
                    })}

                    {activePuzzle.no < connection.puzzles.length && (
                        <button
                            className="secondary"
                            style={{ marginTop: '10px' }}
                            onClick={() => onOpen && onOpen(activePuzzle.no + 1)}
                        >
                            Next Puzzle →
                        </button>
                    )}
                </div>
            )}

            <div className="card">
                <div className="flex-between">
                    <h2>🧩 Connection Puzzles</h2>
                    <button className="bad small" onClick={onReset}>
                        Reset connection game
                    </button>
                </div>
                <div className="item-list">
                    {connection.puzzles.map((pz) => (
                        <div key={pz.id} className={`item-tile ${pz.status === 'active' ? 'active' : ''}`}>
                            <div className="flex-between">
                                <span className="t-name">#{pz.no}</span>
                                <span className={`badge ${pz.status}`}>{pz.status}</span>
                            </div>
                            <div className="t-name">{pz.title}</div>
                            <div className="t-why">4 categories • 16 words</div>
                            <button
                                className="small"
                                onClick={() => onOpen && onOpen(pz.no)}
                            >
                                {pz.status === 'pending' ? 'Open' : 'Re-open'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
