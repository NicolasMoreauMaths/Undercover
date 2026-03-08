// ============================================================
// UNDERCOVER — UI mode HORS-LIGNE
// ============================================================
const OfflineUI = (() => {
  function esc(s){if(!s)return'';return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function show(id){document.getElementById(id)?.classList.remove('hidden');}
  function hide(id){document.getElementById(id)?.classList.add('hidden');}
  function txt(id,t){const e=document.getElementById(id);if(e)e.textContent=t;}
  function html(id,h){const e=document.getElementById(id);if(e)e.innerHTML=h;}
  function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.classList.add('hidden'));show(id);window.scrollTo({top:0,behavior:'smooth'});}

  function renderSetup(){
    showScreen('screen-setup');
    renderPlayerList();
    updateStartBtn();
  }
  function renderPlayerList(){
    const c=document.getElementById('player-list'); if(!c)return;
    c.innerHTML=AppState.playerNames.map((n,i)=>`
      <div class="player-tag">
        <span class="player-tag-name">${esc(n)}</span>
        <button class="player-tag-remove" onclick="OfflineApp.removePlayer(${i})" aria-label="Supprimer">✕</button>
      </div>`).join('');
  }
  function updateStartBtn(){
    const b=document.getElementById('btn-start');
    const n=AppState.playerNames.length;
    if(!b)return;
    b.disabled=n<3;
    b.textContent=n<3?`Ajouter encore ${3-n} joueur(s)`:'Commencer la partie !';
  }

  function renderReveal(player, isLast){
    showScreen('screen-reveal');
    txt('reveal-player-name',player.name);
    txt('reveal-instruction',`Passe le téléphone à ${player.name} et clique quand tu es prêt(e).`);
    hide('reveal-word-container'); show('reveal-btn-show'); hide('reveal-btn-next');
    document.getElementById('reveal-btn-show').onclick=()=>{
      const w=document.getElementById('reveal-word');
      const r=document.getElementById('reveal-role');
      if(player.role==='mrwhite'){w.textContent='❓ Aucun mot !';r.textContent='Tu es Mr. White — bluff et devine !';r.className='reveal-role-badge mrwhite';}
      else if(player.role==='undercover'){w.textContent=player.word;r.textContent='🕵️ Tu es l\'Undercover — cache-toi !';r.className='reveal-role-badge undercover';}
      else{w.textContent=player.word;r.textContent='👤 Tu es Citoyen(ne) — trouve l\'imposteur !';r.className='reveal-role-badge citizen';}
      show('reveal-word-container');hide('reveal-btn-show');show('reveal-btn-next');
      document.getElementById('reveal-word-container').classList.add('animate-pop');
    };
    const nb=document.getElementById('reveal-btn-next');
    nb.textContent=isLast?'🗳️ Passer au vote !':'Joueur suivant ➜';
    nb.onclick=()=>{hide('reveal-word-container');OfflineApp.nextReveal();};
  }

  function renderVote(){
    showScreen('screen-vote');
    const state=OfflineGame.getState();
    const alive=OfflineGame.getAlivePlayers();
    const notVoted=alive.filter(p=>!OfflineGame.hasVoted(p.id));
    const voter=notVoted[0];
    if(!voter)return;
    txt('vote-title',`Vote — Manche ${state.round}`);
    txt('vote-player-name',`${voter.name}, vote !`);
    txt('vote-subtitle','Qui penses-tu être l\'Undercover (ou Mr. White) ?');
    const c=document.getElementById('vote-targets'); c.innerHTML='';
    alive.filter(p=>p.id!==voter.id).forEach(p=>{
      const b=document.createElement('button');
      b.className='vote-target-btn'; b.textContent=p.name;
      b.onclick=()=>OfflineApp.submitVote(voter.id,p.id);
      c.appendChild(b);
    });
    const done=Object.keys(state.votes).length;
    txt('vote-progress',`${done} / ${alive.length} votes`);
  }

  function renderVoteResult(data){
    showScreen('screen-vote-result');
    if(data.tie){
      txt('result-title','⚖️ Égalité !');
      txt('result-body','Personne n\'est éliminé cette manche. La partie continue !');
      html('result-eliminated','');
    } else if(data.mrWhiteEliminated){
      txt('result-title',`${data.player.name} est éliminé(e) !`);
      txt('result-body','C\'était Mr. White ❓ — Il peut tenter de deviner !');
      html('result-eliminated',renderVoteCountsHTML());
    } else if(data.eliminated){
      const p=data.eliminated;
      const lbl=p.role==='undercover'?'🕵️ L\'Undercover !':p.role==='mrwhite'?'❓ Mr. White !':'👤 Un(e) citoyen(ne)...';
      txt('result-title',`${p.name} est éliminé(e) !`);
      txt('result-body',`C'était : ${lbl}`);
      html('result-eliminated',renderVoteCountsHTML());
    }
    document.getElementById('btn-continue-result').onclick=()=>{
      if(data.gameOver) renderGameOver();
      else if(data.mrWhiteEliminated) renderMrWhiteGuess(data.player);
      else OfflineApp.nextRound();
    };
  }

  function renderVoteCountsHTML(){
    const counts=OfflineGame.getVoteCounts();
    const entries=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
    return '<div class="vote-counts">'+entries.map(([id,count])=>{
      const p=OfflineGame.getPlayer(parseInt(id));
      return`<div class="vote-count-row"><span>${esc(p.name)}</span><span>${count} vote(s)</span></div>`;
    }).join('')+'</div>';
  }

  function renderMrWhiteGuess(player){
    showScreen('screen-mrwhite-guess');
    txt('mrwhite-name',player.name);
    const inp=document.getElementById('mrwhite-guess-input');
    inp.value=''; inp.focus();
    document.getElementById('btn-mrwhite-guess').onclick=()=>{
      const g=inp.value.trim();
      if(!g){showToast('Écris ta réponse !','warning');return;}
      OfflineApp.mrWhiteGuess(g);
    };
    inp.onkeydown=e=>{if(e.key==='Enter')document.getElementById('btn-mrwhite-guess').click();};
  }

  function renderMrWhiteGuessResult(correct){
    showScreen('screen-vote-result');
    if(correct){txt('result-title','🎉 Incroyable !');txt('result-body','Mr. White a deviné le mot des citoyens — Il gagne !');}
    else{txt('result-title','❌ Raté !');txt('result-body','Mr. White n\'a pas trouvé le bon mot. La partie continue !');}
    html('result-eliminated','');
    document.getElementById('btn-continue-result').onclick=()=>{
      const s=OfflineGame.getState();
      if(s.phase==='gameover') renderGameOver();
      else OfflineApp.nextRound();
    };
  }

  function renderGameOver(){
    showScreen('screen-gameover');
    const s=OfflineGame.getState();
    const msgs={citizens:{emoji:'🎉',title:'Les Citoyens gagnent !',sub:'L\'Undercover a été démasqué. Bravo !'},undercover:{emoji:'🕵️',title:'L\'Undercover gagne !',sub:'Il a semé la confusion jusqu\'au bout !'},mrwhite:{emoji:'❓',title:'Mr. White gagne !',sub:'Il a deviné le mot secret des citoyens !'}};
    const m=msgs[s.winners]||{emoji:'🎮',title:'Fin de partie',sub:''};
    txt('gameover-emoji',m.emoji); txt('gameover-title',m.title); txt('gameover-sub',m.sub);
    const [cw,uw]=s.wordPair;
    html('gameover-words',`<div class="word-reveal-box"><span class="word-citizen">👤 Citoyens : <strong>${esc(cw)}</strong></span><span class="word-undercover">🕵️ Undercover : <strong>${esc(uw)}</strong></span></div>`);
    html('gameover-roles',s.players.map(p=>{
      const rl=p.role==='undercover'?'🕵️ Undercover':p.role==='mrwhite'?'❓ Mr. White':'👤 Citoyen(ne)';
      return`<div class="final-player-card ${p.role} ${p.alive?'':'eliminated'}">
        <div class="final-player-name">${esc(p.name)}</div>
        <div class="final-player-role">${rl}</div>
        <div class="final-player-word">${p.word?`"${esc(p.word)}"`:'Pas de mot'}</div>
        <div class="final-player-status">${p.alive?'✅ Survivant(e)':'❌ Éliminé(e)'}</div>
      </div>`;
    }).join(''));
  }

  function showToast(msg,type='info'){
    const t=document.getElementById('toast');if(!t)return;
    t.textContent=msg;t.className=`toast toast-${type} show`;
    setTimeout(()=>t.classList.remove('show'),3000);
  }
  return{renderSetup,renderPlayerList,updateStartBtn,renderReveal,renderVote,renderVoteResult,renderMrWhiteGuess,renderMrWhiteGuessResult,renderGameOver,showToast,showScreen};
})();
