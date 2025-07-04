const jwt = require('jsonwebtoken');

module.exports = {
  protect: async (req, res, next) => {
    const accessToken = req.cookies.accessToken || req.headers.authorization?.split(' ')[1];
    
    if (!accessToken) {
      console.log(`[AUTH] ❌ Pas d'access token - IP: ${req.ip} - Path: ${req.path}`);
      return res.status(401).json({ msg: 'Access token requis' });
    }
    
    try {
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
      
      // Vérification de l'expiration
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        console.log(`[AUTH] ⏰ Access token expiré - IP: ${req.ip} - User: ${decoded.username}`);
        return res.status(401).json({ msg: 'Access token expiré', code: 'TOKEN_EXPIRED' });
      }
      
      req.user = decoded;
      console.log(`[AUTH] ✅ Access token valide - IP: ${req.ip} - User: ${decoded.username} - Role: ${decoded.role} - Path: ${req.path}`);
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        console.log(`[AUTH] ⏰ Access token expiré - IP: ${req.ip}`);
        return res.status(401).json({ msg: 'Access token expiré', code: 'TOKEN_EXPIRED' });
      }
      console.log(`[AUTH] ❌ Access token invalide - IP: ${req.ip} - Error: ${err.message}`);
      return res.status(401).json({ msg: 'Access token invalide' });
    }
  },
  
  adminOnly: (req, res, next) => {
    if (!req.user) {
      console.log(`[AUTH] ❌ Pas d'utilisateur authentifié - IP: ${req.ip}`);
      return res.status(401).json({ msg: 'Authentification requise' });
    }
    
    if (req.user.role !== 'admin') {
      console.log(`[AUTH] 🚫 Accès interdit - User: ${req.user.username} (${req.user.role}) n'a pas les droits admin - IP: ${req.ip} - Path: ${req.path}`);
      return res.status(403).json({ msg: 'Accès interdit - Droits administrateur requis' });
    }
    
    console.log(`[AUTH] ✅ Accès admin autorisé - IP: ${req.ip} - User: ${req.user.username} - Path: ${req.path}`);
    next();
  }
};