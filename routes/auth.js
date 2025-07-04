const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/user');
const RefreshToken = require('../models/refreshToken');
const Cotisant = require('../models/Cotisant');
const { protect } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Limite à 5 tentatives par 15 minutes par IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives
  message: { error: "Trop de tentatives, réessayez plus tard." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting global pour l'API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par IP
  message: { error: "Trop de requêtes, réessayez plus tard." }
});

// Appliquer le rate limiting à toutes les routes
router.use(apiLimiter);

function signToken(user) {
  return jwt.sign({ id: user._id, username: user.username, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || '15m' // Access token court (15 minutes)
  });
}

// Validation pour l'inscription
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Le nom d\'utilisateur doit contenir entre 3 et 30 caractères')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères, une minuscule, une majuscule, un chiffre et un caractère spécial (@$!%*?&)')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Le mot de passe doit contenir au moins 8 caractères, une minuscule, une majuscule, un chiffre et un caractère spécial (@$!%*?&)'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide')
];

// Validation pour la connexion
const loginValidation = [
  body('username').trim().notEmpty().withMessage('Nom d\'utilisateur requis'),
  body('password').notEmpty().withMessage('Mot de passe requis')
];

router.post('/register', registerValidation, async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Données invalides',
        details: errors.array().map(err => ({ field: err.path, message: err.msg }))
      });
    }

    const { username, password, email } = req.body;

    // Vérifier si l'utilisateur est dans la liste des cotisants
    const cotisant = await Cotisant.findOne({ 
      email: email.toLowerCase(),
      statut: 'actif',
      dateExpiration: { $gte: new Date() }
    });

    // Déterminer le rôle en fonction du statut cotisant
    const role = cotisant ? 'cotisant' : 'user';

    const user = await User.create({
      username,
      password,
      role
    });
    
    const accessToken = signToken(user);
    
    // Générer un refresh token
    const refreshToken = await RefreshToken.generateToken(
      user._id, 
      req.ip, 
      req.get('User-Agent')
    );
    
    res.cookie('accessToken', accessToken, { 
      httpOnly: true, 
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });
    
    res.cookie('refreshToken', refreshToken.token, { 
      httpOnly: true, 
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 jours
    });
    
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Ce nom d\'utilisateur existe déjà' });
    }
    console.error('Erreur inscription:', err);
    res.status(400).json({ error: 'Erreur lors de l\'inscription' });
  }
});

router.post('/login', loginLimiter, loginValidation, async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Données invalides',
        details: errors.array().map(err => ({ field: err.path, message: err.msg }))
      });
    }

    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ error: 'Identifiants incorrects' });
    }
    
    // Vérifier si le compte est verrouillé
    if (user.isLocked && user.isLocked()) {
      return res.status(423).json({ error: 'Compte temporairement verrouillé' });
    }
    
    const accessToken = signToken(user);
    
    // Générer un refresh token
    const refreshToken = await RefreshToken.generateToken(
      user._id, 
      req.ip, 
      req.get('User-Agent')
    );
    
    // Réinitialiser les tentatives de connexion
    await user.resetLoginAttempts();
    
    res.cookie('accessToken', accessToken, { 
      httpOnly: true, 
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });
    
    res.cookie('refreshToken', refreshToken.token, { 
      httpOnly: true, 
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 jours
    });
    
    res.json({ ok: true });
  } catch (err) {
    console.error('Erreur connexion:', err);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// Route pour renouveler l'access token
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token manquant' });
    }
    
    // Vérifier et révoquer le refresh token
    const tokenDoc = await RefreshToken.verifyAndRevoke(refreshToken);
    
    if (!tokenDoc) {
      return res.status(401).json({ error: 'Refresh token invalide ou expiré' });
    }
    
    // Récupérer l'utilisateur
    const user = await User.findById(tokenDoc.userId);
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }
    
    // Générer un nouvel access token
    const newAccessToken = signToken(user);
    
    // Générer un nouveau refresh token
    const newRefreshToken = await RefreshToken.generateToken(
      user._id, 
      req.ip, 
      req.get('User-Agent')
    );
    
    res.cookie('accessToken', newAccessToken, { 
      httpOnly: true, 
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });
    
    res.cookie('refreshToken', newRefreshToken.token, { 
      httpOnly: true, 
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 jours
    });
    
    res.json({ ok: true });
  } catch (err) {
    console.error('Erreur refresh token:', err);
    res.status(500).json({ error: 'Erreur lors du renouvellement du token' });
  }
});

// Route pour vérifier la validité du token
router.get('/verify', protect, (req, res) => {
  res.json({ valid: true, username: req.user.username, role: req.user.role });
});

router.get('/me', protect, (req, res) => {
  res.json({ username: req.user.username, role: req.user.role });
});

router.post('/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken) {
      // Révoquer le refresh token
      await RefreshToken.verifyAndRevoke(refreshToken);
    }
    
    res.clearCookie('accessToken', { 
      httpOnly: true, 
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    });
    
    res.clearCookie('refreshToken', { 
      httpOnly: true, 
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    });
    
    res.json({ ok: true });
  } catch (err) {
    console.error('Erreur logout:', err);
    res.status(500).json({ error: 'Erreur lors de la déconnexion' });
  }
});

// Route pour changer le mot de passe
router.post('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 8 caractères, une minuscule, une majuscule, un chiffre et un caractère spécial (@$!%*?&)' });
    }
    
    // Vérifier la complexité du mot de passe
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 8 caractères, une minuscule, une majuscule, un chiffre et un caractère spécial (@$!%*?&)' });
    }
    
    // Récupérer l'utilisateur avec le mot de passe hashé
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
    }
    
    // Changer le mot de passe
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Mot de passe changé avec succès' });
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    res.status(500).json({ message: 'Erreur lors du changement de mot de passe' });
  }
});

// Route pour révoquer tous les tokens d'un utilisateur
router.post('/revoke-all', protect, async (req, res) => {
  try {
    await RefreshToken.revokeAllForUser(req.user.id);
    res.json({ ok: true });
  } catch (err) {
    console.error('Erreur révocation tokens:', err);
    res.status(500).json({ error: 'Erreur lors de la révocation des tokens' });
  }
});

module.exports = router;