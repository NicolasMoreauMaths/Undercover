// ============================================================
// UNDERCOVER - Contrôleur principal
// ============================================================

// État partagé de l'interface
const AppState = {
  playerNames: [],
  maxPlayers: 12,
};

const App = (() => {

  // ---------- SETUP ----------

  function init() {
    renderSetupScreen();
    setupEventListeners();
  }

  function setupEventListeners() {
    // Ajout joueur via bouton
    document.getElementById('btn-add-player').addEventListener('click', addPlayerFromInput);

    // Ajout joueur via touche Entrée
    document.getElementById('input-player-name').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addPlayerFromInput();
    });

    // Démarrer la partie
    document.getElementById('btn-start').addEventListener('click', startGame);

    // Options
    document.getElementById('toggle-mrwhite').addEventListener('change', updateOptions);
    document.getElementById('undercover-count').addEventListener('change', updateOptions);
  }

  function addPlayerFromInput() {
    const input = document.getElementById('input-player-name');
    const name = input.value.trim();

    if (!name) {
      UI.showToast('Écris un prénom d\'abord !', 'warning');
      return;
    }
    if (name.length > 20) {
      UI.showToast('Le prénom est trop long (max 20 caractères).', 'warning');
      return;
    }
    if (AppState.playerNames.length >= AppState.maxPlayers) {
      UI.showToast('Maximum 12 joueurs !', 'warning');
      return;
    }
    if (AppState.playerNames.map(n => n.toLowerCase()).includes(name.toLowerCase())) {
      UI.showToast('Ce prénom est déjà utilisé !', 'warning');
      return;
    }

    AppState.playerNames.push(name);
    input.value = '';
    input.focus();
    UI.renderPlayerList();
    UI.updateStartButton();
  }

  function removePlayer(index) {
    AppState.playerNames.splice(index, 1);
    UI.renderPlayerList();
    UI.updateStartButton();
  }

  function updateOptions() {
    // Rien à faire ici, les valeurs sont lues au démarrage
  }

  function renderSetupScreen() {
    UI.renderSetup();
  }

  function startGame() {
    const hasMrWhite = document.getElementById('toggle-mrwhite').checked;
    const undercoverCount = parseInt(document.getElementById('undercover-count').value) || 1;

    const result = Game.setupGame(AppState.playerNames, { hasMrWhite, undercoverCount });

    if (result.error) {
      UI.showToast(result.error, 'error');
      return;
    }

    showRevealScreen();
  }

  // ---------- REVEAL ----------

  function showRevealScreen() {
    const state = Game.getState();
    const player = Game.getCurrentRevealPlayer();
    if (!player) {
      UI.renderPlay();
      return;
    }
    const isLast = state.revealIndex === state.revealQueue.length - 1;
    UI.renderReveal(player, isLast);
  }

  function nextReveal() {
    const result = Game.nextReveal();
    if (result.done) {
      UI.renderPlay();
    } else {
      showRevealScreen();
    }
  }

  // ---------- PLAY ----------

  function submitClue(clue) {
    if (!clue) {
      UI.showToast('Donne un indice en 1 à 3 mots !', 'warning');
      return;
    }

    const result = Game.submitClue(clue);

    if (result.error) {
      UI.showToast(result.error, 'warning');
      return;
    }

    if (result.nextPhase === 'vote') {
      UI.renderVote();
    } else {
      UI.renderPlay();
    }
  }

  // ---------- VOTE ----------

  function submitVote(voterId, targetId) {
    const result = Game.submitVote(voterId, targetId);

    if (result.error) {
      UI.showToast(result.error, 'warning');
      return;
    }

    const state = Game.getState();
    if (state.phase === 'result' || state.phase === 'gameover' || state.phase === 'mrwhite_guess') {
      UI.renderVoteResult(result);
    } else {
      // Plus de votes à enregistrer
      UI.renderVote();
    }
  }

  function mrWhiteGuess(guess) {
    if (!guess) {
      UI.showToast('Écris ta réponse !', 'warning');
      return;
    }
    const result = Game.mrWhiteGuess(guess);
    UI.renderMrWhiteGuessResult(result.correct, result.winners);
  }

  // ---------- TRANSITIONS ----------

  function nextRound() {
    Game.nextRound();
    UI.renderPlay();
  }

  function restartGame() {
    Game.reset();
    AppState.playerNames = [];
    UI.renderSetup();
  }

  function replayGame() {
    // Même joueurs, nouvelle partie
    const names = [...AppState.playerNames];
    Game.reset();
    AppState.playerNames = names;
    UI.renderSetup();
  }

  return {
    init, addPlayerFromInput, removePlayer, startGame,
    nextReveal, submitClue, submitVote, mrWhiteGuess,
    nextRound, restartGame, replayGame,
  };
})();

// Démarrer l'app quand le DOM est prêt
document.addEventListener('DOMContentLoaded', App.init);
