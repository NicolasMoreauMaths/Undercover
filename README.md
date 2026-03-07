# 🕵️ Undercover — Jeu de déduction

Jeu de société numérique adapté pour des élèves de **11 à 15 ans**. Jouez sur un seul téléphone/tablette en vous passant l'appareil !

## 🎮 Comment jouer

1. Entrer les prénoms des joueurs (3 à 12)
2. Choisir les options (1 ou 2 Undercovers, activer Mr. White)
3. Chaque joueur voit son mot secrètement
4. Tour à tour, chaque joueur donne un indice en **1 à 3 mots**
5. Vote : qui est l'Undercover ?
6. La partie continue jusqu'à la victoire !

## 🏆 Victoire

| Équipe | Condition |
|--------|-----------|
| **Citoyens** | Éliminer tous les imposteurs |
| **Undercover** | Survivre jusqu'à être en égalité avec les citoyens |
| **Mr. White** | Être éliminé, puis deviner le mot des citoyens |

## 🚀 Déploiement sur GitHub Pages

1. **Forker** ou uploader ce dossier dans un dépôt GitHub
2. Aller dans **Settings → Pages**
3. Choisir la branche `main` et le dossier `/` (root)
4. Cliquer **Save**
5. Le jeu sera accessible à : `https://[ton-pseudo].github.io/[nom-du-repo]/`

> ✅ Aucune installation, aucun serveur, aucune dépendance — fonctionne directement dans le navigateur !

## 📁 Structure

```
undercover/
├── index.html        ← Page principale
├── css/
│   └── style.css     ← Tous les styles
├── js/
│   ├── words.js      ← Paires de mots (75 paires)
│   ├── game.js       ← Logique du jeu
│   ├── ui.js         ← Interface utilisateur
│   └── app.js        ← Contrôleur principal
└── README.md
```

## 🛠️ Personnalisation

### Ajouter des mots
Dans `js/words.js`, ajouter des paires au tableau `WORD_PAIRS` :
```js
["MonMot1", "MonMot2"],
```

### Changer les couleurs
Dans `css/style.css`, modifier les variables CSS au début du fichier :
```css
:root {
  --accent: #f0c040;       /* Couleur principale */
  --citizen: #4db8ff;      /* Couleur citoyens */
  --undercover: #ff5577;   /* Couleur undercover */
  ...
}
```

## ✅ Fonctionnalités

- 🎲 75 paires de mots adaptées 11-15 ans
- 👥 3 à 12 joueurs
- 🕵️ 1 ou 2 Undercovers
- ❓ Mode Mr. White
- 📱 Responsive mobile-first
- ♿ Accessible (ARIA, navigation clavier)
- 🚫 Aucune dépendance externe (sauf polices Google Fonts)
- 💾 Aucune donnée personnelle collectée

## 📝 Licence

Libre d'utilisation pour un usage éducatif.
