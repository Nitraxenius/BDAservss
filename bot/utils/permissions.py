import discord
from config import Config

def has_admin_role(member):
    """Vérifie si un membre a le rôle admin"""
    if not member:
        return False
    
    # Vérifier si le membre a le rôle admin
    if Config.ADMIN_ROLE_ID and any(role.id == Config.ADMIN_ROLE_ID for role in member.roles):
        return True
    
    # Vérifier si le membre est administrateur du serveur
    if member.guild_permissions.administrator:
        return True
    
    return False

def check_admin_permission(interaction):
    """Vérifie les permissions admin pour une interaction"""
    if not interaction.guild:
        return False, "Cette commande ne peut être utilisée que sur un serveur"
    
    if not has_admin_role(interaction.user):
        return False, "Vous n'avez pas les permissions nécessaires pour utiliser cette commande"
    
    return True, None

async def send_permission_error(interaction, error_message):
    """Envoie un message d'erreur de permission"""
    embed = discord.Embed(
        title="❌ Permission refusée",
        description=error_message,
        color=Config.COLORS['ERROR']
    )
    
    if interaction.response.is_done():
        await interaction.followup.send(embed=embed, ephemeral=True)
    else:
        await interaction.response.send_message(embed=embed, ephemeral=True)

def is_in_correct_channel(channel_id):
    """Vérifie si la commande est exécutée dans le bon salon"""
    return channel_id == Config.CHANNEL_ID 