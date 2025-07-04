require('dotenv').config();
const mongoose = require('mongoose');
const Cotisant = require('./models/Cotisant');
const User = require('./models/User');

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connecté'))
  .catch(err => console.error('Erreur de connexion MongoDB:', err));

// Données de test pour les cotisants
const cotisantsData = [
  {
    email: 'jean.dupont@example.com',
    nom: 'Dupont',
    prenom: 'Jean',
    dateExpiration: new Date('2024-12-31'),
    statut: 'actif',
    notes: 'Membre actif depuis 2023'
  },
  {
    email: 'marie.martin@example.com',
    nom: 'Martin',
    prenom: 'Marie',
    dateExpiration: new Date('2024-06-30'),
    statut: 'actif',
    notes: 'Nouvelle adhérente'
  },
  {
    email: 'pierre.durand@example.com',
    nom: 'Durand',
    prenom: 'Pierre',
    dateExpiration: new Date('2024-03-15'),
    statut: 'inactif',
    notes: 'Adhésion expirée'
  },
  {
    email: 'sophie.leroy@example.com',
    nom: 'Leroy',
    prenom: 'Sophie',
    dateExpiration: new Date('2025-01-15'),
    statut: 'actif',
    notes: 'Membre senior'
  },
  {
    email: 'thomas.moreau@example.com',
    nom: 'Moreau',
    prenom: 'Thomas',
    dateExpiration: new Date('2024-08-20'),
    statut: 'actif',
    notes: 'Étudiant'
  }
];

async function seedCotisants() {
  try {
    // Supprimer tous les cotisants existants
    await Cotisant.deleteMany({});
    console.log('Anciens cotisants supprimés');

    // Récupérer un admin pour l'attribut ajoutePar
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.error('Aucun admin trouvé. Créez d\'abord un admin avec promote-admin.js');
      process.exit(1);
    }

    // Ajouter les nouveaux cotisants
    const cotisants = cotisantsData.map(data => ({
      ...data,
      ajoutePar: admin._id
    }));

    await Cotisant.insertMany(cotisants);
    console.log(`${cotisants.length} cotisants ajoutés avec succès`);

    // Afficher les cotisants créés
    const createdCotisants = await Cotisant.find().populate('ajoutePar', 'username');
    console.log('\nCotisants créés :');
    createdCotisants.forEach(cotisant => {
      console.log(`- ${cotisant.prenom} ${cotisant.nom} (${cotisant.email}) - Statut: ${cotisant.statut} - Expire: ${cotisant.dateExpiration.toLocaleDateString('fr-FR')}`);
    });

    console.log('\nPour tester le système :');
    console.log('1. Créez un compte avec l\'email d\'un cotisant (ex: jean.dupont@example.com)');
    console.log('2. Vérifiez que le rôle est automatiquement "cotisant"');
    console.log('3. Créez un compte avec un email non-cotisant pour vérifier le rôle "user"');

  } catch (error) {
    console.error('Erreur lors de l\'ajout des cotisants:', error);
  } finally {
    mongoose.connection.close();
    console.log('Connexion MongoDB fermée');
  }
}

// Exécuter le script
seedCotisants(); 