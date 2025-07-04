// admin-system.js - Gestion du système admin

document.addEventListener('DOMContentLoaded', function() {
    // Charger les statistiques au chargement de l'onglet
    loadTokenStats();
    
    // Événements
    document.getElementById('refresh-token-stats').addEventListener('click', loadTokenStats);
    document.getElementById('cleanup-tokens').addEventListener('click', cleanupTokens);
});

// Charger les statistiques des tokens
async function loadTokenStats() {
    try {
        const response = await fetch('/api/admin/token-stats', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des statistiques');
        }
        
        const stats = await response.json();
        
        // Mettre à jour l'interface
        document.getElementById('total-tokens').textContent = stats.total;
        document.getElementById('active-tokens').textContent = stats.active;
        document.getElementById('revoked-tokens').textContent = stats.revoked;
        document.getElementById('expired-tokens').textContent = stats.expired;
        
        // Ajouter des couleurs selon les valeurs
        updateStatColors(stats);
        
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors du chargement des statistiques', 'error');
    }
}

// Mettre à jour les couleurs des statistiques
function updateStatColors(stats) {
    const totalEl = document.getElementById('total-tokens');
    const revokedEl = document.getElementById('revoked-tokens');
    
    // Couleur pour le total
    if (stats.total > 1000) {
        totalEl.style.color = '#e74c3c'; // Rouge si trop de tokens
    } else if (stats.total > 500) {
        totalEl.style.color = '#f39c12'; // Orange si beaucoup
    } else {
        totalEl.style.color = '#27ae60'; // Vert si normal
    }
    
    // Couleur pour les tokens révoqués
    if (stats.revoked > stats.active) {
        revokedEl.style.color = '#e74c3c'; // Rouge si plus de révoqués que d'actifs
    } else if (stats.revoked > 100) {
        revokedEl.style.color = '#f39c12'; // Orange si beaucoup de révoqués
    } else {
        revokedEl.style.color = '#27ae60'; // Vert si peu de révoqués
    }
}

// Nettoyer les tokens
async function cleanupTokens() {
    const button = document.getElementById('cleanup-tokens');
    const resultDiv = document.getElementById('cleanup-result');
    
    // Désactiver le bouton pendant le nettoyage
    button.disabled = true;
    button.textContent = 'Nettoyage en cours...';
    
    try {
        const response = await fetch('/api/admin/cleanup-tokens', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors du nettoyage');
        }
        
        const result = await response.json();
        
        // Afficher le résultat
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
            <div class="success-message">
                <h4>Nettoyage terminé avec succès !</h4>
                <p><strong>Tokens supprimés :</strong></p>
                <ul>
                    <li>Expirés : ${result.stats.deleted.expiredDeleted}</li>
                    <li>Révoqués : ${result.stats.deleted.revokedDeleted}</li>
                    <li>Total : ${result.stats.deleted.totalDeleted}</li>
                </ul>
                <p><strong>Avant nettoyage :</strong></p>
                <ul>
                    <li>Total : ${result.stats.before.total}</li>
                    <li>Actifs : ${result.stats.before.active}</li>
                    <li>Révoqués : ${result.stats.before.revoked}</li>
                    <li>Expirés : ${result.stats.before.expired}</li>
                </ul>
            </div>
        `;
        resultDiv.className = 'cleanup-result success';
        
        // Recharger les statistiques
        setTimeout(loadTokenStats, 1000);
        
        showNotification(`Nettoyage terminé : ${result.stats.deleted.totalDeleted} tokens supprimés`, 'success');
        
    } catch (error) {
        console.error('Erreur:', error);
        
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
            <div class="error-message">
                <h4>Erreur lors du nettoyage</h4>
                <p>${error.message}</p>
            </div>
        `;
        resultDiv.className = 'cleanup-result error';
        
        showNotification('Erreur lors du nettoyage des tokens', 'error');
        
    } finally {
        // Réactiver le bouton
        button.disabled = false;
        button.textContent = 'Nettoyer les tokens';
        
        // Masquer le résultat après 10 secondes
        setTimeout(() => {
            resultDiv.style.display = 'none';
        }, 10000);
    }
}

// Fonction utilitaire pour afficher des notifications
function showNotification(message, type = 'info') {
    // Créer l'élément de notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Styles de base
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        animation: slideIn 0.3s ease-out;
    `;
    
    // Couleurs selon le type
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#27ae60';
            break;
        case 'error':
            notification.style.backgroundColor = '#e74c3c';
            break;
        case 'warning':
            notification.style.backgroundColor = '#f39c12';
            break;
        default:
            notification.style.backgroundColor = '#3498db';
    }
    
    // Ajouter au DOM
    document.body.appendChild(notification);
    
    // Supprimer après 5 secondes
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Ajouter les styles CSS pour les animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .cleanup-result {
        margin-top: 15px;
        padding: 15px;
        border-radius: 5px;
        border-left: 4px solid;
    }
    
    .cleanup-result.success {
        background-color: #d4edda;
        border-color: #27ae60;
        color: #155724;
    }
    
    .cleanup-result.error {
        background-color: #f8d7da;
        border-color: #e74c3c;
        color: #721c24;
    }
    
    .system-card {
        background: white;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        margin-bottom: 20px;
    }
    
    .token-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        margin: 20px 0;
    }
    
    .stat-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        background: #f8f9fa;
        border-radius: 5px;
    }
    
    .stat-label {
        font-weight: 500;
        color: #495057;
    }
    
    .stat-value {
        font-weight: bold;
        font-size: 1.1em;
    }
    
    .system-actions {
        display: flex;
        gap: 10px;
        margin-top: 20px;
    }
    
    .btn-primary, .btn-secondary {
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-weight: 500;
        transition: background-color 0.2s;
    }
    
    .btn-primary {
        background-color: #007bff;
        color: white;
    }
    
    .btn-primary:hover {
        background-color: #0056b3;
    }
    
    .btn-secondary {
        background-color: #6c757d;
        color: white;
    }
    
    .btn-secondary:hover {
        background-color: #545b62;
    }
    
    .btn-primary:disabled, .btn-secondary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;
document.head.appendChild(style); 