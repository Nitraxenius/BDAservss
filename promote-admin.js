require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');

async function promoteToAdmin(username) {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    // Rechercher l'utilisateur
    const user = await User.findOne({ username });
    
    if (!user) {
      console.log(`❌ Utilisateur "${username}" non trouvé`);
      return;
    }

    console.log(`📋 Utilisateur trouvé: ${user.username} (rôle actuel: ${user.role})`);

    // Vérifier si déjà admin
    if (user.role === 'admin') {
      console.log(`ℹ️  L'utilisateur "${username}" est déjà administrateur`);
      return;
    }

    // Promouvoir en admin
    user.role = 'admin';
    await user.save();

    console.log(`✅ Utilisateur "${username}" promu administrateur avec succès !`);
    console.log(`🔐 Nouveau rôle: ${user.role}`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Récupérer le nom d'utilisateur depuis les arguments de ligne de commande
const username = process.argv[2];

if (!username) {
  console.log('❌ Usage: node promote-admin.js <nom_utilisateur>');
  console.log('📝 Exemple: node promote-admin.js sofiane');
  process.exit(1);
}

promoteToAdmin(username); 