# 🕵️ Undercover V2

Deux modes de jeu : **Hors-ligne** (un seul téléphone) et **En ligne** (chacun son téléphone, tchat + vocal).

---

## 📴 Mode Hors-ligne

- Un seul téléphone qu'on se passe
- Chaque joueur voit son mot secrètement
- Les indices se disent **à voix haute**
- On vote sur le téléphone

**Aucune configuration nécessaire** — fonctionne immédiatement.

---

## 🌐 Mode En ligne

Chaque joueur utilise son propre téléphone/PC. Vous pouvez jouer dans la même pièce ou à distance !

**Fonctionnalités :**
- Salle privée avec code à 4 lettres
- Chaque joueur voit son mot sur son propre écran
- Indices écrits visibles par tous
- 💬 Tchat écrit intégré
- 🎙️ Tchat vocal (WebRTC, peer-to-peer)
- Votes en temps réel avec barre de progression

### Configuration Firebase (obligatoire pour le mode en ligne)

Le mode en ligne nécessite Firebase (gratuit). Voici comment configurer :

**Étape 1 — Créer un projet Firebase**
1. Va sur [console.firebase.google.com](https://console.firebase.google.com)
2. Clique **"Ajouter un projet"** → Choisis un nom → Continue

**Étape 2 — Activer la Realtime Database**
1. Dans le menu gauche : **Build → Realtime Database**
2. Clique **"Créer une base de données"**
3. Choisis la région **Europe-West** (ou celle qui te convient)
4. Sélectionne **"Démarrer en mode test"** → Activer

**Étape 3 — Activer l'authentification anonyme**
1. Dans le menu gauche : **Build → Authentication**
2. Onglet **"Sign-in method"**
3. Clique **"Ajouter un fournisseur"** → **Anonyme** → Activer

**Étape 4 — Récupérer les clés**
1. Clique sur la roue ⚙️ en haut à gauche → **Paramètres du projet**
2. Dans l'onglet **"General"**, descends jusqu'à **"Tes applications"**
3. Clique ➕ **"Ajouter une application"** → icône Web `</>`
4. Donne un nom, puis copie l'objet `firebaseConfig`

**Étape 5 — Option A : Modifier le fichier config**

Ouvre `js/online/config.js` et remplace les valeurs :

```javascript
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSy...",
  authDomain:        "mon-projet.firebaseapp.com",
  databaseURL:       "https://mon-projet-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:         "mon-projet",
  storageBucket:     "mon-projet.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc123",
};
```

**Étape 5 — Option B : Utiliser le formulaire dans le jeu**

Si tu n'as pas accès aux fichiers, ouvre le jeu → mode En ligne → remplis le formulaire de configuration → clique Sauvegarder.

**Étape 6 — Règles de sécurité (recommandé)**

Dans Firebase Console → Realtime Database → Règles, mets :

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

---

## 🚀 Déploiement GitHub Pages

1. Upload tous les fichiers dans ton dépôt GitHub **en respectant la structure**
2. **Settings → Pages → Source → "Deploy from a branch" → main**
3. C'est tout !

### Structure des fichiers à respecter

```
/ (racine du dépôt)
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── words.js
│   ├── main.js
│   ├── offline/
│   │   ├── game.js
│   │   ├── ui.js
│   │   └── app.js
│   └── online/
│       ├── config.js   ← Mettre tes clés Firebase ici
│       ├── firebase.js
│       ├── voice.js
│       └── app.js
└── README.md
```

⚠️ **Important** : ne pas mettre tous les fichiers à la racine comme la première fois !

---

## 🛠️ Ajouter des mots

Dans `js/words.js`, ajoute des paires :
```javascript
["MonMot1", "MonMot2"],
```

---

## ✅ Fonctionnalités

- 📴 Mode hors-ligne (un seul téléphone)
- 🌐 Mode en ligne (chacun son téléphone)
- 💬 Tchat écrit en temps réel
- 🎙️ Tchat vocal WebRTC (peer-to-peer, sans serveur supplémentaire)
- 🎲 75 paires de mots adaptées 11-15 ans
- 👥 3 à 12 joueurs
- 🕵️ 1 ou 2 Undercovers + Mr. White optionnel
- 📱 Responsive mobile-first
- 🔒 Salles privées avec code à 4 lettres
- ⏱️ Nettoyage automatique des salles après 4h

