// Paires de mots pour le jeu Undercover
// Adaptées pour des élèves de 11 à 15 ans
// Format: [mot des citoyens, mot de l'undercover]

const WORD_PAIRS = [
  ["Lion", "Tigre"],
  ["Dauphin", "Requin"],
  ["Chien", "Loup"],
  ["Papillon", "Libellule"],
  ["Rose", "Tulipe"],
  ["Forêt", "Jungle"],
  ["Montagne", "Volcan"],
  ["Plage", "Désert"],
  ["Rivière", "Fleuve"],
  ["Arc-en-ciel", "Aurore boréale"],
  ["Chêne", "Sapin"],
  ["Aigle", "Faucon"],
  ["Renard", "Loup"],
  ["Soleil", "Lune"],
  ["Pizza", "Quiche"],
  ["Chocolat", "Caramel"],
  ["Glace", "Sorbet"],
  ["Croissant", "Pain au chocolat"],
  ["Fraise", "Framboise"],
  ["Limonade", "Orangeade"],
  ["Baguette", "Ciabatta"],
  ["Crêpe", "Gaufre"],
  ["Sushi", "Maki"],
  ["Burger", "Sandwich"],
  ["Pastèque", "Melon"],
  ["Football", "Rugby"],
  ["Tennis", "Badminton"],
  ["Natation", "Plongée"],
  ["Vélo", "Trottinette"],
  ["Ski", "Snowboard"],
  ["Basket", "Handball"],
  ["Danse", "Gym"],
  ["Escalade", "Randonnée"],
  ["Surf", "Wakeboard"],
  ["Smartphone", "Tablette"],
  ["Casque", "Écouteurs"],
  ["Clavier", "Manette"],
  ["Dessin animé", "Manga"],
  ["Cinéma", "Théâtre"],
  ["Roman", "BD"],
  ["Mathématiques", "Physique"],
  ["Bibliothèque", "Librairie"],
  ["Stylo", "Crayon"],
  ["Tableau", "Écran"],
  ["Professeur", "Directeur"],
  ["Canapé", "Fauteuil"],
  ["Lampe", "Bougie"],
  ["Écharpe", "Foulard"],
  ["Casquette", "Bonnet"],
  ["Montre", "Bracelet"],
  ["Avion", "Hélicoptère"],
  ["Train", "Métro"],
  ["Bateau", "Yacht"],
  ["Château", "Manoir"],
  ["Valise", "Sac de voyage"],
  ["Guitare", "Basse"],
  ["Piano", "Orgue"],
  ["Batterie", "Percussions"],
  ["Flûte", "Clarinette"],
  ["Concert", "Festival"],
  ["Microphone", "Enceinte"],
  ["Dragon", "Dinosaure"],
  ["Fantôme", "Vampire"],
  ["Sorcier", "Magicien"],
  ["Pirate", "Viking"],
  ["Robot", "Androïde"],
  ["Étoile", "Planète"],
  ["Parapluie", "Imperméable"],
  ["Lunettes", "Loupe"],
  ["Bouteille", "Gourde"],
  ["Couverture", "Plaid"],
  ["Oreiller", "Coussin"],
  ["Pomme", "Poire"],
  ["Citron", "Pamplemousse"],
  ["Carte", "GPS"],
  ["Cahier", "Classeur"],
  ["Règle", "Équerre"],
];

function getRandomWordPair() {
  const index = Math.floor(Math.random() * WORD_PAIRS.length);
  return WORD_PAIRS[index];
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
