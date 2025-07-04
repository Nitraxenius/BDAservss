# Image de base Nginx
FROM nginx:alpine

# Installer les outils nécessaires
RUN apk add --no-cache openssl

# Créer le répertoire pour les certificats
RUN mkdir -p /etc/nginx/ssl

# Copier la configuration Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copier les certificats SSL (s'ils existent)
COPY ssl/ /etc/nginx/ssl/

# Exposer les ports HTTP et HTTPS
EXPOSE 80 443

# Commande de démarrage
CMD ["nginx", "-g", "daemon off;"] 