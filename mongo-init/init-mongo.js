// Script d'initialisation MongoDB pour BDA Reservations
// Ce script s'exécute automatiquement au premier démarrage du conteneur MongoDB

print('🚀 Initialisation de la base de données BDA Reservations...');

// Créer la base de données
db = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE || 'bureau-des-jeux');
print(`📊 Base de données créée: ${db.getName()}`);

// Créer l'utilisateur de l'application
try {
  db.createUser({
    user: process.env.MONGO_APP_USERNAME,
    pwd: process.env.MONGO_APP_PASSWORD,
    roles: [
      {
        role: 'readWrite',
        db: process.env.MONGO_INITDB_DATABASE
      }
    ]
  });
  print(`✅ Utilisateur créé: ${process.env.MONGO_APP_USERNAME || 'appUser'}`);
} catch (error) {
  print(`⚠️  Utilisateur existe déjà ou erreur: ${error.message}`);
}

// Créer les collections de base
const collections = ['users', 'games', 'reservations', 'cotisants', 'refreshtokens'];

collections.forEach(collectionName => {
  if (!db.getCollectionNames().includes(collectionName)) {
    db.createCollection(collectionName);
    print(`📁 Collection créée: ${collectionName}`);
  } else {
    print(`📁 Collection existe déjà: ${collectionName}`);
  }
});

// Créer des index pour optimiser les performances
try {
  // Index pour les utilisateurs
  db.users.createIndex({ "username": 1 }, { unique: true });
  db.users.createIndex({ "email": 1 });
  
  // Index pour les réservations
  db.reservations.createIndex({ "gameId": 1, "date": 1 });
  db.reservations.createIndex({ "userId": 1 });
  db.reservations.createIndex({ "date": 1 });
  
  // Index pour les jeux
  db.games.createIndex({ "name": 1 });
  db.games.createIndex({ "available": 1 });
  
  // Index pour les cotisants
  db.cotisants.createIndex({ "email": 1 });
  db.cotisants.createIndex({ "statut": 1, "dateExpiration": 1 });
  
  // Index pour les refresh tokens
  db.refreshtokens.createIndex({ "token": 1 }, { unique: true });
  db.refreshtokens.createIndex({ "userId": 1 });
  db.refreshtokens.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 });
  
  print('✅ Index créés avec succès');
} catch (error) {
  print(`⚠️  Erreur lors de la création des index: ${error.message}`);
}

print('🎉 Initialisation MongoDB terminée avec succès !'); 