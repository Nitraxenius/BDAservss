# main.py
import discord
from discord.ext import commands, tasks
import asyncio
import logging
import sys
from datetime import datetime, timedelta

# Configuration du logging avec encodage UTF-8
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('bot.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

# Import des modules du bot
from config import Config
from database import db
from services.notification_service import NotificationService

# Configuration du bot avec intents minimaux
intents = discord.Intents.default()
intents.message_content = True
intents.reactions = True
# Désactiver les intents privilégiés qui ne sont pas nécessaires
intents.members = False
intents.presences = False

bot = commands.Bot(
    command_prefix=Config.BOT_PREFIX,
    intents=intents,
    help_command=None
)

# Instance du service de notification
notification_service = None

@bot.event
async def on_ready():
    """Événement déclenché quand le bot est prêt"""
    global notification_service
    
    if bot.user:
        logger.info(f"Bot connecté en tant que {bot.user.name}")
        logger.info(f"ID du bot: {bot.user.id}")
    else:
        logger.info("Bot connecté")
    logger.info(f"Connecté à {len(bot.guilds)} serveur(s)")
    
    # Initialiser le service de notification
    notification_service = NotificationService(bot)
    success = await notification_service.initialize()
    
    if success:
        logger.info("Service de notification initialisé")
    else:
        logger.error("Echec de l'initialisation du service de notification")
    
    # Démarrer les tâches en arrière-plan
    daily_summary.start()
    reminder_check.start()
    check_new_reservations.start() # Démarrer la nouvelle tâche
    
    # Synchroniser les commandes slash
    try:
        await bot.tree.sync()
        logger.info("Commandes slash synchronisées")
    except Exception as e:
        logger.error(f"Erreur lors de la synchronisation des commandes: {e}")
    
    # Afficher le statut
    await bot.change_presence(
        activity=discord.Activity(
            type=discord.ActivityType.watching,
            name="les réservations"
        )
    )

@bot.event
async def on_command_error(ctx, error):
    """Gestionnaire d'erreurs global"""
    if isinstance(error, commands.CommandNotFound):
        return
    
    if isinstance(error, commands.MissingPermissions):
        embed = discord.Embed(
            title="Permission refusée",
            description="Vous n'avez pas les permissions nécessaires pour utiliser cette commande.",
            color=Config.COLORS['ERROR']
        )
        await ctx.send(embed=embed)
        return
    
    logger.error(f"Erreur de commande: {error}")
    embed = discord.Embed(
        title="Erreur",
        description=f"Une erreur s'est produite: {str(error)}",
        color=Config.COLORS['ERROR']
    )
    await ctx.send(embed=embed)

@tasks.loop(hours=24)
async def daily_summary():
    """Envoie un résumé quotidien des réservations"""
    if notification_service:
        await notification_service.send_daily_summary()

@tasks.loop(hours=1)
async def reminder_check():
    """Vérifie les réservations en attente depuis plus de 24h"""
    if not notification_service:
        return
    
    try:
        # Récupérer les réservations en attente
        pending_reservations = db.get_pending_reservations()
        
        # Vérifier celles qui sont en attente depuis plus de 24h
        cutoff_time = datetime.now() - timedelta(hours=24)
        
        for reservation in pending_reservations:
            reservation_time = datetime.fromisoformat(str(reservation['startDate']))
            if reservation_time < cutoff_time:
                await notification_service.send_reminder_notification(reservation['_id'])
                # Attendre un peu pour éviter le spam
                await asyncio.sleep(5)
    
    except Exception as e:
        logger.error(f"Erreur lors de la vérification des rappels: {e}")

@tasks.loop(seconds=10)  # Vérifier toutes les 30 secondes
async def check_new_reservations():
    """Vérifie les nouvelles réservations et envoie des notifications"""
    if not notification_service:
        return
    
    try:
        # Récupérer toutes les réservations
        all_reservations = db.get_reservations()
        
        # Vérifier celles qui n'ont pas encore de message Discord
        for reservation in all_reservations:
            if reservation.get('status') == 'pending' and not reservation.get('discord_message_id'):
                # C'est une nouvelle réservation, envoyer une notification
                await notification_service.send_reservation_notification(reservation['_id'])
                logger.info(f"Nouvelle réservation détectée et notifiée: {reservation['_id']}")
                # Attendre un peu pour éviter le spam
                await asyncio.sleep(2)
    
    except Exception as e:
        logger.error(f"Erreur lors de la vérification des nouvelles réservations: {e}")

@daily_summary.before_loop
async def before_daily_summary():
    """Attendre jusqu'à minuit pour commencer le résumé quotidien"""
    await asyncio.sleep(60)  # Attendre 1 minute pour éviter les conflits au démarrage

@reminder_check.before_loop
async def before_reminder_check():
    """Attendre avant de commencer la vérification des rappels"""
    await asyncio.sleep(300)  # Attendre 5 minutes

@check_new_reservations.before_loop
async def before_check_new_reservations():
    """Attendre avant de commencer la vérification"""
    await asyncio.sleep(30)  # Attendre 1 minute au démarrage

async def load_extensions():
    """Charge toutes les extensions du bot"""
    extensions = [
        'commands.reservations',
        'commands.admin',
        'events.reservation_events'
    ]
    
    for extension in extensions:
        try:
            await bot.load_extension(extension)
            logger.info(f"Extension chargée: {extension}")
        except Exception as e:
            logger.error(f"Erreur lors du chargement de {extension}: {e}")

async def main():
    """Fonction principale"""
    try:
        # Charger les extensions
        await load_extensions()
        
        # Démarrer le bot
        logger.info("Demarrage du bot...")
        if Config.DISCORD_TOKEN:
            await bot.start(Config.DISCORD_TOKEN)
        else:
            logger.error("Token Discord manquant")
            return
        
    except KeyboardInterrupt:
        logger.info("Arret du bot...")
    except Exception as e:
        logger.error(f"Erreur fatale: {e}")
    finally:
        # Nettoyer les ressources
        if db:
            db.close()
        
        # Arrêter les tâches
        daily_summary.cancel()
        reminder_check.cancel()
        check_new_reservations.cancel() # Arrêter la nouvelle tâche
        
        logger.info("Bot arrete")

if __name__ == "__main__":
    # Vérifier la configuration
    if not Config.DISCORD_TOKEN:
        logger.error("Token Discord manquant dans les variables d'environnement")
        sys.exit(1)
    
    if not Config.CHANNEL_ID:
        logger.error("ID du salon manquant dans les variables d'environnement")
        sys.exit(1)
    
    # Démarrer le bot
    asyncio.run(main()) 