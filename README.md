# 🎲 Bureau des Jeux - Système de Réservations

Un système complet de gestion de réservations de jeux de société comprenant un site web Node.js/MongoDB et un bot Discord Python pour les notifications et la gestion des réservations.

## 📋 Fonctionnalités

### 🌐 Site Web (Node.js/Express)
- **Authentification JWT** avec access tokens (15 min) et refresh tokens (30 jours)
- **Gestion des jeux** : catalogue, ajout, modification, suppression
- **Système de réservations** : création, modification, statuts
- **Gestion des cotisants** : liste des membres, statuts
- **Interface d'administration** sécurisée
- **Nettoyage automatique** des tokens révoqués
- **Sécurité renforcée** : CORS, Helmet, rate limiting

### 🤖 Bot Discord (Python)
- **Notifications automatiques** des nouvelles réservations
- **Commandes slash** pour gérer les réservations
- **Système de réactions** pour approuver/rejeter
- **Résumés quotidiens** et rappels automatiques
- **Synchronisation directe** avec MongoDB
- **Gestion des permissions** par rôle

## 🚀 Installation

### Prérequis
- Node.js (v16+)
- Python (v3.8+)
- MongoDB (v5+)
- Discord Bot Token

### 1. Cloner le repository
```bash
git clone <votre-repo>
cd BDAserv
```

### 2. Configuration de la base de données
```bash
# Installer les dépendances
npm install

# Configurer MongoDB (voir MONGODB_SECURITY.md)
npm run secure-mongo

# Tester la connexion
npm run test-mongo-auth

# Peupler la base de données
npm run seed
```

### 3. Configuration du site web
```bash
# Créer le fichier .env
cp env.example .env
# Éditer .env avec vos configurations
```

Variables d'environnement requises :
```env
# MongoDB
MONGO_URI=mongodb://username:password@localhost:27017/bda_serv

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# Serveur
PORT=3000
NODE_ENV=development

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### 4. Configuration du bot Discord
```bash
cd bot

# Installer les dépendances Python
pip install -r requirements.txt

# Configurer le bot
cp .envbot.example .envbot
# Éditer .envbot avec vos configurations Discord
```

Variables d'environnement du bot :
```env
# Discord
DISCORD_TOKEN=your_bot_token_here
GUILD_ID=your_guild_id_here
CHANNEL_ID=your_channel_id_here
ADMIN_ROLE_ID=your_admin_role_id_here

# MongoDB
MONGODB_URI=mongodb://username:password@localhost:27017
DATABASE_NAME=bda_serv
```

## 🏃‍♂️ Démarrage

### Site Web
```bash
# Développement
npm run dev

# Production
npm start
```

### Bot Discord
```bash
cd bot

# Démarrage simple
python main.py

# Ou avec les scripts
./start.sh  # Linux/Mac
start.bat   # Windows
```

## 📁 Structure du projet

```
BDAserv/
├── 📁 bot/                    # Bot Discord Python
│   ├── main.py               # Point d'entrée du bot
│   ├── config.py             # Configuration
│   ├── database.py           # Interface MongoDB
│   ├── commands/             # Commandes Discord
│   ├── services/             # Services du bot
│   ├── utils/                # Utilitaires
│   └── events/               # Événements Discord
├── 📁 routes/                # Routes API Express
│   ├── auth.js              # Authentification
│   ├── games.js             # Gestion des jeux
│   ├── reservations.js      # Réservations
│   └── cotisants.js         # Gestion des cotisants
├── 📁 models/                # Modèles MongoDB
│   ├── user.js              # Utilisateurs
│   ├── jeux.js              # Jeux
│   ├── reservation.js       # Réservations
│   ├── Cotisant.js          # Cotisants
│   └── refreshToken.js      # Tokens de rafraîchissement
├── 📁 middleware/            # Middleware Express
│   └── auth.js              # Authentification
├── 📁 public/                # Fichiers statiques
├── server.js                # Serveur Express principal
├── seed.js                  # Script de peuplement
├── cleanup-tokens.js        # Nettoyage des tokens
├── secure-mongodb.js        # Sécurisation MongoDB
└── test-mongo-auth.js       # Tests de connexion
```

## 🔧 Scripts disponibles

### Site Web
```bash
npm run dev              # Démarrage en mode développement
npm start               # Démarrage en production
npm run seed            # Peupler la base de données
npm run cleanup-tokens  # Nettoyer les tokens révoqués
npm run token-stats     # Voir les statistiques des tokens
npm run secure-mongo    # Sécuriser MongoDB
npm run test-mongo-auth # Tester l'authentification MongoDB
npm run mongo-check     # Vérifier la configuration MongoDB
```

### Bot Discord
```bash
cd bot
python main.py          # Démarrage du bot
python setup.py         # Configuration initiale
```

## 🔒 Sécurité

### MongoDB
- Authentification par utilisateur
- Rôles limités (lecture/écriture)
- Chiffrement des connexions
- Voir `MONGODB_SECURITY.md` pour la configuration complète

### Authentification
- JWT avec access tokens courts (15 min)
- Refresh tokens longs (30 jours) avec révocation
- Nettoyage automatique des tokens expirés
- Cookies httpOnly sécurisés

### API
- CORS configuré
- Helmet pour les headers de sécurité
- Rate limiting
- Validation des données

## 📚 Documentation

- [Sécurisation MongoDB](MONGODB_SECURITY.md) - Guide complet pour sécuriser MongoDB
- [Gestion des tokens](TOKEN_CLEANUP.md) - Documentation sur le nettoyage des tokens
- [README du Bot](bot/README.md) - Documentation détaillée du bot Discord

## 🛠️ Maintenance

### Nettoyage automatique des tokens
Le système nettoie automatiquement les tokens révoqués de plus de 7 jours. Vous pouvez aussi le faire manuellement :

```bash
npm run cleanup-tokens
```

### Statistiques des tokens
```bash
npm run token-stats
```

### Vérification MongoDB
```bash
npm run mongo-check
```

## 🐛 Résolution des problèmes

### Bot Discord
- **Erreur "Privileged Intents Required"** : Activez le "Message Content Intent" dans le portail développeur Discord
- **Erreurs d'encodage Unicode** : Normales sous Windows, le bot fonctionne correctement

### Site Web
- **Erreur de connexion MongoDB** : Vérifiez les credentials et la configuration dans `MONGODB_SECURITY.md`
- **Erreurs CORS** : Vérifiez `ALLOWED_ORIGINS` dans le fichier `.env`

## 🤝 Contribution

1. Fork le projet
2. Créez une branche pour votre fonctionnalité
3. Committez vos changements
4. Poussez vers la branche
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👥 Auteurs

- Développé pour le Bureau des Jeux
- Système de réservations avec bot Discord et site web

---

**Note** : Ce projet nécessite une configuration MongoDB sécurisée. Consultez `MONGODB_SECURITY.md` pour la configuration complète. 