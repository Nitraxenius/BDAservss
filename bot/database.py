from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import logging
from config import Config

logger = logging.getLogger(__name__)

class Database:
    def __init__(self):
        self.client = None
        self.db = None
        self.connect()
    
    def connect(self):
        """Établit la connexion à MongoDB"""
        try:
            self.client = MongoClient(Config.MONGODB_URI)
            # Test de la connexion
            self.client.admin.command('ping')
            self.db = self.client[Config.DATABASE_NAME]
            logger.info("Connexion a MongoDB etablie avec succes")
        except ConnectionFailure as e:
            logger.error(f"Erreur de connexion a MongoDB: {e}")
            raise
    
    def get_collection(self, collection_name):
        """Récupère une collection MongoDB"""
        if self.db is None:
            raise ConnectionError("Base de données non connectée")
        return self.db[collection_name]
    
    def get_reservations(self, status=None):
        """Récupère les réservations depuis la base de données"""
        collection = self.get_collection('reservations')
        if status:
            return list(collection.find({'status': status}))
        return list(collection.find())
    
    def get_reservation_by_id(self, reservation_id):
        """Récupère une réservation par son ID"""
        collection = self.get_collection('reservations')
        return collection.find_one({'_id': reservation_id})
    
    def update_reservation_status(self, reservation_id, status, admin_notes=None):
        """Met à jour le statut d'une réservation"""
        collection = self.get_collection('reservations')
        update_data = {'status': status}
        if admin_notes:
            update_data['admin_notes'] = admin_notes
        
        result = collection.update_one(
            {'_id': reservation_id},
            {'$set': update_data}
        )
        return result.modified_count > 0
    
    def add_discord_message_id(self, reservation_id, message_id):
        """Ajoute l'ID du message Discord à une réservation"""
        collection = self.get_collection('reservations')
        result = collection.update_one(
            {'_id': reservation_id},
            {'$set': {'discord_message_id': message_id}}
        )
        return result.modified_count > 0
    
    def get_reservation_by_discord_message(self, message_id):
        """Récupère une réservation par l'ID du message Discord"""
        collection = self.get_collection('reservations')
        return collection.find_one({'discord_message_id': message_id})
    
    def get_pending_reservations(self):
        """Récupère toutes les réservations en attente"""
        return self.get_reservations('pending')
    
    def get_games(self):
        """Récupère tous les jeux"""
        collection = self.get_collection('games')
        return list(collection.find())
    
    def get_game_by_id(self, game_id):
        """Récupère un jeu par son ID"""
        collection = self.get_collection('games')
        return collection.find_one({'_id': game_id})
    
    def get_users(self):
        """Récupère tous les utilisateurs"""
        collection = self.get_collection('users')
        return list(collection.find())
    
    def get_user_by_id(self, user_id):
        """Récupère un utilisateur par son ID"""
        collection = self.get_collection('users')
        return collection.find_one({'_id': user_id})
    
    def close(self):
        """Ferme la connexion à MongoDB"""
        if self.client:
            self.client.close()
            logger.info("Connexion a MongoDB fermee")

# Instance globale de la base de données
db = Database() 