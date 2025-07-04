# Image de base Python
FROM python:3.11-slim

# Définir le répertoire de travail
WORKDIR /app

# Installer les dépendances système
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copier les fichiers de dépendances
COPY requirements.txt .

# Installer les dépendances Python
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code du bot
COPY . .

# Créer le dossier de logs
RUN mkdir -p /app/logs

# Exposer le port (optionnel, pour les webhooks)
EXPOSE 8000

# Commande de démarrage
CMD ["python", "main.py"] 