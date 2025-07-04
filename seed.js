require("dotenv").config();
const mongoose = require("mongoose");
const Game = require("./models/jeux");
const Reservation = require("./models/reservation");
const User = require("./models/user");

const seedGames = [
  {
    name: "Codenames",
    players: "4-8",
    duration: "15-30 minutes",
    description:
      "Give one-word clues to your teammates to help them guess the secret identities of your agents, but be careful not to lead them astray!",
    imagePath: "assets/images/base.png",
    age: "14+",
    tags: ["word", "party"],
    rules: "https://czechgames.com/files/rules/codenames-rules-en.pdf",
  },
  {
    name: "Monopoly",
    players: "2-8",
    duration: "60-180 minutes",
    description:
      "Achetez, vendez et négociez des propriétés pour devenir le joueur le plus riche et faire faillite vos adversaires !",
    imagePath: "assets/images/base.png",
    age: "8+",
    tags: ["strategy", "family"],
    rules: "https://www.hasbro.com/common/instruct/monopoly.pdf",
  },
  {
    name: "Scrabble",
    players: "2-4",
    duration: "45-90 minutes",
    description:
      "Créez des mots sur le plateau en utilisant vos lettres pour marquer le plus de points possible.",
    imagePath: "assets/images/base.png",
    age: "10+",
    tags: ["word", "educational"],
    rules: "https://www.hasbro.com/common/instruct/scrabble.pdf",
  },
  {
    name: "Risk",
    players: "2-6",
    duration: "120-240 minutes",
    description:
      "Conquérir le monde en déployant vos armées et en lançant des dés pour gagner des batailles stratégiques.",
    imagePath: "assets/images/base.png",
    age: "10+",
    tags: ["strategy", "war"],
    rules: "https://www.hasbro.com/common/instruct/risk.pdf",
  },
  {
    name: "Cluedo",
    players: "3-6",
    duration: "45-60 minutes",
    description:
      "Enquêtez sur un meurtre mystérieux en collectant des indices pour découvrir qui, où et avec quoi le crime a été commis.",
    imagePath: "assets/images/base.png",
    age: "8+",
    tags: ["mystery", "deduction"],
    rules: "https://www.hasbro.com/common/instruct/cluedo.pdf",
  },
  {
    name: "Uno",
    players: "2-10",
    duration: "15-30 minutes",
    description:
      "Défaussez toutes vos cartes en premier en jouant des cartes de la même couleur ou du même numéro que la carte du dessus.",
    imagePath: "assets/images/base.png",
    age: "7+",
    tags: ["card", "family"],
    rules: "https://www.letsplayuno.com/rules",
  },
  {
    name: "Jenga",
    players: "1-8",
    duration: "10-20 minutes",
    description:
      "Retirez délicatement des blocs de bois de la tour et empilez-les en haut sans faire tomber la structure.",
    imagePath: "assets/images/base.png",
    age: "6+",
    tags: ["dexterity", "family"],
    rules: "https://www.hasbro.com/common/instruct/jenga.pdf",
  },
  {
    name: "Trivial Pursuit",
    players: "2-6",
    duration: "60-90 minutes",
    description:
      "Répondez à des questions de culture générale pour collecter des pions de différentes couleurs et remporter la victoire.",
    imagePath: "assets/images/base.png",
    age: "12+",
    tags: ["quiz", "knowledge"],
    rules: "https://www.hasbro.com/common/instruct/trivialpursuit.pdf",
  },
  {
    name: "Connect Four",
    players: "2",
    duration: "5-15 minutes",
    description:
      "Alignez quatre jetons de votre couleur en ligne, colonne ou diagonale pour gagner cette bataille stratégique.",
    imagePath: "assets/images/base.png",
    age: "6+",
    tags: ["strategy", "family"],
    rules: "https://www.hasbro.com/common/instruct/connectfour.pdf",
  },
  {
    name: "Monopoly",
    players: "2-8",
    duration: "60-180 minutes",
    description:
      "Achetez, vendez et négociez des propriétés pour devenir le joueur le plus riche et faire faillite vos adversaires.",
    imagePath: "assets/images/base.png",
    age: "8+",
    tags: ["strategy", "economy"],
  },
  {
    name: "Scrabble",
    players: "2-4",
    duration: "45-90 minutes",
    description:
      "Créez des mots sur une grille en utilisant des lettres avec différentes valeurs pour marquer le plus de points.",
    imagePath: "assets/images/base.png",
    age: "10+",
    tags: ["word", "strategy"],
  },
  {
    name: "Risk",
    players: "2-6",
    duration: "120-300 minutes",
    description:
      "Conquérir le monde en déployant des armées, en attaquant des territoires et en formant des alliances stratégiques.",
    imagePath: "assets/images/base.png",
    age: "10+",
    tags: ["strategy", "war"],
  },
  {
    name: "Catan",
    players: "3-4",
    duration: "60-120 minutes",
    description:
      "Colonisez l'île de Catan en échangeant des ressources, construisant des routes et des villes pour dominer l'île.",
    imagePath: "assets/images/base.png",
    age: "10+",
    tags: ["strategy", "trading"],
    rules: "https://www.catan.com/game/catan",
  },
  {
    name: "Ticket to Ride",
    players: "2-5",
    duration: "45-60 minutes",
    description:
      "Connectez des villes en construisant des routes ferroviaires à travers l'Amérique du Nord pour compléter vos destinations.",
    imagePath: "assets/images/base.png",
    age: "8+",
    tags: ["strategy", "family"],
    rules: "https://www.daysofwonder.com/tickettoride/en/",
  },
  {
    name: "Pandemic",
    players: "2-4",
    duration: "45-60 minutes",
    description:
      "Coopérez avec votre équipe pour sauver le monde en guérissant des maladies qui se propagent rapidement.",
    imagePath: "assets/images/base.png",
    age: "8+",
    tags: ["cooperative", "strategy"],
    rules: "https://www.zmangames.com/en/games/pandemic/",
  },
  {
    name: "Carcassonne",
    players: "2-5",
    duration: "30-45 minutes",
    description:
      "Construisez un paysage médiéval en plaçant des tuiles et en positionnant vos meeples pour marquer des points.",
    imagePath: "assets/images/base.png",
    age: "7+",
    tags: ["strategy", "tile-laying"],
  },
  {
    name: "Settlers of Catan",
    players: "3-4",
    duration: "60-120 minutes",
    description:
      "Développez votre colonie en gérant les ressources, en négociant avec les autres joueurs et en construisant des routes.",
    imagePath: "assets/images/base.png",
    age: "10+",
    tags: ["strategy", "trading"],
  },
  {
    name: "Dominion",
    players: "2-4",
    duration: "30-45 minutes",
    description:
      "Construisez votre deck de cartes en achetant des actions, des trésors et des victoires pour créer le royaume le plus puissant.",
    imagePath: "assets/images/base.png",
    age: "13+",
    tags: ["deck-building", "strategy"],
  },
  {
    name: "7 Wonders",
    players: "3-7",
    duration: "30-45 minutes",
    description:
      "Développez votre civilisation en construisant des merveilles, en gérant les ressources et en négociant avec vos voisins.",
    imagePath: "assets/images/base.png",
    age: "10+",
    tags: ["strategy", "civilization"],
  },
  {
    name: "Splendor",
    players: "2-4",
    duration: "30-45 minutes",
    description:
      "Devenez un marchand de la Renaissance en collectant des gemmes pour acheter des développements et attirer la noblesse.",
    imagePath: "assets/images/base.png",
    age: "10+",
    tags: ["strategy", "engine-building"],
  },
  {
    name: "King of Tokyo",
    players: "2-6",
    duration: "30 minutes",
    description:
      "Incarnez un monstre géant qui se bat pour devenir le roi de Tokyo en attaquant vos adversaires et en évoluant.",
    imagePath: "assets/images/base.png",
    age: "8+",
    tags: ["dice", "fighting"],
  },
  {
    name: "Love Letter",
    players: "2-4",
    duration: "20 minutes",
    description:
      "Tentez de faire parvenir votre lettre d'amour à la princesse en utilisant des cartes avec des effets spéciaux.",
    imagePath: "assets/images/base.png",
    age: "10+",
    tags: ["card", "deduction"],
  },
  {
    name: "The Resistance",
    players: "5-10",
    duration: "30 minutes",
    description:
      "Les résistants tentent de renverser le gouvernement tandis que les espions s'infiltrent dans leurs rangs.",
    imagePath: "assets/images/base.png",
    age: "13+",
    tags: ["social", "deduction"],
    rules: "https://www.indieboardsandcards.com/index.php/games/the-resistance/",
  },
  {
    name: "Codenames",
    players: "4-8",
    duration: "15 minutes",
    description:
      "Donnez des indices d'un mot pour faire deviner plusieurs mots à votre équipe sans révéler l'espion ennemi.",
    imagePath: "assets/images/base.png",
    age: "14+",
    tags: ["word", "team"],
  },
  {
    name: "Azul",
    players: "2-4",
    duration: "30-45 minutes",
    description:
      "Décorez le palais royal en plaçant stratégiquement des tuiles colorées pour créer des motifs magnifiques.",
    imagePath: "assets/images/base.png",
    age: "8+",
    tags: ["strategy", "abstract"],
    rules: "https://www.planbgames.com/en/games/azul/",
  },
  {
    name:"Codenames",
    players:"4-8",
    duration:"15-30 minutes",
    age:"14+",
    description:"Give one-word clues…",
    imagePath:"assets/images/base.png",
    tags:["word","party"],
    rules:"https://czechgames.com/files/rules/codenames-rules-en.pdf"
  }
  
];

// Données de test pour les réservations
const seedReservations = [
  {
    gameId: null, // Sera rempli après insertion des jeux
    userId: null, // Sera rempli après création d'un utilisateur de test
    userName: "Test User",
    startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Demain
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // Demain + 2h
    status: "pending",
    userNotes: "Réservation de test pour démonstration"
  },
  {
    gameId: null,
    userId: null,
    userName: "Test User",
    startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Après-demain
    endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // Après-demain + 3h
    status: "approved",
    userNotes: "Réservation approuvée de test"
  },
  {
    gameId: null,
    userId: null,
    userName: "Test User",
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Dans 3 jours
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000), // Dans 3 jours + 1h
    status: "rejected",
    userNotes: "Réservation rejetée de test",
    adminNotes: "Pas disponible à cette date"
  }
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Supprimer les données existantes
    await Game.deleteMany();
    await Reservation.deleteMany();
    
    // Insérer les jeux
    const games = await Game.insertMany(seedGames);
    console.log(`${games.length} jeux insérés`);
    
    // Créer un utilisateur de test s'il n'existe pas
    let testUser = await User.findOne({ username: "testuser" });
    if (!testUser) {
      testUser = new User({
        username: "testuser",
        email: "test@example.com",
        password: "Test123!",
        role: "user"
      });
      await testUser.save();
      console.log("Utilisateur de test créé");
    }
    
    // Créer des réservations de test
    const testReservations = seedReservations.map(reservation => ({
      ...reservation,
      gameId: games[0]._id, // Utiliser le premier jeu
      userId: testUser._id
    }));
    
    await Reservation.insertMany(testReservations);
    console.log(`${testReservations.length} réservations de test créées`);
    
    console.log("Database seeded avec succès !");
    process.exit();
  } catch (err) {
    console.error("Erreur lors du seeding:", err);
    process.exit(1);
  }
})();