const mongoose = require('mongoose');
const crypto = require('crypto');

const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // Suppression automatique à expiration
  },
  isRevoked: {
    type: Boolean,
    default: false
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances
refreshTokenSchema.index({ userId: 1, isRevoked: 1 });
refreshTokenSchema.index({ token: 1 });
refreshTokenSchema.index({ isRevoked: 1, updatedAt: 1 }); // Pour le nettoyage des tokens révoqués

// Méthode pour générer un refresh token
refreshTokenSchema.statics.generateToken = function(userId, ipAddress, userAgent) {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 jours
  
  return this.create({
    token,
    userId,
    expiresAt,
    ipAddress,
    userAgent
  });
};

// Méthode pour vérifier et révoquer un token
refreshTokenSchema.statics.verifyAndRevoke = async function(token) {
  const refreshToken = await this.findOne({ 
    token, 
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  });
  
  if (!refreshToken) {
    return null;
  }
  
  // Révoquer le token après utilisation
  refreshToken.isRevoked = true;
  await refreshToken.save();
  
  return refreshToken;
};

// Méthode pour révoquer tous les tokens d'un utilisateur
refreshTokenSchema.statics.revokeAllForUser = function(userId) {
  return this.updateMany(
    { userId, isRevoked: false },
    { isRevoked: true }
  );
};

// Méthode pour nettoyer les tokens expirés
refreshTokenSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

// NOUVELLE MÉTHODE : Nettoyer les tokens révoqués anciens
refreshTokenSchema.statics.cleanupRevoked = function(daysOld = 7) {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  return this.deleteMany({
    isRevoked: true,
    updatedAt: { $lt: cutoffDate }
  });
};

// NOUVELLE MÉTHODE : Nettoyage complet (expirés + révoqués anciens)
refreshTokenSchema.statics.cleanupAll = async function(daysOld = 7) {
  const results = await Promise.all([
    this.cleanupExpired(),
    this.cleanupRevoked(daysOld)
  ]);
  
  return {
    expiredDeleted: results[0].deletedCount,
    revokedDeleted: results[1].deletedCount,
    totalDeleted: results[0].deletedCount + results[1].deletedCount
  };
};

// NOUVELLE MÉTHODE : Statistiques de la collection
refreshTokenSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ['$isRevoked', false] }, 1, 0] } },
        revoked: { $sum: { $cond: [{ $eq: ['$isRevoked', true] }, 1, 0] } },
        expired: { $sum: { $cond: [{ $lt: ['$expiresAt', new Date()] }, 1, 0] } }
      }
    }
  ]);
  
  return stats[0] || { total: 0, active: 0, revoked: 0, expired: 0 };
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema); 