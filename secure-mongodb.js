// secure-mongodb.js - Script de sécurisation MongoDB
require('dotenv').config();
const { MongoClient } = require('mongodb');
const crypto = require('crypto');

class MongoDBSecurer {
    constructor() {
        this.adminUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
        this.dbName = 'bureau_des_jeux';
        this.adminUsername = process.env.MONGO_ADMIN_USERNAME || 'admin';
        this.adminPassword = process.env.MONGO_ADMIN_PASSWORD || 'admin123';
        this.appUsername = process.env.MONGO_APP_USERNAME || 'bureau_jeux_user';
        this.appPassword = process.env.MONGO_APP_PASSWORD || 'app123';
    }

    async connect() {
        try {
            console.log('🔗 Connexion à MongoDB...');
            this.client = new MongoClient(this.adminUri);
            await this.client.connect();
            console.log('✅ Connecté à MongoDB');
            return true;
        } catch (error) {
            console.error('❌ Erreur de connexion:', error.message);
            return false;
        }
    }

    async disconnect() {
        if (this.client) {
            await this.client.close();
            console.log('🔌 Déconnecté de MongoDB');
        }
    }

    async checkCurrentSecurity() {
        console.log('\n🔍 Vérification de la sécurité actuelle...');
        
        try {
            const adminDb = this.client.db('admin');
            
            // Vérifier si l'authentification est activée
            const authInfo = await adminDb.command({ getParameter: 1, authenticationMechanisms: 1 });
            console.log('   Mécanismes d\'authentification:', authInfo.authenticationMechanisms);
            
            // Vérifier les utilisateurs existants
            const users = await adminDb.collection('system.users').find({}).toArray();
            console.log(`   Utilisateurs existants: ${users.length}`);
            
            if (users.length > 0) {
                console.log('   ⚠️  Des utilisateurs existent déjà');
                users.forEach(user => {
                    console.log(`      - ${user.user} (${user.db})`);
                });
            } else {
                console.log('   ✅ Aucun utilisateur configuré');
            }
            
            return users.length === 0;
        } catch (error) {
            console.log('   ℹ️  Impossible de vérifier la sécurité (normal si pas d\'auth)');
            return true;
        }
    }

    async createAdminUser() {
        console.log('\n👤 Création de l\'utilisateur administrateur...');
        
        try {
            const adminDb = this.client.db('admin');
            
            // Vérifier si l'admin existe déjà
            const existingAdmin = await adminDb.collection('system.users').findOne({ user: this.adminUsername });
            if (existingAdmin) {
                console.log('   ⚠️  L\'utilisateur admin existe déjà');
                return true;
            }
            
            // Créer l'utilisateur admin
            await adminDb.addUser(this.adminUsername, this.adminPassword, {
                roles: [
                    { role: 'userAdminAnyDatabase', db: 'admin' },
                    { role: 'readWriteAnyDatabase', db: 'admin' },
                    { role: 'dbAdminAnyDatabase', db: 'admin' }
                ]
            });
            
            console.log('   ✅ Utilisateur admin créé avec succès');
            return true;
        } catch (error) {
            console.error('   ❌ Erreur création admin:', error.message);
            return false;
        }
    }

    async createAppUser() {
        console.log('\n👤 Création de l\'utilisateur application...');
        
        try {
            const appDb = this.client.db(this.dbName);
            
            // Vérifier si l'utilisateur app existe déjà
            const existingApp = await appDb.collection('system.users').findOne({ user: this.appUsername });
            if (existingApp) {
                console.log('   ⚠️  L\'utilisateur application existe déjà');
                return true;
            }
            
            // Créer l'utilisateur application
            await appDb.addUser(this.appUsername, this.appPassword, {
                roles: [
                    { role: 'readWrite', db: this.dbName },
                    { role: 'dbAdmin', db: this.dbName }
                ]
            });
            
            console.log('   ✅ Utilisateur application créé avec succès');
            return true;
        } catch (error) {
            console.error('   ❌ Erreur création utilisateur app:', error.message);
            return false;
        }
    }

    async enableAuthentication() {
        console.log('\n🔐 Activation de l\'authentification...');
        
        try {
            // Créer le fichier de configuration MongoDB
            const configContent = this.generateMongoConfig();
            
            console.log('   📝 Configuration MongoDB générée:');
            console.log('   ' + '='.repeat(50));
            console.log(configContent);
            console.log('   ' + '='.repeat(50));
            
            console.log('\n   📋 Instructions:');
            console.log('   1. Arrêtez MongoDB');
            console.log('   2. Ajoutez la configuration ci-dessus à votre fichier mongod.conf');
            console.log('   3. Redémarrez MongoDB');
            console.log('   4. Testez la connexion avec: npm run test-mongo-auth');
            
            return true;
        } catch (error) {
            console.error('   ❌ Erreur activation auth:', error.message);
            return false;
        }
    }

    generateMongoConfig() {
        return `# Configuration MongoDB sécurisée
security:
  authorization: enabled

# Réseau
net:
  port: 27017
  bindIp: 127.0.0.1

# Stockage
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true

# Logs
systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

# Process
processManagement:
  timeZoneInfo: /usr/share/zoneinfo`;
    }

    async generateSecureConnectionString() {
        console.log('\n🔗 Chaînes de connexion sécurisées:');
        console.log('   ' + '='.repeat(50));
        
        // Chaîne pour l'application
        const appUri = `mongodb://${this.appUsername}:${this.appPassword}@localhost:27017/${this.dbName}?authSource=${this.dbName}`;
        console.log('   Application:');
        console.log(`   ${appUri}`);
        
        // Chaîne pour l'admin
        const adminUri = `mongodb://${this.adminUsername}:${this.adminPassword}@localhost:27017/admin`;
        console.log('\n   Admin:');
        console.log(`   ${adminUri}`);
        
        console.log('\n   📝 Mettez à jour votre .env avec:');
        console.log(`   MONGO_URI=${appUri}`);
        
        console.log('   ' + '='.repeat(50));
    }

    async testConnection(uri, description) {
        console.log(`\n🧪 Test de connexion: ${description}`);
        
        try {
            const testClient = new MongoClient(uri);
            await testClient.connect();
            await testClient.db().admin().ping();
            await testClient.close();
            console.log('   ✅ Connexion réussie');
            return true;
        } catch (error) {
            console.log(`   ❌ Échec de connexion: ${error.message}`);
            return false;
        }
    }

    async runSecuritySetup() {
        console.log('🔐 Démarrage de la sécurisation MongoDB\n');
        
        if (!await this.connect()) {
            return false;
        }
        
        try {
            // Vérifier l'état actuel
            const canProceed = await this.checkCurrentSecurity();
            
            if (!canProceed) {
                console.log('\n⚠️  Des utilisateurs existent déjà. Voulez-vous continuer ?');
                console.log('   Cela pourrait écraser les utilisateurs existants.');
                console.log('   Arrêtez le script si vous voulez préserver les utilisateurs existants.');
                return false;
            }
            
            // Créer les utilisateurs
            const adminCreated = await this.createAdminUser();
            const appCreated = await this.createAppUser();
            
            if (adminCreated && appCreated) {
                // Générer les chaînes de connexion
                await this.generateSecureConnectionString();
                
                // Afficher les instructions
                await this.enableAuthentication();
                
                console.log('\n🎉 Configuration terminée !');
                console.log('\n📋 Prochaines étapes:');
                console.log('   1. Arrêtez MongoDB');
                console.log('   2. Configurez l\'authentification (voir instructions ci-dessus)');
                console.log('   3. Redémarrez MongoDB');
                console.log('   4. Testez avec: npm run test-mongo-auth');
                console.log('   5. Mettez à jour votre .env');
                
                return true;
            } else {
                console.log('\n❌ Erreur lors de la création des utilisateurs');
                return false;
            }
            
        } catch (error) {
            console.error('\n❌ Erreur lors de la sécurisation:', error);
            return false;
        } finally {
            await this.disconnect();
        }
    }
}

// Fonction principale
async function main() {
    const securer = new MongoDBSecurer();
    
    // Vérifier les arguments
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
🔐 Script de sécurisation MongoDB

Usage:
  node secure-mongodb.js [options]

Options:
  --help, -h           Afficher cette aide
  --test               Tester la connexion après configuration
  --check-only         Vérifier seulement l'état actuel

Exemples:
  node secure-mongodb.js              # Configuration complète
  node secure-mongodb.js --check-only # Vérification seulement
  node secure-mongodb.js --test       # Configuration + test

Variables d'environnement:
  MONGO_URI            URI de connexion MongoDB
  MONGO_ADMIN_USERNAME Nom d'utilisateur admin (défaut: admin)
  MONGO_ADMIN_PASSWORD Mot de passe admin
  MONGO_APP_USERNAME   Nom d'utilisateur app (défaut: bureau_jeux_user)
  MONGO_APP_PASSWORD   Mot de passe app
        `);
        return;
    }
    
    if (args.includes('--check-only')) {
        await securer.connect();
        await securer.checkCurrentSecurity();
        await securer.disconnect();
        return;
    }
    
    if (args.includes('--test')) {
        // Test après configuration
        const appUri = `mongodb://${securer.appUsername}:${securer.appPassword}@localhost:27017/${securer.dbName}?authSource=${securer.dbName}`;
        await securer.testConnection(appUri, 'Application');
        return;
    }
    
    // Configuration complète
    await securer.runSecuritySetup();
}

// Exécuter le script
if (require.main === module) {
    main().catch(console.error);
}

module.exports = MongoDBSecurer; 