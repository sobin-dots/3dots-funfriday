'use client';

interface TopBarProps {
    role: 'member' | 'admin';
    name?: string;
    team?: string;
    points?: number;
    quizScore?: number;
    onlineCount?: number;
    totalJoined?: number;
    onLogout?: () => void;
}

export default function TopBar({
    role,
    name,
    team,
    points = 0,
    quizScore = 0,
    onlineCount = 0,
    totalJoined = 0,
    onLogout
}: TopBarProps) {
    if (role === 'admin') {
        return (
            <div className="topbar">
                <div className="brand"><span className="emoji">🛠️</span> Fun Friday — Control Panel</div>
                <div className="chips">
                    <span className="chip">👥 <b>{onlineCount}</b> online</span>
                    <span className="chip">🧑‍🤝‍🧑 <b>{totalJoined}</b> joined</span>
                    <a className="chip" href="/present" target="_blank" rel="noopener" style={{ textDecoration: 'none', color: 'inherit' }}>📺 Projector</a>
                </div>
            </div>
        );
    }

    return (
        <div className="topbar">
            <div className="brand"><span className="emoji">🎉</span> Fun Friday</div>
            <div className="chips">
                <span className="chip">
                    {name} <span className="tag-team">· {team}</span>
                </span>
                <span className="chip">💰 <b>{points}</b> pts</span>
                <span className="chip">🧠 <b>{quizScore}</b> quiz</span>
                <button className="chip" style={{ cursor: 'pointer' }} onClick={onLogout}>Leave</button>
            </div>
        </div>
    );
}
