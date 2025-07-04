const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Cotisant = require('../models/Cotisant');
const { protect, adminOnly } = require('../middleware/auth');

// Middleware de validation pour les cotisants
const validateCotisant = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('nom').trim().isLength({ min: 2 }).withMessage('Le nom doit contenir au moins 2 caractères'),
  body('prenom').trim().isLength({ min: 2 }).withMessage('Le prénom doit contenir au moins 2 caractères'),
  body('dateExpiration').isISO8601().withMessage('Date d\'expiration invalide'),
  body('statut').optional().isIn(['actif', 'inactif']).withMessage('Statut invalide'),
  body('notes').optional().trim()
];

// GET /api/cotisants - Récupérer tous les cotisants (admin seulement)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const cotisants = await Cotisant.find()
      .populate('ajoutePar', 'username')
      .sort({ createdAt: -1 });
    
    res.json(cotisants);
  } catch (error) {
    console.error('Erreur lors de la récupération des cotisants:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/cotisants/:id - Récupérer un cotisant spécifique (admin seulement)
router.get('/:id', protect, adminOnly, async (req, res) => {
  try {
    const cotisant = await Cotisant.findById(req.params.id)
      .populate('ajoutePar', 'username');
    
    if (!cotisant) {
      return res.status(404).json({ message: 'Cotisant non trouvé' });
    }
    
    res.json(cotisant);
  } catch (error) {
    console.error('Erreur lors de la récupération du cotisant:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /api/cotisants - Créer un nouveau cotisant (admin seulement)
router.post('/', protect, adminOnly, validateCotisant, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Données invalides',
        errors: errors.array() 
      });
    }

    const { email, nom, prenom, dateExpiration, statut, notes } = req.body;

    // Vérifier si l'email existe déjà
    const existingCotisant = await Cotisant.findOne({ email: email.toLowerCase() });
    if (existingCotisant) {
      return res.status(400).json({ message: 'Un cotisant avec cet email existe déjà' });
    }

    const cotisant = new Cotisant({
      email: email.toLowerCase(),
      nom,
      prenom,
      dateExpiration,
      statut: statut || 'actif',
      notes,
      ajoutePar: req.user.id
    });

    await cotisant.save();
    
    const populatedCotisant = await Cotisant.findById(cotisant._id)
      .populate('ajoutePar', 'username');
    
    res.status(201).json(populatedCotisant);
  } catch (error) {
    console.error('Erreur lors de la création du cotisant:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT /api/cotisants/:id - Modifier un cotisant (admin seulement)
router.put('/:id', protect, adminOnly, validateCotisant, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Données invalides',
        errors: errors.array() 
      });
    }

    const { email, nom, prenom, dateExpiration, statut, notes } = req.body;

    // Vérifier si l'email existe déjà pour un autre cotisant
    const existingCotisant = await Cotisant.findOne({ 
      email: email.toLowerCase(),
      _id: { $ne: req.params.id }
    });
    if (existingCotisant) {
      return res.status(400).json({ message: 'Un cotisant avec cet email existe déjà' });
    }

    const cotisant = await Cotisant.findByIdAndUpdate(
      req.params.id,
      {
        email: email.toLowerCase(),
        nom,
        prenom,
        dateExpiration,
        statut,
        notes
      },
      { new: true, runValidators: true }
    ).populate('ajoutePar', 'username');

    if (!cotisant) {
      return res.status(404).json({ message: 'Cotisant non trouvé' });
    }

    res.json(cotisant);
  } catch (error) {
    console.error('Erreur lors de la modification du cotisant:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE /api/cotisants/:id - Supprimer un cotisant (admin seulement)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const cotisant = await Cotisant.findByIdAndDelete(req.params.id);
    
    if (!cotisant) {
      return res.status(404).json({ message: 'Cotisant non trouvé' });
    }

    res.json({ message: 'Cotisant supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du cotisant:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/cotisants/check/:email - Vérifier si un email est dans la liste des cotisants
router.get('/check/:email', async (req, res) => {
  try {
    const email = req.params.email.toLowerCase();
    const cotisant = await Cotisant.findOne({ 
      email,
      statut: 'actif',
      dateExpiration: { $gte: new Date() }
    });
    
    res.json({ 
      isCotisant: !!cotisant,
      cotisant: cotisant ? {
        nom: cotisant.nom,
        prenom: cotisant.prenom,
        dateExpiration: cotisant.dateExpiration
      } : null
    });
  } catch (error) {
    console.error('Erreur lors de la vérification du cotisant:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router; 