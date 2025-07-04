import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv('.envbot')

class Config:
    # Configuration Discord
    DISCORD_TOKEN = os.getenv('DISCORD_TOKEN')
    GUILD_ID = int(os.getenv('GUILD_ID', 0))
    CHANNEL_ID = int(os.getenv('CHANNEL_ID', 0))
    ADMIN_ROLE_ID = int(os.getenv('ADMIN_ROLE_ID', 0))
    
    # Configuration MongoDB
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
    DATABASE_NAME = os.getenv('DATABASE_NAME', 'bda_serv')
    
    # Configuration du bot
    BOT_PREFIX = os.getenv('BOT_PREFIX', '!')
    BOT_NAME = os.getenv('BOT_NAME', 'BDA Reservations Bot')
    
    # Couleurs pour les embeds
    COLORS = {
        'SUCCESS': 0x4CAF50,    # Vert
        'ERROR': 0xF44336,      # Rouge
        'WARNING': 0xFF9800,    # Orange
        'INFO': 0x2196F3,       # Bleu
        'PENDING': 0xFFC107,    # Jaune
        'APPROVED': 0x4CAF50,   # Vert
        'REJECTED': 0xF44336    # Rouge
    }
    
    # Emojis pour les réactions
    EMOJIS = {
        'APPROVE': '✅',
        'REJECT': '❌',
        'INFO': 'ℹ️',
        'CLOCK': '⏰',
        'GAME': '🎮',
        'USER': '👤',
        'CALENDAR': '📅'
    } 