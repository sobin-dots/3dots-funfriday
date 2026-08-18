'use client';

interface MythStatement {
    id: string;
    no: number;
    text: string;
    answer: string;
    explanation: string;
    status: 'pending' | 'active' | 'revealed';
    revealed: boolean;
    totalVotes: number;
    votes: Record<string, string>; // memberId -> 'True' | 'False'
}

interface MythState {
    activeStatementId: number | null;
    statements: MythStatement[];
}

interface MythBusterViewProps {
    role: 'member' | 'admin';
    myth: MythState;
    memberId?: string;
    onVote?: (vote: 'True' | 'False') => void;
    onOpen?: (mythId: number) => void;
    onReveal?: () => void;
    onReset?: () => void;
}

export default function MythBusterView({
    role,
    myth,
    memberId,
    onVote,
    onOpen,
    onReveal,
    onReset
}: MythBusterViewProps) {
    const activeStatement = myth.statements.find((s) => s.no === myth.activeStatementId);

    const renderVoteBar = (statement: MythStatement) => {
        const trueVotes = Object.values(statement.votes).filter(v => v === 'True').length;
        const falseVotes = Object.values(statement.votes).filter(v => v === 'False').length;
        const total = trueVotes + falseVotes;
        const tp = total ? Math.round((trueVotes / total) * 100) : 0;
        const fp = total ? 100 - tp : 0;

        return (
            <>
                <div className="vote-bar">
                    <div className="seg seg-true" style={{ width: `${tp}%` }}>
                        {trueVotes > 0 ? `TRUE ${tp}%` : ''}
                    </div>
                    <div className="seg seg-false" style={{ width: `${fp}%` }}>
                        {falseVotes > 0 ? `FALSE ${fp}%` : ''}
                    </div>
                </div>
                <p className="center muted">✅ {trueVotes} &nbsp; · &nbsp; ❌ {falseVotes}</p>
            </>
        );
    };

    if (role === 'member') {
        if (!activeStatement) {
            return <div className="card empty">🧠 Myth Buster is open. Waiting for the next statement…</div>;
        }

        const myVote = memberId ? activeStatement.votes[memberId] : null;

        return (
            <div className="card">
                <h3>Statement #{activeStatement.no} · Myth Buster</h3>
                <div className="bigitem" style={{ textAlign: 'left' }}>
                    <div className="name" style={{ fontSize: '1.3rem' }}>{activeStatement.text}</div>
                </div>

                {!activeStatement.revealed ? (
                    <>
                        <p className="muted center" style={{ marginTop: '12px' }}>Discuss with your team, then vote:</p>
                        <div className="vote-row">
                            <button
                                className={`btn-true vote ${myVote === 'True' ? 'selected' : ''}`}
                                onClick={() => onVote && onVote('True')}
                            >
                                ✅ TRUE{myVote === 'True' ? ' ✓' : ''}
                            </button>
                            <button
                                className={`btn-false vote ${myVote === 'False' ? 'selected' : ''}`}
                                onClick={() => onVote && onVote('False')}
                            >
                                ❌ FALSE{myVote === 'False' ? ' ✓' : ''}
                            </button>
                        </div>
                        {myVote ? (
                            <p className="center" style={{ marginTop: '10px' }}>
                                You voted <b>{myVote}</b>. You can change it until the answer is revealed.
                            </p>
                        ) : (
                            <p className="center muted" style={{ marginTop: '10px' }}>No vote yet.</p>
                        )}
                        <p className="center muted">{activeStatement.totalVotes} vote(s) in so far.</p>
                    </>
                ) : (
                    <>
                        {renderVoteBar(activeStatement)}
                        <div className={`answer-box ${activeStatement.answer === 'True' ? 'true' : 'false'}`}>
                            ✔ Correct answer: {activeStatement.answer.toUpperCase()}<br />
                            <span className="muted" style={{ fontWeight: 500 }}>{activeStatement.explanation}</span>
                        </div>
                        <p className="center" style={{ marginTop: '10px' }}>
                            {myVote ? (
                                myVote === activeStatement.answer ? (
                                    <span className="correct">🎉 You were right! +10 quiz points</span>
                                ) : (
                                    <span className="wrong">You voted {myVote} — not this time.</span>
                                )
                            ) : (
                                <span className="muted">You didn&apos;t vote on this one.</span>
                            )}
                        </p>
                    </>
                )}
            </div>
        );
    }

    // Admin View
    return (
        <>
            {activeStatement && (
                <div className="card">
                    <h2>🔴 Live now — Statement #{activeStatement.no}</h2>
                    <div className="bigitem" style={{ textAlign: 'left' }}>
                        <div className="name" style={{ fontSize: '1.25rem' }}>{activeStatement.text}</div>
                    </div>

                    {renderVoteBar(activeStatement)}

                    <div className={`answer-box ${activeStatement.answer === 'True' ? 'true' : 'false'}`} style={{ opacity: activeStatement.revealed ? 1 : 0.6 }}>
                        {activeStatement.revealed ? '✔ Revealed — ' : '👁️ Answer (hidden from members): '}
                        <b>{activeStatement.answer}</b> — <span className="muted">{activeStatement.explanation}</span>
                    </div>

                    <div className="row" style={{ marginTop: '12px' }}>
                        <button
                            className="good grow"
                            disabled={activeStatement.revealed}
                            onClick={onReveal}
                        >
                            👁️ Reveal answer &amp; award points
                        </button>
                        {activeStatement.no < myth.statements.length && (
                            <button
                                className="secondary"
                                onClick={() => onOpen && onOpen(activeStatement.no + 1)}
                            >
                                Next →
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="card">
                <div className="flex-between">
                    <h2>🧠 Statements</h2>
                    <button className="bad small" onClick={onReset}>
                        Reset quiz
                    </button>
                </div>
                <div className="item-list">
                    {myth.statements.map((s) => (
                        <div key={s.id} className={`item-tile ${s.status === 'revealed' ? 'sold' : s.status === 'active' ? 'active' : ''}`}>
                            <div className="flex-between">
                                <span className="t-name">#{s.no}</span>
                                <span className={`badge ${s.status === 'revealed' ? 'revealed' : s.status}`}>{s.status}</span>
                            </div>
                            <div className="t-name">{s.text}</div>
                            <div className="t-why">Answer: <b>{s.answer}</b> · {s.totalVotes} votes</div>
                            <button
                                className="small"
                                onClick={() => onOpen && onOpen(s.no)}
                            >
                                {s.status === 'pending' ? 'Open' : 'Re-open'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
