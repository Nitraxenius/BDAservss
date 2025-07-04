#!/bin/bash

echo "========================================"
echo "   Bot Discord - Gestion Reservations"
echo "========================================"
echo

# Vérifier si Python est installé
if ! command -v python3 &> /dev/null; then
    echo "ERREUR: Python 3 n'est pas installé"
    echo "Veuillez installer Python 3.8+"
    exit 1
fi

# Vérifier si le fichier .env existe
if [ ! -f ".env" ]; then
    echo "ATTENTION: Fichier .env manquant"
    echo "Copiez env.example vers .env et configurez vos variables"
    echo
    cp env.example .env
    echo "Fichier .env créé. Veuillez le configurer avant de relancer."
    exit 1
fi

# Installer les dépendances si nécessaire
echo "Installation/vérification des dépendances..."
pip3 install -r requirements.txt

echo
echo "Démarrage du bot..."
echo "Appuyez sur Ctrl+C pour arrêter"
echo

# Démarrer le bot
python3 main.py 