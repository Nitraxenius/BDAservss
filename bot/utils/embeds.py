import discord
from datetime import datetime
from config import Config

class EmbedBuilder:
    @staticmethod
    def create_reservation_embed(reservation, game=None, user=None):
        """Crée un embed pour une réservation"""
        embed = discord.Embed(
            title=f"🎮 Nouvelle réservation - {game['name'] if game else 'Jeu inconnu'}",
            description=f"Une nouvelle réservation a été créée",
            color=Config.COLORS['PENDING'],
            timestamp=datetime.utcnow()
        )
        
        # Informations sur la réservation
        embed.add_field(
            name="📅 Début de réservation",
            value=f"<t:{int(datetime.fromisoformat(str(reservation['startDate'])).timestamp())}:F>",
            inline=True
        )
        
        embed.add_field(
            name="📅 Fin de réservation",
            value=f"<t:{int(datetime.fromisoformat(str(reservation['endDate'])).timestamp())}:F>",
            inline=True
        )
        
        embed.add_field(
            name="👤 Utilisateur",
            value=f"{user['username'] if user else 'Utilisateur inconnu'}",
            inline=True
        )
        
        if reservation.get('notes'):
            embed.add_field(
                name="📝 Notes",
                value=reservation['notes'],
                inline=False
            )
        
        # Informations sur le jeu
        if game:
            embed.add_field(
                name="🎯 Détails du jeu",
                value=f"**Joueurs:** {game.get('players', 'N/A')}\n**Durée:** {game.get('duration', 'N/A')}\n**Âge:** {game.get('age', 'N/A')}",
                inline=False
            )
        
        embed.set_footer(text=f"ID: {reservation['_id']}")
        
        return embed
    
    @staticmethod
    def create_reservation_list_embed(reservations, title="Réservations en attente"):
        """Crée un embed pour la liste des réservations"""
        embed = discord.Embed(
            title=title,
            color=Config.COLORS['INFO'],
            timestamp=datetime.utcnow()
        )
        
        if not reservations:
            embed.description = "Aucune réservation en attente"
            return embed
        
        for reservation in reservations[:10]:  # Limite à 10 réservations
            game = reservation.get('game', {})
            user = reservation.get('user', {})
            
            embed.add_field(
                name=f"🎮 {game.get('name', 'Jeu inconnu')} - {user.get('username', 'Utilisateur inconnu')}",
                value=f"📅 <t:{int(datetime.fromisoformat(str(reservation['startDate'])).timestamp())}:F>\n⏰ <t:{int(datetime.fromisoformat(str(reservation['endDate'])).timestamp())}:F>\nID: `{reservation['_id']}`",
                inline=False
            )
        
        if len(reservations) > 10:
            embed.set_footer(text=f"Affichage des 10 premières réservations sur {len(reservations)}")
        
        return embed
    
    @staticmethod
    def create_reservation_detail_embed(reservation, game=None, user=None):
        """Crée un embed détaillé pour une réservation"""
        embed = discord.Embed(
            title=f"📋 Détails de la réservation",
            color=Config.COLORS['INFO'],
            timestamp=datetime.utcnow()
        )
        
        # Statut
        status_emoji = {
            'pending': '⏳',
            'approved': '✅',
            'rejected': '❌'
        }.get(reservation['status'], '❓')
        
        embed.add_field(
            name="Statut",
            value=f"{status_emoji} {reservation['status'].upper()}",
            inline=True
        )
        
        # Dates
        embed.add_field(
            name="Début",
            value=f"<t:{int(datetime.fromisoformat(str(reservation['startDate'])).timestamp())}:F>",
            inline=True
        )
        
        embed.add_field(
            name="Fin",
            value=f"<t:{int(datetime.fromisoformat(str(reservation['endDate'])).timestamp())}:F>",
            inline=True
        )
        
        # Utilisateur
        embed.add_field(
            name="Utilisateur",
            value=f"{user['username'] if user else 'Inconnu'}",
            inline=True
        )
        
        # Jeu
        if game:
            embed.add_field(
                name="Jeu",
                value=f"**{game['name']}**\nJoueurs: {game.get('players', 'N/A')}\nDurée: {game.get('duration', 'N/A')}",
                inline=False
            )
        
        # Notes
        if reservation.get('notes'):
            embed.add_field(
                name="Notes",
                value=reservation['notes'],
                inline=False
            )
        
        # Notes admin
        if reservation.get('admin_notes'):
            embed.add_field(
                name="Notes admin",
                value=reservation['admin_notes'],
                inline=False
            )
        
        embed.set_footer(text=f"ID: {reservation['_id']}")
        
        return embed
    
    @staticmethod
    def create_success_embed(title, description):
        """Crée un embed de succès"""
        return discord.Embed(
            title=f"✅ {title}",
            description=description,
            color=Config.COLORS['SUCCESS'],
            timestamp=datetime.utcnow()
        )
    
    @staticmethod
    def create_error_embed(title, description):
        """Crée un embed d'erreur"""
        return discord.Embed(
            title=f"❌ {title}",
            description=description,
            color=Config.COLORS['ERROR'],
            timestamp=datetime.utcnow()
        )
    
    @staticmethod
    def create_warning_embed(title, description):
        """Crée un embed d'avertissement"""
        return discord.Embed(
            title=f"⚠️ {title}",
            description=description,
            color=Config.COLORS['WARNING'],
            timestamp=datetime.utcnow()
        ) 