// ============================================================
// UNDERCOVER V2 — Point d'entrée
// ============================================================
const AppState = { playerNames: [] };

document.addEventListener('DOMContentLoaded', () => {
  // Charger config Firebase depuis localStorage si présente
  const saved = localStorage.getItem('undercover_fb_config');
  if (saved) {
    try {
      const cfg = JSON.parse(saved);
      if (cfg.apiKey && cfg.apiKey !== 'VOTRE_API_KEY') {
        Object.assign(FIREBASE_CONFIG, cfg);
      }
    } catch(e) {}
  }

  // Boutons de sélection de mode
  document.getElementById('btn-mode-offline').addEventListener('click', () => {
    document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active-offline','active-online'));
    document.getElementById('btn-mode-offline').classList.add('active-offline');
    hide('section-online');
    show('section-offline');
    OfflineApp.init();
    OfflineUI.renderSetup();
  });

  document.getElementById('btn-mode-online').addEventListener('click', () => {
    document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active-offline','active-online'));
    document.getElementById('btn-mode-online').classList.add('active-online');
    hide('section-offline');
    show('section-online');
    OnlineApp.init();
  });

  function show(id) { document.getElementById(id)?.classList.remove('hidden'); }
  function hide(id) { document.getElementById(id)?.classList.add('hidden'); }
});
