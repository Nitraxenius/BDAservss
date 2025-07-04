# Bot Discord BDA Reservations

Bot Discord simple pour gérer les réservations de jeux via Discord, communiquant directement avec MongoDB.

## 🚀 Installation

1. **Installer les dépendances Python :**
```bash
pip install -r requirements.txt
```

2. **Configurer le fichier `.envbot` :**
```env
# Configuration Discord
DISCORD_TOKEN=your_bot_token_here
GUILD_ID=your_guild_id_here
CHANNEL_ID=your_channel_id_here
ADMIN_ROLE_ID=your_admin_role_id_here

# Configuration MongoDB
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=bda_serv

# Configuration du bot
BOT_PREFIX=!
BOT_NAME=BDA Reservations Bot
```

## 🔧 Configuration Discord

1. **Créer une application Discord :**
   - Allez sur [Discord Developer Portal](https://discord.com/developers/applications)
   - Créez une nouvelle application
   - Notez votre `APP_ID` et `PUBLIC_KEY`

2. **Créer un bot :**
   - Dans votre application, allez dans l'onglet "Bot"
   - Créez un bot et copiez le token
   - Activez les intents nécessaires (Message Content)

3. **Inviter le bot sur votre serveur :**
   - Utilisez ce lien (remplacez YOUR_APP_ID) :
   ```
   https://discord.com/api/oauth2/authorize?client_id=YOUR_APP_ID&permissions=8&scope=bot%20applications.commands
   ```

4. **Récupérer les IDs :**
   - `GUILD_ID` : ID de votre serveur (clic droit sur le nom du serveur → Copier l'identifiant)
   - `CHANNEL_ID` : ID du salon où le bot doit envoyer les notifications
   - `ADMIN_ROLE_ID` : ID du rôle admin qui peut gérer les réservations

## ⚠️ Résolution des problèmes

### Erreur "Privileged Intents Required"

Si vous obtenez cette erreur :
```
discord.errors.PrivilegedIntentsRequired: Shard ID None is requesting privileged intents that have not been explicitly enabled in the developer portal.
```

**Solution :**
1. Allez sur [Discord Developer Portal](https://discord.com/developers/applications)
2. Sélectionnez votre application
3. Allez dans l'onglet "Bot"
4. Activez les intents suivants :
   - ✅ **Message Content Intent**
   - ❌ **Server Members Intent** (pas nécessaire pour ce bot)
   - ❌ **Presence Intent** (pas nécessaire pour ce bot)

### Erreur d'encodage Unicode

Si vous voyez des erreurs d'encodage avec les emojis dans la console Windows, c'est normal. Le bot fonctionne correctement malgré ces erreurs.

## 📋 Commandes disponibles

### Commandes slash (pour les admins) :
- `/reservations list` - Liste toutes les réservations en attente
- `/reservations approve <id>` - Approuve une réservation
- `/reservations reject <id>` - Rejette une réservation
- `/reservations info <id>` - Affiche les détails d'une réservation

## 🔄 Fonctionnement

1. **Nouvelles réservations :** Le bot détecte automatiquement les nouvelles réservations dans MongoDB et envoie une notification dans le salon configuré

2. **Gestion des réservations :** Les admins peuvent approuver/rejeter les réservations via les commandes Discord

3. **Notifications :** Le bot envoie des rappels pour les réservations en attente depuis plus de 24h

4. **Résumés quotidiens :** Un résumé des réservations du jour est envoyé automatiquement

## 🚀 Démarrage

```bash
# Démarrage simple
python main.py

# Ou avec le script de démarrage
./start.sh  # Linux/Mac
start.bat   # Windows
```

## 📁 Structure du projet

```
bot/
├── main.py                 # Point d'entrée principal
├── config.py              # Configuration
├── database.py            # Interface MongoDB
├── .envbot               # Variables d'environnement
├── requirements.txt      # Dépendances Python
├── commands/            # Commandes Discord
│   ├── reservations.py  # Commandes de gestion des réservations
│   └── admin.py         # Commandes admin
├── services/            # Services du bot
│   └── notification_service.py  # Service de notification
├── utils/               # Utilitaires
│   ├── embeds.py        # Création d'embeds Discord
│   └── permissions.py   # Gestion des permissions
└── events/              # Événements Discord
    └── reservation_events.py  # Gestion des événements de réservation
```

## 🔒 Permissions requises

Le bot a besoin des permissions suivantes sur Discord :
- Lire les messages
- Envoyer des messages
- Utiliser les commandes slash
- Gérer les réactions

## 📝 Notes

- Le bot communique directement avec MongoDB, pas besoin d'API web
- Seuls les utilisateurs avec le rôle admin configuré peuvent utiliser les commandes
- Les réservations sont automatiquement synchronisées entre le site web et Discord via la base de données 