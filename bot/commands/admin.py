import discord
from discord import app_commands
from discord.ext import commands
import logging
from database import db
from utils.embeds import EmbedBuilder
from utils.permissions import check_admin_permission, send_permission_error
from config import Config
from datetime import datetime
import asyncio

logger = logging.getLogger(__name__)

class AdminCommands(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
    
    @app_commands.command(name="stats", description="Afficher les statistiques des réservations")
    async def stats(self, interaction: discord.Interaction):
        """Affiche les statistiques des réservations"""
        # Vérifier les permissions
        has_permission, error_message = check_admin_permission(interaction)
        if not has_permission:
            await send_permission_error(interaction, error_message)
            return
        
        await interaction.response.defer()
        
        try:
            # Récupérer toutes les réservations
            all_reservations = db.get_reservations()
            
            # Compter par statut
            stats = {
                'pending': 0,
                'approved': 0,
                'rejected': 0,
                'total': len(all_reservations)
            }
            
            for reservation in all_reservations:
                status = reservation.get('status', 'unknown')
                if status in stats:
                    stats[status] += 1
            
            # Créer l'embed
            embed = discord.Embed(
                title="📊 Statistiques des réservations",
                color=Config.COLORS['INFO'],
                timestamp=discord.utils.utcnow()
            )
            
            embed.add_field(
                name="📈 Total",
                value=f"**{stats['total']}** réservations",
                inline=True
            )
            
            embed.add_field(
                name="⏳ En attente",
                value=f"**{stats['pending']}** réservations",
                inline=True
            )
            
            embed.add_field(
                name="✅ Approuvées",
                value=f"**{stats['approved']}** réservations",
                inline=True
            )
            
            embed.add_field(
                name="❌ Rejetées",
                value=f"**{stats['rejected']}** réservations",
                inline=True
            )
            
            # Calculer le pourcentage d'approbation
            if stats['total'] > 0:
                approval_rate = (stats['approved'] / stats['total']) * 100
                embed.add_field(
                    name="📊 Taux d'approbation",
                    value=f"**{approval_rate:.1f}%**",
                    inline=True
                )
            
            await interaction.followup.send(embed=embed)
            
        except Exception as e:
            logger.error(f"Erreur dans la commande stats: {e}")
            embed = EmbedBuilder.create_error_embed("Erreur", f"Une erreur s'est produite: {str(e)}")
            await interaction.followup.send(embed=embed)
    
    @app_commands.command(name="sync", description="Synchroniser les commandes slash")
    async def sync(self, interaction: discord.Interaction):
        """Synchronise les commandes slash avec Discord"""
        # Vérifier les permissions
        has_permission, error_message = check_admin_permission(interaction)
        if not has_permission:
            await send_permission_error(interaction, error_message)
            return
        
        await interaction.response.defer()
        
        try:
            # Synchroniser les commandes
            await self.bot.tree.sync()
            
            embed = EmbedBuilder.create_success_embed(
                "Synchronisation réussie",
                "Les commandes slash ont été synchronisées avec Discord"
            )
            await interaction.followup.send(embed=embed)
            
        except Exception as e:
            logger.error(f"Erreur lors de la synchronisation: {e}")
            embed = EmbedBuilder.create_error_embed("Erreur", f"Erreur lors de la synchronisation: {str(e)}")
            await interaction.followup.send(embed=embed)
    
    @app_commands.command(name="ping", description="Vérifier la latence du bot")
    async def ping(self, interaction: discord.Interaction):
        """Vérifie la latence du bot"""
        latency = round(self.bot.latency * 1000)
        
        embed = discord.Embed(
            title="🏓 Pong!",
            description=f"Latence: **{latency}ms**",
            color=Config.COLORS['SUCCESS'] if latency < 100 else Config.COLORS['WARNING']
        )
        
        await interaction.response.send_message(embed=embed)
    
    @app_commands.command(name="status", description="Afficher le statut du bot")
    async def status(self, interaction: discord.Interaction):
        """Affiche le statut du bot"""
        # Vérifier les permissions
        has_permission, error_message = check_admin_permission(interaction)
        if not has_permission:
            await send_permission_error(interaction, error_message)
            return
        
        await interaction.response.defer()
        
        try:
            # Vérifier la connexion à la base de données
            db_status = "✅ Connecté"
            try:
                if db.client:
                    db.client.admin.command('ping')
                else:
                    db_status = "❌ Déconnecté"
            except:
                db_status = "❌ Déconnecté"
            
            # Vérifier la connexion Discord
            discord_status = "✅ Connecté" if self.bot.is_ready() else "❌ Déconnecté"
            
            embed = discord.Embed(
                title="🔧 Statut du bot",
                color=Config.COLORS['INFO'],
                timestamp=discord.utils.utcnow()
            )
            
            embed.add_field(
                name="Discord",
                value=discord_status,
                inline=True
            )
            
            embed.add_field(
                name="Base de données",
                value=db_status,
                inline=True
            )
            
            embed.add_field(
                name="Latence",
                value=f"**{round(self.bot.latency * 1000)}ms**",
                inline=True
            )
            
            embed.add_field(
                name="Serveurs",
                value=f"**{len(self.bot.guilds)}** serveurs",
                inline=True
            )
            
            embed.add_field(
                name="Utilisateurs",
                value=f"**{len(self.bot.users)}** utilisateurs",
                inline=True
            )
            
            await interaction.followup.send(embed=embed)
            
        except Exception as e:
            logger.error(f"Erreur dans la commande status: {e}")
            embed = EmbedBuilder.create_error_embed("Erreur", f"Une erreur s'est produite: {str(e)}")
            await interaction.followup.send(embed=embed)
    
    @app_commands.command(name="test_notification", description="Envoie une notification de test avec réactions")
    async def test_notification(self, interaction: discord.Interaction):
        """Envoie une notification de test avec réactions"""
        # Vérifier les permissions
        has_permission, error_message = check_admin_permission(interaction)
        if not has_permission:
            await send_permission_error(interaction, error_message)
            return
        
        await interaction.response.defer()
        
        try:
            # Créer un embed de test
            embed = discord.Embed(
                title="🎮 Test - Nouvelle réservation",
                description="Ceci est une notification de test",
                color=Config.COLORS['PENDING'],
                timestamp=discord.utils.utcnow()
            )
            
            embed.add_field(
                name="📅 Date de réservation",
                value=f"<t:{int(datetime.now().timestamp())}:F>",
                inline=True
            )
            
            embed.add_field(
                name="👤 Utilisateur",
                value="Utilisateur de test",
                inline=True
            )
            
            embed.add_field(
                name="🎯 Jeu",
                value="Jeu de test",
                inline=False
            )
            
            embed.set_footer(text="ID: test_123")
            
            # Envoyer le message
            try:
                message = await interaction.channel.send(embed=embed)  # type: ignore
            except AttributeError:
                await interaction.followup.send("❌ Impossible d'envoyer le message dans ce type de salon.")
                return
            
            # Ajouter les réactions
            await message.add_reaction(Config.EMOJIS['APPROVE'])
            await message.add_reaction(Config.EMOJIS['REJECT'])
            await message.add_reaction(Config.EMOJIS['INFO'])
            
            await interaction.followup.send("✅ Notification de test envoyée avec réactions !")
            
        except Exception as e:
            logger.error(f"Erreur dans la commande test_notification: {e}")
            embed = EmbedBuilder.create_error_embed("Erreur", f"Une erreur s'est produite: {str(e)}")
            await interaction.followup.send(embed=embed)
    

    
    @app_commands.command(name="notify_all", description="Envoie des notifications pour toutes les réservations en attente")
    async def notify_all(self, interaction: discord.Interaction):
        """Envoie des notifications pour toutes les réservations en attente"""
        # Vérifier les permissions
        has_permission, error_message = check_admin_permission(interaction)
        if not has_permission:
            await send_permission_error(interaction, error_message)
            return
        
        await interaction.response.defer()
        
        try:
            # Récupérer toutes les réservations en attente
            pending_reservations = db.get_pending_reservations()
            
            if not pending_reservations:
                await interaction.followup.send("Aucune réservation en attente à notifier.")
                return
            
            # Envoyer une notification pour chaque réservation
            count = 0
            for reservation in pending_reservations:
                if not reservation.get('discord_message_id'):
                    # Envoyer la notification
                    from services.notification_service import NotificationService
                    notification_service = NotificationService(self.bot)
                    await notification_service.initialize()
                    await notification_service.send_reservation_notification(reservation['_id'])
                    count += 1
                    await asyncio.sleep(1)  # Attendre 1 seconde entre chaque notification
            
            await interaction.followup.send(f"✅ {count} notification(s) envoyée(s) pour les réservations en attente.")
            
        except Exception as e:
            logger.error(f"Erreur dans la commande notify_all: {e}")
            embed = EmbedBuilder.create_error_embed("Erreur", f"Une erreur s'est produite: {str(e)}")
            await interaction.followup.send(embed=embed)

async def setup(bot):
    await bot.add_cog(AdminCommands(bot)) 