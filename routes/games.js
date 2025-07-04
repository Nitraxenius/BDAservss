const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const Game = require('../models/jeux');
const fs = require('fs');
const { protect, adminOnly } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

/* ---------- Configuration multer sécurisée ---------- */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) =>
    cb(null, path.join(__dirname, '..', 'public', 'assets', 'images')),
  filename: (_req, file, cb) => {
    // Générer un nom de fichier sécurisé
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `game-${uniqueSuffix}${ext}`);
  }
});

// Validation des fichiers
const fileFilter = (req, file, cb) => {
  // Vérifier le type MIME
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedMimes.includes(file.mimetype)) {
    return cb(new Error('Type de fichier non autorisé. Seuls JPEG, PNG, GIF et WebP sont acceptés.'), false);
  }
  
  // Vérifier l'extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return cb(new Error('Extension de fichier non autorisée.'), false);
  }
  
  cb(null, true);
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 1 // 1 fichier max
  }
});

// Validation des données de jeu
const gameValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Le nom du jeu est requis')
    .isLength({ min: 1, max: 100 })
    .withMessage('Le nom doit contenir entre 1 et 100 caractères')
    .escape(),
  body('players')
    .trim()
    .notEmpty()
    .withMessage('Le nombre de joueurs est requis')
    .isLength({ min: 1, max: 50 })
    .withMessage('Le nombre de joueurs doit contenir entre 1 et 50 caractères')
    .escape(),
  body('duration')
    .trim()
    .notEmpty()
    .withMessage('La durée est requise')
    .isLength({ min: 1, max: 50 })
    .withMessage('La durée doit contenir entre 1 et 50 caractères')
    .escape(),
  body('age')
    .trim()
    .notEmpty()
    .withMessage('L\'âge minimum est requis')
    .isLength({ min: 1, max: 20 })
    .withMessage('L\'âge doit contenir entre 1 et 20 caractères')
    .escape(),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 10000 })
    .withMessage('La description ne peut pas dépasser 10000 caractères')
    .escape(),
];

/* ---------- READ public ---------- */
router.get('/', async (_req, res) => res.json(await Game.find()));

/* ---------- CREATE admin ---------- */
router.post('/', protect, adminOnly, upload.single('image'), gameValidation, async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Données invalides - Veuillez corriger les erreurs suivantes',
        details: errors.array().map(err => ({ 
          field: err.path, 
          message: err.msg,
          value: err.value 
        }))
      });
    }

    if (req.file) {
      req.body.imagePath = `assets/images/${req.file.filename}`;
    }
    
    // Validation sécurisée des tags
    if (req.body.tags) {
      try {
        const tags = JSON.parse(req.body.tags);
        if (Array.isArray(tags)) {
          req.body.tags = tags
            .filter(tag => typeof tag === 'string' && tag.length <= 50)
            .map(tag => tag.trim().toLowerCase())
            .slice(0, 10); // Maximum 10 tags
        } else {
          req.body.tags = [];
        }
      } catch (e) {
        console.error('Erreur parsing tags:', e);
        req.body.tags = [];
      }
    }

    const game = await Game.create(req.body);
    res.status(201).json(game);
  } catch (err) {
    console.error('Erreur création jeu:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Erreur de validation des données',
        details: Object.keys(err.errors).map(key => ({
          field: key,
          message: err.errors[key].message
        }))
      });
    }
    res.status(400).json({ error: 'Erreur lors de la création du jeu' });
  }
});

/* ---------- UPDATE admin ---------- */
router.put('/:id', protect, adminOnly, upload.single('image'), gameValidation, async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Données invalides - Veuillez corriger les erreurs suivantes',
        details: errors.array().map(err => ({ 
          field: err.path, 
          message: err.msg,
          value: err.value 
        }))
      });
    }

    if (req.file) {
      req.body.imagePath = `assets/images/${req.file.filename}`;
    }
    
    // Validation sécurisée des tags
    if (req.body.tags) {
      try {
        const tags = JSON.parse(req.body.tags);
        if (Array.isArray(tags)) {
          req.body.tags = tags
            .filter(tag => typeof tag === 'string' && tag.length <= 50)
            .map(tag => tag.trim().toLowerCase())
            .slice(0, 10); // Maximum 10 tags
        } else {
          req.body.tags = [];
        }
      } catch (e) {
        console.error('Erreur parsing tags:', e);
        req.body.tags = [];
      }
    }

    const game = await Game.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!game) {
      return res.status(404).json({ error: 'Jeu non trouvé' });
    }
    res.json(game);
  } catch (err) {
    console.error('Erreur mise à jour jeu:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Erreur de validation des données',
        details: Object.keys(err.errors).map(key => ({
          field: key,
          message: err.errors[key].message
        }))
      });
    }
    res.status(400).json({ error: 'Erreur lors de la mise à jour du jeu' });
  }
});

/* ---------- DELETE admin ---------- */
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Jeu non trouvé' });

    /* Suppression sécurisée de l'image */
    if (game.imagePath) {
      const imgAbs = path.join(__dirname, '..', 'public', game.imagePath);
      const imgDir = path.join(__dirname, '..', 'public', 'assets', 'images');

      /* Vérification de sécurité renforcée */
      if (imgAbs.startsWith(imgDir) && fs.existsSync(imgAbs)) {
        try {
          fs.unlinkSync(imgAbs);
        } catch (err) {
          console.error('Erreur suppression image:', err);
        }
      }
    }

    await game.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    console.error('Erreur suppression jeu:', err);
    res.status(400).json({ error: 'Erreur lors de la suppression du jeu' });
  }
});

module.exports = router;
