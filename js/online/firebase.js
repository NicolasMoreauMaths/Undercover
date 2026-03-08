// ============================================================
// UNDERCOVER — Wrapper Firebase (Realtime Database)
// Configure tes clés dans js/online/config.js
// ============================================================
const FB = (() => {
  let db = null;
  let auth = null;
  let myUid = null;

  function isConfigured() {
    return typeof FIREBASE_CONFIG !== 'undefined' &&
           FIREBASE_CONFIG.apiKey &&
           FIREBASE_CONFIG.apiKey !== 'VOTRE_API_KEY';
  }

  async function init() {
    if (!isConfigured()) return false;
    try {
      firebase.initializeApp(FIREBASE_CONFIG);
      db = firebase.database();
      // Authentification anonyme pour avoir un UID stable
      const result = await firebase.auth().signInAnonymously();
      myUid = result.user.uid;
      return true;
    } catch(e) {
      console.error('Firebase init error:', e);
      return false;
    }
  }

  function getUid() { return myUid; }
  function getDb()  { return db; }

  // --- ROOM ---
  function roomRef(code)        { return db.ref(`rooms/${code}`); }
  function playersRef(code)     { return db.ref(`rooms/${code}/players`); }
  function gameRef(code)        { return db.ref(`rooms/${code}/game`); }
  function chatRef(code)        { return db.ref(`rooms/${code}/chat`); }
  function voiceRef(code)       { return db.ref(`rooms/${code}/voice`); }

  async function createRoom(code, hostData) {
    await roomRef(code).set({
      host: myUid,
      code,
      status: 'lobby',
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      players: { [myUid]: hostData },
      game: null,
      chat: null,
    });
    // Auto-cleanup après 4h
    setTimeout(() => roomRef(code).remove(), 4 * 60 * 60 * 1000);
  }

  async function joinRoom(code, playerData) {
    const snap = await roomRef(code).once('value');
    if (!snap.exists()) return { error: 'Salle introuvable.' };
    const room = snap.val();
    if (room.status === 'playing') return { error: 'La partie a déjà commencé.' };
    const players = Object.keys(room.players || {});
    if (players.length >= 12) return { error: 'Salle pleine (12 joueurs max).' };
    // Vérifier doublons de nom
    const names = Object.values(room.players||{}).map(p=>p.name.toLowerCase());
    if (names.includes(playerData.name.toLowerCase())) return { error: 'Ce prénom est déjà pris dans cette salle.' };
    await db.ref(`rooms/${code}/players/${myUid}`).set(playerData);
    return { success: true };
  }

  async function leaveRoom(code) {
    if (!code || !myUid) return;
    await db.ref(`rooms/${code}/players/${myUid}`).remove();
  }

  // Marquer la presence comme offline si l'onglet se ferme
  function setupPresence(code) {
    const presRef = db.ref(`rooms/${code}/players/${myUid}/online`);
    presRef.set(true);
    presRef.onDisconnect().set(false);
  }

  async function setGameState(code, gameState) {
    await gameRef(code).set(gameState);
  }
  async function updateGameState(code, updates) {
    await gameRef(code).update(updates);
  }
  async function setRoomStatus(code, status) {
    await roomRef(code).update({ status });
  }
  async function submitClue(code, uid, clue) {
    await db.ref(`rooms/${code}/game/clues/${uid}`).set(clue);
  }
  async function submitVote(code, uid, targetUid) {
    await db.ref(`rooms/${code}/game/votes/${uid}`).set(targetUid);
  }

  // Chat
  async function sendChatMessage(code, name, text) {
    await chatRef(code).push({
      uid: myUid, name, text,
      ts: firebase.database.ServerValue.TIMESTAMP,
    });
  }

  // Listeners
  function onRoom(code, cb)    { return roomRef(code).on('value', s => cb(s.val())); }
  function onGame(code, cb)    { return gameRef(code).on('value', s => cb(s.val())); }
  function onChat(code, cb)    { return chatRef(code).on('child_added', s => cb(s.val())); }
  function onVoice(code, cb)   { return voiceRef(code).on('value', s => cb(s.val())); }

  function off(code) {
    roomRef(code).off();
    gameRef(code).off();
    chatRef(code).off();
    voiceRef(code).off();
  }

  // ReadyPlayers helpers (évite l'accès direct à FB.db depuis l'extérieur)
  async function setReadyPlayer(code, uid) {
    await db.ref(`rooms/${code}/game/readyPlayers/${uid}`).set(true);
  }
  function onReadyPlayers(code, cb) {
    return db.ref(`rooms/${code}/game/readyPlayers`).on('value', s => cb(s.val() || {}));
  }
  function offReadyPlayers(code) {
    db.ref(`rooms/${code}/game/readyPlayers`).off();
  }

  // Signaling WebRTC via Firebase
  async function sendSignal(code, toUid, data) {
    await db.ref(`rooms/${code}/voice/signals/${toUid}/${myUid}`).set({
      ...data, from: myUid, ts: Date.now()
    });
  }
  function onSignal(code, cb) {
    const ref = db.ref(`rooms/${code}/voice/signals/${myUid}`);
    ref.on('child_added', snap => {
      const data = snap.val();
      cb(data);
      snap.ref.remove(); // consommer le signal
    });
    return ref;
  }
  async function updateMicStatus(code, muted) {
    await db.ref(`rooms/${code}/voice/muted/${myUid}`).set(muted);
  }

  return {
    init, isConfigured, getUid, getDb,
    createRoom, joinRoom, leaveRoom, setupPresence,
    setGameState, updateGameState, setRoomStatus, submitClue, submitVote,
    sendChatMessage, onRoom, onGame, onChat, onVoice, off,
    setReadyPlayer, onReadyPlayers, offReadyPlayers,
    sendSignal, onSignal, updateMicStatus,
    roomRef, playersRef, gameRef,
  };
})();
