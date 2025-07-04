// cleanup-tokens.js - Script de maintenance pour nettoyer les tokens
require('dotenv').config();
const mongoose = require('mongoose');
const RefreshToken = require('./models/refreshToken');

async function cleanupTokens() {
    try {
        console.log('🔗 Connexion à MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connecté à MongoDB');
        
        // Afficher les statistiques avant nettoyage
        console.log('\n📊 Statistiques avant nettoyage :');
        const statsBefore = await RefreshToken.getStats();
        console.log(`   Total des tokens : ${statsBefore.total}`);
        console.log(`   Tokens actifs : ${statsBefore.active}`);
        console.log(`   Tokens révoqués : ${statsBefore.revoked}`);
        console.log(`   Tokens expirés : ${statsBefore.expired}`);
        
        // Nettoyer les tokens expirés (automatique par MongoDB)
        console.log('\n🧹 Nettoyage des tokens expirés...');
        const expiredResult = await RefreshToken.cleanupExpired();
        console.log(`   ✅ ${expiredResult.deletedCount} tokens expirés supprimés`);
        
        // Nettoyer les tokens révoqués anciens (plus de 7 jours)
        console.log('\n🧹 Nettoyage des tokens révoqués anciens...');
        const revokedResult = await RefreshToken.cleanupRevoked(7);
        console.log(`   ✅ ${revokedResult.deletedCount} tokens révoqués supprimés`);
        
        // Afficher les statistiques après nettoyage
        console.log('\n📊 Statistiques après nettoyage :');
        const statsAfter = await RefreshToken.getStats();
        console.log(`   Total des tokens : ${statsAfter.total}`);
        console.log(`   Tokens actifs : ${statsAfter.active}`);
        console.log(`   Tokens révoqués : ${statsAfter.revoked}`);
        console.log(`   Tokens expirés : ${statsAfter.expired}`);
        
        // Calculer les économies
        const totalDeleted = expiredResult.deletedCount + revokedResult.deletedCount;
        const spaceSaved = totalDeleted * 0.5; // Estimation : ~0.5KB par token
        
        console.log('\n💾 Résumé du nettoyage :');
        console.log(`   Total supprimé : ${totalDeleted} tokens`);
        console.log(`   Espace libéré estimé : ~${spaceSaved.toFixed(2)} KB`);
        
        if (totalDeleted > 0) {
            console.log('\n🎉 Nettoyage terminé avec succès !');
        } else {
            console.log('\n✨ Aucun token à nettoyer, la base est déjà propre !');
        }
        
    } catch (error) {
        console.error('❌ Erreur lors du nettoyage :', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Déconnecté de MongoDB');
    }
}

// Fonction pour afficher l'aide
function showHelp() {
    console.log(`
🔧 Script de nettoyage des tokens d'authentification

Usage:
  node cleanup-tokens.js [options]

Options:
  --help, -h     Afficher cette aide
  --days <n>     Nettoyer les tokens révoqués de plus de n jours (défaut: 7)
  --force        Forcer le nettoyage sans confirmation
  --stats-only   Afficher seulement les statistiques sans nettoyer

Exemples:
  node cleanup-tokens.js                    # Nettoyage standard (7 jours)
  node cleanup-tokens.js --days 3           # Nettoyer après 3 jours
  node cleanup-tokens.js --stats-only       # Voir les stats seulement
  node cleanup-tokens.js --force            # Nettoyage sans confirmation

Variables d'environnement requises:
  MONGO_URI     URI de connexion MongoDB
    `);
}

// Fonction pour afficher seulement les statistiques
async function showStatsOnly() {
    try {
        console.log('🔗 Connexion à MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connecté à MongoDB');
        
        console.log('\n📊 Statistiques des tokens :');
        const stats = await RefreshToken.getStats();
        console.log(`   Total des tokens : ${stats.total}`);
        console.log(`   Tokens actifs : ${stats.active}`);
        console.log(`   Tokens révoqués : ${stats.revoked}`);
        console.log(`   Tokens expirés : ${stats.expired}`);
        
        // Calculer les pourcentages
        if (stats.total > 0) {
            const activePercent = ((stats.active / stats.total) * 100).toFixed(1);
            const revokedPercent = ((stats.revoked / stats.total) * 100).toFixed(1);
            const expiredPercent = ((stats.expired / stats.total) * 100).toFixed(1);
            
            console.log('\n📈 Pourcentages :');
            console.log(`   Actifs : ${activePercent}%`);
            console.log(`   Révoqués : ${revokedPercent}%`);
            console.log(`   Expirés : ${expiredPercent}%`);
        }
        
        // Recommandations
        console.log('\n💡 Recommandations :');
        if (stats.revoked > 100) {
            console.log('   ⚠️  Beaucoup de tokens révoqués, nettoyage recommandé');
        }
        if (stats.total > 1000) {
            console.log('   ⚠️  Base de données volumineuse, nettoyage recommandé');
        }
        if (stats.revoked < 50 && stats.total < 500) {
            console.log('   ✅ Base de données propre, pas de nettoyage nécessaire');
        }
        
    } catch (error) {
        console.error('❌ Erreur :', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Déconnecté de MongoDB');
    }
}

// Gestion des arguments de ligne de commande
const args = process.argv.slice(2);
let daysToKeep = 7;
let forceCleanup = false;
let statsOnly = false;

for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
        case '--help':
        case '-h':
            showHelp();
            process.exit(0);
            break;
        case '--days':
            daysToKeep = parseInt(args[++i]) || 7;
            break;
        case '--force':
            forceCleanup = true;
            break;
        case '--stats-only':
            statsOnly = true;
            break;
        default:
            console.log(`❌ Option inconnue : ${args[i]}`);
            showHelp();
            process.exit(1);
    }
}

// Vérifier les variables d'environnement
if (!process.env.MONGO_URI) {
    console.error('❌ Variable d\'environnement MONGO_URI requise');
    process.exit(1);
}

// Exécuter le script
if (statsOnly) {
    showStatsOnly();
} else {
    if (!forceCleanup) {
        console.log(`\n⚠️  Ce script va nettoyer les tokens révoqués de plus de ${daysToKeep} jours.`);
        console.log('   Utilisez --force pour ignorer cette confirmation.');
        console.log('   Utilisez --stats-only pour voir les statistiques seulement.');
        process.exit(0);
    }
    
    cleanupTokens();
} 