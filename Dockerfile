# Dockerfile pour le site web Node.js
FROM node:18-alpine AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY . .

# Créer un utilisateur non-root pour la sécurité
FROM node:18-alpine AS runtime

# Installer dumb-init pour gérer les signaux
RUN apk add --no-cache dumb-init

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Définir le répertoire de travail
WORKDIR /app

# Copier les dépendances et le code depuis le builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app .

# Créer les répertoires nécessaires
RUN mkdir -p logs && chown -R nodejs:nodejs logs

# Exposer le port
EXPOSE 3000

# Utiliser dumb-init pour gérer les signaux
ENTRYPOINT ["dumb-init", "--"]

# Commande par défaut
CMD ["node", "server.js"] 