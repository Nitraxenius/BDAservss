// Charger les réservations en attente au chargement de la page seulement si on est sur l'onglet réservations
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('reservations-tab').classList.contains('active')) {
    loadPendingReservations();
  }
});

// Charger les réservations en attente
async function loadPendingReservations() {
  try {
    const response = await fetch('/api/reservations/pending', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors du chargement des réservations');
    }
    
    const reservations = await response.json();
    displayPendingReservations(reservations);
  } catch (error) {
    console.error('Erreur:', error);
    document.getElementById('pending-reservations').innerHTML = 
      '<p style="color: red;">Erreur lors du chargement des réservations</p>';
  }
}

// Afficher les réservations en attente
function displayPendingReservations(reservations) {
  const container = document.getElementById('pending-reservations');
  
  if (reservations.length === 0) {
    container.innerHTML = '<p>Aucune réservation en attente</p>';
    return;
  }
  
  const reservationsHTML = reservations.map(reservation => {
    const startDate = new Date(reservation.startDate).toLocaleString('fr-FR');
    const endDate = new Date(reservation.endDate).toLocaleString('fr-FR');
    const createdAt = new Date(reservation.createdAt).toLocaleString('fr-FR');
    
    return `
      <div class="reservation-item" data-id="${reservation._id}">
        <div class="reservation-header">
          <h3>${reservation.gameId.name}</h3>
          <span class="reservation-date">Demandé le ${createdAt}</span>
        </div>
        <div class="reservation-details">
          <p><strong>Utilisateur :</strong> ${reservation.userId.username} (${reservation.userId.email})</p>
          <p><strong>Période :</strong> Du ${startDate} au ${endDate}</p>
          ${reservation.userNotes ? `<p><strong>Notes :</strong> ${reservation.userNotes}</p>` : ''}
        </div>
        <div class="reservation-actions">
          <textarea placeholder="Notes admin (optionnel)" class="admin-notes"></textarea>
          <div class="action-buttons">
            <button class="btn-approve" data-reservation-id="${reservation._id}">Approuver</button>
            <button class="btn-reject" data-reservation-id="${reservation._id}">Rejeter</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  container.innerHTML = reservationsHTML;
  
  // Attacher les événements des boutons
  attachReservationEvents();
}

// Attacher les événements des boutons de réservation
function attachReservationEvents() {
  // Boutons Approuver
  document.querySelectorAll('.btn-approve').forEach(btn => {
    btn.addEventListener('click', function() {
      const reservationId = this.getAttribute('data-reservation-id');
      approveReservation(reservationId);
    });
  });
  
  // Boutons Rejeter
  document.querySelectorAll('.btn-reject').forEach(btn => {
    btn.addEventListener('click', function() {
      const reservationId = this.getAttribute('data-reservation-id');
      rejectReservation(reservationId);
    });
  });
}

// Approuver une réservation
async function approveReservation(reservationId) {
  const reservationItem = document.querySelector(`[data-id="${reservationId}"]`);
  const adminNotes = reservationItem.querySelector('.admin-notes').value;
  
  try {
    const response = await fetch(`/api/reservations/${reservationId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        status: 'approved',
        adminNotes
      })
    });
    
    if (response.ok) {
      alert('Réservation approuvée !');
      loadPendingReservations(); // Recharger la liste
    } else {
      const error = await response.json();
      alert(error.message || 'Erreur lors de l\'approbation');
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de l\'approbation de la réservation');
  }
}

// Rejeter une réservation
async function rejectReservation(reservationId) {
  const reservationItem = document.querySelector(`[data-id="${reservationId}"]`);
  const adminNotes = reservationItem.querySelector('.admin-notes').value;
  
  try {
    const response = await fetch(`/api/reservations/${reservationId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        status: 'rejected',
        adminNotes
      })
    });
    
    if (response.ok) {
      alert('Réservation rejetée !');
      loadPendingReservations(); // Recharger la liste
    } else {
      const error = await response.json();
      alert(error.message || 'Erreur lors du rejet');
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors du rejet de la réservation');
  }
} 