require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const path = require('path');

const gamesRouter = require('./routes/games');
const authRouter = require('./routes/auth');
const reservationsRouter = require('./routes/reservations');
const cotisantsRouter = require('./routes/cotisants');
const { protect, adminOnly } = require('./middleware/auth');
const RefreshToken = require('./models/refreshToken');

const app = express();

// Headers de sécurité avec helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS sécurisé - spécifier les origines autorisées
const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
  process.env.ALLOWED_ORIGINS.split(',') : 
  ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://localhost', 'http://localhost'];

app.use(cors({ 
  origin: function (origin, callback) {
    // En développement, accepter toutes les origines locales
    if (!origin || 
        allowedOrigins.includes(origin) || 
        origin.startsWith('http://localhost') || 
        origin.startsWith('https://localhost') ||
        origin.startsWith('http://127.0.0.1')) {
      callback(null, true);
    } else {
      console.log('CORS bloqué pour origine:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true 
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' })); // Limitation de taille
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging de sécurité
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

mongoose.connect(process.env.MONGO_URI).then(() => console.log('MongoDB connected'));

// Fonction de nettoyage automatique des tokens
async function cleanupTokens() {
  try {
    const stats = await RefreshToken.getStats();
    console.log(`[CLEANUP] Avant nettoyage - Total: ${stats.total}, Actifs: ${stats.active}, Révoqués: ${stats.revoked}, Expirés: ${stats.expired}`);
    
    const result = await RefreshToken.cleanupAll(7); // Nettoyer les tokens révoqués de plus de 7 jours
    
    if (result.totalDeleted > 0) {
      console.log(`[CLEANUP] Nettoyage terminé - Expirés supprimés: ${result.expiredDeleted}, Révoqués supprimés: ${result.revokedDeleted}, Total: ${result.totalDeleted}`);
    }
  } catch (error) {
    console.error('[CLEANUP] Erreur lors du nettoyage des tokens:', error);
  }
}

// Nettoyage automatique toutes les heures
setInterval(cleanupTokens, 60 * 60 * 1000); // 1 heure

// Nettoyage initial au démarrage
setTimeout(cleanupTokens, 5 * 60 * 1000); // 5 minutes après le démarrage

// Route pour déclencher le nettoyage manuellement (admin seulement)
app.post('/api/admin/cleanup-tokens', protect, adminOnly, async (req, res) => {
  try {
    const stats = await RefreshToken.getStats();
    const result = await RefreshToken.cleanupAll(7);
    
    res.json({
      message: 'Nettoyage terminé',
      stats: {
        before: stats,
        deleted: result
      }
    });
  } catch (error) {
    console.error('Erreur nettoyage manuel:', error);
    res.status(500).json({ error: 'Erreur lors du nettoyage' });
  }
});

// Route pour voir les statistiques des tokens (admin seulement)
app.get('/api/admin/token-stats', protect, adminOnly, async (req, res) => {
  try {
    const stats = await RefreshToken.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Erreur récupération stats:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

// Route de santé pour Docker healthcheck
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/games', gamesRouter);
app.use('/api/reservations', reservationsRouter);
app.use('/api/cotisants', cotisantsRouter);

app.get('/admin.html', protect, adminOnly, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.use(express.static('public'));

// Gestion d'erreurs globale
app.use((err, req, res, next) => {
  console.error('Erreur:', err.message);
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Origine non autorisée' });
  }
  
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

app.listen(process.env.PORT || 3000);