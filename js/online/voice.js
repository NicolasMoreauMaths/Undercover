// ============================================================
// UNDERCOVER — Tchat Vocal (WebRTC mesh)
// ============================================================
const Voice = (() => {
  let localStream = null;
  let peers = {}; // uid -> RTCPeerConnection
  let muted = false;
  let roomCode = null;
  let myUid = null;
  let onSpeakingCb = null;
  let audioCtx = null;
  let analyserNodes = {};

  const RTC_CONFIG = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  };

  async function start(code, uid, otherUids) {
    roomCode = code; myUid = uid;
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      muted = false;
      // Connecter à chaque pair existant
      for (const oid of otherUids) {
        if (oid !== uid) await createPeer(oid, true);
      }
      // Écouter les signaux entrants
      FB.onSignal(code, async (data) => {
        if (data.type === 'offer')       await handleOffer(data);
        else if (data.type === 'answer') await handleAnswer(data);
        else if (data.type === 'ice')    await handleIce(data);
      });
      startSpeakingDetection();
      return true;
    } catch(e) {
      console.warn('Voice error:', e);
      return false;
    }
  }

  async function createPeer(targetUid, isInitiator) {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    peers[targetUid] = pc;
    localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
    pc.ontrack = (e) => {
      const audio = new Audio();
      audio.srcObject = e.streams[0];
      audio.autoplay = true;
      // Détection parole distante
      watchRemoteSpeaking(targetUid, e.streams[0]);
    };
    pc.onicecandidate = async (e) => {
      if (e.candidate) await FB.sendSignal(roomCode, targetUid, { type: 'ice', candidate: e.candidate.toJSON() });
    };
    pc.onconnectionstatechange = () => {
      if (['failed','disconnected','closed'].includes(pc.connectionState)) {
        pc.close(); delete peers[targetUid];
      }
    };
    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await FB.sendSignal(roomCode, targetUid, { type: 'offer', sdp: offer.sdp });
    }
    return pc;
  }

  async function handleOffer(data) {
    let pc = peers[data.from];
    if (!pc) pc = await createPeer(data.from, false);
    await pc.setRemoteDescription({ type: 'offer', sdp: data.sdp });
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await FB.sendSignal(roomCode, data.from, { type: 'answer', sdp: answer.sdp });
  }

  async function handleAnswer(data) {
    const pc = peers[data.from];
    if (pc) await pc.setRemoteDescription({ type: 'answer', sdp: data.sdp });
  }

  async function handleIce(data) {
    const pc = peers[data.from];
    if (pc && data.candidate) {
      try { await pc.addIceCandidate(data.candidate); } catch(e) {}
    }
  }

  function toggleMute() {
    if (!localStream) return false;
    muted = !muted;
    localStream.getAudioTracks().forEach(t => t.enabled = !muted);
    FB.updateMicStatus(roomCode, muted);
    return muted;
  }

  function isMuted() { return muted; }

  function startSpeakingDetection() {
    if (!localStream) return;
    try {
      audioCtx = new AudioContext();
      const src = audioCtx.createMediaStreamSource(localStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      setInterval(() => {
        analyser.getByteFrequencyData(buf);
        const avg = buf.reduce((a,b)=>a+b,0)/buf.length;
        if (onSpeakingCb) onSpeakingCb(myUid, avg > 20);
      }, 150);
    } catch(e) {}
  }

  function watchRemoteSpeaking(uid, stream) {
    try {
      if (!audioCtx) audioCtx = new AudioContext();
      const src = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      setInterval(() => {
        analyser.getByteFrequencyData(buf);
        const avg = buf.reduce((a,b)=>a+b,0)/buf.length;
        if (onSpeakingCb) onSpeakingCb(uid, avg > 15);
      }, 150);
    } catch(e) {}
  }

  function onSpeaking(cb) { onSpeakingCb = cb; }

  async function addPeer(uid) {
    if (!localStream || peers[uid]) return;
    await createPeer(uid, false);
  }

  function stop() {
    Object.values(peers).forEach(pc => pc.close());
    peers = {};
    if (localStream) { localStream.getTracks().forEach(t => t.stop()); localStream = null; }
    if (audioCtx) { audioCtx.close(); audioCtx = null; }
  }

  return { start, toggleMute, isMuted, onSpeaking, addPeer, stop };
})();
