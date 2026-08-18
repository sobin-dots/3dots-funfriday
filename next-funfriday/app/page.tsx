'use client';

import { useState } from 'react';
import LoginView from './components/LoginView';
import TopBar from './components/TopBar';
import AuctionView from './components/AuctionView';
import MythBusterView from './components/MythBusterView';
import LogoFinderView from './components/LogoFinderView';
import ConnectionsGrid from './components/ConnectionsGrid';
import ScoreBoard from './components/ScoreBoard';
import PeopleView from './components/PeopleView';
import { useGameState } from '../hooks/useGameState';
import { SOCKET_EVENTS } from '../constants/events';

export default function Home() {
  const {
    socket,
    gameState,
    role,
    memberId,
    handleJoin,
    handleAdminLogin,
    handleLogout
  } = useGameState();

  const [adminTab, setAdminTab] = useState<string>('auction');

  // --- Render Helpers ---
  if (role === 'guest') {
    return (
      <div className="wrap">
        <LoginView onJoin={handleJoin} onAdminLogin={handleAdminLogin} />
      </div>
    );
  }

  if (!gameState) {
    return <div className="wrap center" style={{ marginTop: '50px' }}>Loading game state...</div>;
  }

  const you = gameState.members[memberId];
  const onlineCount = Object.values(gameState.members).filter((m) => m.connected).length;
  const totalJoined = Object.keys(gameState.members).length;

  return (
    <div className="wrap">
      <TopBar
        role={role}
        name={you?.name}
        team={you?.team}
        points={you?.points}
        quizScore={you?.quizScore}
        onlineCount={onlineCount}
        totalJoined={totalJoined}
        onLogout={handleLogout}
      />

      {role === 'admin' && (
        <div className="tabs" id="admin-tabs">
          <div className={`tab ${adminTab === 'auction' ? 'active' : ''}`} onClick={() => setAdminTab('auction')}>🏷️ Auction</div>
          <div className={`tab ${adminTab === 'myth' ? 'active' : ''}`} onClick={() => setAdminTab('myth')}>🧠 Myth Buster</div>
          <div className={`tab ${adminTab === 'logo' ? 'active' : ''}`} onClick={() => setAdminTab('logo')}>🎨 Logo Finder</div>
          <div className={`tab ${adminTab === 'connection' ? 'active' : ''}`} onClick={() => setAdminTab('connection')}>🧩 Connection</div>
          <div className={`tab ${adminTab === 'people' ? 'active' : ''}`} onClick={() => setAdminTab('people')}>👥 People</div>
        </div>
      )}

      {role === 'admin' && (
        <div className="card flex-between" style={{ marginBottom: '16px' }}>
          <div><b>Phase:</b> {gameState.phase}</div>
          <div className="row">
            <button className="ghost small" onClick={() => socket.emit(SOCKET_EVENTS.ADMIN_SET_PHASE, { phase: 'lobby' })}>Lobby</button>
            <button className="ghost small" onClick={() => socket.emit(SOCKET_EVENTS.ADMIN_SET_PHASE, { phase: 'auction' })}>Auction</button>
            <button className="ghost small" onClick={() => socket.emit(SOCKET_EVENTS.ADMIN_SET_PHASE, { phase: 'myth' })}>Myth Buster</button>
            <button className="ghost small" onClick={() => socket.emit(SOCKET_EVENTS.ADMIN_SET_PHASE, { phase: 'logo' })}>Logo Finder</button>
            <button className="ghost small" onClick={() => socket.emit(SOCKET_EVENTS.ADMIN_SET_PHASE, { phase: 'connection' })}>Connection</button>
            <button className="ghost small" onClick={() => socket.emit(SOCKET_EVENTS.ADMIN_SET_PHASE, { phase: 'results' })}>Results</button>
          </div>
        </div>
      )}

      {/* --- Phase Routing --- */}
      {((role === 'member' && gameState.phase === 'auction') || (role === 'admin' && adminTab === 'auction')) && (
        <AuctionView
          role={role}
          auction={gameState.auction}
          memberPoints={you?.points}
          onBid={(amount) => socket.emit(SOCKET_EVENTS.AUCTION_BID, { amount }, (res: { ok: boolean; error?: string }) => { if (!res.ok) alert(res.error); })}
          onOpenItem={(itemId) => socket.emit(SOCKET_EVENTS.AUCTION_OPEN, { itemId })}
          onSell={() => socket.emit(SOCKET_EVENTS.AUCTION_SELL)}
          onCancel={() => socket.emit(SOCKET_EVENTS.AUCTION_CANCEL)}
          onReset={() => socket.emit(SOCKET_EVENTS.ADMIN_RESET)}
        />
      )}

      {((role === 'member' && gameState.phase === 'myth') || (role === 'admin' && adminTab === 'myth')) && (
        <MythBusterView
          role={role}
          myth={gameState.myth}
          memberId={memberId}
          onVote={(vote) => socket.emit(SOCKET_EVENTS.MYTH_VOTE, { vote }, (res: { ok: boolean; error?: string }) => { if (!res.ok) alert(res.error); })}
          onOpen={(mythId) => socket.emit(SOCKET_EVENTS.MYTH_OPEN, { mythId })}
          onReveal={() => socket.emit(SOCKET_EVENTS.MYTH_REVEAL)}
          onReset={() => socket.emit(SOCKET_EVENTS.ADMIN_RESET)}
        />
      )}

      {((role === 'member' && gameState.phase === 'logo') || (role === 'admin' && adminTab === 'logo')) && (
        <LogoFinderView
          role={role}
          logo={gameState.logo}
          memberId={memberId}
          onVote={(vote) => socket.emit(SOCKET_EVENTS.LOGO_VOTE, { vote }, (res: { ok: boolean; error?: string }) => { if (!res.ok) alert(res.error); })}
          onOpen={(logoId) => socket.emit(SOCKET_EVENTS.LOGO_OPEN, { logoId })}
          onReveal={() => socket.emit(SOCKET_EVENTS.LOGO_REVEAL)}
          onReset={() => socket.emit(SOCKET_EVENTS.ADMIN_RESET)}
        />
      )}

      {((role === 'member' && gameState.phase === 'connection') || (role === 'admin' && adminTab === 'connection')) && (
        <ConnectionsGrid
          role={role}
          connection={gameState.connection}
          memberId={memberId}
          onSubmit={(words) => socket.emit(SOCKET_EVENTS.CONNECTION_SUBMIT, { words }, (res: { ok: boolean; matched?: boolean; oneAway?: boolean; category?: string; error?: string }) => {
            if (res.ok) {
              if (res.matched) alert(`🎉 Group solved: ${res.category}! (+20 pts)`);
              else if (res.oneAway) alert('💡 One away! (3 of 4 match a category)');
              else alert('❌ Not quite, try another combination.');
            } else {
              alert(res.error || 'Submission failed.');
            }
          })}
          onOpen={(puzzleId) => socket.emit(SOCKET_EVENTS.CONNECTION_OPEN, { puzzleId })}
          onRevealCategory={(categoryName) => socket.emit(SOCKET_EVENTS.CONNECTION_REVEAL_GROUP, { categoryName })}
          onReset={() => socket.emit(SOCKET_EVENTS.ADMIN_RESET)}
        />
      )}

      {role === 'admin' && adminTab === 'people' && (
        <PeopleView
          members={gameState.members}
          onKick={(id) => socket.emit(SOCKET_EVENTS.ADMIN_KICK, { memberId: id })}
          onResetMembers={() => socket.emit(SOCKET_EVENTS.ADMIN_RESET)}
        />
      )}

      {role === 'member' && gameState.phase === 'lobby' && (
        <div className="card empty">🛋️ Hang tight! The facilitator will start the next game shortly.</div>
      )}

      {/* --- Scoreboard & Winnings --- */}
      {role === 'admin' && (
        <div style={{ marginTop: '16px' }}>
          <ScoreBoard members={gameState.members} />
        </div>
      )}

      {role === 'member' && you?.wonItems?.length > 0 && (
        <div className="card" style={{ marginTop: '16px' }}>
          <h2>🛍️ Your winnings</h2>
          {you.wonItems.map((itemNo: number) => {
            const item = gameState.auction.items.find((i) => i.no === itemNo);
            return (
              <div key={itemNo} className="item-tile" style={{ marginBottom: '8px' }}>
                <div className="t-name">✅ {item?.name}</div>
                <div className="row">
                  <input
                    className="grow"
                    type="text"
                    maxLength={240}
                    placeholder="Why do you want this? (optional)"
                    defaultValue={item?.reason || ''}
                    onBlur={(e) => socket.emit(SOCKET_EVENTS.AUCTION_REASON, { itemId: itemNo, reason: e.target.value })}
                  />
                  <button className="secondary small">Saved automatically</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
