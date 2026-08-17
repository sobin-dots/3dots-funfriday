/* Fun Friday — client app (member + admin) */
(function () {
  'use strict';

  const socket = io();
  const $ = (sel) => document.querySelector(sel);
  const esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );

  const LS = {
    get id() { return localStorage.getItem('ff_memberId') || ''; },
    set id(v) { localStorage.setItem('ff_memberId', v); },
    get name() { return localStorage.getItem('ff_name') || ''; },
    set name(v) { localStorage.setItem('ff_name', v); },
    get team() { return localStorage.getItem('ff_team') || ''; },
    set team(v) { localStorage.setItem('ff_team', v); },
    clear() { localStorage.removeItem('ff_memberId'); localStorage.removeItem('ff_name'); localStorage.removeItem('ff_team'); },
  };

  let role = 'guest';            // 'guest' | 'member' | 'admin'
  let adminPass = sessionStorage.getItem('ff_adminPass') || '';
  let adminTab = 'auction';
  let state = null;
  let selectedConnWords = [];
  let logoLevelFilter = 'all';

  // ---------------- Toast ----------------
  let toastTimer = null;
  function toast(msg, isError) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.toggle('error', !!isError);
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  // ---------------- View switching ----------------
  function show(view) {
    $('#view-login').classList.toggle('hidden', view !== 'login');
    $('#view-member').classList.toggle('hidden', view !== 'member');
    $('#view-admin').classList.toggle('hidden', view !== 'admin');
  }

  // ---------------- Connect / reconnect ----------------
  socket.on('connect', () => {
    if (role === 'admin' && adminPass) {
      socket.emit('admin:login', { password: adminPass }, (res) => {
        if (!res || !res.ok) { role = 'guest'; show('login'); }
      });
    } else if (LS.id || (role === 'member')) {
      socket.emit('member:join', { memberId: LS.id, name: LS.name, team: LS.team }, (res) => {
        if (res && res.ok) { LS.id = res.memberId; role = 'member'; }
      });
    }
  });

  socket.on('state', (s) => {
    state = s;
    render();
  });

  // ---------------- Login handlers ----------------
  $('#btn-join').addEventListener('click', () => {
    const name = $('#in-name').value.trim();
    const team = $('#in-team').value.trim();
    if (!name) { toast('Please enter your name.', true); return; }
    socket.emit('member:join', { memberId: LS.id, name, team }, (res) => {
      if (res && res.ok) {
        LS.id = res.memberId; LS.name = name; LS.team = team;
        role = 'member';
      } else {
        toast((res && res.error) || 'Could not join.', true);
      }
    });
  });

  $('#in-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#in-team').focus(); });
  $('#in-team').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#btn-join').click(); });

  $('#btn-admin').addEventListener('click', () => {
    const pass = $('#in-pass').value;
    socket.emit('admin:login', { password: pass }, (res) => {
      if (res && res.ok) {
        role = 'admin';
        adminPass = pass;
        sessionStorage.setItem('ff_adminPass', pass);
      } else {
        toast((res && res.error) || 'Login failed.', true);
      }
    });
  });
  $('#in-pass').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#btn-admin').click(); });

  $('#m-logout').addEventListener('click', () => {
    LS.clear();
    role = 'guest';
    location.reload();
  });

  // Prefill saved identity.
  if (LS.name) $('#in-name').value = LS.name;
  if (LS.team) $('#in-team').value = LS.team;
  // Deep link: /?admin=1 focuses the admin field.
  if (new URLSearchParams(location.search).get('admin')) {
    setTimeout(() => $('#in-pass') && $('#in-pass').focus(), 50);
  }

  // ================= RENDER =================
  function render() {
    if (!state) return;
    if (role === 'admin') { show('admin'); renderAdmin(); }
    else if (role === 'member' && state.you) { show('member'); renderMember(); }
    else { show('login'); refreshTeamList(); }
  }

  function refreshTeamList() {
    if (!state) return;
    const teams = [...new Set(state.teams.map((t) => t.team).filter((t) => t && t !== 'No team'))];
    $('#team-list').innerHTML = teams.map((t) => `<option value="${esc(t)}">`).join('');
  }

  // ---------------- MEMBER ----------------
  function renderMember() {
    const you = state.you;
    $('#m-who').innerHTML = `${esc(you.name)} <span class="tag-team">· ${esc(you.team)}</span>`;
    $('#m-points').textContent = you.points;
    $('#m-quiz').textContent = you.quizScore;

    let html = '';
    if (state.phase === 'auction') html = memberAuction();
    else if (state.phase === 'myth') html = memberMyth();
    else if (state.phase === 'logo') html = memberLogo();
    else if (state.phase === 'connection') html = memberConnection();
    else if (state.phase === 'results') html = resultsBlock();
    else html = waiting('🛋️ Hang tight! The facilitator will start the next game shortly.');

    // Always show what you own + your score footer.
    html += myStuff();
    $('#member-body').innerHTML = html;
    wireMemberEvents();
  }

  function waiting(msg) {
    return `<div class="card empty">${msg}</div>`;
  }

  function memberAuction() {
    const item = state.auction.items.find((i) => i.id === state.auction.activeItemId);
    const you = state.you;
    if (!item) return waiting('🏷️ Auction is open. Waiting for the facilitator to put up the next item…');
    const leading = item.currentBidderId === you.id;
    const canBid = item.status === 'active';
    return `
      <div class="card">
        <div class="bigitem">
          <div class="no">ITEM #${item.no}</div>
          <div class="name">${esc(item.name)}</div>
          <div class="why">${esc(item.why)}</div>
          <div class="bid-display">${item.currentBid} pts</div>
          <div class="bid-by">${item.currentBidderName ? 'Top bid: ' + esc(item.currentBidderName) + (leading ? ' (you!)' : '') : 'No bids yet — start it off!'}</div>
        </div>
        ${canBid ? `
        <div style="margin-top:16px">
          <div class="row">
            <input class="grow" id="bid-amount" type="number" min="${item.currentBid + 1}" max="${you.points}" placeholder="Your bid (max ${you.points})" />
            <button id="bid-send">Place bid</button>
          </div>
          <div class="quickbids">
            ${quickBidButtons(item.currentBid, you.points)}
          </div>
          <p class="muted center" style="margin-top:8px">You have <b>${you.points}</b> points to spend.</p>
        </div>` : `<p class="empty">This item is closed.</p>`}
      </div>`;
  }

  function quickBidButtons(current, max) {
    const steps = [5, 10, 20];
    const btns = steps
      .map((s) => current + s)
      .filter((v) => v <= max)
      .map((v) => `<button class="secondary small quickbid" data-v="${v}">+${v - current} → ${v}</button>`);
    if (max > current) btns.push(`<button class="warn small quickbid" data-v="${max}">All in (${max})</button>`);
    return btns.join('') || '<span class="muted">No points left to bid.</span>';
  }

  function memberMyth() {
    const idx = state.myth.activeIndex;
    const st = state.myth.statements[idx];
    const you = state.you;
    if (!st) return waiting('🧠 Myth Buster is open. Waiting for the next statement…');
    const voted = you.myVote;
    let block = `
      <div class="card">
        <h3>Statement #${st.no} · Myth Buster</h3>
        <div class="bigitem" style="text-align:left">
          <div class="name" style="font-size:1.3rem">${esc(st.text)}</div>
        </div>`;

    if (!st.revealed) {
      block += `
        <p class="muted center" style="margin-top:12px">Discuss with your team, then vote:</p>
        <div class="vote-row">
          <button class="btn-true vote ${voted === 'True' ? '' : ''}" data-v="True">✅ TRUE${voted === 'True' ? ' ✓' : ''}</button>
          <button class="btn-false vote" data-v="False">❌ FALSE${voted === 'False' ? ' ✓' : ''}</button>
        </div>
        ${voted ? `<p class="center" style="margin-top:10px">You voted <b>${voted}</b>. You can change it until the answer is revealed.</p>` : '<p class="center muted" style="margin-top:10px">No vote yet.</p>'}
        <p class="center muted">${st.totalVotes} vote(s) in so far.</p>`;
    } else {
      const right = voted && voted === st.answer;
      block += `
        ${voteBar(st.voteCounts)}
        <div class="answer-box ${st.answer === 'True' ? 'true' : 'false'}">
          ✔ Correct answer: ${st.answer.toUpperCase()}<br />
          <span class="muted" style="font-weight:500">${esc(st.explanation)}</span>
        </div>
        <p class="center" style="margin-top:10px">
          ${voted ? (right ? `<span class="correct">🎉 You were right! +${state.correctReward} quiz points</span>` : `<span class="wrong">You voted ${voted} — not this time.</span>`) : '<span class="muted">You didn\'t vote on this one.</span>'}
        </p>`;
    }
    block += '</div>';
    return block;
  }

  function memberLogo() {
    const idx = state.logo.activeIndex;
    const item = state.logo.items[idx];
    const you = state.you;
    if (!item) return waiting('🎨 Old Logo Finder is open. Waiting for the facilitator to open a logo…');
    const voted = you.myLogoVote;
    let block = `
      <div class="card center">
        <h3>Logo #${item.no} · Famous Brands Old Logo Finder &nbsp;<span class="badge ${item.level}">${item.level.toUpperCase()}</span></h3>
        <div class="logo-img-container">
          <img src="${esc(item.svg)}" alt="Vintage Logo" />
        </div>
        <p class="muted" style="font-style:italic">"${esc(item.hint)}"</p>`;

    if (!item.revealed) {
      block += `
        <p class="muted" style="margin-top:12px">Which famous brand used this logo?</p>
        <div class="options-grid">
          ${item.options.map((opt) => `
            <button class="option-btn logo-vote ${voted === opt ? 'selected' : ''}" data-v="${esc(opt)}">
              ${esc(opt)}${voted === opt ? ' ✓' : ''}
            </button>
          `).join('')}
        </div>
        ${voted ? `<p class="center" style="margin-top:12px">Your guess: <b>${esc(voted)}</b></p>` : '<p class="center muted" style="margin-top:12px">Select an option to place your guess.</p>'}
        <p class="center muted">${item.totalVotes} vote(s) submitted.</p>`;
    } else {
      const right = voted && voted === item.answer;
      block += `
        <div class="options-grid">
          ${item.options.map((opt) => {
            const isAns = opt === item.answer;
            const isMyVote = opt === voted;
            const cls = isAns ? 'correct-opt' : isMyVote ? 'wrong-opt' : '';
            return `<div class="option-btn ${cls}">${esc(opt)} ${isAns ? '✅' : ''}</div>`;
          }).join('')}
        </div>
        <div class="answer-box true" style="margin-top:14px">
          ✔ Correct brand: <b>${esc(item.answer)}</b><br />
          <span class="muted" style="font-weight:500">${esc(item.explanation)}</span>
        </div>
        <p class="center" style="margin-top:10px">
          ${voted ? (right ? `<span class="correct">🎉 Correct! +${state.logoReward} quiz points</span>` : `<span class="wrong">You guessed ${esc(voted)} — correct answer was ${esc(item.answer)}.</span>`) : '<span class="muted">You didn\'t guess this logo.</span>'}
        </p>`;
    }
    block += '</div>';
    return block;
  }

  function memberConnection() {
    const idx = state.connection.activeIndex;
    const pz = state.connection.puzzles[idx];
    const you = state.you;
    if (!pz) return waiting('🧩 Connection Game is open. Waiting for the facilitator to start a puzzle…');

    const solvedCatNames = you.mySolvedCategories || [];

    // Render solved categories
    const solvedBanners = pz.categories
      .filter((c) => solvedCatNames.includes(c.name))
      .map((c) => `
        <div class="cat-banner cat-${c.level}">
          <div class="cat-title">${esc(c.name)}</div>
          <div class="cat-words">${c.words.map(esc).join(' • ')}</div>
        </div>
      `).join('');

    // Filter out remaining unsolved words
    const unsolvedWords = pz.categories
      .filter((c) => !solvedCatNames.includes(c.name))
      .flatMap((c) => c.words);

    // Keep selectedConnWords clean of already solved words
    selectedConnWords = selectedConnWords.filter((w) => unsolvedWords.includes(w));

    const gridHtml = unsolvedWords.length
      ? `<div class="conn-grid">
          ${unsolvedWords.map((w) => `
            <div class="word-tile ${selectedConnWords.includes(w) ? 'selected' : ''}" data-w="${esc(w)}">
              ${esc(w)}
            </div>
          `).join('')}
        </div>`
      : `<div class="answer-box true center" style="font-size:1.2rem;margin:16px 0">
          🎉 Incredible! You solved all 4 categories! +${state.connectionGroupReward * 5} Total Quiz Points!
        </div>`;

    return `
      <div class="card">
        <h3>${esc(pz.title)} · Create 4 groups of 4 words</h3>
        <p class="muted center">Select 4 related words and tap <b>Submit Group</b>.</p>
        ${solvedBanners}
        ${gridHtml}
        ${unsolvedWords.length ? `
        <div class="row" style="margin-top:14px">
          <button id="conn-submit" class="good grow" ${selectedConnWords.length === 4 ? '' : 'disabled'}>
            Submit Group (${selectedConnWords.length}/4)
          </button>
          <button id="conn-deselect" class="secondary" ${selectedConnWords.length ? '' : 'disabled'}>
            Deselect All
          </button>
        </div>` : ''}
      </div>`;
  }

  function voteBar(counts) {
    const total = counts.True + counts.False;
    const tp = total ? Math.round((counts.True / total) * 100) : 0;
    const fp = total ? 100 - tp : 0;
    return `
      <div class="vote-bar">
        <div class="seg seg-true" style="width:${tp}%">${counts.True ? 'TRUE ' + tp + '%' : ''}</div>
        <div class="seg seg-false" style="width:${fp}%">${counts.False ? 'FALSE ' + fp + '%' : ''}</div>
      </div>
      <p class="center muted">✅ ${counts.True} &nbsp; · &nbsp; ❌ ${counts.False}</p>`;
  }

  function myStuff() {
    const you = state.you;
    if (!you.itemsWon.length) return '';
    return `
      <div class="card">
        <h2>🛍️ Your winnings</h2>
        ${you.itemsWon.map((it) => {
          const full = state.auction.items.find((x) => x.id === it.id) || {};
          return `
          <div class="item-tile" style="margin-bottom:8px">
            <div class="t-name">✅ ${esc(it.name)}</div>
            <div class="row">
              <input class="grow reason-input" data-id="${it.id}" type="text" maxlength="240" placeholder="Why do you want this? (optional)" value="${esc(full.reason || '')}" />
              <button class="secondary small reason-save" data-id="${it.id}">Save</button>
            </div>
          </div>`;
        }).join('')}
      </div>`;
  }

  function wireMemberEvents() {
    const send = $('#bid-send');
    if (send) {
      const doBid = (val) => {
        const amount = Number(val != null ? val : $('#bid-amount').value);
        if (!amount) { toast('Enter a bid amount.', true); return; }
        socket.emit('auction:bid', { amount }, (res) => {
          if (res && res.ok) toast('Bid placed: ' + amount + ' pts');
          else toast((res && res.error) || 'Bid failed.', true);
        });
      };
      send.addEventListener('click', () => doBid());
      const amt = $('#bid-amount');
      if (amt) amt.addEventListener('keydown', (e) => { if (e.key === 'Enter') doBid(); });
      document.querySelectorAll('.quickbid').forEach((b) =>
        b.addEventListener('click', () => doBid(b.dataset.v))
      );
    }
    document.querySelectorAll('.vote').forEach((b) =>
      b.addEventListener('click', () => {
        socket.emit('myth:vote', { value: b.dataset.v }, (res) => {
          if (res && res.ok) toast('Voted ' + b.dataset.v);
          else toast((res && res.error) || 'Vote failed.', true);
        });
      })
    );
    document.querySelectorAll('.logo-vote').forEach((b) =>
      b.addEventListener('click', () => {
        socket.emit('logo:vote', { value: b.dataset.v }, (res) => {
          if (res && res.ok) toast('Submitted guess: ' + b.dataset.v);
          else toast((res && res.error) || 'Guess failed.', true);
        });
      })
    );
    document.querySelectorAll('.word-tile').forEach((tile) =>
      tile.addEventListener('click', () => {
        const w = tile.dataset.w;
        if (!w) return;
        if (selectedConnWords.includes(w)) {
          selectedConnWords = selectedConnWords.filter((x) => x !== w);
        } else {
          if (selectedConnWords.length >= 4) {
            toast('You can only select 4 words at a time.', true);
            return;
          }
          selectedConnWords.push(w);
        }
        renderMember();
      })
    );
    const submitConn = $('#conn-submit');
    if (submitConn) {
      submitConn.addEventListener('click', () => {
        if (selectedConnWords.length !== 4) return;
        socket.emit('connection:submit', { words: selectedConnWords }, (res) => {
          if (res && res.ok) {
            if (res.matched) {
              toast('🎉 Group solved: ' + res.category + '! (+20 pts)');
              selectedConnWords = [];
            } else if (res.oneAway) {
              toast('💡 One away! (3 of 4 match a category)', true);
            } else {
              toast('❌ Not quite, try another combination.', true);
            }
          } else {
            toast((res && res.error) || 'Submission failed.', true);
          }
        });
      });
    }
    const deselectConn = $('#conn-deselect');
    if (deselectConn) {
      deselectConn.addEventListener('click', () => {
        selectedConnWords = [];
        renderMember();
      });
    }
    document.querySelectorAll('.reason-save').forEach((b) =>
      b.addEventListener('click', () => {
        const input = document.querySelector(`.reason-input[data-id="${b.dataset.id}"]`);
        socket.emit('auction:reason', { itemId: b.dataset.id, reason: input.value });
        toast('Saved!');
      })
    );
  }

  function resultsBlock() {
    return `
      <div class="card">
        <h2>🏆 Results</h2>
        ${teamTable()}
      </div>
      ${auctionResultsTable()}`;
  }

  // ---------------- ADMIN ----------------
  document.querySelectorAll('#admin-tabs .tab').forEach((tab) =>
    tab.addEventListener('click', () => {
      adminTab = tab.dataset.tab;
      document.querySelectorAll('#admin-tabs .tab').forEach((t) => t.classList.toggle('active', t === tab));
      renderAdmin();
    })
  );

  function renderAdmin() {
    $('#a-online').textContent = state.counts.online;
    $('#a-total').textContent = state.counts.members;
    let html = '';
    if (adminTab === 'auction') html = adminAuction();
    else if (adminTab === 'myth') html = adminMyth();
    else if (adminTab === 'logo') html = adminLogo();
    else if (adminTab === 'connection') html = adminConnection();
    else html = adminPeople();
    $('#admin-body').innerHTML = html;
    wireAdminEvents();
  }

  function phaseBanner() {
    const map = {
      lobby: 'Lobby',
      auction: 'Auction live',
      myth: 'Myth Buster live',
      logo: 'Logo Finder live',
      connection: 'Connection live',
      results: 'Results',
    };
    return `<div class="card flex-between">
      <div><b>Phase:</b> ${map[state.phase] || state.phase}</div>
      <div class="row">
        <button class="ghost small" data-phase="lobby">Lobby</button>
        <button class="ghost small" data-phase="auction">Auction</button>
        <button class="ghost small" data-phase="myth">Myth Buster</button>
        <button class="ghost small" data-phase="logo">Logo Finder</button>
        <button class="ghost small" data-phase="connection">Connection</button>
        <button class="ghost small" data-phase="results">Results</button>
      </div>
    </div>`;
  }

  function adminAuction() {
    const a = state.auction;
    const active = a.items.find((i) => i.id === a.activeItemId);
    let live = '';
    if (active) {
      live = `
        <div class="card">
          <h2>🔴 Live now — Item #${active.no}</h2>
          <div class="bigitem">
            <div class="name">${esc(active.name)}</div>
            <div class="why">${esc(active.why)}</div>
            <div class="bid-display">${active.currentBid} pts</div>
            <div class="bid-by">${active.currentBidderName ? 'Top bidder: ' + esc(active.currentBidderName) : 'No bids yet'}</div>
          </div>
          <div class="row" style="margin-top:14px">
            <button class="good grow" id="sell" ${active.currentBidderId ? '' : 'disabled'}>💰 Sell to ${active.currentBidderName ? esc(active.currentBidderName) : '—'} (${active.currentBid})</button>
            <button class="bad" id="cancel">Cancel item</button>
          </div>
        </div>`;
    }
    const tiles = a.items.map((i) => `
      <div class="item-tile ${i.status}">
        <div class="flex-between">
          <span class="t-name">#${i.no}</span>
          <span class="badge ${i.status}">${i.status}</span>
        </div>
        <div class="t-name">${esc(i.name)}</div>
        <div class="t-why">${esc(i.why)}</div>
        ${i.status === 'sold'
          ? `<div class="muted">✅ Won by <b>${esc(i.winnerName || '—')}</b> for <b>${i.winningBid}</b> pts${i.reason ? `<br/>💬 "${esc(i.reason)}"` : ''}</div>`
          : `<button class="small open-item" data-id="${i.id}">${i.status === 'active' ? 'Re-open' : 'Open for bidding'}</button>`}
      </div>`).join('');

    return `
      ${phaseBanner()}
      ${live}
      <div class="card">
        <div class="flex-between"><h2>🏷️ Auction items</h2>
          <button class="bad small" data-reset="auction">Reset auction</button>
        </div>
        <div class="item-list">${tiles}</div>
      </div>
      ${auctionResultsTable()}`;
  }

  function auctionResultsTable() {
    const sold = state.auction.items.filter((i) => i.status === 'sold' && i.winnerId);
    if (!sold.length) return '';
    return `
      <div class="card">
        <h2>🧾 Auction results</h2>
        <table>
          <tr><th>Item</th><th>Winner</th><th>Team</th><th>Paid</th><th>Reason</th></tr>
          ${sold.map((i) => `<tr>
            <td>${esc(i.name)}</td>
            <td>${esc(i.winnerName || '')}</td>
            <td class="tag-team">${esc(i.winnerTeam || '')}</td>
            <td><b>${i.winningBid}</b></td>
            <td class="muted">${esc(i.reason || '')}</td>
          </tr>`).join('')}
        </table>
      </div>`;
  }

  function adminMyth() {
    const m = state.myth;
    const active = m.statements[m.activeIndex];
    let live = '';
    if (active) {
      const c = active.voteCounts;
      live = `
        <div class="card">
          <h2>🔴 Live now — Statement #${active.no}</h2>
          <div class="bigitem" style="text-align:left">
            <div class="name" style="font-size:1.25rem">${esc(active.text)}</div>
          </div>
          ${voteBar(c)}
          <div class="answer-box ${active.answer === 'True' ? 'true' : 'false'}" ${active.revealed ? '' : 'style="opacity:.6"'}>
            ${active.revealed ? '✔ Revealed — ' : '👁️ Answer (hidden from members): '} <b>${active.answer}</b> — <span class="muted">${esc(active.explanation)}</span>
          </div>
          <div class="row" style="margin-top:12px">
            <button class="good grow" id="reveal" ${active.revealed ? 'disabled' : ''}>👁️ Reveal answer &amp; award points</button>
            ${m.activeIndex < m.statements.length - 1 ? `<button class="secondary" id="next-myth" data-i="${m.activeIndex + 1}">Next →</button>` : ''}
          </div>
          ${active.voters && active.voters.length ? `<details style="margin-top:10px"><summary class="muted">Who voted (${active.voters.length})</summary>
            <table>${active.voters.map((v) => `<tr><td>${esc(v.name)}</td><td class="tag-team">${esc(v.team)}</td><td>${v.vote}</td></tr>`).join('')}</table></details>` : ''}
        </div>`;
    }
    const tiles = m.statements.map((s, i) => `
      <div class="item-tile ${s.status === 'revealed' ? 'sold' : s.status === 'active' ? 'active' : ''}">
        <div class="flex-between">
          <span class="t-name">#${s.no}</span>
          <span class="badge ${s.status === 'revealed' ? 'revealed' : s.status}">${s.status}</span>
        </div>
        <div class="t-name">${esc(s.text)}</div>
        <div class="t-why">Answer: <b>${esc(s.answer)}</b> · ${s.totalVotes} votes</div>
        <button class="small open-myth" data-i="${i}">${s.status === 'pending' ? 'Open' : 'Re-open'}</button>
      </div>`).join('');

    return `
      ${phaseBanner()}
      ${live}
      <div class="card">
        <div class="flex-between"><h2>🧠 Statements</h2>
          <button class="bad small" data-reset="myth">Reset quiz</button>
        </div>
        <div class="item-list">${tiles}</div>
      </div>
      <div class="card"><h2>🏆 Team scoreboard</h2>${teamTable()}</div>`;
  }

  function adminLogo() {
    const l = state.logo;
    const active = l.items[l.activeIndex];
    let live = '';
    if (active) {
      live = `
        <div class="card center">
          <h2>🔴 Live now — Logo #${active.no} &nbsp;<span class="badge ${active.level}">${active.level.toUpperCase()}</span></h2>
          <div class="logo-img-container" style="max-width:240px;height:200px">
            <img src="${esc(active.svg)}" alt="Logo" />
          </div>
          <p class="muted" style="font-style:italic">"${esc(active.hint)}"</p>
          <div class="answer-box true" ${active.revealed ? '' : 'style="opacity:.6"'}>
            ${active.revealed ? '✔ Revealed — ' : '👁️ Correct Brand (hidden): '} <b>${esc(active.answer)}</b> — <span class="muted">${esc(active.explanation)}</span>
          </div>
          <div class="row" style="margin-top:12px">
            <button class="good grow" id="reveal-logo" ${active.revealed ? 'disabled' : ''}>👁️ Reveal answer &amp; award points</button>
            ${l.activeIndex < l.items.length - 1 ? `<button class="secondary" id="next-logo" data-i="${l.activeIndex + 1}">Next Logo →</button>` : ''}
          </div>
          ${active.voters && active.voters.length ? `<details style="margin-top:10px;text-align:left"><summary class="muted">Who guessed (${active.voters.length})</summary>
            <table>${active.voters.map((v) => `<tr><td>${esc(v.name)}</td><td class="tag-team">${esc(v.team)}</td><td>${esc(v.vote)} ${v.vote === active.answer ? '✅' : ''}</td></tr>`).join('')}</table></details>` : ''}
        </div>`;
    }

    const filteredItems = l.items.filter((it) => logoLevelFilter === 'all' || it.level === logoLevelFilter);

    const tiles = filteredItems.map((item) => {
      const realIndex = l.items.findIndex((x) => x.id === item.id);
      return `
      <div class="item-tile ${item.status === 'revealed' ? 'sold' : item.status === 'active' ? 'active' : ''}">
        <div class="flex-between">
          <span class="t-name">#${item.no} <span class="badge ${item.level}">${item.level.toUpperCase()}</span></span>
          <span class="badge ${item.status === 'revealed' ? 'revealed' : item.status}">${item.status}</span>
        </div>
        <div class="t-name">Brand: <b>${esc(item.answer)}</b></div>
        <div class="t-why">${item.totalVotes} votes submitted</div>
        <button class="small open-logo" data-i="${realIndex}">${item.status === 'pending' ? 'Open' : 'Re-open'}</button>
      </div>`;
    }).join('');

    const easyCount = l.items.filter((i) => i.level === 'easy').length;
    const mediumCount = l.items.filter((i) => i.level === 'medium').length;
    const hardCount = l.items.filter((i) => i.level === 'hard').length;

    return `
      ${phaseBanner()}
      ${live}
      <div class="card">
        <div class="flex-between">
          <h2>🎨 Vintage Logos (${l.items.length})</h2>
          <button class="bad small" data-reset="logo">Reset logo game</button>
        </div>
        <div class="level-pills">
          <div class="level-pill ${logoLevelFilter === 'all' ? 'active' : ''}" data-lev="all">All (${l.items.length})</div>
          <div class="level-pill ${logoLevelFilter === 'easy' ? 'active' : ''}" data-lev="easy">🟢 Easy (${easyCount})</div>
          <div class="level-pill ${logoLevelFilter === 'medium' ? 'active' : ''}" data-lev="medium">🟡 Medium (${mediumCount})</div>
          <div class="level-pill ${logoLevelFilter === 'hard' ? 'active' : ''}" data-lev="hard">🔴 Hard (${hardCount})</div>
        </div>
        <div class="item-list">${tiles}</div>
      </div>
      <div class="card"><h2>🏆 Team scoreboard</h2>${teamTable()}</div>`;
  }

  function adminConnection() {
    const c = state.connection;
    const active = c.puzzles[c.activeIndex];
    let live = '';
    if (active) {
      live = `
        <div class="card">
          <h2>🔴 Live now — ${esc(active.title)}</h2>
          <p class="muted">Categories in this puzzle:</p>
          ${active.categories.map((cat) => `
            <div class="cat-banner cat-${cat.level}" style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px">
              <div style="text-align:left">
                <div class="cat-title">${esc(cat.name)}</div>
                <div class="cat-words">${cat.words.map(esc).join(' • ')}</div>
              </div>
              <button class="secondary small reveal-cat" data-name="${esc(cat.name)}" ${cat.isRevealed ? 'disabled' : ''}>
                ${cat.isRevealed ? 'Revealed' : 'Reveal category'}
              </button>
            </div>
          `).join('')}
          ${c.activeIndex < c.puzzles.length - 1 ? `<button class="secondary" id="next-conn" data-i="${c.activeIndex + 1}" style="margin-top:10px">Next Puzzle →</button>` : ''}
        </div>`;
    }
    const tiles = c.puzzles.map((pz, i) => `
      <div class="item-tile ${pz.status === 'active' ? 'active' : ''}">
        <div class="flex-between">
          <span class="t-name">#${pz.no}</span>
          <span class="badge ${pz.status}">${pz.status}</span>
        </div>
        <div class="t-name">${esc(pz.title)}</div>
        <div class="t-why">4 categories • 16 words</div>
        <button class="small open-conn" data-i="${i}">${pz.status === 'pending' ? 'Open' : 'Re-open'}</button>
      </div>`).join('');

    return `
      ${phaseBanner()}
      ${live}
      <div class="card">
        <div class="flex-between"><h2>🧩 Connection Puzzles</h2>
          <button class="bad small" data-reset="connection">Reset connection game</button>
        </div>
        <div class="item-list">${tiles}</div>
      </div>
      <div class="card"><h2>🏆 Team scoreboard</h2>${teamTable()}</div>`;
  }

  function teamTable() {
    if (!state.teams.length) return '<p class="empty">No teams yet.</p>';
    return `
      <table>
        <tr><th class="rank">#</th><th>Team</th><th>Members</th><th>Quiz score</th><th>Points left</th><th>Items won</th></tr>
        ${state.teams.map((t, i) => `<tr>
          <td class="rank">${i + 1}</td>
          <td><b>${esc(t.team)}</b></td>
          <td>${t.members}</td>
          <td><b>${t.quizScore}</b></td>
          <td>${t.pointsLeft}</td>
          <td>${t.itemsWon}</td>
        </tr>`).join('')}
      </table>`;
  }

  function adminPeople() {
    const rows = state.members.map((m) => `
      <tr>
        <td><span class="dot ${m.connected ? 'on' : 'off'}"></span>${esc(m.name)}</td>
        <td class="tag-team">${esc(m.team)}</td>
        <td>${m.points}</td>
        <td>${m.quizScore}</td>
        <td>${m.itemsWon.length}</td>
        <td><button class="bad small kick" data-id="${m.id}">Remove</button></td>
      </tr>`).join('');
    return `
      <div class="card">
        <div class="flex-between">
          <h2>👥 Members (${state.members.length})</h2>
          <button class="bad small" data-reset="members">Clear all members</button>
        </div>
        ${state.members.length ? `<table>
          <tr><th>Name</th><th>Team</th><th>Points</th><th>Quiz</th><th>Items</th><th></th></tr>
          ${rows}
        </table>` : '<p class="empty">Nobody has joined yet. Share the QR / link from the server window.</p>'}
      </div>
      <div class="card"><h2>🏆 Team scoreboard</h2>${teamTable()}</div>`;
  }

  function wireAdminEvents() {
    document.querySelectorAll('[data-phase]').forEach((b) =>
      b.addEventListener('click', () => socket.emit('admin:setPhase', { phase: b.dataset.phase }))
    );
    document.querySelectorAll('.open-item').forEach((b) =>
      b.addEventListener('click', () => socket.emit('auction:open', { itemId: b.dataset.id }))
    );
    const sell = $('#sell');
    if (sell) sell.addEventListener('click', () => socket.emit('auction:sell'));
    const cancel = $('#cancel');
    if (cancel) cancel.addEventListener('click', () => socket.emit('auction:cancel'));
    document.querySelectorAll('.open-myth').forEach((b) =>
      b.addEventListener('click', () => socket.emit('myth:open', { index: Number(b.dataset.i) }))
    );
    const reveal = $('#reveal');
    if (reveal) reveal.addEventListener('click', () => socket.emit('myth:reveal'));
    const next = $('#next-myth');
    if (next) next.addEventListener('click', () => socket.emit('myth:open', { index: Number(next.dataset.i) }));

    document.querySelectorAll('.open-logo').forEach((b) =>
      b.addEventListener('click', () => socket.emit('logo:open', { index: Number(b.dataset.i) }))
    );
    const revealLogo = $('#reveal-logo');
    if (revealLogo) revealLogo.addEventListener('click', () => socket.emit('logo:reveal'));
    const nextLogo = $('#next-logo');
    if (nextLogo) nextLogo.addEventListener('click', () => socket.emit('logo:open', { index: Number(nextLogo.dataset.i) }));

    document.querySelectorAll('.level-pill').forEach((pill) =>
      pill.addEventListener('click', () => {
        logoLevelFilter = pill.dataset.lev;
        renderAdmin();
      })
    );

    document.querySelectorAll('.open-conn').forEach((b) =>
      b.addEventListener('click', () => socket.emit('connection:open', { index: Number(b.dataset.i) }))
    );
    const nextConn = $('#next-conn');
    if (nextConn) nextConn.addEventListener('click', () => socket.emit('connection:open', { index: Number(nextConn.dataset.i) }));
    document.querySelectorAll('.reveal-cat').forEach((b) =>
      b.addEventListener('click', () => socket.emit('connection:revealGroup', { categoryName: b.dataset.name }))
    );

    document.querySelectorAll('.kick').forEach((b) =>
      b.addEventListener('click', () => { if (confirm('Remove this member?')) socket.emit('admin:kick', { memberId: b.dataset.id }); })
    );
    document.querySelectorAll('[data-reset]').forEach((b) =>
      b.addEventListener('click', () => {
        const what = b.dataset.reset;
        if (confirm('Reset ' + what + '? This cannot be undone.')) socket.emit('admin:reset', { what });
      })
    );
  }
})();
