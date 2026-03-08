// ============================================================
// UNDERCOVER — Contrôleur mode EN LIGNE
// ============================================================
const OnlineApp = (() => {
  let roomCode = null;
  let myUid = null;
  let myName = null;
  let isHost = false;
  let roomListener = null;
  let gameListener = null;
  let speakingState = {};
  let voiceActive = false;
  let currentRoomData = null;
  let currentGameData = null;
  let resolvingVote = false; // verrou pour éviter la résolution multiple du vote

  // ---- HELPERS ----
  function esc(s){if(!s)return'';return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function show(id){document.getElementById(id)?.classList.remove('hidden');}
  function hide(id){document.getElementById(id)?.classList.add('hidden');}
  function txt(id,t){const e=document.getElementById(id);if(e)e.textContent=t;}
  function html(id,h){const e=document.getElementById(id);if(e)e.innerHTML=h;}
  function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.classList.add('hidden'));show(id);window.scrollTo({top:0,behavior:'smooth'});}
  function showToast(msg,type='info'){
    const t=document.getElementById('toast');if(!t)return;
    t.textContent=msg;t.className=`toast toast-${type} show`;
    setTimeout(()=>t.classList.remove('show'),3000);
  }
  function genCode(){return Math.random().toString(36).substring(2,6).toUpperCase();}

  // ---- INIT ----
  async function init() {
    if (!FB.isConfigured()) {
      showConfigScreen();
      return;
    }
    const ok = await FB.init();
    if (!ok) { showConfigScreen(); return; }
    myUid = FB.getUid();
    showJoinOrCreate();
  }

  function showConfigScreen() {
    showScreen('screen-online-config');
    document.getElementById('btn-save-config').onclick = saveConfig;
  }

  function saveConfig() {
    const fields = ['cfg-apiKey','cfg-authDomain','cfg-databaseURL','cfg-projectId','cfg-appId'];
    const vals = {};
    for (const f of fields) {
      const v = document.getElementById(f)?.value.trim();
      if (!v) { showToast('Remplis tous les champs !','warning'); return; }
      vals[f.replace('cfg-','')] = v;
    }
    // Écrire dans localStorage pour réutilisation
    localStorage.setItem('undercover_fb_config', JSON.stringify(vals));
    showToast('Configuration sauvegardée ! Recharge la page.','success');
    setTimeout(() => location.reload(), 1500);
  }

  function showJoinOrCreate() {
    // Vérifier si config sauvegardée
    const saved = localStorage.getItem('undercover_fb_config');
    if (saved && !FB.isConfigured()) {
      showToast('Recharge la page pour appliquer la config.','warning');
    }
    showScreen('screen-online-home');
    document.getElementById('btn-create-room').onclick = showCreateRoom;
    document.getElementById('btn-join-room').onclick = showJoinRoom;
  }

  // ---- CREATE ----
  function showCreateRoom() {
    showScreen('screen-create-room');
    document.getElementById('btn-do-create').onclick = async () => {
      const name = document.getElementById('create-name-input').value.trim();
      if (!name) { showToast('Entre ton prénom !','warning'); return; }
      if (name.length > 20) { showToast('Prénom trop long.','warning'); return; }
      myName = name;
      const code = genCode();
      roomCode = code;
      isHost = true;
      try {
        await FB.createRoom(code, { name, uid: myUid, online: true, ready: false });
        FB.setupPresence(code);
        showLobby();
      } catch(e) { showToast('Erreur de connexion.','error'); }
    };
    document.getElementById('create-name-input').onkeydown = e => { if(e.key==='Enter') document.getElementById('btn-do-create').click(); };
  }

  // ---- JOIN ----
  function showJoinRoom() {
    showScreen('screen-join-room');
    document.getElementById('btn-do-join').onclick = async () => {
      const name = document.getElementById('join-name-input').value.trim();
      const code = document.getElementById('join-code-input').value.trim().toUpperCase();
      if (!name) { showToast('Entre ton prénom !','warning'); return; }
      if (name.length > 20) { showToast('Prénom trop long.','warning'); return; }
      if (code.length !== 4) { showToast('Le code fait 4 lettres.','warning'); return; }
      myName = name; roomCode = code;
      const r = await FB.joinRoom(code, { name, uid: myUid, online: true, ready: false });
      if (r.error) { showToast(r.error,'error'); return; }
      FB.setupPresence(code);
      isHost = false;
      showLobby();
    };
    document.getElementById('join-code-input').onkeydown = e => { if(e.key==='Enter') document.getElementById('btn-do-join').click(); };
  }

  // ---- LOBBY ----
  function showLobby() {
    showScreen('screen-lobby');
    txt('lobby-code', roomCode);
    document.getElementById('lobby-copy-btn').onclick = () => {
      navigator.clipboard?.writeText(roomCode);
      showToast('Code copié !','success');
    };
    // Bouton démarrer (host only)
    const startBtn = document.getElementById('btn-start-online');
    if (isHost) {
      show('btn-start-online');
      startBtn.onclick = startOnlineGame;
    } else {
      hide('btn-start-online');
    }
    document.getElementById('btn-leave-room').onclick = leaveRoom;
    // Écouter la salle
    if (roomListener) FB.off(roomCode);
    FB.onRoom(roomCode, (room) => {
      if (!room) { showToast('La salle a été fermée.','error'); leaveRoom(); return; }
      currentRoomData = room;
      renderLobbyPlayers(room.players || {});
      if (room.status === 'playing' && currentGameData) {
        renderOnlineGame();
      }
    });
    FB.onGame(roomCode, (game) => {
      if (!game) return;
      currentGameData = game;
      if (currentRoomData?.status === 'playing') renderOnlineGame();
    });
    FB.onChat(roomCode, (msg) => appendChatMsg(msg));
    setupChat();
  }

  function renderLobbyPlayers(players) {
    const arr = Object.values(players);
    const hostUid = currentRoomData?.host;
    html('lobby-players-list', arr.map(p => {
      const isMe = p.uid === myUid;
      const isH = p.uid === hostUid;
      const online = p.online !== false;
      const badgeClass = isH ? 'badge-host' : (online ? 'badge-ready' : 'badge-waiting');
      const badgeTxt = isH ? '👑 Hôte' : (online ? '✅ Connecté' : '⏳ Absent');
      return `<div class="lobby-player-row">
        <span class="lobby-player-name">${esc(p.name)}${isMe?' <span style="color:var(--online);font-size:.75rem">(toi)</span>':''}</span>
        <span class="lobby-player-badge ${badgeClass}">${badgeTxt}</span>
      </div>`;
    }).join(''));
    txt('lobby-count', `${arr.length} joueur(s) dans la salle`);
    if (isHost) {
      const startBtn = document.getElementById('btn-start-online');
      startBtn.disabled = arr.length < 3;
      startBtn.textContent = arr.length < 3 ? `Attends encore ${3-arr.length} joueur(s)` : '🚀 Lancer la partie !';
    }
  }

  // ---- START ONLINE GAME ----
  async function startOnlineGame() {
    const players = Object.values(currentRoomData.players || {});
    if (players.length < 3) { showToast('Il faut au moins 3 joueurs !','warning'); return; }
    const hasMrWhite = document.getElementById('online-toggle-mrwhite').checked;
    const undercoverCount = parseInt(document.getElementById('online-undercover-count').value) || 1;
    const wordPair = getRandomWordPair();
    const shuffled = shuffleArray([...players]);
    const n = shuffled.length;
    // Assign roles
    const roles = Array(n).fill('citizen');
    const idx = shuffleArray([...Array(n).keys()]);
    const uc = Math.min(undercoverCount, Math.floor((n-1)/2));
    for (let i = 0; i < uc; i++) roles[idx[i]] = 'undercover';
    if (hasMrWhite) roles[idx[uc]] = 'mrwhite';
    // Build player map with roles & words
    const playerMap = {};
    shuffled.forEach((p, i) => {
      playerMap[p.uid] = {
        ...p,
        role: roles[i],
        word: roles[i]==='citizen' ? wordPair[0] : roles[i]==='undercover' ? wordPair[1] : null,
        alive: true,
        order: i,
      };
    });
    const gameState = {
      wordPair, playerMap,
      phase: 'reveal',
      round: 1,
      votes: {},
      clues: {},
      revealOrder: shuffled.map(p => p.uid),
      revealIndex: 0,
      eliminatedThisRound: null,
      winners: null,
      startedAt: Date.now(),
    };
    resolvingVote = false;
    await FB.setGameState(roomCode, gameState);
    await FB.setRoomStatus(roomCode, 'playing');
  }

  // ---- RENDER ONLINE GAME ----
  function renderOnlineGame() {
    const g = currentGameData;
    if (!g) return;
    switch(g.phase) {
      case 'reveal':      renderOnlineReveal(g); break;
      case 'play':        renderOnlinePlay(g); break;
      case 'vote':        renderOnlineVote(g); break;
      case 'result':      renderOnlineResult(g); break;
      case 'mrwhite_guess': renderMrWhiteGuess(g); break;
      case 'gameover':    renderOnlineGameOver(g); break;
    }
  }

  // REVEAL : chaque joueur voit son propre mot
  function renderOnlineReveal(g) {
    showScreen('screen-online-reveal');
    const me = g.playerMap[myUid];
    if (!me) return;
    const wordEl = document.getElementById('online-reveal-word');
    const roleEl = document.getElementById('online-reveal-role');
    const nameEl = document.getElementById('online-reveal-greeting');
    txt('online-reveal-greeting', `Salut ${me.name} ! 👋`);
    if (me.role === 'mrwhite') {
      wordEl.textContent = '❓ Aucun mot !';
      roleEl.textContent = 'Tu es Mr. White — bluff et essaie de deviner !';
      roleEl.className = 'reveal-role-badge mrwhite';
    } else if (me.role === 'undercover') {
      wordEl.textContent = me.word;
      roleEl.textContent = '🕵️ Tu es l\'Undercover — cache-toi !';
      roleEl.className = 'reveal-role-badge undercover';
    } else {
      wordEl.textContent = me.word;
      roleEl.textContent = '👤 Tu es Citoyen(ne) — trouve l\'imposteur !';
      roleEl.className = 'reveal-role-badge citizen';
    }
    // Bouton prêt
    const btn = document.getElementById('btn-online-reveal-ready');
    btn.onclick = async () => {
      btn.disabled = true; btn.textContent = '✅ Prêt(e) !';
      await FB.setReadyPlayer(roomCode, myUid);
      // Si hôte, surveiller quand tout le monde est prêt
      if (isHost) watchAllReady(g);
    };
  }

  function watchAllReady(g) {
    FB.onReadyPlayers(roomCode, async (ready) => {
      const alivePlayers = Object.values(g.playerMap).filter(p => p.alive);
      if (Object.keys(ready).length >= alivePlayers.length) {
        FB.offReadyPlayers(roomCode);
        await FB.updateGameState(roomCode, { phase: 'play', clues: {} });
      }
    });
  }

  // PLAY : indices écrits
  function renderOnlinePlay(g) {
    showScreen('screen-online-play');
    setupPlayChat();
    const me = g.playerMap[myUid];
    const alive = Object.values(g.playerMap).filter(p => p.alive);
    txt('online-round', `Manche ${g.round}`);
    // Barre des joueurs
    html('online-players-bar', alive.map(p => `
      <div class="player-alive-chip ${p.uid===myUid?'is-you':''}">
        ${esc(p.name)}${p.uid===myUid?' (toi)':''}
      </div>`).join(''));
    // Indices
    const clues = g.clues || {};
    const clueItems = Object.entries(clues).map(([uid, clue]) => {
      const p = g.playerMap[uid];
      const isMe = uid === myUid;
      const elim = !p?.alive;
      return `<div class="clue-item-online ${isMe?'own':''} ${elim?'eliminated':''}">
        <span class="ci-name">${esc(p?.name||'?')}${isMe?' (toi)':''}</span>
        <span class="ci-text">"${esc(clue.text)}"</span>
      </div>`;
    });
    const container = document.getElementById('online-clues-list');
    container.innerHTML = clueItems.length ? clueItems.join('') : '<p class="clue-empty">Sois le premier à donner un indice !</p>';
    // Input
    const myClue = clues[myUid];
    const clueArea = document.getElementById('online-clue-area');
    if (myClue) {
      clueArea.innerHTML = `<p style="color:var(--online);font-weight:700;font-size:.9rem">✅ Ton indice : "${esc(myClue.text)}"</p>`;
    } else if (!me?.alive) {
      clueArea.innerHTML = '<p style="color:var(--text2);font-size:.85rem">Tu es éliminé(e).</p>';
    } else {
      clueArea.innerHTML = `
        <p class="clue-waiting">Donne ton indice en 1 à 3 mots :</p>
        <div class="clue-input-area">
          <input id="online-clue-input" class="input-field online" type="text" placeholder="Ton indice..." maxlength="40" autocomplete="off" />
          <button id="btn-send-clue" class="btn btn-online btn-sm">✓</button>
        </div>`;
      const inp = document.getElementById('online-clue-input');
      document.getElementById('btn-send-clue').onclick = () => sendClue(inp.value.trim());
      inp.onkeydown = e => { if(e.key==='Enter') sendClue(inp.value.trim()); };
      setTimeout(() => inp.focus(), 100);
    }
    // Progression
    const clueCount = Object.keys(clues).length;
    const aliveCount = alive.length;
    txt('online-clue-progress', `${clueCount} / ${aliveCount} indices donnés`);
    // Hôte peut forcer le passage au vote
    if (isHost) {
      const forceBtn = document.getElementById('btn-force-vote');
      if (forceBtn) {
        forceBtn.style.display = clueCount > 0 ? 'block' : 'none';
        forceBtn.onclick = () => FB.updateGameState(roomCode, { phase: 'vote', votes: {} });
      }
    }
  }

  async function sendClue(text) {
    if (!text) { showToast('Donne un indice !','warning'); return; }
    if (text.split(' ').length > 3) { showToast('Maximum 3 mots !','warning'); return; }
    await FB.submitClue(roomCode, myUid, { text, round: currentGameData?.round || 1 });
    // Si hôte, vérifier si tout le monde a donné son indice
    if (isHost) checkAllCluesDone();
  }

  function checkAllCluesDone() {
    const g = currentGameData;
    if (!g) return;
    const alive = Object.values(g.playerMap).filter(p => p.alive);
    const clues = g.clues || {};
    const done = alive.every(p => clues[p.uid]);
    if (done) {
      setTimeout(() => FB.updateGameState(roomCode, { phase: 'vote', votes: {} }), 800);
    }
  }

  // VOTE ONLINE
  function renderOnlineVote(g) {
    showScreen('screen-online-vote');
    const alive = Object.values(g.playerMap).filter(p => p.alive);
    const votes = g.votes || {};
    const myVote = votes[myUid];
    const me = g.playerMap[myUid];
    txt('online-vote-round', `Vote — Manche ${g.round}`);
    const voteCounts = {};
    alive.forEach(p => { voteCounts[p.uid] = 0; });
    Object.values(votes).forEach(t => { if(voteCounts[t]!==undefined) voteCounts[t]++; });
    const totalVotes = Object.keys(votes).length;
    txt('online-vote-progress', `${totalVotes} / ${alive.length} votes`);
    // Boutons de vote
    const c = document.getElementById('online-vote-list');
    c.innerHTML = alive.filter(p => p.uid !== myUid).map(p => {
      const count = voteCounts[p.uid] || 0;
      const pct = totalVotes > 0 ? Math.round(count/alive.length*100) : 0;
      const voted = myVote === p.uid;
      const hasVoted = !!myVote || !me?.alive;
      return `<button class="online-vote-btn ${voted?'voted':''}" 
              ${hasVoted?'disabled':''} 
              onclick="OnlineApp.castVote('${p.uid}')">
        <span>${esc(p.name)}</span>
        <span style="font-size:.8rem;color:var(--text2)">${count} vote(s)</span>
      </button>
      <div class="vote-bar"><div class="vote-bar-fill" style="width:${pct}%"></div></div>`;
    }).join('');
    if (!me?.alive) {
      c.insertAdjacentHTML('beforeend','<p style="color:var(--text2);font-size:.85rem;margin-top:8px">Tu es éliminé(e) — tu ne peux plus voter.</p>');
    }
    // Hôte résout le vote quand tout le monde a voté
    if (isHost && totalVotes >= alive.length && !resolvingVote) {
      setTimeout(() => resolveOnlineVote(g), 500);
    }
  }

  async function castVote(targetUid) {
    const g = currentGameData;
    if (!g) return;
    if (g.votes?.[myUid]) { showToast('Tu as déjà voté !','warning'); return; }
    await FB.submitVote(roomCode, myUid, targetUid);
  }

  async function resolveOnlineVote(g) {
    if (resolvingVote) return;
    if (currentGameData?.phase !== 'vote') return; // déjà résolu
    resolvingVote = true;
    const alive = Object.values(g.playerMap).filter(p => p.alive);
    const votes = g.votes || {};
    const counts = {};
    alive.forEach(p => { counts[p.uid] = 0; });
    Object.values(votes).forEach(t => { if(counts[t]!==undefined) counts[t]++; });
    const maxV = Math.max(...Object.values(counts));
    const tied = Object.keys(counts).filter(id => counts[id] === maxV);
    const updates = { votes: {}, clues: {} };
    if (tied.length > 1) {
      updates.eliminatedThisRound = null;
      updates.phase = 'result';
      updates.tieResult = true;
    } else {
      const elimUid = tied[0];
      updates[`playerMap/${elimUid}/alive`] = false;
      updates.eliminatedThisRound = elimUid;
      updates.tieResult = false;
      const elimRole = g.playerMap[elimUid].role;
      if (elimRole === 'mrwhite') {
        updates.phase = 'mrwhite_guess';
      } else {
        // Check win
        const newAlive = alive.filter(p => p.uid !== elimUid);
        const specials = newAlive.filter(p => p.role !== 'citizen');
        const citizens = newAlive.filter(p => p.role === 'citizen');
        if (specials.length === 0) { updates.phase = 'gameover'; updates.winners = 'citizens'; }
        else if (specials.length >= citizens.length) { updates.phase = 'gameover'; updates.winners = 'undercover'; }
        else { updates.phase = 'result'; }
      }
    }
    await FB.updateGameState(roomCode, updates);
    resolvingVote = false;
  }

  function renderOnlineResult(g) {
    showScreen('screen-online-result');
    const elimUid = g.eliminatedThisRound;
    if (g.tieResult || !elimUid) {
      txt('online-result-title', '⚖️ Égalité !');
      txt('online-result-body', 'Personne n\'est éliminé. La partie continue !');
    } else {
      const elim = g.playerMap[elimUid];
      const lbl = elim.role==='undercover'?'🕵️ L\'Undercover !':elim.role==='mrwhite'?'❓ Mr. White !':'👤 Un(e) citoyen(ne)...';
      txt('online-result-title', `${elim.name} est éliminé(e) !`);
      txt('online-result-body', `C'était : ${lbl}`);
    }
    if (isHost) {
      show('btn-next-round-online');
      document.getElementById('btn-next-round-online').onclick = async () => {
        resolvingVote = false;
        await FB.updateGameState(roomCode, { phase: 'play', round: (g.round||1)+1, clues:{}, votes:{}, eliminatedThisRound:null, tieResult:false });
      };
    } else {
      hide('btn-next-round-online');
    }
  }

  function renderMrWhiteGuess(g) {
    showScreen('screen-online-mrwhite');
    const elimUid = g.eliminatedThisRound;
    const elim = g.playerMap?.[elimUid];
    const isMe = elimUid === myUid;
    txt('online-mrwhite-name', elim?.name || '');
    const area = document.getElementById('online-mrwhite-area');
    if (isMe) {
      area.innerHTML = `
        <p class="mrwhite-desc">C'est ta dernière chance ! Si tu devines le mot des citoyens, tu gagnes !</p>
        <div class="input-group">
          <input id="online-mrwhite-input" class="input-field" type="text" placeholder="Le mot des citoyens..." maxlength="30" />
          <button id="btn-online-mrwhite-guess" class="btn btn-danger btn-sm">Valider</button>
        </div>`;
      const inp = document.getElementById('online-mrwhite-input');
      document.getElementById('btn-online-mrwhite-guess').onclick = () => submitMrWhiteGuess(inp.value.trim(), g);
      inp.onkeydown = e => { if(e.key==='Enter') submitMrWhiteGuess(inp.value.trim(), g); };
      setTimeout(() => inp.focus(), 100);
    } else {
      area.innerHTML = `<p class="mrwhite-desc" style="text-align:center">Mr. White tente de deviner le mot des citoyens…<br>En attente de sa réponse.</p>`;
    }
  }

  async function submitMrWhiteGuess(guess, g) {
    if (!guess) { showToast('Écris ta réponse !','warning'); return; }
    const correct = guess.trim().toLowerCase() === g.wordPair[0].toLowerCase();
    if (correct) {
      await FB.updateGameState(roomCode, { phase: 'gameover', winners: 'mrwhite' });
    } else {
      const alive = Object.values(g.playerMap).filter(p => p.alive);
      const specials = alive.filter(p => p.role !== 'citizen');
      const citizens = alive.filter(p => p.role === 'citizen');
      let next;
      if (specials.length === 0) next = { phase:'gameover', winners:'citizens' };
      else if (specials.length >= citizens.length) next = { phase:'gameover', winners:'undercover' };
      else next = { phase:'result', tieResult:false };
      await FB.updateGameState(roomCode, next);
      showToast('Mauvaise réponse !','error');
    }
  }

  function renderOnlineGameOver(g) {
    showScreen('screen-online-gameover');
    const msgs = {
      citizens:{emoji:'🎉',title:'Les Citoyens gagnent !',sub:'L\'Undercover a été démasqué !'},
      undercover:{emoji:'🕵️',title:'L\'Undercover gagne !',sub:'Il a semé la confusion jusqu\'au bout !'},
      mrwhite:{emoji:'❓',title:'Mr. White gagne !',sub:'Il a deviné le mot secret !'},
    };
    const m = msgs[g.winners] || {emoji:'🎮',title:'Fin de partie',sub:''};
    txt('online-go-emoji', m.emoji);
    txt('online-go-title', m.title);
    txt('online-go-sub', m.sub);
    const [cw,uw] = g.wordPair;
    html('online-go-words', `<div class="word-reveal-box"><span class="word-citizen">👤 Citoyens : <strong>${esc(cw)}</strong></span><span class="word-undercover">🕵️ Undercover : <strong>${esc(uw)}</strong></span></div>`);
    html('online-go-roles', Object.values(g.playerMap).map(p => {
      const rl = p.role==='undercover'?'🕵️ Undercover':p.role==='mrwhite'?'❓ Mr. White':'👤 Citoyen(ne)';
      return`<div class="final-player-card ${p.role} ${p.alive?'':'eliminated'}">
        <div class="final-player-name">${esc(p.name)}${p.uid===myUid?' (toi)':''}</div>
        <div class="final-player-role">${rl}</div>
        <div class="final-player-word">${p.word?`"${esc(p.word)}"`:'Pas de mot'}</div>
        <div class="final-player-status">${p.alive?'✅ Survivant(e)':'❌ Éliminé(e)'}</div>
      </div>`;
    }).join(''));
    document.getElementById('btn-online-replay').onclick = async () => {
      await FB.setRoomStatus(roomCode, 'lobby');
      await FB.updateGameState(roomCode, null);
      showLobby();
    };
    document.getElementById('btn-online-quit').onclick = leaveRoom;
    Voice.stop();
  }

  // ---- CHAT ----
  function setupChat() {
    const sendBtn = document.getElementById('chat-send');
    const inp = document.getElementById('chat-input');
    if (!sendBtn || !inp) return;
    sendBtn.onclick = () => sendChatFrom('chat-input');
    inp.onkeydown = e => { if(e.key==='Enter') sendChatFrom('chat-input'); };
  }

  function setupPlayChat() {
    const sendBtn = document.getElementById('play-chat-send');
    const inp = document.getElementById('play-chat-input');
    if (!sendBtn || !inp) return;
    sendBtn.onclick = () => sendChatFrom('play-chat-input');
    inp.onkeydown = e => { if(e.key==='Enter') sendChatFrom('play-chat-input'); };
  }

  async function sendChatFrom(inputId) {
    const inp = document.getElementById(inputId);
    if (!inp) return;
    const text = inp.value.trim();
    if (!text) return;
    inp.value = '';
    await FB.sendChatMessage(roomCode, myName, text);
  }

  function appendChatMsg(msg) {
    // Écrire dans tous les conteneurs de chat (lobby + jeu)
    const boxes = document.querySelectorAll('.chat-messages');
    if (!boxes.length) return;
    const isMe = msg.uid === myUid;
    const isSystem = msg.uid === 'system';
    boxes.forEach(box => {
      const div = document.createElement('div');
      div.className = 'chat-msg';
      div.innerHTML = `<span class="chat-msg-name ${isMe?'own':isSystem?'system':''}">${esc(msg.name)}</span><span class="chat-msg-text">${esc(msg.text)}</span>`;
      box.appendChild(div);
      box.scrollTop = box.scrollHeight;
    });
  }

  // ---- VOICE ----
  async function toggleVoice() {
    const btn = document.getElementById('btn-voice-toggle');
    if (!voiceActive) {
      const uids = Object.keys(currentRoomData?.players || {}).filter(u => u !== myUid);
      const ok = await Voice.start(roomCode, myUid, uids);
      if (!ok) { showToast('Micro non disponible.','error'); return; }
      voiceActive = true;
      Voice.onSpeaking((uid, speaking) => {
        speakingState[uid] = speaking;
        updateVoicePeers();
      });
      btn.textContent = '🎙️'; btn.classList.add('active');
      showToast('Vocal activé !','success');
    } else {
      Voice.stop(); voiceActive = false;
      btn.textContent = '🎙️'; btn.classList.remove('active','muted');
      showToast('Vocal désactivé.','info');
    }
  }

  function toggleMute() {
    if (!voiceActive) return;
    const muted = Voice.toggleMute();
    const btn = document.getElementById('btn-voice-mute');
    btn.textContent = muted ? '🔇' : '🔊';
    btn.classList.toggle('muted', muted);
  }

  function updateVoicePeers() {
    const container = document.getElementById('voice-peers');
    if (!container || !currentRoomData) return;
    const players = Object.values(currentRoomData.players || {});
    container.innerHTML = players.map(p => {
      const speaking = speakingState[p.uid];
      return `<div class="voice-peer ${speaking?'speaking':''}">
        ${speaking?'🔊':'👤'} ${esc(p.name)}
      </div>`;
    }).join('');
  }

  async function leaveRoom() {
    if (roomCode) {
      FB.off(roomCode);
      await FB.leaveRoom(roomCode);
    }
    Voice.stop();
    roomCode = null; myUid = FB.getUid(); myName = null; isHost = false;
    currentRoomData = null; currentGameData = null;
    showJoinOrCreate();
  }

  return { init, castVote, toggleVoice, toggleMute, leaveRoom };
})();
