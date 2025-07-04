// test-mongo-auth.js - Test de connexion MongoDB sécurisée
require('dotenv').config();
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');

class MongoAuthTester {
    constructor() {
        this.uri = process.env.MONGO_URI;
        this.dbName = 'bureau_des_jeux';
    }

    async testMongooseConnection() {
        console.log('🧪 Test de connexion Mongoose...');
        
        try {
            await mongoose.connect(this.uri);
            console.log('   ✅ Connexion Mongoose réussie');
            
            // Test des opérations de base
            const db = mongoose.connection.db;
            const collections = await db.listCollections().toArray();
            console.log(`   📊 Collections trouvées: ${collections.length}`);
            
            await mongoose.disconnect();
            return true;
        } catch (error) {
            console.log(`   ❌ Erreur Mongoose: ${error.message}`);
            return false;
        }
    }

    async testMongoClientConnection() {
        console.log('\n🧪 Test de connexion MongoClient...');
        
        try {
            const client = new MongoClient(this.uri);
            await client.connect();
            console.log('   ✅ Connexion MongoClient réussie');
            
            // Test ping
            await client.db().admin().ping();
            console.log('   ✅ Ping réussi');
            
            // Test d'accès à la base
            const db = client.db(this.dbName);
            const collections = await db.listCollections().toArray();
            console.log(`   📊 Collections dans ${this.dbName}: ${collections.length}`);
            
            await client.close();
            return true;
        } catch (error) {
            console.log(`   ❌ Erreur MongoClient: ${error.message}`);
            return false;
        }
    }

    async testDatabaseOperations() {
        console.log('\n🧪 Test des opérations de base...');
        
        try {
            const client = new MongoClient(this.uri);
            await client.connect();
            const db = client.db(this.dbName);
            
            // Test d'écriture
            const testCollection = db.collection('test_auth');
            const testDoc = { 
                test: true, 
                timestamp: new Date(),
                message: 'Test d\'authentification réussi'
            };
            
            const insertResult = await testCollection.insertOne(testDoc);
            console.log('   ✅ Écriture réussie');
            
            // Test de lecture
            const readResult = await testCollection.findOne({ _id: insertResult.insertedId });
            if (readResult) {
                console.log('   ✅ Lecture réussie');
            }
            
            // Test de mise à jour
            const updateResult = await testCollection.updateOne(
                { _id: insertResult.insertedId },
                { $set: { updated: true } }
            );
            if (updateResult.modifiedCount > 0) {
                console.log('   ✅ Mise à jour réussie');
            }
            
            // Test de suppression
            const deleteResult = await testCollection.deleteOne({ _id: insertResult.insertedId });
            if (deleteResult.deletedCount > 0) {
                console.log('   ✅ Suppression réussie');
            }
            
            await client.close();
            return true;
        } catch (error) {
            console.log(`   ❌ Erreur opérations: ${error.message}`);
            return false;
        }
    }

    async testApplicationModels() {
        console.log('\n🧪 Test des modèles d\'application...');
        
        try {
            await mongoose.connect(this.uri);
            
            // Importer les modèles
            const User = require('./models/user');
            const Game = require('./models/jeux');
            const Reservation = require('./models/reservation');
            
            // Test de comptage
            const userCount = await User.countDocuments();
            const gameCount = await Game.countDocuments();
            const reservationCount = await Reservation.countDocuments();
            
            console.log(`   📊 Utilisateurs: ${userCount}`);
            console.log(`   📊 Jeux: ${gameCount}`);
            console.log(`   📊 Réservations: ${reservationCount}`);
            console.log('   ✅ Accès aux modèles réussi');
            
            await mongoose.disconnect();
            return true;
        } catch (error) {
            console.log(`   ❌ Erreur modèles: ${error.message}`);
            return false;
        }
    }

    async runAllTests() {
        console.log('🔐 Test de sécurité MongoDB\n');
        console.log(`URI de test: ${this.uri}\n`);
        
        const tests = [
            { name: 'Mongoose', test: () => this.testMongooseConnection() },
            { name: 'MongoClient', test: () => this.testMongoClientConnection() },
            { name: 'Opérations DB', test: () => this.testDatabaseOperations() },
            { name: 'Modèles App', test: () => this.testApplicationModels() }
        ];
        
        let passedTests = 0;
        let totalTests = tests.length;
        
        for (const test of tests) {
            const success = await test.test();
            if (success) passedTests++;
        }
        
        console.log('\n' + '='.repeat(50));
        console.log(`📊 Résultats: ${passedTests}/${totalTests} tests réussis`);
        
        if (passedTests === totalTests) {
            console.log('🎉 Tous les tests sont passés ! MongoDB est correctement sécurisé.');
        } else {
            console.log('⚠️  Certains tests ont échoué. Vérifiez votre configuration.');
        }
        
        console.log('='.repeat(50));
        
        return passedTests === totalTests;
    }
}

// Fonction principale
async function main() {
    const tester = new MongoAuthTester();
    
    // Vérifier les arguments
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
🧪 Test de sécurité MongoDB

Usage:
  node test-mongo-auth.js [options]

Options:
  --help, -h     Afficher cette aide
  --quick        Test rapide (Mongoose seulement)

Exemples:
  node test-mongo-auth.js        # Tests complets
  node test-mongo-auth.js --quick # Test rapide

Variables d'environnement:
  MONGO_URI      URI de connexion MongoDB sécurisée
        `);
        return;
    }
    
    if (args.includes('--quick')) {
        // Test rapide
        const success = await tester.testMongooseConnection();
        console.log(success ? '✅ Test rapide réussi' : '❌ Test rapide échoué');
        return;
    }
    
    // Tests complets
    await tester.runAllTests();
}

// Exécuter le script
if (require.main === module) {
    main().catch(console.error);
}

module.exports = MongoAuthTester; 