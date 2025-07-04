import asyncio
import logging
import discord
from datetime import datetime
from database import db
from utils.embeds import EmbedBuilder
from config import Config

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self, bot):
        self.bot = bot
        self.channel = None
    
    async def initialize(self):
        """Initialise le service de notification"""
        try:
            self.channel = self.bot.get_channel(Config.CHANNEL_ID)
            if not self.channel:
                logger.error(f"❌ Impossible de trouver le salon {Config.CHANNEL_ID}")
                return False
            
            logger.info(f"✅ Service de notification initialisé pour le salon {self.channel.name}")
            return True
        except Exception as e:
            logger.error(f"❌ Erreur lors de l'initialisation du service de notification: {e}")
            return False
    
    async def send_reservation_notification(self, reservation_id):
        """Envoie une notification pour une nouvelle réservation"""
        try:
            # Récupérer la réservation
            reservation = db.get_reservation_by_id(reservation_id)
            if not reservation:
                logger.error(f"❌ Réservation {reservation_id} introuvable")
                return None
            
            # Récupérer les informations du jeu et de l'utilisateur
            game = None
            user = None
            
            if 'gameId' in reservation:
                game = db.get_game_by_id(reservation['gameId'])
            if 'userId' in reservation:
                user = db.get_user_by_id(reservation['userId'])
            
            # Créer l'embed
            embed = EmbedBuilder.create_reservation_embed(reservation, game, user)
            
            # Envoyer le message
            message = await self.channel.send(embed=embed)
            
            # Ajouter les réactions
            await message.add_reaction(Config.EMOJIS['APPROVE'])
            await message.add_reaction(Config.EMOJIS['REJECT'])
            await message.add_reaction(Config.EMOJIS['INFO'])
            
            # Sauvegarder l'ID du message Discord
            db.add_discord_message_id(reservation_id, str(message.id))
            
            logger.info(f"✅ Notification envoyée pour la réservation {reservation_id}")
            return message
            
        except Exception as e:
            logger.error(f"❌ Erreur lors de l'envoi de la notification: {e}")
            return None
    
    async def update_reservation_message(self, reservation_id, new_status):
        """Met à jour le message Discord d'une réservation"""
        try:
            # Récupérer la réservation
            reservation = db.get_reservation_by_id(reservation_id)
            if not reservation:
                logger.error(f"❌ Réservation {reservation_id} introuvable")
                return False
            
            # Récupérer l'ID du message Discord
            discord_message_id = reservation.get('discord_message_id')
            if not discord_message_id:
                logger.warning(f"⚠️ Aucun message Discord associé à la réservation {reservation_id}")
                return False
            
            # Récupérer le message
            try:
                message = await self.channel.fetch_message(int(discord_message_id))
            except:
                logger.error(f"❌ Impossible de récupérer le message Discord {discord_message_id}")
                return False
            
            # Mettre à jour l'embed
            embed = message.embeds[0]
            
            # Changer la couleur selon le statut
            if new_status == 'approved':
                embed.color = Config.COLORS['APPROVED']
                status_text = "✅ APPROUVÉ"
            elif new_status == 'rejected':
                embed.color = Config.COLORS['REJECTED']
                status_text = "❌ REJETÉ"
            else:
                embed.color = Config.COLORS['PENDING']
                status_text = "⏳ EN ATTENTE"
            
            # Mettre à jour le champ statut
            for i, field in enumerate(embed.fields):
                if field.name == "Statut":
                    embed.set_field_at(i, name="Statut", value=status_text, inline=True)
                    break
            
            # Éditer le message
            await message.edit(embed=embed)
            
            logger.info(f"✅ Message Discord mis à jour pour la réservation {reservation_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Erreur lors de la mise à jour du message: {e}")
            return False
    
    async def send_reminder_notification(self, reservation_id):
        """Envoie un rappel pour une réservation en attente"""
        try:
            # Récupérer la réservation
            reservation = db.get_reservation_by_id(reservation_id)
            if not reservation:
                return False
            
            # Vérifier que la réservation est toujours en attente
            if reservation['status'] != 'pending':
                return False
            
            # Créer un embed de rappel
            embed = discord.Embed(
                title="⏰ Rappel - Réservation en attente",
                description=f"La réservation {reservation_id} est en attente depuis plus de 24h",
                color=Config.COLORS['WARNING'],
                timestamp=datetime.utcnow()
            )
            
            # Ajouter les informations de base
            embed.add_field(
                name="Début de réservation",
                value=f"<t:{int(datetime.fromisoformat(str(reservation['startDate'])).timestamp())}:F>",
                inline=True
            )
            
            embed.add_field(
                name="Fin de réservation",
                value=f"<t:{int(datetime.fromisoformat(str(reservation['endDate'])).timestamp())}:F>",
                inline=True
            )
            
            if reservation.get('notes'):
                embed.add_field(
                    name="Notes",
                    value=reservation['notes'],
                    inline=False
                )
            
            embed.set_footer(text=f"ID: {reservation_id}")
            
            # Envoyer le rappel
            await self.channel.send(embed=embed)
            
            logger.info(f"✅ Rappel envoyé pour la réservation {reservation_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Erreur lors de l'envoi du rappel: {e}")
            return False
    
    async def send_daily_summary(self):
        """Envoie un résumé quotidien des réservations"""
        try:
            # Récupérer les réservations du jour
            today = datetime.now().date()
            all_reservations = db.get_reservations()
            
            today_reservations = []
            for reservation in all_reservations:
                reservation_date = datetime.fromisoformat(str(reservation['startDate'])).date()
                if reservation_date == today:
                    today_reservations.append(reservation)
            
            # Compter par statut
            stats = {
                'pending': 0,
                'approved': 0,
                'rejected': 0,
                'total': len(today_reservations)
            }
            
            for reservation in today_reservations:
                status = reservation.get('status', 'unknown')
                if status in stats:
                    stats[status] += 1
            
            # Créer l'embed de résumé
            embed = discord.Embed(
                title="📊 Résumé quotidien",
                description=f"Réservations du {today.strftime('%d/%m/%Y')}",
                color=Config.COLORS['INFO'],
                timestamp=datetime.utcnow()
            )
            
            embed.add_field(name="Total", value=stats['total'], inline=True)
            embed.add_field(name="En attente", value=stats['pending'], inline=True)
            embed.add_field(name="Approuvées", value=stats['approved'], inline=True)
            embed.add_field(name="Rejetées", value=stats['rejected'], inline=True)
            
            if stats['total'] > 0:
                approval_rate = (stats['approved'] / stats['total']) * 100
                embed.add_field(name="Taux d'approbation", value=f"{approval_rate:.1f}%", inline=True)
            
            await self.channel.send(embed=embed)
            
            logger.info(f"✅ Résumé quotidien envoyé pour le {today}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Erreur lors de l'envoi du résumé quotidien: {e}")
            return False

# Instance globale du service de notification
notification_service = None 