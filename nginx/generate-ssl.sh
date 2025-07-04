#!/bin/bash

# Script pour générer des certificats SSL auto-signés
# Usage: ./generate-ssl.sh

echo "🔐 Génération des certificats SSL auto-signés..."

# Créer le répertoire ssl s'il n'existe pas
mkdir -p ssl

# Générer la clé privée
openssl genrsa -out ssl/key.pem 2048

# Générer le certificat auto-signé
openssl req -new -x509 -key ssl/key.pem -out ssl/cert.pem -days 365 -subj "/C=FR/ST=France/L=Paris/O=BDAserv/CN=localhost"

# Définir les permissions
chmod 600 ssl/key.pem
chmod 644 ssl/cert.pem

echo "✅ Certificats SSL générés avec succès !"
echo "📁 Fichiers créés :"
echo "   - ssl/key.pem (clé privée)"
echo "   - ssl/cert.pem (certificat)"
echo ""
echo "⚠️  ATTENTION : Ces certificats sont auto-signés pour le développement."
echo "   Pour la production, utilisez des certificats Let's Encrypt ou d'un CA reconnu." 