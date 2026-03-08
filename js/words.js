// ============================================================
// UNDERCOVER — Paires de mots (adapté aux enfants)
// ============================================================
const WORD_PAIRS = [

  // === ANIMAUX DE LA FERME ===
  ["Vache","Chèvre"],["Cochon","Sanglier"],["Poule","Canard"],
  ["Cheval","Âne"],["Mouton","Agneau"],["Lapin","Lièvre"],
  ["Chien","Loup"],["Chat","Renard"],["Oie","Dinde"],
  ["Âne","Mulet"],["Coq","Pintade"],

  // === ANIMAUX SAUVAGES ===
  ["Lion","Tigre"],["Éléphant","Rhinocéros"],["Girafe","Zèbre"],
  ["Singe","Gorille"],["Léopard","Guépard"],["Ours","Ours polaire"],
  ["Chameau","Dromadaire"],["Lama","Alpaga"],["Bison","Buffle"],
  ["Koala","Paresseux"],["Panda","Raton laveur"],["Hyène","Chacal"],
  ["Cerf","Chevreuil"],["Sanglier","Phacochère"],["Zèbre","Onagre"],

  // === ANIMAUX MARINS ===
  ["Dauphin","Orque"],["Requin","Raie"],["Baleine","Cachalot"],
  ["Pieuvre","Poulpe"],["Crabe","Homard"],["Otarie","Phoque"],
  ["Tortue de mer","Dugong"],["Méduse","Anémone de mer"],
  ["Hippocampe","Poisson-clown"],

  // === OISEAUX ===
  ["Aigle","Faucon"],["Hibou","Chouette"],["Pingouin","Manchot"],
  ["Flamant rose","Cigogne"],["Perroquet","Perruche"],["Paon","Faisan"],
  ["Pic-vert","Toucan"],["Autruche","Émeu"],["Pélican","Cormoran"],
  ["Moineau","Mésange"],

  // === INSECTES ===
  ["Papillon","Libellule"],["Abeille","Guêpe"],
  ["Coccinelle","Scarabée"],["Fourmi","Termite"],
  ["Grillon","Criquet"],["Luciole","Moustique"],

  // === ANIMAUX DE COMPAGNIE ===
  ["Lapin","Hamster"],["Cochon d'Inde","Gerbille"],
  ["Poisson rouge","Tortue"],["Perruche","Canari"],
  ["Hérisson","Chinchilla"],

  // === FRUITS ===
  ["Pomme","Poire"],["Fraise","Framboise"],["Pastèque","Melon"],
  ["Banane","Mangue"],["Raisin","Cerise"],["Ananas","Kiwi"],
  ["Citron","Orange"],["Myrtille","Cassis"],["Pêche","Abricot"],
  ["Prune","Mirabelle"],["Figue","Datte"],["Grenade","Litchi"],
  ["Clémentine","Mandarine"],["Noix de coco","Noix de cajou"],
  ["Mûre","Groseille"],

  // === LÉGUMES ===
  ["Carotte","Navet"],["Tomate","Poivron"],["Maïs","Blé"],
  ["Courgette","Concombre"],["Brocoli","Chou-fleur"],
  ["Petits pois","Haricots verts"],["Épinards","Salade"],
  ["Betterave","Radis"],["Citrouille","Courge"],["Oignon","Échalote"],

  // === SUCRERIES / DESSERTS ===
  ["Chocolat","Caramel"],["Glace","Sorbet"],
  ["Cookie","Madeleine"],["Gâteau","Tarte"],
  ["Muffin","Cupcake"],["Macaron","Éclair"],
  ["Bonbon","Sucette"],["Marshmallow","Guimauve"],
  ["Crêpe","Gaufre"],["Croissant","Pain au chocolat"],
  ["Beignet","Donut"],["Choux à la crème","Profiterole"],

  // === PLATS / NOURRITURE ===
  ["Pizza","Quiche"],["Burger","Sandwich"],
  ["Spaghetti","Macaroni"],["Pâtes","Riz"],
  ["Soupe","Bouillon"],["Pain","Baguette"],
  ["Croque-monsieur","Toast"],["Tartine","Brioche"],
  ["Sushi","Maki"],["Tacos","Burrito"],
  ["Omelette","Quiche"],["Salade","Coleslaw"],

  // === BOISSONS ===
  ["Limonade","Orangeade"],["Jus de pomme","Jus d'orange"],
  ["Lait","Lait chocolaté"],["Smoothie","Milkshake"],
  ["Thé glacé","Limonade"],["Sirop de menthe","Sirop de grenadine"],

  // === SPORTS ===
  ["Football","Rugby"],["Tennis","Badminton"],
  ["Basket","Handball"],["Volleyball","Beach-volley"],
  ["Natation","Plongée"],["Surf","Wakeboard"],
  ["Ski","Snowboard"],["Patinage","Roller"],
  ["Vélo","Trottinette"],["Judo","Karaté"],
  ["Tir à l'arc","Fléchettes"],["Golf","Cricket"],
  ["Danse","Gym"],["Escalade","Randonnée"],
  ["Ping-pong","Squash"],["Boxe","Lutte"],
  ["Équitation","Polo"],["Trampoline","Acrobatie"],

  // === JOUETS ===
  ["Lego","Kapla"],["Poupée","Peluche"],
  ["Yoyo","Toupie"],["Ballon","Frisbee"],
  ["Puzzle","Jeu de société"],["Billes","Osselets"],
  ["Voiture télécommandée","Drone"],["Marelle","Corde à sauter"],
  ["Playmobil","Figurine"],["Jeu de cartes","Jeu de dés"],
  ["Toboggan","Trampoline"],["Diabolo","Jonglage"],
  ["Château fort","Cabane"],["Cubes","Blocs"],

  // === MUSIQUE ===
  ["Guitare","Basse"],["Piano","Orgue"],
  ["Batterie","Percussions"],["Flûte","Clarinette"],
  ["Trompette","Trombone"],["Violon","Alto"],
  ["Concert","Festival"],["Microphone","Enceinte"],
  ["Casque","Écouteurs"],

  // === DIVERTISSEMENT ===
  ["Dessin animé","Manga"],["Cinéma","Théâtre"],
  ["Roman","BD"],["Livre","Album illustré"],
  ["Podcast","Émission de radio"],["Cirque","Spectacle de magie"],

  // === TECHNOLOGIE ===
  ["Smartphone","Tablette"],["Clavier","Manette"],
  ["Appareil photo","Caméra"],["Télévision","Projecteur"],
  ["Console","Ordinateur"],["Montre connectée","Bracelet connecté"],

  // === ÉCOLE ===
  ["Stylo","Crayon"],["Cahier","Classeur"],
  ["Règle","Compas"],["Cartable","Sac à dos"],
  ["Trousse","Plumier"],["Colle","Scotch"],
  ["Bibliothèque","Librairie"],["Professeur","Directeur"],
  ["Tableau","Écran"],["Gomme","Taille-crayon"],
  ["Livre","Manuel"],["Calculatrice","Abaque"],
  ["Maternelle","École primaire"],["Récré","Pause déjeuner"],

  // === VÊTEMENTS ===
  ["T-shirt","Polo"],["Robe","Jupe"],
  ["Pull","Sweat"],["Manteau","Veste"],
  ["Baskets","Sandales"],["Gants","Mitaines"],
  ["Pyjama","Grenouillère"],["Salopette","Combinaison"],
  ["Chapeau","Bob"],["Jean","Pantalon"],
  ["Écharpe","Foulard"],["Casquette","Bonnet"],
  ["Montre","Bracelet"],["Lunettes","Loupe"],
  ["Maillot de bain","Combinaison de plongée"],

  // === PERSONNAGES CÉLÈBRES (enfants) ===
  ["Superman","Batman"],["Spiderman","Ironman"],
  ["Elsa","Anna"],["Simba","Bambi"],
  ["Astérix","Obélix"],["Tintin","Milou"],
  ["Mickey","Donald"],["Minnie","Daisy"],
  ["Nemo","Dory"],["Shrek","L'Âne"],
  ["Harry Potter","Hermione"],["Cendrillon","La Belle au bois dormant"],
  ["Pinocchio","Gepetto"],["Blanche-Neige","Raiponce"],
  ["Buzz l'Éclair","Woody"],["Bob l'éponge","Patrick"],

  // === CRÉATURES FANTASTIQUES ===
  ["Dragon","Dinosaure"],["Licorne","Pégase"],
  ["Fantôme","Vampire"],["Sorcier","Magicien"],
  ["Géant","Ogre"],["Fée","Elfe"],
  ["Pirate","Viking"],["Robot","Androïde"],
  ["Chevalier","Guerrier"],["Sirène","Naïade"],

  // === NATURE / PAYSAGES ===
  ["Forêt","Jungle"],["Montagne","Volcan"],
  ["Plage","Désert"],["Rivière","Fleuve"],
  ["Lac","Étang"],["Mer","Océan"],
  ["Île","Presqu'île"],["Grotte","Tunnel"],
  ["Prairie","Savane"],["Marais","Tourbière"],
  ["Falaise","Dune"],["Glacier","Banquise"],

  // === MÉTÉO / CIEL ===
  ["Soleil","Lune"],["Arc-en-ciel","Aurore boréale"],
  ["Pluie","Bruine"],["Neige","Grêle"],
  ["Orage","Tempête"],["Nuage","Brouillard"],
  ["Printemps","Été"],["Automne","Hiver"],
  ["Étoile","Planète"],["Comète","Météorite"],
  ["Tornade","Cyclone"],["Arc-en-ciel","Halo solaire"],

  // === PLANTES / FLEURS ===
  ["Rose","Tulipe"],["Tournesol","Marguerite"],
  ["Lavande","Muguet"],["Orchidée","Violette"],
  ["Chêne","Sapin"],["Bambou","Palmier"],
  ["Cactus","Aloé vera"],["Champignon","Mousse"],
  ["Fougère","Lierre"],["Nénuphar","Iris"],

  // === TRANSPORT ===
  ["Avion","Hélicoptère"],["Train","Métro"],
  ["Bateau","Yacht"],["Bus","Car"],
  ["Moto","Scooter"],["Tracteur","Pelleteuse"],
  ["Fusée","Navette spatiale"],["Sous-marin","Bathyscaphe"],
  ["Montgolfière","Planeur"],["Ambulance","Camion de pompiers"],
  ["Téléphérique","Funiculaire"],["Chariot","Charrette"],
  ["Voiture de course","Karting"],["Quad","Buggy"],

  // === LIEUX ===
  ["Parc","Jardin"],["Zoo","Aquarium"],
  ["Château","Manoir"],["Supermarché","Marché"],
  ["École","Collège"],["Maison","Appartement"],
  ["Ferme","Ranch"],["Manège","Fête foraine"],
  ["Stade","Arena"],["Musée","Galerie d'art"],
  ["Piscine","Lac de baignade"],["Terrain de jeux","Skatepark"],
  ["Phare","Tour de guet"],["Igloo","Tipi"],

  // === MAISON / INTÉRIEUR ===
  ["Canapé","Fauteuil"],["Lampe","Bougie"],
  ["Couverture","Plaid"],["Oreiller","Coussin"],
  ["Frigo","Congélateur"],["Four","Micro-ondes"],
  ["Table","Bureau"],["Chaise","Tabouret"],
  ["Armoire","Commode"],["Miroir","Tableau"],
  ["Parapluie","Imperméable"],["Bouteille","Gourde"],
  ["Valise","Sac de voyage"],["Carte","GPS"],

  // === FÊTES ===
  ["Noël","Saint-Nicolas"],["Anniversaire","Fête"],
  ["Halloween","Carnaval"],["Cadeau","Surprise"],
  ["Confettis","Serpentins"],["Feu d'artifice","Feu de camp"],
  ["Déguisement","Costume"],["Bougie d'anniversaire","Cierge"],
  ["Pâques","Épiphanie"],["Bonnet de Père Noël","Couronne des rois"],
];

function getRandomWordPair(){return WORD_PAIRS[Math.floor(Math.random()*WORD_PAIRS.length)];}
function shuffleArray(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
