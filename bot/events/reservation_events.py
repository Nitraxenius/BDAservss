import discord
from discord.ext import commands
import logging
from database import db
from utils.embeds import EmbedBuilder
from utils.permissions import has_admin_role
from config import Config

logger = logging.getLogger(__name__)

class ReservationEvents(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
    
    @commands.Cog.listener()
    async def on_raw_reaction_add(self, payload):
        """Gère les réactions sur les messages de réservation"""
        # Vérifier que c'est dans le bon salon
        if payload.channel_id != Config.CHANNEL_ID:
            return
        
        # Vérifier que c'est un message du bot
        channel = self.bot.get_channel(payload.channel_id)
        if not channel:
            return
        
        try:
            message = await channel.fetch_message(payload.message_id)
        except:
            return
        
        if message.author.id != self.bot.user.id:
            return
        
        # Récupérer la réservation associée au message
        reservation = db.get_reservation_by_discord_message(str(payload.message_id))
        if not reservation:
            return
        
        # Vérifier les permissions de l'utilisateur
        guild = self.bot.get_guild(payload.guild_id)
        if not guild:
            return
            
        # Utiliser fetch_member au lieu de get_member pour éviter l'intent members
        try:
            member = await guild.fetch_member(payload.user_id)
        except:
            # Si on ne peut pas récupérer le membre, on ignore la réaction
            return
        
        if not has_admin_role(member):
            # Supprimer la réaction si l'utilisateur n'a pas les permissions
            try:
                await message.remove_reaction(payload.emoji, member)
            except:
                pass
            return
        
        # Traiter la réaction
        if str(payload.emoji) == Config.EMOJIS['APPROVE']:
            await self.handle_approve_reaction(reservation, message, member)
        elif str(payload.emoji) == Config.EMOJIS['REJECT']:
            await self.handle_reject_reaction(reservation, message, member)
        elif str(payload.emoji) == Config.EMOJIS['INFO']:
            await self.handle_info_reaction(reservation, message, member)
    
    async def handle_approve_reaction(self, reservation, message, member):
        """Gère la réaction d'approbation"""
        if reservation['status'] != 'pending':
            return
        
        # Mettre à jour le statut
        success = db.update_reservation_status(
            reservation['_id'], 
            'approved', 
            f"Approuvé par {member.name} via Discord"
        )
        
        if success:
            # Mettre à jour l'embed
            embed = message.embeds[0]
            embed.color = Config.COLORS['APPROVED']
            embed.set_field_at(0, name="Statut", value="✅ APPROUVÉ", inline=True)
            
            await message.edit(embed=embed)
            
            # Ajouter une réaction de confirmation
            await message.add_reaction('✅')
            
            logger.info(f"Réservation {reservation['_id']} approuvée par {member.name}")
    
    async def handle_reject_reaction(self, reservation, message, member):
        """Gère la réaction de rejet"""
        if reservation['status'] != 'pending':
            return
        
        # Mettre à jour le statut
        success = db.update_reservation_status(
            reservation['_id'], 
            'rejected', 
            f"Rejeté par {member.name} via Discord"
        )
        
        if success:
            # Mettre à jour l'embed
            embed = message.embeds[0]
            embed.color = Config.COLORS['REJECTED']
            embed.set_field_at(0, name="Statut", value="❌ REJETÉ", inline=True)
            
            await message.edit(embed=embed)
            
            # Ajouter une réaction de confirmation
            await message.add_reaction('❌')
            
            logger.info(f"Réservation {reservation['_id']} rejetée par {member.name}")
    
    async def handle_info_reaction(self, reservation, message, member):
        """Gère la réaction d'information"""
        # Récupérer les informations complètes
        game = None
        user = None
        
        if 'gameId' in reservation:
            game = db.get_game_by_id(reservation['gameId'])
        if 'userId' in reservation:
            user = db.get_user_by_id(reservation['userId'])
        
        # Créer un embed détaillé
        embed = EmbedBuilder.create_reservation_detail_embed(reservation, game, user)
        
        # Envoyer l'embed en message temporaire
        await message.channel.send(embed=embed, delete_after=30)
    
    @commands.Cog.listener()
    async def on_message(self, message):
        """Gère les messages pour détecter les nouvelles réservations"""
        # Ignorer les messages du bot
        if message.author == self.bot.user:
            return
        
        # Vérifier que c'est dans le bon salon
        if message.channel.id != Config.CHANNEL_ID:
            return
        
        # Vérifier les permissions
        if not has_admin_role(message.author):
            return
        
        # Traiter les commandes textuelles (fallback)
        if message.content.startswith(Config.BOT_PREFIX):
            await self.handle_text_command(message)
    
    async def handle_text_command(self, message):
        """Gère les commandes textuelles (fallback)"""
        content = message.content[len(Config.BOT_PREFIX):].strip()
        parts = content.split()
        
        if not parts:
            return
        
        command = parts[0].lower()
        
        try:
            if command == "list":
                await self.list_reservations_text(message)
            elif command == "stats":
                await self.stats_text(message)
            elif command == "help":
                await self.help_text(message)
        except Exception as e:
            logger.error(f"Erreur dans la commande textuelle: {e}")
            await message.channel.send(f"❌ Erreur: {str(e)}")
    
    async def list_reservations_text(self, message):
        """Liste les réservations en attente (commande textuelle)"""
        reservations = db.get_pending_reservations()
        
        if not reservations:
            embed = EmbedBuilder.create_warning_embed("Aucune réservation", "Aucune réservation en attente")
            await message.channel.send(embed=embed)
            return
        
        embed = EmbedBuilder.create_reservation_list_embed(reservations)
        await message.channel.send(embed=embed)
    
    async def stats_text(self, message):
        """Affiche les statistiques (commande textuelle)"""
        all_reservations = db.get_reservations()
        
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
        
        embed = discord.Embed(
            title="📊 Statistiques",
            color=Config.COLORS['INFO']
        )
        
        embed.add_field(name="Total", value=stats['total'], inline=True)
        embed.add_field(name="En attente", value=stats['pending'], inline=True)
        embed.add_field(name="Approuvées", value=stats['approved'], inline=True)
        embed.add_field(name="Rejetées", value=stats['rejected'], inline=True)
        
        await message.channel.send(embed=embed)
    
    async def help_text(self, message):
        """Affiche l'aide (commande textuelle)"""
        embed = discord.Embed(
            title="🤖 Aide du bot",
            description="Commandes disponibles:",
            color=Config.COLORS['INFO']
        )
        
        embed.add_field(
            name="Commandes slash",
            value="`/reservations` - Gérer les réservations\n`/stats` - Statistiques\n`/status` - Statut du bot",
            inline=False
        )
        
        embed.add_field(
            name="Réactions",
            value="✅ - Approuver\n❌ - Rejeter\nℹ️ - Voir les détails",
            inline=False
        )
        
        embed.add_field(
            name="Commandes textuelles",
            value="`!list` - Liste des réservations\n`!stats` - Statistiques\n`!help` - Cette aide",
            inline=False
        )
        
        await message.channel.send(embed=embed)

async def setup(bot):
    await bot.add_cog(ReservationEvents(bot)) 