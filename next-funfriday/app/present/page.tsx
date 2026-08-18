'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import ScoreBoard from '../components/ScoreBoard';
import { GameState } from '../../types';
import { SOCKET_EVENTS } from '../../constants/events';

let socket: Socket;

export default function PresenterPage() {
    const [gameState, setGameState] = useState<GameState | null>(null);

    useEffect(() => {
        socket = io();

        socket.on(SOCKET_EVENTS.CONNECT, () => {
            socket.emit(SOCKET_EVENTS.SPECTATOR_JOIN);
        });

        socket.on(SOCKET_EVENTS.STATE_UPDATE, (state: GameState) => {
            setGameState(state);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    if (!gameState) {
        return (
            <div className="present-wrap">
                <div className="card empty" style={{ fontSize: '1.6rem', marginTop: '50px' }}>
                    ⏳ Loading game state...
                </div>
            </div>
        );
    }

    const onlineCount = Object.values(gameState.members).filter((m) => m.connected).length;

    const renderAuction = () => {
        const item = gameState.auction.items.find((i: { no: number }) => i.no === gameState.auction.activeItemId);
        if (!item) {
            return (
                <div className="card empty" style={{ fontSize: '1.6rem' }}>
                    🏷️ Productivity Auction<br />
                    <span className="muted">Next item coming up…</span>
                </div>
            );
        }
        return (
            <>
                <div className="ptitle">🏷️ Productivity Auction — Item #{item.no}</div>
                <div className="card">
                    <div className="bigitem">
                        <div className="name">{item.name}</div>
                        <div className="why">{item.why}</div>
                        <div className="bid-display">{item.currentBid} pts</div>
                        <div className="bid-by" style={{ fontSize: '1.4rem' }}>
                            {item.currentBidderId ? '🏆 Top bid placed' : 'Waiting for the first bid…'}
                        </div>
                    </div>
                </div>
            </>
        );
    };

    const renderMyth = () => {
        const st = gameState.myth.statements.find((s: { no: number }) => s.no === gameState.myth.activeStatementId);
        if (!st) {
            return (
                <div className="card empty" style={{ fontSize: '1.6rem' }}>
                    🧠 Myth Buster<br />
                    <span className="muted">Next statement coming up…</span>
                </div>
            );
        }

        const trueVotes = Object.values(st.votes as Record<string, string>).filter(v => v === 'True').length;
        const falseVotes = Object.values(st.votes as Record<string, string>).filter(v => v === 'False').length;
        const total = trueVotes + falseVotes;
        const tp = total ? Math.round((trueVotes / total) * 100) : 0;
        const fp = total ? 100 - tp : 0;

        return (
            <>
                <div className="ptitle">🧠 Myth Buster — Statement #{st.no}</div>
                <div className="card">
                    <div className="bigitem" style={{ textAlign: 'left' }}>
                        <div className="name">{st.text}</div>
                    </div>
                    <div className="vote-bar">
                        <div className="seg seg-true" style={{ width: `${tp}%` }}>
                            {trueVotes > 0 ? `TRUE ${tp}%` : ''}
                        </div>
                        <div className="seg seg-false" style={{ width: `${fp}%` }}>
                            {falseVotes > 0 ? `FALSE ${fp}%` : ''}
                        </div>
                    </div>
                    <p className="center" style={{ fontSize: '1.4rem' }}>
                        ✅ {trueVotes} &nbsp;·&nbsp; ❌ {falseVotes} &nbsp;·&nbsp; {total} votes
                    </p>
                    {st.revealed && (
                        <div className={`answer-box ${st.answer === 'True' ? 'true' : 'false'}`} style={{ fontSize: '1.5rem' }}>
                            ✔ Correct answer: {st.answer.toUpperCase()}<br />
                            <span className="muted" style={{ fontWeight: 500, fontSize: '1.1rem' }}>{st.explanation}</span>
                        </div>
                    )}
                </div>
            </>
        );
    };

    const renderLogo = () => {
        const item = gameState.logo.items.find((l: { no: number }) => l.no === gameState.logo.activeLogoId);
        if (!item) {
            return (
                <div className="card empty" style={{ fontSize: '1.6rem' }}>
                    🎨 Vintage Logo Finder<br />
                    <span className="muted">Next logo coming up…</span>
                </div>
            );
        }

        const total = Object.keys(item.votes).length;

        return (
            <>
                <div className="ptitle">🎨 Vintage Logo Finder — Logo #{item.no} &nbsp;<span className={`badge ${item.level}`}>{item.level.toUpperCase()}</span></div>
                <div className="card center">
                    <div className="logo-img-container" style={{ maxWidth: '340px', height: '280px' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.svg} alt="Vintage Logo" />
                    </div>
                    <p className="muted" style={{ fontSize: '1.25rem', fontStyle: 'italic' }}>&quot;{item.hint}&quot;</p>

                    <div style={{ margin: '20px 0', textAlign: 'left' }}>
                        {item.options.map((opt: string) => {
                            const count = Object.values(item.votes as Record<string, string>).filter(v => v === opt).length;
                            const pct = total ? Math.round((count / total) * 100) : 0;
                            const isCorrect = item.revealed && opt === item.answer;

                            return (
                                <div key={opt} style={{ marginBottom: '8px' }}>
                                    <div className="flex-between" style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                                        <span>{opt} {isCorrect ? '✅' : ''}</span>
                                        <span>{count} ({pct}%)</span>
                                    </div>
                                    <div className="vote-bar" style={{ height: '18px' }}>
                                        <div className={`seg ${isCorrect ? 'seg-true' : 'seg-false'}`} style={{ width: `${pct}%`, background: isCorrect ? 'var(--good)' : 'var(--brand)' }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <p className="center" style={{ fontSize: '1.3rem' }}>📥 Total votes received: <b>{total}</b></p>

                    {item.revealed && (
                        <div className="answer-box true" style={{ fontSize: '1.5rem' }}>
                            🎉 Correct Answer: <b>{item.answer}</b><br />
                            <span className="muted" style={{ fontWeight: 500, fontSize: '1.1rem' }}>{item.explanation}</span>
                        </div>
                    )}
                </div>
            </>
        );
    };

    const renderConnection = () => {
        const pz = gameState.connection.puzzles.find((p: { no: number }) => p.no === gameState.connection.activePuzzleId);
        if (!pz) {
            return (
                <div className="card empty" style={{ fontSize: '1.6rem' }}>
                    🧩 Connection Puzzle<br />
                    <span className="muted">Next puzzle coming up…</span>
                </div>
            );
        }

        const allWords = pz.categories.flatMap((c: { words: string[] }) => c.words);

        return (
            <>
                <div className="ptitle">🧩 {pz.title}</div>
                <div className="card">
                    {pz.categories.map((c: { name: string; level: string; words: string[]; solvedBy: string[] }) => {
                        const isRevealed = pz.revealedCategories.includes(c.name);
                        if (isRevealed) {
                            return (
                                <div key={c.name} className={`cat-banner cat-${c.level}`}>
                                    <div className="cat-title">{c.name}</div>
                                    <div className="cat-words">{c.words.join(' • ')}</div>
                                </div>
                            );
                        }
                        return (
                            <div key={c.name} className="card" style={{ marginBottom: '10px' }}>
                                <div className="flex-between">
                                    <div><b style={{ fontSize: '1.2rem' }}>Category: ???</b> <span className="muted">({c.level.toUpperCase()} TIER)</span></div>
                                    <div><b>{c.solvedBy.length}</b> player(s) solved</div>
                                </div>
                            </div>
                        );
                    })}

                    <h3 style={{ marginTop: '20px', textAlign: 'center' }}>16 Words to Group into 4 Categories</h3>
                    <div className="conn-grid">
                        {allWords.map((w: string) => (
                            <div key={w} className="word-tile" style={{ cursor: 'default' }}>{w}</div>
                        ))}
                    </div>
                </div>
            </>
        );
    };

    return (
        <div className="present-wrap">
            <style dangerouslySetInnerHTML={{
                __html: `
        body { font-size: 1.15rem; }
        .present-wrap { max-width: 1280px; margin: 0 auto; padding: 24px; }
        .present-wrap .bigitem .name { font-size: 2.6rem; }
        .present-wrap .bid-display { font-size: 4rem; }
        .present-wrap .vote-bar { height: 46px; }
        .present-wrap .vote-bar .seg { font-size: 1.2rem; }
        .ptitle { text-align: center; font-size: 1.6rem; font-weight: 800; margin: 0 0 16px; }
      `}} />

            <div className="topbar">
                <div className="brand"><span className="emoji">🚀</span> 3dots x Wizi — Partnership Event</div>
                <div className="chips">
                    <a className="chip" href="/deck.html" target="_blank" style={{ textDecoration: 'none', color: 'inherit', fontWeight: 'bold' }}>📊 Presentation Deck</a>
                    <span className="chip">👥 <b>{onlineCount}</b> playing</span>
                </div>
            </div>

            {gameState.phase === 'lobby' && (
                <div className="card empty" style={{ fontSize: '1.6rem' }}>
                    ⏳ Get ready! The next game starts soon…<br />
                    <span className="muted">Join from your phone on the office Wi-Fi.</span>
                </div>
            )}

            {gameState.phase === 'auction' && renderAuction()}
            {gameState.phase === 'myth' && renderMyth()}
            {gameState.phase === 'logo' && renderLogo()}
            {gameState.phase === 'connection' && renderConnection()}

            {gameState.phase === 'results' && (
                <>
                    <div className="ptitle">🏆 Results</div>
                    <ScoreBoard members={gameState.members} />
                </>
            )}
        </div>
    );
}
