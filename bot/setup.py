#!/usr/bin/env python3
"""
Script de configuration interactif pour le bot Discord BDA Reservations
"""

import os
import sys

def main():
    print("🤖 Configuration du Bot Discord BDA Reservations")
    print("=" * 50)
    
    # Vérifier si le fichier .envbot existe
    if os.path.exists('.envbot'):
        print("⚠️  Le fichier .envbot existe déjà.")
        response = input("Voulez-vous le remplacer ? (o/n): ").lower()
        if response != 'o':
            print("Configuration annulée.")
            return
    
    print("\n📝 Veuillez fournir les informations suivantes :")
    print("(Laissez vide si vous ne savez pas encore)")
    
    # Collecter les informations
    config = {}
    
    print("\n🔑 Token du bot Discord :")
    print("(Trouvez-le dans Discord Developer Portal > Applications > Votre App > Bot)")
    config['DISCORD_TOKEN'] = input("Token: ").strip()
    
    print("\n🏠 ID du serveur Discord :")
    print("(Clic droit sur le nom du serveur > Copier l'identifiant)")
    config['GUILD_ID'] = input("Guild ID: ").strip()
    
    print("\n📺 ID du salon pour les notifications :")
    print("(Clic droit sur le salon > Copier l'identifiant)")
    config['CHANNEL_ID'] = input("Channel ID: ").strip()
    
    print("\n👑 ID du rôle admin :")
    print("(Clic droit sur le rôle > Copier l'identifiant)")
    config['ADMIN_ROLE_ID'] = input("Admin Role ID: ").strip()
    
    print("\n🗄️  Configuration MongoDB :")
    config['MONGODB_URI'] = input("URI MongoDB (défaut: mongodb://localhost:27017): ").strip() or "mongodb://localhost:27017"
    config['DATABASE_NAME'] = input("Nom de la base de données (défaut: bda_serv): ").strip() or "bda_serv"
    
    print("\n⚙️  Configuration du bot :")
    config['BOT_PREFIX'] = input("Préfixe des commandes (défaut: !): ").strip() or "!"
    config['BOT_NAME'] = input("Nom du bot (défaut: BDA Reservations Bot): ").strip() or "BDA Reservations Bot"
    
    # Créer le fichier .envbot
    env_content = f"""# Configuration Discord
DISCORD_TOKEN={config['DISCORD_TOKEN']}
GUILD_ID={config['GUILD_ID']}
CHANNEL_ID={config['CHANNEL_ID']}
ADMIN_ROLE_ID={config['ADMIN_ROLE_ID']}

# Configuration MongoDB
MONGODB_URI={config['MONGODB_URI']}
DATABASE_NAME={config['DATABASE_NAME']}

# Configuration du bot
BOT_PREFIX={config['BOT_PREFIX']}
BOT_NAME={config['BOT_NAME']}
"""
    
    try:
        with open('.envbot', 'w', encoding='utf-8') as f:
            f.write(env_content)
        
        print("\n✅ Configuration sauvegardée dans .envbot")
        
        # Vérifications
        print("\n🔍 Vérifications :")
        
        if not config['DISCORD_TOKEN']:
            print("⚠️  Token Discord manquant - vous devrez l'ajouter manuellement")
        
        if not config['GUILD_ID']:
            print("⚠️  Guild ID manquant - vous devrez l'ajouter manuellement")
        
        if not config['CHANNEL_ID']:
            print("⚠️  Channel ID manquant - vous devrez l'ajouter manuellement")
        
        if not config['ADMIN_ROLE_ID']:
            print("⚠️  Admin Role ID manquant - vous devrez l'ajouter manuellement")
        
        print("\n📋 Prochaines étapes :")
        print("1. Complétez les informations manquantes dans le fichier .envbot")
        print("2. Installez les dépendances : pip install -r requirements.txt")
        print("3. Démarrez le bot : python main.py")
        
    except Exception as e:
        print(f"❌ Erreur lors de la sauvegarde : {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 