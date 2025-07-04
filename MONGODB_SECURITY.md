# 🔐 Guide de Sécurisation MongoDB

## 📋 Vue d'ensemble

Ce guide vous accompagne pour sécuriser votre base MongoDB avec authentification, utilisateurs dédiés et bonnes pratiques de sécurité.

## 🚀 Procédure de Sécurisation

### **Étape 1 : Préparation**

1. **Créer le fichier .env**
```bash
# Copier le fichier d'exemple
cp env.example .env

# Éditer le fichier .env avec vos valeurs
nano .env
```

2. **Variables importantes à configurer :**
```env
# MongoDB (sans auth pour commencer)
MONGO_URI=mongodb://localhost:27017/bureau_des_jeux

# Utilisateurs à créer
MONGO_ADMIN_USERNAME=admin
MONGO_ADMIN_PASSWORD=votre_mot_de_passe_admin_complexe
MONGO_APP_USERNAME=bureau_jeux_user
MONGO_APP_PASSWORD=votre_mot_de_passe_app_complexe

# JWT (changez le secret !)
JWT_SECRET=votre_secret_jwt_tres_long_et_complexe_ici
```

### **Étape 2 : Vérification de l'état actuel**

```bash
# Vérifier l'état de sécurité actuel
npm run mongo-check
```

### **Étape 3 : Création des utilisateurs**

```bash
# Lancer la sécurisation
npm run secure-mongo
```

Le script va :
- ✅ Créer un utilisateur administrateur
- ✅ Créer un utilisateur application
- ✅ Générer les chaînes de connexion sécurisées
- ✅ Afficher la configuration MongoDB

### **Étape 4 : Configuration MongoDB**

1. **Arrêter MongoDB**
```bash
# Windows
net stop MongoDB

# Linux/Mac
sudo systemctl stop mongod
```

2. **Configurer l'authentification**

Ajouter cette configuration à votre fichier `mongod.conf` :

```yaml
# Configuration MongoDB sécurisée
security:
  authorization: enabled

# Réseau
net:
  port: 27017
  bindIp: 127.0.0.1

# Stockage
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true

# Logs
systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

# Process
processManagement:
  timeZoneInfo: /usr/share/zoneinfo
```

3. **Redémarrer MongoDB**
```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

### **Étape 5 : Mise à jour de la configuration**

1. **Mettre à jour le fichier .env**
```env
# Remplacer par la chaîne sécurisée générée
MONGO_URI=mongodb://bureau_jeux_user:votre_mot_de_passe@localhost:27017/bureau_des_jeux?authSource=bureau_des_jeux
```

2. **Mettre à jour le bot Discord**
```env
# Dans bot/.envbot
MONGO_URI=mongodb://bureau_jeux_user:votre_mot_de_passe@localhost:27017/bureau_des_jeux?authSource=bureau_des_jeux
```

### **Étape 6 : Test de la sécurisation**

```bash
# Test complet
npm run test-mongo-auth

# Test rapide
npm run test-mongo-auth -- --quick
```

## 🔍 Vérification de la Sécurité

### **Test de Connexion Non Authentifiée**

```bash
# Cette commande devrait échouer
mongosh mongodb://localhost:27017/bureau_des_jeux
```

### **Test de Connexion Authentifiée**

```bash
# Cette commande devrait réussir
mongosh "mongodb://bureau_jeux_user:votre_mot_de_passe@localhost:27017/bureau_des_jeux?authSource=bureau_des_jeux"
```

### **Test de Connexion Admin**

```bash
# Connexion admin
mongosh "mongodb://admin:votre_mot_de_passe_admin@localhost:27017/admin"
```

## 🛡️ Bonnes Pratiques de Sécurité

### **1. Mots de Passe Forts**

```bash
# Générer un mot de passe sécurisé
openssl rand -base64 32

# Ou utiliser un générateur en ligne
# https://passwordsgenerator.net/
```

**Critères :**
- Minimum 16 caractères
- Lettres majuscules et minuscules
- Chiffres
- Caractères spéciaux
- Pas de mots du dictionnaire

### **2. Principe du Moindre Privilège**

- **Utilisateur admin** : Gestion des utilisateurs et bases
- **Utilisateur app** : Accès limité à sa base uniquement
- **Pas d'accès root** sauf maintenance

### **3. Réseau Sécurisé**

```yaml
# Limiter l'accès réseau
net:
  bindIp: 127.0.0.1  # Localhost seulement
  port: 27017
```

### **4. Logs de Sécurité**

```yaml
# Activer les logs détaillés
systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log
  verbosity: 1
```

## 🔧 Dépannage

### **Problème : Connexion échoue après sécurisation**

```bash
# 1. Vérifier que MongoDB redémarre
sudo systemctl status mongod

# 2. Vérifier les logs
sudo tail -f /var/log/mongodb/mongod.log

# 3. Tester la connexion
npm run test-mongo-auth
```

### **Problème : Erreur d'authentification**

```bash
# 1. Vérifier les utilisateurs
mongosh "mongodb://admin:votre_mot_de_passe_admin@localhost:27017/admin" --eval "db.getUsers()"

# 2. Recréer l'utilisateur si nécessaire
mongosh "mongodb://admin:votre_mot_de_passe_admin@localhost:27017/admin" --eval "
use bureau_des_jeux
db.createUser({
  user: 'bureau_jeux_user',
  pwd: 'votre_mot_de_passe_app',
  roles: [
    { role: 'readWrite', db: 'bureau_des_jeux' },
    { role: 'dbAdmin', db: 'bureau_des_jeux' }
  ]
})"
```

### **Problème : Application ne démarre pas**

```bash
# 1. Vérifier la chaîne de connexion
echo $MONGO_URI

# 2. Tester la connexion
npm run test-mongo-auth -- --quick

# 3. Vérifier les variables d'environnement
node -e "require('dotenv').config(); console.log(process.env.MONGO_URI)"
```

## 📊 Monitoring de Sécurité

### **Vérification Régulière**

```bash
# Vérifier les connexions actives
mongosh "mongodb://admin:votre_mot_de_passe_admin@localhost:27017/admin" --eval "db.currentOp()"

# Vérifier les utilisateurs
mongosh "mongodb://admin:votre_mot_de_passe_admin@localhost:27017/admin" --eval "db.getUsers()"

# Vérifier les logs d'authentification
sudo grep "authentication" /var/log/mongodb/mongod.log
```

### **Audit de Sécurité**

```bash
# Script d'audit automatique
node audit-mongo-security.js
```

## 🚨 Sécurité Avancée

### **1. Chiffrement des Données**

```yaml
# Activer le chiffrement au repos
security:
  authorization: enabled
  keyFile: /path/to/keyfile

storage:
  encrypted: true
  encryptionKeyFile: /path/to/encryption-key
```

### **2. TLS/SSL**

```yaml
# Activer TLS
net:
  tls:
    mode: requireTLS
    certificateKeyFile: /path/to/cert.pem
    CAFile: /path/to/ca.pem
```

### **3. Audit Logs**

```yaml
# Activer les logs d'audit
auditLog:
  destination: file
  format: JSON
  path: /var/log/mongodb/audit.log
```

## 📋 Checklist de Sécurité

- [ ] Authentification activée
- [ ] Utilisateurs créés avec privilèges minimaux
- [ ] Mots de passe forts utilisés
- [ ] Accès réseau limité
- [ ] Logs activés
- [ ] Tests de connexion réussis
- [ ] Application fonctionne avec authentification
- [ ] Bot Discord fonctionne avec authentification
- [ ] Sauvegarde sécurisée configurée
- [ ] Monitoring en place

## 🆘 Support

En cas de problème :

1. **Vérifiez les logs** : `/var/log/mongodb/mongod.log`
2. **Testez la connexion** : `npm run test-mongo-auth`
3. **Vérifiez la configuration** : `npm run mongo-check`
4. **Consultez la documentation MongoDB** : https://docs.mongodb.com/manual/security/

---

**⚠️ Important** : Gardez vos mots de passe en sécurité et ne les partagez jamais. Utilisez un gestionnaire de mots de passe pour les stocker de manière sécurisée. 