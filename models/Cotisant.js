const mongoose = require('mongoose');

const cotisantSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  nom: {
    type: String,
    required: true,
    trim: true
  },
  prenom: {
    type: String,
    required: true,
    trim: true
  },
  dateAdhesion: {
    type: Date,
    default: Date.now
  },
  statut: {
    type: String,
    enum: ['actif', 'inactif'],
    default: 'actif'
  },
  dateExpiration: {
    type: Date,
    required: true
  },
  notes: {
    type: String,
    trim: true
  },
  ajoutePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index pour optimiser les recherches
cotisantSchema.index({ email: 1 });
cotisantSchema.index({ statut: 1 });
cotisantSchema.index({ dateExpiration: 1 });

module.exports = mongoose.model('Cotisant', cotisantSchema); 