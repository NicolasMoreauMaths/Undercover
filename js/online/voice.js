// ============================================================
// UNDERCOVER — Tchat Vocal (WebRTC mesh)
// ============================================================
const Voice = (() => {
  let localStream  = null;
  let peers        = {};         // uid -> RTCPeerConnection
  let audioEls     = {};         // uid -> HTMLAudioElement (gardés en vie)
  let analyserNodes = {};        // uid -> { analyser, src, intervalId }
  let signalRef    = null;       // ref Firebase pour les signaux entrants
  let audioCtx     = null;
  let muted        = false;
  let roomCode     = null;
  let myUid        = null;
  let onSpeakingCb = null;

  const RTC_CONFIG = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  };

  // ── Démarrage ──────────────────────────────────────────────
  async function start(code, uid, otherUids) {
    roomCode = code;
    myUid    = uid;
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      muted = false;

      // Écouter les signaux entrants d'abord, AVANT d'envoyer des offres
      signalRef = FB.onSignal(code, async (data) => {
        if      (data.type === 'offer')   await handleOffer(data);
        else if (data.type === 'answer')  await handleAnswer(data);
        else if (data.type === 'ice')     await handleIce(data);
      });

      // Connexion mesh : seul le pair avec le UID lexicographiquement
      // inférieur initie, pour éviter les situations de glare.
      for (const oid of otherUids) {
        if (oid !== uid && uid < oid) {
          await createPeer(oid, true);
        }
        // Si uid > oid, on attend que l'autre envoie son offre
      }

      startSpeakingDetection();
      return true;
    } catch (e) {
      console.warn('[Voice] Démarrage échoué :', e);
      return false;
    }
  }

  // ── Création d'un pair ─────────────────────────────────────
  async function createPeer(targetUid, isInitiator) {
    // Fermer un éventuel pair existant (sécurité)
    if (peers[targetUid]) {
      peers[targetUid].close();
      delete peers[targetUid];
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    peers[targetUid] = pc;

    // Ajouter les pistes locales
    localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));

    // Réception audio distant
    pc.ontrack = (e) => {
      const stream = e.streams && e.streams[0];
      if (!stream) return;

      // Créer et stocker l'élément audio (nécessaire pour qu'il reste en mémoire)
      const audio = new Audio();
      audio.srcObject = stream;
      audio.autoplay  = true;
      audio.volume    = 1;
      audioEls[targetUid] = audio;   // ← Gardé en vie par la map

      // Déclencher la lecture (nécessaire sur certains navigateurs)
      audio.play().catch(() => {
        // Autoplay bloqué : la lecture reprendra dès la prochaine interaction
        document.addEventListener('click', () => audio.play().catch(() => {}), { once: true });
      });

      watchRemoteSpeaking(targetUid, stream);
    };

    // Envoi des candidats ICE via Firebase
    pc.onicecandidate = async (e) => {
      if (e.candidate) {
        await FB.sendSignal(roomCode, targetUid, {
          type: 'ice',
          candidate: e.candidate.toJSON(),
        });
      }
    };

    // Nettoyage en cas de déconnexion
    pc.onconnectionstatechange = () => {
      if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) {
        cleanupPeer(targetUid);
      }
    };

    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await FB.sendSignal(roomCode, targetUid, { type: 'offer', sdp: offer.sdp });
    }

    return pc;
  }

  // ── Gestion des signaux entrants ───────────────────────────
  async function handleOffer(data) {
    const pc = await createPeer(data.from, false);
    await pc.setRemoteDescription({ type: 'offer', sdp: data.sdp });
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await FB.sendSignal(roomCode, data.from, { type: 'answer', sdp: answer.sdp });
  }

  async function handleAnswer(data) {
    const pc = peers[data.from];
    if (pc && pc.signalingState !== 'stable') {
      await pc.setRemoteDescription({ type: 'answer', sdp: data.sdp });
    }
  }

  async function handleIce(data) {
    const pc = peers[data.from];
    if (pc && data.candidate) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (e) {}
    }
  }

  // ── Mute / Unmute ──────────────────────────────────────────
  function toggleMute() {
    if (!localStream) return false;
    muted = !muted;
    localStream.getAudioTracks().forEach((t) => (t.enabled = !muted));
    FB.updateMicStatus(roomCode, muted);
    return muted;
  }

  function isMuted() { return muted; }

  // ── Détection de parole ────────────────────────────────────
  function startSpeakingDetection() {
    if (!localStream) return;
    try {
      audioCtx = new AudioContext();
      const src     = audioCtx.createMediaStreamSource(localStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      const intervalId = setInterval(() => {
        analyser.getByteFrequencyData(buf);
        const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
        if (onSpeakingCb) onSpeakingCb(myUid, avg > 20);
      }, 150);
      analyserNodes[myUid] = { analyser, src, intervalId };
    } catch (e) {}
  }

  function watchRemoteSpeaking(uid, stream) {
    cleanupAnalyser(uid);
    try {
      if (!audioCtx) audioCtx = new AudioContext();
      const src     = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      const intervalId = setInterval(() => {
        analyser.getByteFrequencyData(buf);
        const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
        if (onSpeakingCb) onSpeakingCb(uid, avg > 15);
      }, 150);
      analyserNodes[uid] = { analyser, src, intervalId };
    } catch (e) {}
  }

  function cleanupAnalyser(uid) {
    const node = analyserNodes[uid];
    if (!node) return;
    clearInterval(node.intervalId);
    try { node.src.disconnect(); } catch (e) {}
    delete analyserNodes[uid];
  }

  function cleanupPeer(uid) {
    cleanupAnalyser(uid);
    const audio = audioEls[uid];
    if (audio) { audio.srcObject = null; delete audioEls[uid]; }
    if (peers[uid]) { peers[uid].close(); delete peers[uid]; }
  }

  function onSpeaking(cb) { onSpeakingCb = cb; }

  // Ajouter un pair en cours de route (nouveau joueur qui arrive)
  async function addPeer(uid) {
    if (!localStream || peers[uid]) return;
    // Respecter l'ordre lexicographique
    if (myUid < uid) await createPeer(uid, true);
  }

  // ── Arrêt complet ──────────────────────────────────────────
  function stop() {
    // Intervals de détection de parole
    Object.keys(analyserNodes).forEach(cleanupAnalyser);
    analyserNodes = {};

    // Connexions WebRTC et éléments audio
    Object.keys(peers).forEach(cleanupPeer);
    peers    = {};
    audioEls = {};

    // Flux micro local
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
      localStream = null;
    }

    // Contexte audio
    if (audioCtx) {
      audioCtx.close().catch(() => {});
      audioCtx = null;
    }

    // Listener Firebase
    if (signalRef) {
      signalRef.off();
      signalRef = null;
    }

    muted        = false;
    onSpeakingCb = null;
  }

  return { start, toggleMute, isMuted, onSpeaking, addPeer, stop };
})();
