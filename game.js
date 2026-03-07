// ============================================================
// UNDERCOVER - Logique du jeu
// ============================================================

const Game = (() => {

  // État du jeu
  let state = {
    phase: 'setup',        // setup | reveal | play | vote | result | gameover
    players: [],           // [{id, name, role, word, alive, clues:[]}]
    currentPlayerIndex: 0,
    round: 1,
    votes: {},             // {voterId: targetId}
    wordPair: [],          // [citizenWord, undercoverWord]
    undercoverId: null,
    mrWhiteId: null,
    settings: {
      hasMrWhite: false,
      undercoverCount: 1,
    },
    revealQueue: [],       // ordre dans lequel les joueurs voient leur mot
    revealIndex: 0,
    eliminatedThisRound: null,
    mrWhiteGuessActive: false,
    winners: null,         // 'citizens' | 'undercover' | 'mrwhite'
    history: [],           // log des événements
  };

  // ---------- SETUP ----------

  function setupGame(playerNames, options = {}) {
    const n = playerNames.length;
    if (n < 3) return { error: 'Il faut au moins 3 joueurs.' };
    if (n > 12) return { error: 'Maximum 12 joueurs.' };

    state.settings.hasMrWhite = options.hasMrWhite || false;
    state.settings.undercoverCount = options.undercoverCount || 1;

    // Vérifier qu'il y a assez de citoyens
    const specialCount = state.settings.undercoverCount + (state.settings.hasMrWhite ? 1 : 0);
    if (specialCount >= n - 1) return { error: 'Trop de rôles spéciaux pour ce nombre de joueurs.' };

    // Tirer une paire de mots
    state.wordPair = getRandomWordPair();

    // Assigner les rôles
    const roles = assignRoles(n);

    // Créer les joueurs dans l'ordre mélangé
    const shuffledNames = shuffleArray([...playerNames]);
    state.players = shuffledNames.map((name, i) => ({
      id: i,
      name,
      role: roles[i],   // 'citizen' | 'undercover' | 'mrwhite'
      word: roles[i] === 'citizen' ? state.wordPair[0]
           : roles[i] === 'undercover' ? state.wordPair[1]
           : null,
      alive: true,
      clues: [],
      votedBy: [],
    }));

    state.undercoverId = state.players.find(p => p.role === 'undercover')?.id ?? null;
    state.mrWhiteId = state.players.find(p => p.role === 'mrwhite')?.id ?? null;

    state.phase = 'reveal';
    state.currentPlayerIndex = 0;
    state.round = 1;
    state.votes = {};
    state.revealQueue = state.players.map(p => p.id);
    state.revealIndex = 0;
    state.history = [];
    state.winners = null;

    return { success: true };
  }

  function assignRoles(n) {
    const roles = Array(n).fill('citizen');
    const indices = shuffleArray([...Array(n).keys()]);
    for (let i = 0; i < state.settings.undercoverCount; i++) {
      roles[indices[i]] = 'undercover';
    }
    if (state.settings.hasMrWhite) {
      roles[indices[state.settings.undercoverCount]] = 'mrwhite';
    }
    return roles;
  }

  // ---------- REVEAL PHASE ----------

  function getCurrentRevealPlayer() {
    if (state.revealIndex >= state.revealQueue.length) return null;
    const pid = state.revealQueue[state.revealIndex];
    return state.players.find(p => p.id === pid);
  }

  function nextReveal() {
    state.revealIndex++;
    if (state.revealIndex >= state.revealQueue.length) {
      state.phase = 'play';
      state.currentPlayerIndex = 0;
      // Pointer vers le premier joueur vivant
      while (state.currentPlayerIndex < state.players.length && !state.players[state.currentPlayerIndex].alive) {
        state.currentPlayerIndex++;
      }
      return { done: true };
    }
    return { done: false };
  }

  // ---------- PLAY PHASE ----------

  function getCurrentPlayer() {
    return state.players[state.currentPlayerIndex] || null;
  }

  function submitClue(clue) {
    const trimmed = clue.trim();
    if (!trimmed) return { error: 'L\'indice ne peut pas être vide.' };
    if (trimmed.split(' ').length > 3) return { error: 'Maximum 3 mots par indice.' };

    const player = state.players[state.currentPlayerIndex];
    if (!player || !player.alive) return { error: 'Joueur invalide.' };

    player.clues.push({ round: state.round, text: trimmed });
    state.history.push({ type: 'clue', round: state.round, player: player.name, text: trimmed });

    // Avancer au prochain joueur vivant
    let next = state.currentPlayerIndex + 1;
    while (next < state.players.length && !state.players[next].alive) next++;

    if (next >= state.players.length) {
      // Tous ont donné leur indice, passage au vote
      state.phase = 'vote';
      state.votes = {};
      state.currentPlayerIndex = 0;
      while (state.currentPlayerIndex < state.players.length && !state.players[state.currentPlayerIndex].alive) {
        state.currentPlayerIndex++;
      }
      return { nextPhase: 'vote' };
    }

    state.currentPlayerIndex = next;
    return { success: true };
  }

  // ---------- VOTE PHASE ----------

  function submitVote(voterId, targetId) {
    if (state.votes[voterId] !== undefined) return { error: 'Déjà voté.' };
    const voter = state.players.find(p => p.id === voterId);
    const target = state.players.find(p => p.id === targetId);
    if (!voter || !voter.alive) return { error: 'Votant invalide.' };
    if (!target || !target.alive) return { error: 'Cible invalide.' };
    if (voterId === targetId) return { error: 'Tu ne peux pas voter contre toi-même.' };

    state.votes[voterId] = targetId;

    const alivePlayers = state.players.filter(p => p.alive);
    const totalVotes = Object.keys(state.votes).length;

    if (totalVotes >= alivePlayers.length) {
      return resolveVote();
    }

    return { success: true, votesIn: totalVotes, totalNeeded: alivePlayers.length };
  }

  function resolveVote() {
    // Compter les votes
    const counts = {};
    state.players.filter(p => p.alive).forEach(p => { counts[p.id] = 0; });
    Object.values(state.votes).forEach(targetId => {
      if (counts[targetId] !== undefined) counts[targetId]++;
    });

    // Trouver le max
    const maxVotes = Math.max(...Object.values(counts));
    const tied = Object.keys(counts).filter(id => counts[id] === maxVotes);

    let eliminated = null;
    if (tied.length === 1) {
      eliminated = state.players.find(p => p.id === parseInt(tied[0]));
    } else {
      // Égalité : personne n'est éliminé
      state.history.push({ type: 'tie', round: state.round });
      state.phase = 'result';
      state.eliminatedThisRound = null;
      return { tie: true };
    }

    eliminated.alive = false;
    state.eliminatedThisRound = eliminated;
    state.history.push({ type: 'elimination', round: state.round, player: eliminated.name, role: eliminated.role });

    // Mr. White éliminé ? Il peut tenter de deviner
    if (eliminated.role === 'mrwhite') {
      state.mrWhiteGuessActive = true;
      state.phase = 'mrwhite_guess';
      return { mrWhiteEliminated: true, player: eliminated };
    }

    state.phase = 'result';
    const check = checkWinCondition();
    return { eliminated, ...check };
  }

  function mrWhiteGuess(guess) {
    const citizenWord = state.wordPair[0];
    const correct = guess.trim().toLowerCase() === citizenWord.toLowerCase();
    state.mrWhiteGuessActive = false;

    if (correct) {
      state.winners = 'mrwhite';
      state.phase = 'gameover';
      return { correct: true, winners: 'mrwhite' };
    }

    const check = checkWinCondition();
    state.phase = check.gameOver ? 'gameover' : 'result';
    return { correct: false, ...check };
  }

  function checkWinCondition() {
    const alive = state.players.filter(p => p.alive);
    const aliveUndercovers = alive.filter(p => p.role === 'undercover' || p.role === 'mrwhite');
    const aliveCitizens = alive.filter(p => p.role === 'citizen');

    // Tous les imposteurs éliminés
    if (aliveUndercovers.length === 0) {
      state.winners = 'citizens';
      state.phase = 'gameover';
      return { gameOver: true, winners: 'citizens' };
    }

    // Undercover en égalité ou supérieur aux citoyens
    if (aliveUndercovers.length >= aliveCitizens.length) {
      state.winners = 'undercover';
      state.phase = 'gameover';
      return { gameOver: true, winners: 'undercover' };
    }

    return { gameOver: false };
  }

  function nextRound() {
    state.round++;
    state.phase = 'play';
    state.votes = {};
    state.currentPlayerIndex = 0;
    while (state.currentPlayerIndex < state.players.length && !state.players[state.currentPlayerIndex].alive) {
      state.currentPlayerIndex++;
    }
  }

  // ---------- GETTERS ----------

  function getState() { return state; }
  function getAlivePlayers() { return state.players.filter(p => p.alive); }
  function getEliminatedPlayers() { return state.players.filter(p => !p.alive); }
  function getPlayer(id) { return state.players.find(p => p.id === id); }

  function getVoteCounts() {
    const counts = {};
    state.players.filter(p => p.alive).forEach(p => { counts[p.id] = 0; });
    Object.values(state.votes).forEach(tid => {
      if (counts[tid] !== undefined) counts[tid]++;
    });
    return counts;
  }

  function hasVoted(playerId) {
    return state.votes[playerId] !== undefined;
  }

  function reset() {
    state = {
      phase: 'setup',
      players: [],
      currentPlayerIndex: 0,
      round: 1,
      votes: {},
      wordPair: [],
      undercoverId: null,
      mrWhiteId: null,
      settings: { hasMrWhite: false, undercoverCount: 1 },
      revealQueue: [],
      revealIndex: 0,
      eliminatedThisRound: null,
      mrWhiteGuessActive: false,
      winners: null,
      history: [],
    };
  }

  return {
    setupGame, getCurrentRevealPlayer, nextReveal,
    getCurrentPlayer, submitClue, submitVote, resolveVote,
    mrWhiteGuess, nextRound, checkWinCondition,
    getState, getAlivePlayers, getEliminatedPlayers, getPlayer,
    getVoteCounts, hasVoted, reset,
  };
})();
