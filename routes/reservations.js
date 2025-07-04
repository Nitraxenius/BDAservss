const express = require('express');
const router = express.Router();
const Reservation = require('../models/reservation');
const Game = require('../models/jeux');
const { protect } = require('../middleware/auth');

// Récupérer toutes les réservations d'un jeu
router.get('/game/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { month, year } = req.query;
    
    let query = { gameId };
    
    // Si on demande un mois spécifique
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      query.$or = [
        { startDate: { $lte: endDate, $gte: startDate } },
        { endDate: { $gte: startDate, $lte: endDate } },
        { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
      ];
    }
    
    const reservations = await Reservation.find(query)
      .populate('userId', 'username')
      .sort({ startDate: 1 });
    
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Récupérer les réservations d'un utilisateur
router.get('/user', protect, async (req, res) => {
  try {
    // Vérifier que seuls les cotisants et admins peuvent voir leurs réservations
    if (req.user.role === 'user') {
      return res.status(403).json({ 
        message: 'Seuls les cotisants et administrateurs peuvent voir leurs réservations.' 
      });
    }
    
    const reservations = await Reservation.find({ userId: req.user.id })
      .populate('gameId', 'name imagePath')
      .sort({ createdAt: -1 });
    
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Créer une nouvelle réservation
router.post('/', protect, async (req, res) => {
  try {
    const { gameId, startDate, endDate, userNotes } = req.body;
    
    // Vérifier que seuls les cotisants et admins peuvent réserver
    if (req.user.role === 'user') {
      return res.status(403).json({ 
        message: 'Seuls les cotisants et administrateurs peuvent réserver des jeux. Veuillez contacter l\'administration pour devenir cotisant.' 
      });
    }
    
    // Vérifier que le jeu existe
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Jeu non trouvé' });
    }
    
    // Vérifier qu'il n'y a pas de conflit de réservation
    const conflictingReservation = await Reservation.findOne({
      gameId,
      status: { $in: ['pending', 'approved'] },
      $or: [
        { startDate: { $lte: new Date(endDate), $gte: new Date(startDate) } },
        { endDate: { $gte: new Date(startDate), $lte: new Date(endDate) } },
        { startDate: { $lte: new Date(startDate), $gte: new Date(endDate) } }
      ]
    });
    
    if (conflictingReservation) {
      return res.status(400).json({ message: 'Ce jeu est déjà réservé pour cette période' });
    }
    
    const reservation = new Reservation({
      gameId,
      userId: req.user.id,
      userName: req.user.username,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      userNotes
    });
    
    await reservation.save();
    
    const populatedReservation = await reservation.populate('gameId', 'name imagePath');
    res.status(201).json(populatedReservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Récupérer toutes les réservations en attente (admin)
router.get('/pending', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    
    const reservations = await Reservation.find({ status: 'pending' })
      .populate('gameId', 'name imagePath')
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });
    
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Valider ou rejeter une réservation (admin)
router.patch('/:id/status', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    
    const { status, adminNotes } = req.body;
    const { id } = req.params;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }
    
    const reservation = await Reservation.findByIdAndUpdate(
      id,
      { status, adminNotes },
      { new: true }
    ).populate('gameId', 'name imagePath')
     .populate('userId', 'username email');
    
    if (!reservation) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }
    
    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Supprimer une réservation (cotisant ou admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findById(id);
    
    if (!reservation) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }
    
    // Vérifier que seuls les cotisants et admins peuvent supprimer des réservations
    if (req.user.role === 'user') {
      return res.status(403).json({ 
        message: 'Seuls les cotisants et administrateurs peuvent gérer leurs réservations.' 
      });
    }
    
    // Seul l'utilisateur qui a créé la réservation ou un admin peut la supprimer
    if (reservation.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    
    await Reservation.findByIdAndDelete(id);
    res.json({ message: 'Réservation supprimée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 