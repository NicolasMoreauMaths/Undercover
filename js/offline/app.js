// ============================================================
// UNDERCOVER — Contrôleur HORS-LIGNE
// ============================================================
const OfflineApp = (() => {
  function init(){
    document.getElementById('btn-add-player').addEventListener('click', addPlayer);
    document.getElementById('input-player-name').addEventListener('keydown', e=>{if(e.key==='Enter')addPlayer();});
    document.getElementById('btn-start').addEventListener('click', startGame);
  }
  function addPlayer(){
    const inp=document.getElementById('input-player-name');
    const name=inp.value.trim();
    if(!name){OfflineUI.showToast('Écris un prénom !','warning');return;}
    if(name.length>20){OfflineUI.showToast('Prénom trop long (max 20 car.).','warning');return;}
    if(AppState.playerNames.length>=12){OfflineUI.showToast('Maximum 12 joueurs !','warning');return;}
    if(AppState.playerNames.map(n=>n.toLowerCase()).includes(name.toLowerCase())){OfflineUI.showToast('Ce prénom existe déjà !','warning');return;}
    AppState.playerNames.push(name); inp.value=''; inp.focus();
    OfflineUI.renderPlayerList(); OfflineUI.updateStartBtn();
  }
  function removePlayer(i){AppState.playerNames.splice(i,1);OfflineUI.renderPlayerList();OfflineUI.updateStartBtn();}
  function startGame(){
    const hasMrWhite=document.getElementById('toggle-mrwhite').checked;
    const undercoverCount=parseInt(document.getElementById('undercover-count').value)||1;
    const r=OfflineGame.setupGame(AppState.playerNames,{hasMrWhite,undercoverCount});
    if(r.error){OfflineUI.showToast(r.error,'error');return;}
    showReveal();
  }
  function showReveal(){
    const s=OfflineGame.getState();
    const player=OfflineGame.getCurrentRevealPlayer();
    if(!player){OfflineUI.renderVote();return;}
    const isLast=s.revealIndex===s.revealQueue.length-1;
    OfflineUI.renderReveal(player,isLast);
  }
  function nextReveal(){
    const r=OfflineGame.nextReveal();
    if(r.done)OfflineUI.renderVote();
    else showReveal();
  }
  function submitVote(voterId,targetId){
    const r=OfflineGame.submitVote(voterId,targetId);
    if(r.error){OfflineUI.showToast(r.error,'warning');return;}
    const s=OfflineGame.getState();
    if(['result','gameover','mrwhite_guess'].includes(s.phase)) OfflineUI.renderVoteResult(r);
    else OfflineUI.renderVote();
  }
  function mrWhiteGuess(g){
    const r=OfflineGame.mrWhiteGuess(g);
    OfflineUI.renderMrWhiteGuessResult(r.correct);
  }
  function nextRound(){OfflineGame.nextRound();OfflineUI.renderVote();}
  function restartGame(){OfflineGame.reset();AppState.playerNames=[];OfflineUI.renderSetup();}
  function replayGame(){const names=[...AppState.playerNames];OfflineGame.reset();AppState.playerNames=names;OfflineUI.renderSetup();}
  return{init,addPlayer,removePlayer,startGame,nextReveal,submitVote,mrWhiteGuess,nextRound,restartGame,replayGame};
})();
