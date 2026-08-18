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

interface ScoreBoardProps {
    members: Record<string, Member>;
}

export default function ScoreBoard({ members }: ScoreBoardProps) {
    // Calculate team stats from members
    const teamMap: Record<string, { members: number; quizScore: number; pointsLeft: number; itemsWon: number }> = {};

    Object.values(members).forEach((m) => {
        if (!teamMap[m.team]) {
            teamMap[m.team] = { members: 0, quizScore: 0, pointsLeft: 0, itemsWon: 0 };
        }
        teamMap[m.team].members += 1;
        teamMap[m.team].quizScore += m.quizScore;
        teamMap[m.team].pointsLeft += m.points;
        teamMap[m.team].itemsWon += m.wonItems.length;
    });

    // Convert to array and sort by quizScore (descending), then pointsLeft (descending)
    const teams = Object.entries(teamMap)
        .map(([team, stats]) => ({ team, ...stats }))
        .sort((a, b) => b.quizScore - a.quizScore || b.pointsLeft - a.pointsLeft);

    if (teams.length === 0) {
        return (
            <div className="card">
                <h2>🏆 Team scoreboard</h2>
                <p className="empty">No teams yet.</p>
            </div>
        );
    }

    return (
        <div className="card">
            <h2>🏆 Team scoreboard</h2>
            <table>
                <thead>
                    <tr>
                        <th className="rank">#</th>
                        <th>Team</th>
                        <th>Members</th>
                        <th>Quiz score</th>
                        <th>Points left</th>
                        <th>Items won</th>
                    </tr>
                </thead>
                <tbody>
                    {teams.map((t, i) => (
                        <tr key={t.team}>
                            <td className="rank">{i + 1}</td>
                            <td><b>{t.team}</b></td>
                            <td>{t.members}</td>
                            <td><b>{t.quizScore}</b></td>
                            <td>{t.pointsLeft}</td>
                            <td>{t.itemsWon}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
