import discord
from discord import app_commands
from discord.ext import commands
import logging
from database import db
from utils.embeds import EmbedBuilder
from utils.permissions import check_admin_permission, send_permission_error
from config import Config

logger = logging.getLogger(__name__)

class ReservationCommands(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
    
    @app_commands.command(name="reservations", description="Gérer les réservations")
    @app_commands.describe(
        action="Action à effectuer",
        reservation_id="ID de la réservation (pour approve/reject/info)"
    )
    @app_commands.choices(action=[
        app_commands.Choice(name="list", value="list"),
        app_commands.Choice(name="approve", value="approve"),
        app_commands.Choice(name="reject", value="reject"),
        app_commands.Choice(name="info", value="info")
    ])
    async def reservations(self, interaction: discord.Interaction, action: str, reservation_id: str | None = None):
        """Commande principale pour gérer les réservations"""
        # Vérifier les permissions
        has_permission, error_message = check_admin_permission(interaction)
        if not has_permission:
            await send_permission_error(interaction, error_message)
            return
        
        # Vérifier le salon
        if not interaction.channel_id == Config.CHANNEL_ID:
            await send_permission_error(interaction, "Cette commande ne peut être utilisée que dans le salon des réservations")
            return
        
        await interaction.response.defer()
        
        try:
            if action == "list":
                await self.list_reservations(interaction)
            elif action == "approve":
                if not reservation_id:
                    await interaction.followup.send("❌ ID de réservation requis pour cette action")
                    return
                await self.approve_reservation(interaction, reservation_id)
            elif action == "reject":
                if not reservation_id:
                    await interaction.followup.send("❌ ID de réservation requis pour cette action")
                    return
                await self.reject_reservation(interaction, reservation_id)
            elif action == "info":
                if not reservation_id:
                    await interaction.followup.send("❌ ID de réservation requis pour cette action")
                    return
                await self.info_reservation(interaction, reservation_id)
        except Exception as e:
            logger.error(f"Erreur dans la commande reservations: {e}")
            embed = EmbedBuilder.create_error_embed("Erreur", f"Une erreur s'est produite: {str(e)}")
            await interaction.followup.send(embed=embed)
    
    async def list_reservations(self, interaction: discord.Interaction):
        """Liste toutes les réservations en attente"""
        reservations = db.get_pending_reservations()
        
        if not reservations:
            embed = EmbedBuilder.create_warning_embed("Aucune réservation", "Aucune réservation en attente")
            await interaction.followup.send(embed=embed)
            return
        
        # Récupérer les informations des jeux et utilisateurs
        for reservation in reservations:
            if 'game' not in reservation and 'gameId' in reservation:
                reservation['game'] = db.get_game_by_id(reservation['gameId'])
            if 'user' not in reservation and 'userId' in reservation:
                reservation['user'] = db.get_user_by_id(reservation['userId'])
        
        embed = EmbedBuilder.create_reservation_list_embed(reservations)
        await interaction.followup.send(embed=embed)
    
    async def approve_reservation(self, interaction: discord.Interaction, reservation_id: str):
        """Approuve une réservation"""
        # Récupérer la réservation
        reservation = db.get_reservation_by_id(reservation_id)
        if not reservation:
            embed = EmbedBuilder.create_error_embed("Réservation introuvable", f"Aucune réservation trouvée avec l'ID: {reservation_id}")
            await interaction.followup.send(embed=embed)
            return
        
        if reservation['status'] != 'pending':
            embed = EmbedBuilder.create_warning_embed("Action impossible", f"Cette réservation est déjà {reservation['status']}")
            await interaction.followup.send(embed=embed)
            return
        
        # Mettre à jour le statut
        success = db.update_reservation_status(reservation_id, 'approved', f"Approuvé par {interaction.user.name}")
        
        if success:
            embed = EmbedBuilder.create_success_embed("Réservation approuvée", f"La réservation {reservation_id} a été approuvée avec succès")
            await interaction.followup.send(embed=embed)
            
            # Notifier l'utilisateur si possible
            await self.notify_user_reservation_update(reservation, 'approved')
        else:
            embed = EmbedBuilder.create_error_embed("Erreur", "Impossible de mettre à jour la réservation")
            await interaction.followup.send(embed=embed)
    
    async def reject_reservation(self, interaction: discord.Interaction, reservation_id: str):
        """Rejette une réservation"""
        # Récupérer la réservation
        reservation = db.get_reservation_by_id(reservation_id)
        if not reservation:
            embed = EmbedBuilder.create_error_embed("Réservation introuvable", f"Aucune réservation trouvée avec l'ID: {reservation_id}")
            await interaction.followup.send(embed=embed)
            return
        
        if reservation['status'] != 'pending':
            embed = EmbedBuilder.create_warning_embed("Action impossible", f"Cette réservation est déjà {reservation['status']}")
            await interaction.followup.send(embed=embed)
            return
        
        # Demander une raison pour le rejet
        embed = discord.Embed(
            title="❓ Raison du rejet",
            description="Veuillez fournir une raison pour le rejet de cette réservation",
            color=Config.COLORS['WARNING']
        )
        await interaction.followup.send(embed=embed)
        
        # TODO: Implémenter la logique pour récupérer la raison
        # Pour l'instant, on utilise une raison par défaut
        reason = f"Rejeté par {interaction.user.name}"
        
        # Mettre à jour le statut
        success = db.update_reservation_status(reservation_id, 'rejected', reason)
        
        if success:
            embed = EmbedBuilder.create_success_embed("Réservation rejetée", f"La réservation {reservation_id} a été rejetée")
            await interaction.followup.send(embed=embed)
            
            # Notifier l'utilisateur si possible
            await self.notify_user_reservation_update(reservation, 'rejected', reason)
        else:
            embed = EmbedBuilder.create_error_embed("Erreur", "Impossible de mettre à jour la réservation")
            await interaction.followup.send(embed=embed)
    
    async def info_reservation(self, interaction: discord.Interaction, reservation_id: str):
        """Affiche les détails d'une réservation"""
        # Récupérer la réservation
        reservation = db.get_reservation_by_id(reservation_id)
        if not reservation:
            embed = EmbedBuilder.create_error_embed("Réservation introuvable", f"Aucune réservation trouvée avec l'ID: {reservation_id}")
            await interaction.followup.send(embed=embed)
            return
        
        # Récupérer les informations du jeu et de l'utilisateur
        game = None
        user = None
        
        if 'gameId' in reservation:
            game = db.get_game_by_id(reservation['gameId'])
        if 'userId' in reservation:
            user = db.get_user_by_id(reservation['userId'])
        
        embed = EmbedBuilder.create_reservation_detail_embed(reservation, game, user)
        await interaction.followup.send(embed=embed)
    
    async def notify_user_reservation_update(self, reservation, status, reason=None):
        """Notifie l'utilisateur d'une mise à jour de sa réservation"""
        # TODO: Implémenter la notification utilisateur
        # Cela pourrait être via un webhook Discord privé ou un email
        logger.info(f"Réservation {reservation['_id']} mise à jour vers {status}")
        pass

async def setup(bot):
    await bot.add_cog(ReservationCommands(bot)) 