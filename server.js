'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const qrcode = require('qrcode-terminal');

const {
  AUCTION_ITEMS,
  MYTH_STATEMENTS,
  LOGO_ITEMS,
  CONNECTION_PUZZLES,
  STARTING_POINTS,
  CORRECT_VOTE_REWARD,
  LOGO_REWARD,
  CONNECTION_GROUP_REWARD,
} = require('./seed');

const PORT = Number(process.env.PORT) || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'funfriday';
const DATA_DIR = path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

function freshState() {
  return {
    phase: 'lobby', // 'lobby' | 'auction' | 'myth' | 'logo' | 'connection' | 'results'
    members: {}, // memberId -> member
    auction: {
      activeItemId: null,
      items: AUCTION_ITEMS.map((it) => ({
        id: `item-${it.no}`,
        no: it.no,
        name: it.name,
        why: it.why,
        status: 'pending', // 'pending' | 'active' | 'sold'
        currentBid: 0,
        currentBidderId: null,
        winnerId: null,
        winningBid: 0,
        reason: '',
      })),
    },
    myth: {
      activeIndex: -1,
      statements: MYTH_STATEMENTS.map((s) => ({
        id: `myth-${s.no}`,
        no: s.no,
        text: s.text,
        answer: s.answer,
        explanation: s.explanation,
        status: 'pending', // 'pending' | 'active' | 'revealed'
        revealed: false,
        scored: false,
        votes: {}, // memberId -> 'True' | 'False'
      })),
    },
    logo: {
      activeIndex: -1,
      items: LOGO_ITEMS.map((l) => ({
        id: `logo-${l.no}`,
        no: l.no,
        level: l.level,
        svg: l.svg,
        hint: l.hint,
        options: l.options,
        answer: l.answer,
        explanation: l.explanation,
        status: 'pending', // 'pending' | 'active' | 'revealed'
        revealed: false,
        scored: false,
        votes: {}, // memberId -> selected option
      })),
    },
    connection: {
      activeIndex: -1,
      puzzles: CONNECTION_PUZZLES.map((p) => ({
        id: `conn-${p.no}`,
        no: p.no,
        title: p.title,
        categories: p.categories,
        status: 'pending', // 'pending' | 'active' | 'completed'
        revealedCategories: [],
        solvedByMember: {}, // memberId -> array of category names solved
      })),
    },
  };
}

let state = loadState();

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      const base = freshState();
      // Shallow-merge persisted dynamic data over a fresh structure so that
      // edits to seed.js (item text, etc.) and new fields still apply.
      const merged = mergePersisted(base, raw);
      console.log('Loaded saved game state from data/state.json');
      return merged;
    }
  } catch (err) {
    console.warn('Could not read saved state, starting fresh:', err.message);
  }
  return freshState();
}

function mergePersisted(base, raw) {
  if (!raw || typeof raw !== 'object') return base;
  base.phase = raw.phase || base.phase;
  base.members = raw.members && typeof raw.members === 'object' ? raw.members : {};
  // Members are never "connected" right after a restart.
  Object.values(base.members).forEach((m) => {
    m.connected = false;
  });
  if (raw.auction) {
    base.auction.activeItemId = raw.auction.activeItemId ?? null;
    if (Array.isArray(raw.auction.items)) {
      base.auction.items.forEach((item) => {
        const saved = raw.auction.items.find((s) => s.id === item.id);
        if (saved) {
          item.status = saved.status ?? item.status;
          item.currentBid = saved.currentBid ?? 0;
          item.currentBidderId = saved.currentBidderId ?? null;
          item.winnerId = saved.winnerId ?? null;
          item.winningBid = saved.winningBid ?? 0;
          item.reason = saved.reason ?? '';
        }
      });
    }
  }
  if (raw.myth) {
    base.myth.activeIndex = raw.myth.activeIndex ?? -1;
    if (Array.isArray(raw.myth.statements)) {
      base.myth.statements.forEach((st) => {
        const saved = raw.myth.statements.find((s) => s.id === st.id);
        if (saved) {
          st.status = saved.status ?? st.status;
          st.revealed = !!saved.revealed;
          st.scored = !!saved.scored;
          st.votes = saved.votes && typeof saved.votes === 'object' ? saved.votes : {};
        }
      });
    }
  }
  if (raw.logo) {
    base.logo.activeIndex = raw.logo.activeIndex ?? -1;
    if (Array.isArray(raw.logo.items)) {
      base.logo.items.forEach((l) => {
        const saved = raw.logo.items.find((s) => s.id === l.id);
        if (saved) {
          l.status = saved.status ?? l.status;
          l.revealed = !!saved.revealed;
          l.scored = !!saved.scored;
          l.votes = saved.votes && typeof saved.votes === 'object' ? saved.votes : {};
        }
      });
    }
  }
  if (raw.connection) {
    base.connection.activeIndex = raw.connection.activeIndex ?? -1;
    if (Array.isArray(raw.connection.puzzles)) {
      base.connection.puzzles.forEach((pz) => {
        const saved = raw.connection.puzzles.find((s) => s.id === pz.id);
        if (saved) {
          pz.status = saved.status ?? pz.status;
          pz.revealedCategories = Array.isArray(saved.revealedCategories) ? saved.revealedCategories : [];
          pz.solvedByMember = saved.solvedByMember && typeof saved.solvedByMember === 'object' ? saved.solvedByMember : {};
        }
      });
    }
  }
  return base;
}

let saveTimer = null;
function saveState() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    } catch (err) {
      console.error('Failed to save state:', err.message);
    }
  }, 250);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function memberById(id) {
  return state.members[id] || null;
}

function activeAuctionItem() {
  return state.auction.items.find((i) => i.id === state.auction.activeItemId) || null;
}

function activeMyth() {
  return state.myth.statements[state.myth.activeIndex] || null;
}

function activeLogo() {
  return state.logo.items[state.logo.activeIndex] || null;
}

function activeConnection() {
  return state.connection.puzzles[state.connection.activeIndex] || null;
}

function teamLeaderboard() {
  const teams = {};
  Object.values(state.members).forEach((m) => {
    const t = m.team || 'No team';
    if (!teams[t]) teams[t] = { team: t, members: 0, quizScore: 0, pointsLeft: 0, itemsWon: 0 };
    teams[t].members += 1;
    teams[t].quizScore += m.quizScore || 0;
    teams[t].pointsLeft += m.points ?? 0;
    teams[t].itemsWon += (m.itemsWon || []).length;
  });
  return Object.values(teams).sort((a, b) => b.quizScore - a.quizScore);
}

function publicMember(m) {
  return {
    id: m.id,
    name: m.name,
    team: m.team,
    points: m.points,
    quizScore: m.quizScore || 0,
    itemsWon: m.itemsWon || [],
    connected: !!m.connected,
    isAdmin: !!m.isAdmin,
  };
}

// Build a state view appropriate for the recipient's role.
function buildView(role, memberId) {
  const isAdmin = role === 'admin';
  const members = Object.values(state.members)
    .filter((m) => !m.isAdmin)
    .map(publicMember)
    .sort((a, b) => a.name.localeCompare(b.name));

  const itemName = {};
  state.auction.items.forEach((i) => (itemName[i.id] = i.name));
  const nameOf = (id) => (state.members[id] ? state.members[id].name : null);

  const auction = {
    activeItemId: state.auction.activeItemId,
    items: state.auction.items.map((i) => ({
      id: i.id,
      no: i.no,
      name: i.name,
      why: i.why,
      status: i.status,
      currentBid: i.currentBid,
      currentBidderId: i.currentBidderId,
      currentBidderName: nameOf(i.currentBidderId),
      winnerId: i.winnerId,
      winnerName: nameOf(i.winnerId),
      winnerTeam: i.winnerId && state.members[i.winnerId] ? state.members[i.winnerId].team : null,
      winningBid: i.winningBid,
      reason: i.reason,
    })),
  };

  const myth = {
    activeIndex: state.myth.activeIndex,
    statements: state.myth.statements.map((s) => {
      const counts = { True: 0, False: 0 };
      Object.values(s.votes).forEach((v) => {
        if (counts[v] !== undefined) counts[v] += 1;
      });
      const reveal = s.revealed || isAdmin;
      return {
        id: s.id,
        no: s.no,
        text: s.text,
        status: s.status,
        revealed: s.revealed,
        answer: reveal ? s.answer : null,
        explanation: reveal ? s.explanation : null,
        voteCounts: counts,
        totalVotes: Object.keys(s.votes).length,
        // Detailed voter breakdown only for admin / present screen.
        voters: isAdmin
          ? Object.entries(s.votes).map(([mid, v]) => ({
              name: nameOf(mid),
              team: state.members[mid] ? state.members[mid].team : null,
              vote: v,
            }))
          : undefined,
      };
    }),
  };

  const logo = {
    activeIndex: state.logo.activeIndex,
    items: state.logo.items.map((l) => {
      const counts = {};
      l.options.forEach((opt) => (counts[opt] = 0));
      Object.values(l.votes).forEach((v) => {
        if (counts[v] !== undefined) counts[v] += 1;
      });
      const reveal = l.revealed || isAdmin;
      return {
        id: l.id,
        no: l.no,
        level: l.level,
        svg: l.svg,
        hint: l.hint,
        options: l.options,
        status: l.status,
        revealed: l.revealed,
        answer: reveal ? l.answer : null,
        explanation: reveal ? l.explanation : null,
        voteCounts: counts,
        totalVotes: Object.keys(l.votes).length,
        voters: isAdmin
          ? Object.entries(l.votes).map(([mid, v]) => ({
              name: nameOf(mid),
              team: state.members[mid] ? state.members[mid].team : null,
              vote: v,
            }))
          : undefined,
      };
    }),
  };

  const connection = {
    activeIndex: state.connection.activeIndex,
    puzzles: state.connection.puzzles.map((pz) => {
      const solvedSummary = {};
      Object.values(pz.solvedByMember || {}).forEach((solvedArr) => {
        (solvedArr || []).forEach((catName) => {
          solvedSummary[catName] = (solvedSummary[catName] || 0) + 1;
        });
      });
      return {
        id: pz.id,
        no: pz.no,
        title: pz.title,
        status: pz.status,
        revealedCategories: pz.revealedCategories,
        categories: pz.categories.map((c) => ({
          name: c.name,
          level: c.level,
          words: c.words,
          isRevealed: pz.revealedCategories.includes(c.name),
          solvedCount: solvedSummary[c.name] || 0,
        })),
      };
    }),
  };

  const view = {
    phase: state.phase,
    startingPoints: STARTING_POINTS,
    correctReward: CORRECT_VOTE_REWARD,
    logoReward: LOGO_REWARD,
    connectionGroupReward: CONNECTION_GROUP_REWARD,
    members,
    auction,
    myth,
    logo,
    connection,
    teams: teamLeaderboard(),
    counts: {
      members: members.length,
      online: members.filter((m) => m.connected).length,
    },
  };

  // Personal slice for a logged-in member.
  if (memberId && state.members[memberId]) {
    const me = state.members[memberId];
    const activeMythState = state.myth.statements[state.myth.activeIndex];
    const activeLogoState = state.logo.items[state.logo.activeIndex];
    const activeConnState = state.connection.puzzles[state.connection.activeIndex];
    view.you = {
      id: me.id,
      name: me.name,
      team: me.team,
      points: me.points,
      quizScore: me.quizScore || 0,
      itemsWon: (me.itemsWon || []).map((id) => ({ id, name: itemName[id] })),
      myVote: activeMythState ? activeMythState.votes[me.id] || null : null,
      myLogoVote: activeLogoState ? activeLogoState.votes[me.id] || null : null,
      mySolvedCategories: activeConnState && activeConnState.solvedByMember[me.id] ? activeConnState.solvedByMember[me.id] : [],
    };
  }

  return view;
}

// ---------------------------------------------------------------------------
// HTTP + Socket.IO
// ---------------------------------------------------------------------------

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const io = new Server(server);

// socket.data: { role: 'member'|'admin'|'spectator', memberId }

function emitTo(socket) {
  socket.emit('state', buildView(socket.data.role, socket.data.memberId));
}

function broadcast() {
  saveState();
  for (const [, socket] of io.of('/').sockets) {
    emitTo(socket);
  }
}

io.on('connection', (socket) => {
  socket.data = { role: 'spectator', memberId: null };

  // -- Identity -------------------------------------------------------------
  socket.on('member:join', ({ memberId, name, team } = {}, ack) => {
    name = (name || '').toString().trim().slice(0, 40);
    team = (team || '').toString().trim().slice(0, 40) || 'No team';
    if (!name) {
      if (ack) ack({ ok: false, error: 'Please enter your name.' });
      return;
    }
    let id = (memberId || '').toString();
    let member = id && state.members[id];
    if (!member) {
      id = `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      member = {
        id,
        name,
        team,
        points: STARTING_POINTS,
        quizScore: 0,
        itemsWon: [],
        isAdmin: false,
      };
      state.members[id] = member;
    } else {
      member.name = name;
      member.team = team;
    }
    member.connected = true;
    socket.data.role = 'member';
    socket.data.memberId = id;
    if (ack) ack({ ok: true, memberId: id });
    broadcast();
  });

  socket.on('admin:login', ({ password } = {}, ack) => {
    if (password !== ADMIN_PASSWORD) {
      if (ack) ack({ ok: false, error: 'Incorrect admin password.' });
      return;
    }
    socket.data.role = 'admin';
    if (ack) ack({ ok: true });
    emitTo(socket);
  });

  socket.on('spectator:join', () => {
    socket.data.role = 'spectator';
    emitTo(socket);
  });

  // -- Phase control (admin) ------------------------------------------------
  socket.on('admin:setPhase', ({ phase } = {}) => {
    if (socket.data.role !== 'admin') return;
    if (['lobby', 'auction', 'myth', 'logo', 'connection', 'results'].includes(phase)) {
      state.phase = phase;
      broadcast();
    }
  });

  // -- Auction --------------------------------------------------------------
  socket.on('auction:open', ({ itemId } = {}) => {
    if (socket.data.role !== 'admin') return;
    const item = state.auction.items.find((i) => i.id === itemId);
    if (!item || item.status === 'sold') return;
    // Close any other active item back to pending.
    const prev = activeAuctionItem();
    if (prev && prev.id !== item.id) prev.status = 'pending';
    item.status = 'active';
    item.currentBid = 0;
    item.currentBidderId = null;
    state.auction.activeItemId = item.id;
    state.phase = 'auction';
    broadcast();
  });

  socket.on('auction:bid', ({ amount } = {}, ack) => {
    if (socket.data.role !== 'member') return;
    const me = memberById(socket.data.memberId);
    const item = activeAuctionItem();
    if (!me || !item || item.status !== 'active') {
      if (ack) ack({ ok: false, error: 'Bidding is not open right now.' });
      return;
    }
    amount = Math.floor(Number(amount));
    if (!Number.isFinite(amount) || amount <= 0) {
      if (ack) ack({ ok: false, error: 'Enter a valid bid.' });
      return;
    }
    if (amount <= item.currentBid) {
      if (ack) ack({ ok: false, error: `Bid must be higher than ${item.currentBid}.` });
      return;
    }
    if (amount > me.points) {
      if (ack) ack({ ok: false, error: `You only have ${me.points} points.` });
      return;
    }
    item.currentBid = amount;
    item.currentBidderId = me.id;
    if (ack) ack({ ok: true });
    broadcast();
  });

  socket.on('auction:sell', () => {
    if (socket.data.role !== 'admin') return;
    const item = activeAuctionItem();
    if (!item || item.status !== 'active') return;
    if (item.currentBidderId) {
      const winner = memberById(item.currentBidderId);
      if (winner) {
        winner.points = Math.max(0, winner.points - item.currentBid);
        if (!winner.itemsWon) winner.itemsWon = [];
        if (!winner.itemsWon.includes(item.id)) winner.itemsWon.push(item.id);
        item.winnerId = winner.id;
        item.winningBid = item.currentBid;
      }
    }
    item.status = 'sold';
    state.auction.activeItemId = null;
    broadcast();
  });

  socket.on('auction:cancel', () => {
    if (socket.data.role !== 'admin') return;
    const item = activeAuctionItem();
    if (!item) return;
    item.status = 'pending';
    item.currentBid = 0;
    item.currentBidderId = null;
    state.auction.activeItemId = null;
    broadcast();
  });

  socket.on('auction:reason', ({ itemId, reason } = {}) => {
    if (socket.data.role !== 'member') return;
    const me = memberById(socket.data.memberId);
    const item = state.auction.items.find((i) => i.id === itemId);
    if (!me || !item || item.winnerId !== me.id) return;
    item.reason = (reason || '').toString().trim().slice(0, 240);
    broadcast();
  });

  // -- Myth Buster ----------------------------------------------------------
  socket.on('myth:open', ({ index } = {}) => {
    if (socket.data.role !== 'admin') return;
    index = Number(index);
    const st = state.myth.statements[index];
    if (!st) return;
    const prev = activeMyth();
    if (prev && prev !== st && prev.status === 'active') prev.status = 'pending';
    state.myth.activeIndex = index;
    st.status = 'active';
    st.revealed = false;
    state.phase = 'myth';
    broadcast();
  });

  socket.on('myth:vote', ({ value } = {}, ack) => {
    if (socket.data.role !== 'member') return;
    const me = memberById(socket.data.memberId);
    const st = activeMyth();
    if (!me || !st || st.status !== 'active' || st.revealed) {
      if (ack) ack({ ok: false, error: 'Voting is closed.' });
      return;
    }
    if (value !== 'True' && value !== 'False') return;
    st.votes[me.id] = value;
    if (ack) ack({ ok: true });
    broadcast();
  });

  socket.on('myth:reveal', () => {
    if (socket.data.role !== 'admin') return;
    const st = activeMyth();
    if (!st || st.revealed) return;
    st.revealed = true;
    st.status = 'revealed';
    if (!st.scored) {
      Object.entries(st.votes).forEach(([mid, v]) => {
        if (v === st.answer && state.members[mid]) {
          state.members[mid].quizScore = (state.members[mid].quizScore || 0) + CORRECT_VOTE_REWARD;
        }
      });
      st.scored = true;
    }
    broadcast();
  });

  // -- Old Logo Finder ------------------------------------------------------
  socket.on('logo:open', ({ index } = {}) => {
    if (socket.data.role !== 'admin') return;
    index = Number(index);
    const item = state.logo.items[index];
    if (!item) return;
    const prev = activeLogo();
    if (prev && prev !== item && prev.status === 'active') prev.status = 'pending';
    state.logo.activeIndex = index;
    item.status = 'active';
    item.revealed = false;
    state.phase = 'logo';
    broadcast();
  });

  socket.on('logo:vote', ({ value } = {}, ack) => {
    if (socket.data.role !== 'member') return;
    const me = memberById(socket.data.memberId);
    const item = activeLogo();
    if (!me || !item || item.status !== 'active' || item.revealed) {
      if (ack) ack({ ok: false, error: 'Voting is closed.' });
      return;
    }
    if (!item.options.includes(value)) return;
    item.votes[me.id] = value;
    if (ack) ack({ ok: true });
    broadcast();
  });

  socket.on('logo:reveal', () => {
    if (socket.data.role !== 'admin') return;
    const item = activeLogo();
    if (!item || item.revealed) return;
    item.revealed = true;
    item.status = 'revealed';
    if (!item.scored) {
      Object.entries(item.votes).forEach(([mid, v]) => {
        if (v === item.answer && state.members[mid]) {
          state.members[mid].quizScore = (state.members[mid].quizScore || 0) + LOGO_REWARD;
        }
      });
      item.scored = true;
    }
    broadcast();
  });

  // -- Connection -----------------------------------------------------------
  socket.on('connection:open', ({ index } = {}) => {
    if (socket.data.role !== 'admin') return;
    index = Number(index);
    const pz = state.connection.puzzles[index];
    if (!pz) return;
    const prev = activeConnection();
    if (prev && prev !== pz && prev.status === 'active') prev.status = 'pending';
    state.connection.activeIndex = index;
    pz.status = 'active';
    state.phase = 'connection';
    broadcast();
  });

  socket.on('connection:submit', ({ words } = {}, ack) => {
    if (socket.data.role !== 'member') return;
    const me = memberById(socket.data.memberId);
    const pz = activeConnection();
    if (!me || !pz || pz.status !== 'active') {
      if (ack) ack({ ok: false, error: 'Puzzle is not active right now.' });
      return;
    }
    if (!Array.isArray(words) || words.length !== 4) {
      if (ack) ack({ ok: false, error: 'Please select exactly 4 words.' });
      return;
    }

    if (!pz.solvedByMember[me.id]) pz.solvedByMember[me.id] = [];
    const solved = pz.solvedByMember[me.id];

    // Find exact category match
    let matchedCat = null;
    let maxMatchCount = 0;

    pz.categories.forEach((cat) => {
      if (solved.includes(cat.name)) return;
      const matchCount = words.filter((w) => cat.words.includes(w)).length;
      if (matchCount > maxMatchCount) maxMatchCount = matchCount;
      if (matchCount === 4) matchedCat = cat;
    });

    if (matchedCat) {
      solved.push(matchedCat.name);
      me.quizScore = (me.quizScore || 0) + CONNECTION_GROUP_REWARD;
      const allSolved = solved.length === pz.categories.length;
      if (allSolved) {
        me.quizScore += CONNECTION_GROUP_REWARD; // Bonus for solving all!
      }
      broadcast();
      if (ack) ack({ ok: true, matched: true, category: matchedCat.name, allSolved });
    } else {
      const oneAway = maxMatchCount === 3;
      if (ack) ack({ ok: true, matched: false, oneAway });
    }
  });

  socket.on('connection:revealGroup', ({ categoryName } = {}) => {
    if (socket.data.role !== 'admin') return;
    const pz = activeConnection();
    if (!pz) return;
    if (categoryName && !pz.revealedCategories.includes(categoryName)) {
      pz.revealedCategories.push(categoryName);
      broadcast();
    }
  });

  // -- Resets (admin) -------------------------------------------------------
  socket.on('admin:reset', ({ what } = {}) => {
    if (socket.data.role !== 'admin') return;
    if (what === 'auction' || what === 'all') {
      const fresh = freshState().auction;
      state.auction = fresh;
      Object.values(state.members).forEach((m) => {
        m.points = STARTING_POINTS;
        m.itemsWon = [];
      });
    }
    if (what === 'myth' || what === 'all') {
      state.myth = freshState().myth;
      Object.values(state.members).forEach((m) => {
        m.quizScore = 0;
      });
    }
    if (what === 'logo' || what === 'all') {
      state.logo = freshState().logo;
    }
    if (what === 'connection' || what === 'all') {
      state.connection = freshState().connection;
    }
    if (what === 'members') {
      state.members = {};
    }
    broadcast();
  });

  socket.on('admin:kick', ({ memberId } = {}) => {
    if (socket.data.role !== 'admin') return;
    delete state.members[memberId];
    broadcast();
  });

  socket.on('disconnect', () => {
    const m = socket.data.memberId && state.members[socket.data.memberId];
    if (m) m.connected = false;
    broadcast();
  });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

function localIPs() {
  const ifaces = os.networkInterfaces();
  const ips = [];
  Object.values(ifaces).forEach((list) => {
    (list || []).forEach((i) => {
      if (i.family === 'IPv4' && !i.internal) ips.push(i.address);
    });
  });
  return ips;
}

function startBanner(port) {
  const ips = localIPs();
  const primary = ips[0] ? `http://${ips[0]}:${port}` : `http://localhost:${port}`;
  console.log('\n========================================================');
  console.log('  FUN FRIDAY  -  Productivity Auction & Myth Buster');
  console.log('========================================================');
  console.log(`  Admin password : ${ADMIN_PASSWORD}`);
  console.log('');
  console.log('  Open on this computer:');
  console.log(`    Members  : http://localhost:${port}`);
  console.log(`    Admin    : http://localhost:${port}/?admin=1`);
  console.log(`    Big screen (projector): http://localhost:${port}/present.html`);
  if (ips.length) {
    console.log('');
    console.log('  Share with the team (same Wi-Fi):');
    ips.forEach((ip) => console.log(`    http://${ip}:${port}`));
    console.log('');
    console.log('  Scan to join:');
    qrcode.generate(primary, { small: true });
  }
  console.log('========================================================\n');
}

// Bind to PORT; if it's busy, try the next few ports automatically so the
// app still starts on machines where the default port is taken.
server.once('listening', () => startBanner(server.address().port));

function listen(port, attemptsLeft) {
  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE' && attemptsLeft > 0) {
      console.warn(`Port ${port} is in use, trying ${port + 1}...`);
      setTimeout(() => listen(port + 1, attemptsLeft - 1), 150);
    } else {
      console.error('Could not start server:', err.message);
      process.exit(1);
    }
  });
  server.listen(port);
}

listen(PORT, 15);
