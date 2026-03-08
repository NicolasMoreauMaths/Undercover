// ============================================================
// UNDERCOVER — Logique mode HORS-LIGNE
// ============================================================
const OfflineGame = (() => {
  let state = {
    phase:'setup', players:[], wordPair:[], round:1,
    votes:{}, eliminatedThisRound:null, winners:null,
    settings:{hasMrWhite:false,undercoverCount:1},
    revealIndex:0, revealQueue:[],
  };

  function setupGame(names, options={}) {
    const n = names.length;
    if(n<3) return {error:'Il faut au moins 3 joueurs.'};
    if(n>12) return {error:'Maximum 12 joueurs.'};
    state.settings.hasMrWhite = options.hasMrWhite || false;
    const rawUC = typeof options.undercoverCount === 'number' ? options.undercoverCount : 1;
    state.settings.undercoverCount = Math.min(rawUC, Math.floor((n-1)/2));
    const specialCount = state.settings.undercoverCount + (state.settings.hasMrWhite ? 1 : 0);
    if(specialCount === 0) return {error:'Active au moins un rôle spécial (Undercover ou Mr. White) !'};
    if(specialCount >= n-1) return {error:'Trop de rôles spéciaux pour ce nombre de joueurs.'};

    state.wordPair = getRandomWordPair();
    const roles = assignRoles(n);
    const shuffled = shuffleArray([...names]);
    state.players = shuffled.map((name,i)=>({
      id:i, name, role:roles[i],
      word: roles[i]==='citizen'?state.wordPair[0]: roles[i]==='undercover'?state.wordPair[1]:null,
      alive:true, votedBy:[],
    }));
    state.phase='reveal'; state.round=1; state.votes={};
    state.revealQueue=state.players.map(p=>p.id); state.revealIndex=0;
    state.winners=null; state.eliminatedThisRound=null;
    return {success:true};
  }

  function assignRoles(n) {
    const roles=Array(n).fill('citizen');
    const idx=shuffleArray([...Array(n).keys()]);
    for(let i=0;i<state.settings.undercoverCount;i++) roles[idx[i]]='undercover';
    if(state.settings.hasMrWhite) roles[idx[state.settings.undercoverCount]]='mrwhite';
    return roles;
  }

  function getCurrentRevealPlayer() {
    if(state.revealIndex>=state.revealQueue.length) return null;
    return state.players.find(p=>p.id===state.revealQueue[state.revealIndex]);
  }
  function nextReveal() {
    state.revealIndex++;
    if(state.revealIndex>=state.revealQueue.length){state.phase='vote';state.votes={};return{done:true};}
    return{done:false};
  }
  function submitVote(voterId, targetId) {
    if(state.votes[voterId]!==undefined) return{error:'Déjà voté.'};
    const voter=state.players.find(p=>p.id===voterId);
    const target=state.players.find(p=>p.id===targetId);
    if(!voter||!voter.alive) return{error:'Votant invalide.'};
    if(!target||!target.alive) return{error:'Cible invalide.'};
    if(voterId===targetId) return{error:'Tu ne peux pas voter contre toi-même.'};
    state.votes[voterId]=targetId;
    const alive=state.players.filter(p=>p.alive);
    if(Object.keys(state.votes).length>=alive.length) return resolveVote();
    return{success:true};
  }
  function resolveVote() {
    const counts={};
    state.players.filter(p=>p.alive).forEach(p=>{counts[p.id]=0;});
    Object.values(state.votes).forEach(t=>{if(counts[t]!==undefined)counts[t]++;});
    const maxV=Math.max(...Object.values(counts));
    const tied=Object.keys(counts).filter(id=>counts[id]===maxV);
    if(tied.length>1){state.phase='result';state.eliminatedThisRound=null;return{tie:true};}
    const elim=state.players.find(p=>p.id===parseInt(tied[0]));
    elim.alive=false; state.eliminatedThisRound=elim;
    if(elim.role==='mrwhite'){state.phase='mrwhite_guess';return{mrWhiteEliminated:true,player:elim};}
    state.phase='result';
    return{eliminated:elim, ...checkWin()};
  }
  function mrWhiteGuess(guess) {
    const correct=guess.trim().toLowerCase()===state.wordPair[0].toLowerCase();
    if(correct){state.winners='mrwhite';state.phase='gameover';return{correct:true,winners:'mrwhite'};}
    const w=checkWin(); state.phase=w.gameOver?'gameover':'result';
    return{correct:false,...w};
  }
  function checkWin() {
    const alive=state.players.filter(p=>p.alive);
    const specials=alive.filter(p=>p.role!=='citizen');
    const citizens=alive.filter(p=>p.role==='citizen');
    if(specials.length===0){state.winners='citizens';state.phase='gameover';return{gameOver:true,winners:'citizens'};}
    if(specials.length>=citizens.length){state.winners='undercover';state.phase='gameover';return{gameOver:true,winners:'undercover'};}
    return{gameOver:false};
  }
  function nextRound(){state.round++;state.phase='vote';state.votes={};}
  function reset(){state={phase:'setup',players:[],wordPair:[],round:1,votes:{},eliminatedThisRound:null,winners:null,settings:{hasMrWhite:false,undercoverCount:1},revealIndex:0,revealQueue:[]};}
  function getState(){return state;}
  function getAlivePlayers(){return state.players.filter(p=>p.alive);}
  function getPlayer(id){return state.players.find(p=>p.id===id);}
  function getVoteCounts(){const c={};state.players.filter(p=>p.alive).forEach(p=>{c[p.id]=0;});Object.values(state.votes).forEach(t=>{if(c[t]!==undefined)c[t]++;});return c;}
  function hasVoted(id){return state.votes[id]!==undefined;}
  return{setupGame,getCurrentRevealPlayer,nextReveal,submitVote,mrWhiteGuess,nextRound,reset,getState,getAlivePlayers,getPlayer,getVoteCounts,hasVoted};
})();
