'use client';

interface Member {
    id: string;
    name: string;
    team: string;
    points: number;
    quizScore: number;
    connected: boolean;
    wonItems: number[];
}

interface PeopleViewProps {
    members: Record<string, Member>;
    onKick?: (memberId: string) => void;
    onResetMembers?: () => void;
}

export default function PeopleView({ members, onKick, onResetMembers }: PeopleViewProps) {
    const memberList = Object.values(members).sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="card">
            <div className="flex-between">
                <h2>👥 Members ({memberList.length})</h2>
                <button className="bad small" onClick={onResetMembers}>
                    Clear all members
                </button>
            </div>

            {memberList.length > 0 ? (
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Team</th>
                            <th>Points</th>
                            <th>Quiz</th>
                            <th>Items</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {memberList.map((m) => (
                            <tr key={m.id}>
                                <td>
                                    <span className={`dot ${m.connected ? 'on' : 'off'}`}></span>
                                    {m.name}
                                </td>
                                <td className="tag-team">{m.team}</td>
                                <td>{m.points}</td>
                                <td>{m.quizScore}</td>
                                <td>{m.wonItems.length}</td>
                                <td>
                                    <button
                                        className="bad small kick"
                                        onClick={() => onKick && onKick(m.id)}
                                    >
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p className="empty">Nobody has joined yet. Share the QR / link from the server window.</p>
            )}
        </div>
    );
}
