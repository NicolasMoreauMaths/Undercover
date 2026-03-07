// ============================================================
// UNDERCOVER - Interface utilisateur
// ============================================================

const UI = (() => {

  // ---------- UTILITAIRES ----------

  function show(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
  }

  function hide(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  }

  function hideAll() {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  }

  function showScreen(id) {
    hideAll();
    show(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function setHTML(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  function animateIn(el, className = 'animate-pop') {
    el.classList.remove(className);
    void el.offsetWidth;
    el.classList.add(className);
  }

  // ---------- ÉCRAN SETUP ----------

  function renderSetup() {
    showScreen('screen-setup');
    renderPlayerList();
    updateStartButton();
  }

  function renderPlayerList() {
    const container = document.getElementById('player-list');
    const players = AppState.playerNames;
    container.innerHTML = '';

    players.forEach((name, i) => {
      const div = document.createElement('div');
      div.className = 'player-tag';
      div.innerHTML = `
        <span class="player-tag-name">${escapeHTML(name)}</span>
        <button class="player-tag-remove" onclick="App.removePlayer(${i})" aria-label="Supprimer ${escapeHTML(name)}">✕</button>
      `;
      container.appendChild(div);
    });
  }

  function updateStartButton() {
    const btn = document.getElementById('btn-start');
    const n = AppState.playerNames.length;
    if (btn) {
      btn.disabled = n < 3;
      btn.textContent = n < 3 ? `Ajouter encore ${3 - n} joueur(s)` : 'Commencer la partie !';
    }
  }

  // ---------- ÉCRAN REVEAL ----------

  function renderReveal(player, isLast) {
    showScreen('screen-reveal');
    setText('reveal-player-name', player.name);
    setText('reveal-instruction', `Passe le téléphone à ${player.name} et clique quand tu es prêt(e).`);
    hide('reveal-word-container');
    show('reveal-btn-show');
    hide('reveal-btn-next');

    // Configurer le bouton "Montrer mon mot"
    const btnShow = document.getElementById('reveal-btn-show');
    btnShow.onclick = () => {
      const wordEl = document.getElementById('reveal-word');
      const roleEl = document.getElementById('reveal-role');

      if (player.role === 'mrwhite') {
        wordEl.textContent = '❓ Aucun mot !';
        roleEl.textContent = 'Tu es Mr. White — bluff et essaie de deviner !';
        roleEl.className = 'reveal-role-badge mrwhite';
      } else if (player.role === 'undercover') {
        wordEl.textContent = player.word;
        roleEl.textContent = '🕵️ Tu es l\'Undercover — cache-toi !';
        roleEl.className = 'reveal-role-badge undercover';
      } else {
        wordEl.textContent = player.word;
        roleEl.textContent = '👤 Tu es Citoyen(ne) — trouve l\'imposteur !';
        roleEl.className = 'reveal-role-badge citizen';
      }

      show('reveal-word-container');
      hide('reveal-btn-show');
      show('reveal-btn-next');
      animateIn(document.getElementById('reveal-word-container'));
    };

    const btnNext = document.getElementById('reveal-btn-next');
    btnNext.textContent = isLast ? '🎮 Commencer à jouer !' : 'Joueur suivant ➜';
    btnNext.onclick = () => {
      hide('reveal-word-container');
      App.nextReveal();
    };
  }

  // ---------- ÉCRAN PLAY ----------

  function renderPlay() {
    showScreen('screen-play');
    const state = Game.getState();
    const player = Game.getCurrentPlayer();
    if (!player) return;

    setText('play-round', `Manche ${state.round}`);
    setText('play-player-name', player.name);
    setText('play-instruction', `${player.name}, c'est à toi de donner un indice !`);
    setText('play-clue-count', `(1 à 3 mots)`);

    // Rendre les indices précédents
    renderCluesHistory();

    // Input
    const input = document.getElementById('play-clue-input');
    input.value = '';
    input.focus();

    // Bouton submit
    document.getElementById('btn-submit-clue').onclick = () => {
      const clue = input.value.trim();
      App.submitClue(clue);
    };

    input.onkeydown = (e) => {
      if (e.key === 'Enter') App.submitClue(input.value.trim());
    };
  }

  function renderCluesHistory() {
    const state = Game.getState();
    const container = document.getElementById('clues-history');
    if (!container) return;

    const allClues = [];
    state.players.forEach(p => {
      p.clues.forEach(c => {
        if (c.round === state.round) {
          allClues.push({ player: p.name, text: c.text, alive: p.alive });
        }
      });
    });

    if (allClues.length === 0) {
      container.innerHTML = '<p class="clue-empty">Sois le premier à donner un indice !</p>';
      return;
    }

    container.innerHTML = allClues.map(c => `
      <div class="clue-item ${c.alive ? '' : 'clue-eliminated'}">
        <span class="clue-player">${escapeHTML(c.player)}</span>
        <span class="clue-text">"${escapeHTML(c.text)}"</span>
      </div>
    `).join('');
  }

  // ---------- ÉCRAN VOTE ----------

  function renderVote() {
    showScreen('screen-vote');
    const state = Game.getState();
    const alivePlayers = Game.getAlivePlayers();

    // Trouver qui doit encore voter
    const notYetVoted = alivePlayers.filter(p => !Game.hasVoted(p.id));
    const currentVoter = notYetVoted[0];

    if (!currentVoter) return;

    setText('vote-title', `Vote — Manche ${state.round}`);
    setText('vote-player-name', `${currentVoter.name}, vote !`);
    setText('vote-instruction', 'Qui penses-tu être l\'Undercover (ou Mr. White) ?');

    const container = document.getElementById('vote-targets');
    container.innerHTML = '';

    alivePlayers.filter(p => p.id !== currentVoter.id).forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'vote-target-btn';
      btn.textContent = p.name;
      btn.onclick = () => App.submitVote(currentVoter.id, p.id);
      container.appendChild(btn);
    });

    // Votes déjà passés
    const votedCount = Object.keys(state.votes).length;
    setText('vote-progress', `${votedCount} / ${alivePlayers.length} votes`);
  }

  // ---------- ÉCRAN RÉSULTAT VOTE ----------

  function renderVoteResult(data) {
    showScreen('screen-vote-result');

    if (data.tie) {
      setText('result-title', '⚖️ Égalité !');
      setText('result-body', 'Personne n\'est éliminé cette manche. La partie continue !');
      setHTML('result-eliminated', '');
    } else if (data.eliminated) {
      const p = data.eliminated;
      const roleLabel = p.role === 'undercover' ? '🕵️ L\'Undercover !'
                      : p.role === 'mrwhite' ? '❓ Mr. White !'
                      : '👤 Un(e) citoyen(ne)...';
      setText('result-title', `${p.name} est éliminé(e) !`);
      setText('result-body', `C'était : ${roleLabel}`);
      setHTML('result-eliminated', renderVoteCountsHTML());
    }

    document.getElementById('btn-continue-result').onclick = () => {
      if (data.gameOver) {
        renderGameOver();
      } else if (data.mrWhiteEliminated) {
        renderMrWhiteGuess(data.player);
      } else {
        App.nextRound();
      }
    };
  }

  function renderVoteCountsHTML() {
    const counts = Game.getVoteCounts();
    const state = Game.getState();
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return '<div class="vote-counts">' + entries.map(([id, count]) => {
      const p = Game.getPlayer(parseInt(id));
      return `<div class="vote-count-row"><span>${escapeHTML(p.name)}</span><span>${count} vote(s)</span></div>`;
    }).join('') + '</div>';
  }

  // ---------- MR. WHITE GUESS ----------

  function renderMrWhiteGuess(player) {
    showScreen('screen-mrwhite-guess');
    setText('mrwhite-name', player.name);
    const input = document.getElementById('mrwhite-guess-input');
    input.value = '';
    input.focus();

    document.getElementById('btn-mrwhite-guess').onclick = () => {
      const guess = input.value.trim();
      if (!guess) return;
      App.mrWhiteGuess(guess);
    };

    input.onkeydown = (e) => {
      if (e.key === 'Enter') App.mrWhiteGuess(input.value.trim());
    };
  }

  function renderMrWhiteGuessResult(correct, winners) {
    showScreen('screen-vote-result');
    if (correct) {
      setText('result-title', '🎉 Incroyable !');
      setText('result-body', `Mr. White a deviné le mot des citoyens ! Il remporte la partie !`);
    } else {
      setText('result-title', '❌ Raté !');
      setText('result-body', `Mr. White n'a pas deviné le bon mot. La partie continue !`);
    }
    setHTML('result-eliminated', '');
    document.getElementById('btn-continue-result').onclick = () => {
      if (correct || winners === 'undercover' || winners === 'citizens') {
        renderGameOver();
      } else {
        App.nextRound();
      }
    };
  }

  // ---------- GAME OVER ----------

  function renderGameOver() {
    showScreen('screen-gameover');
    const state = Game.getState();
    const w = state.winners;

    const messages = {
      citizens: { emoji: '🎉', title: 'Les Citoyens gagnent !', sub: 'L\'Undercover a été démasqué. Bravo !' },
      undercover: { emoji: '🕵️', title: 'L\'Undercover gagne !', sub: 'Il a semé la confusion jusqu\'au bout !' },
      mrwhite: { emoji: '❓', title: 'Mr. White gagne !', sub: 'Il a deviné le mot secret des citoyens !' },
    };

    const m = messages[w] || { emoji: '🎮', title: 'Fin de partie', sub: '' };
    setText('gameover-emoji', m.emoji);
    setText('gameover-title', m.title);
    setText('gameover-sub', m.sub);

    // Révéler tous les rôles
    renderFinalReveal();
  }

  function renderFinalReveal() {
    const state = Game.getState();
    const container = document.getElementById('gameover-roles');

    container.innerHTML = state.players.map(p => {
      const roleLabel = p.role === 'undercover' ? '🕵️ Undercover'
                      : p.role === 'mrwhite' ? '❓ Mr. White'
                      : '👤 Citoyen(ne)';
      const statusClass = p.alive ? 'alive' : 'eliminated';
      return `
        <div class="final-player-card ${p.role} ${statusClass}">
          <div class="final-player-name">${escapeHTML(p.name)}</div>
          <div class="final-player-role">${roleLabel}</div>
          <div class="final-player-word">${p.word ? `Mot : "${escapeHTML(p.word)}"` : 'Pas de mot'}</div>
          <div class="final-player-status">${p.alive ? '✅ Survivant(e)' : '❌ Éliminé(e)'}</div>
        </div>
      `;
    }).join('');

    // Afficher les mots
    const [citizenWord, undercoverWord] = state.wordPair;
    setHTML('gameover-words', `
      <div class="word-reveal-box">
        <span class="word-citizen">👤 Citoyens : <strong>${escapeHTML(citizenWord)}</strong></span>
        <span class="word-undercover">🕵️ Undercover : <strong>${escapeHTML(undercoverWord)}</strong></span>
      </div>
    `);
  }

  // ---------- HELPERS ----------

  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast toast-${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  return {
    renderSetup, renderPlayerList, updateStartButton,
    renderReveal, renderPlay, renderCluesHistory,
    renderVote, renderVoteResult, renderVoteCountsHTML,
    renderMrWhiteGuess, renderMrWhiteGuessResult,
    renderGameOver, renderFinalReveal,
    showToast, show, hide, showScreen, setText, setHTML, animateIn,
  };
})();
