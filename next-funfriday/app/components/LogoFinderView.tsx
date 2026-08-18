'use client';

import { useState } from 'react';

interface LogoItem {
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
    votes: Record<string, string>; // memberId -> guess
}

interface LogoState {
    activeLogoId: number | null;
    items: LogoItem[];
}

interface LogoFinderViewProps {
    role: 'member' | 'admin';
    logo: LogoState;
    memberId?: string;
    onVote?: (guess: string) => void;
    onOpen?: (logoId: number) => void;
    onReveal?: () => void;
    onReset?: () => void;
}

export default function LogoFinderView({
    role,
    logo,
    memberId,
    onVote,
    onOpen,
    onReveal,
    onReset
}: LogoFinderViewProps) {
    const [levelFilter, setLevelFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

    const activeLogo = logo.items.find((l) => l.no === logo.activeLogoId);

    if (role === 'member') {
        if (!activeLogo) {
            return <div className="card empty">🎨 Old Logo Finder is open. Waiting for the facilitator to open a logo…</div>;
        }

        const myVote = memberId ? activeLogo.votes[memberId] : null;

        return (
            <div className="card center">
                <h3>Logo #{activeLogo.no} · Famous Brands Old Logo Finder &nbsp;<span className={`badge ${activeLogo.level}`}>{activeLogo.level.toUpperCase()}</span></h3>
                <div className="logo-img-container">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={activeLogo.svg} alt="Vintage Logo" />
                </div>
                <p className="muted" style={{ fontStyle: 'italic' }}>&quot;{activeLogo.hint}&quot;</p>

                {!activeLogo.revealed ? (
                    <>
                        <p className="muted" style={{ marginTop: '12px' }}>Which famous brand used this logo?</p>
                        <div className="options-grid">
                            {activeLogo.options.map((opt) => (
                                <button
                                    key={opt}
                                    className={`option-btn logo-vote ${myVote === opt ? 'selected' : ''}`}
                                    onClick={() => onVote && onVote(opt)}
                                >
                                    {opt}{myVote === opt ? ' ✓' : ''}
                                </button>
                            ))}
                        </div>
                        {myVote ? (
                            <p className="center" style={{ marginTop: '12px' }}>Your guess: <b>{myVote}</b></p>
                        ) : (
                            <p className="center muted" style={{ marginTop: '12px' }}>Select an option to place your guess.</p>
                        )}
                        <p className="center muted">{activeLogo.totalVotes} vote(s) submitted.</p>
                    </>
                ) : (
                    <>
                        <div className="options-grid">
                            {activeLogo.options.map((opt) => {
                                const isAns = opt === activeLogo.answer;
                                const isMyVote = opt === myVote;
                                const cls = isAns ? 'correct-opt' : isMyVote ? 'wrong-opt' : '';
                                return (
                                    <div key={opt} className={`option-btn ${cls}`}>
                                        {opt} {isAns ? '✅' : ''}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="answer-box true" style={{ marginTop: '14px' }}>
                            ✔ Correct brand: <b>{activeLogo.answer}</b><br />
                            <span className="muted" style={{ fontWeight: 500 }}>{activeLogo.explanation}</span>
                        </div>
                        <p className="center" style={{ marginTop: '10px' }}>
                            {myVote ? (
                                myVote === activeLogo.answer ? (
                                    <span className="correct">🎉 Correct! +10 quiz points</span>
                                ) : (
                                    <span className="wrong">You guessed {myVote} — correct answer was {activeLogo.answer}.</span>
                                )
                            ) : (
                                <span className="muted">You didn&apos;t guess this logo.</span>
                            )}
                        </p>
                    </>
                )}
            </div>
        );
    }

    // Admin View
    const filteredItems = logo.items.filter((it) => levelFilter === 'all' || it.level === levelFilter);
    const easyCount = logo.items.filter((i) => i.level === 'easy').length;
    const mediumCount = logo.items.filter((i) => i.level === 'medium').length;
    const hardCount = logo.items.filter((i) => i.level === 'hard').length;

    return (
        <>
            {activeLogo && (
                <div className="card center">
                    <h2>🔴 Live now — Logo #{activeLogo.no} &nbsp;<span className={`badge ${activeLogo.level}`}>{activeLogo.level.toUpperCase()}</span></h2>
                    <div className="logo-img-container" style={{ maxWidth: '240px', height: '200px' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={activeLogo.svg} alt="Logo" />
                    </div>
                    <p className="muted" style={{ fontStyle: 'italic' }}>&quot;{activeLogo.hint}&quot;</p>

                    <div className="answer-box true" style={{ opacity: activeLogo.revealed ? 1 : 0.6 }}>
                        {activeLogo.revealed ? '✔ Revealed — ' : '👁️ Correct Brand (hidden): '}
                        <b>{activeLogo.answer}</b> — <span className="muted">{activeLogo.explanation}</span>
                    </div>

                    <div className="row" style={{ marginTop: '12px' }}>
                        <button
                            className="good grow"
                            disabled={activeLogo.revealed}
                            onClick={onReveal}
                        >
                            👁️ Reveal answer &amp; award points
                        </button>
                        {activeLogo.no < logo.items.length && (
                            <button
                                className="secondary"
                                onClick={() => onOpen && onOpen(activeLogo.no + 1)}
                            >
                                Next Logo →
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="card">
                <div className="flex-between">
                    <h2>🎨 Vintage Logos ({logo.items.length})</h2>
                    <button className="bad small" onClick={onReset}>
                        Reset logo game
                    </button>
                </div>

                <div className="level-pills">
                    <div className={`level-pill ${levelFilter === 'all' ? 'active' : ''}`} onClick={() => setLevelFilter('all')}>All ({logo.items.length})</div>
                    <div className={`level-pill ${levelFilter === 'easy' ? 'active' : ''}`} onClick={() => setLevelFilter('easy')}>🟢 Easy ({easyCount})</div>
                    <div className={`level-pill ${levelFilter === 'medium' ? 'active' : ''}`} onClick={() => setLevelFilter('medium')}>🟡 Medium ({mediumCount})</div>
                    <div className={`level-pill ${levelFilter === 'hard' ? 'active' : ''}`} onClick={() => setLevelFilter('hard')}>🔴 Hard ({hardCount})</div>
                </div>

                <div className="item-list">
                    {filteredItems.map((item) => (
                        <div key={item.id} className={`item-tile ${item.status === 'revealed' ? 'sold' : item.status === 'active' ? 'active' : ''}`}>
                            <div className="flex-between">
                                <span className="t-name">#{item.no} <span className={`badge ${item.level}`}>{item.level.toUpperCase()}</span></span>
                                <span className={`badge ${item.status === 'revealed' ? 'revealed' : item.status}`}>{item.status}</span>
                            </div>
                            <div className="t-name">Brand: <b>{item.answer}</b></div>
                            <div className="t-why">{item.totalVotes} votes submitted</div>
                            <button
                                className="small"
                                onClick={() => onOpen && onOpen(item.no)}
                            >
                                {item.status === 'pending' ? 'Open' : 'Re-open'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
