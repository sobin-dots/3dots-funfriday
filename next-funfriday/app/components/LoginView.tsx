'use client';

import { useState } from 'react';

interface LoginViewProps {
    onJoin: (name: string, team: string) => void;
    onAdminLogin: (password: string) => void;
}

export default function LoginView({ onJoin, onAdminLogin }: LoginViewProps) {
    const [name, setName] = useState('');
    const [team, setTeam] = useState('');
    const [password, setPassword] = useState('');

    return (
        <section id="view-login">
            <div className="hero">
                <h1>🎉 Fun Friday</h1>
                <p>Auction · Myth Buster · Vintage Logo Finder · Connection</p>
            </div>
            <div className="login-grid">
                <div className="card">
                    <h2>👋 Join as a team member</h2>
                    <label htmlFor="in-name">Your name</label>
                    <input
                        id="in-name"
                        type="text"
                        placeholder="e.g. Priya"
                        maxLength={40}
                        autoComplete="off"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && document.getElementById('in-team')?.focus()}
                    />
                    <label htmlFor="in-team">Your team</label>
                    <input
                        id="in-team"
                        type="text"
                        placeholder="e.g. Team Rocket"
                        maxLength={40}
                        autoComplete="off"
                        value={team}
                        onChange={(e) => setTeam(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onJoin(name, team)}
                    />
                    <br />
                    <button className="block" onClick={() => onJoin(name, team)}>
                        Join the fun →
                    </button>
                </div>

                <div className="card">
                    <h2>🛠️ Admin / Facilitator</h2>
                    <p className="muted">Run the auction and games from here.</p>
                    <label htmlFor="in-pass">Admin password</label>
                    <input
                        id="in-pass"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onAdminLogin(password)}
                    />
                    <br />
                    <button className="block secondary" onClick={() => onAdminLogin(password)}>
                        Open control panel
                    </button>
                    <p className="muted" style={{ marginTop: '14px', fontSize: '0.85rem' }}>
                        📊 Slide Deck: <a href="/deck.html" target="_blank" rel="noopener" style={{ fontWeight: 'bold', color: 'var(--brand)' }}>/deck.html (PPT Presentation)</a><br />
                        Projector view: <a href="/present" target="_blank" rel="noopener">/present</a>
                    </p>
                </div>
            </div>
        </section>
    );
}
