let currentGameId = null;
let currentGameName = null;
let currentMonth = new Date().getMonth() + 1;
let currentYear = new Date().getFullYear();

// Créer la modal de réservation
function createReservationModal() {
  const modal = document.createElement('div');
  modal.id = 'reservation-modal';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Réserver <span id="game-name"></span></h2>
        <span class="close">&times;</span>
      </div>
      <div class="modal-body">
        <div class="calendar-container">
          <div class="calendar-header">
            <button class="prev-month">&lt;</button>
            <h3 id="month-year"></h3>
            <button class="next-month">&gt;</button>
          </div>
          <div class="calendar-grid">
            <div class="calendar-days">
              <div>Dim</div><div>Lun</div><div>Mar</div><div>Mer</div>
              <div>Jeu</div><div>Ven</div><div>Sam</div>
            </div>
            <div id="calendar-dates"></div>
          </div>
        </div>
        <div class="reservation-form" style="display: none;">
          <h3>Nouvelle réservation</h3>
          <div class="form-group">
            <label>Date de début :</label>
            <input type="datetime-local" id="start-date" required>
          </div>
          <div class="form-group">
            <label>Date de fin :</label>
            <input type="datetime-local" id="end-date" required>
          </div>
          <div class="form-group">
            <label>Notes (optionnel) :</label>
            <textarea id="user-notes" rows="3" placeholder="Précisez le contexte de votre réservation..."></textarea>
          </div>
          <div class="form-actions">
            <button class="btn-primary submit-reservation">Demander la réservation</button>
            <button class="btn-secondary cancel-reservation">Annuler</button>
          </div>
        </div>
        <div class="legend">
          <div class="legend-item">
            <span class="legend-color free"></span>
            <span>Libre</span>
          </div>
          <div class="legend-item">
            <span class="legend-color reserved"></span>
            <span>Réservé</span>
          </div>
          <div class="legend-item">
            <span class="legend-color pending"></span>
            <span>En attente</span>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Attacher les événements après création
  attachModalEvents();
}

// Attacher tous les événements de la modal
function attachModalEvents() {
  const modal = document.getElementById('reservation-modal');
  
  // Bouton fermer
  modal.querySelector('.close').addEventListener('click', closeReservationModal);
  
  // Boutons navigation mois
  modal.querySelector('.prev-month').addEventListener('click', previousMonth);
  modal.querySelector('.next-month').addEventListener('click', nextMonth);
  
  // Boutons formulaire
  modal.querySelector('.submit-reservation').addEventListener('click', submitReservation);
  modal.querySelector('.cancel-reservation').addEventListener('click', cancelReservation);
  
  // Jours du calendrier
  modal.querySelectorAll('.calendar-day').forEach(day => {
    day.addEventListener('click', function() {
      const dateString = this.getAttribute('data-date');
      if (dateString) {
        selectDate(dateString);
      }
    });
  });
}

// Ouvrir la modal de réservation
async function openReservationModal(gameId, gameName) {
  if (!(await isLoggedIn())) {
    alert('Vous devez être connecté pour réserver un jeu');
    return;
  }
  
  // Vérifier le rôle de l'utilisateur
  try {
    const response = await fetch('/api/auth/me', { credentials: 'include' });
    if (response.ok) {
      const user = await response.json();
      if (user.role === 'user') {
        alert('Seuls les cotisants et administrateurs peuvent réserver des jeux. Veuillez contacter l\'administration pour devenir cotisant.');
        return;
      }
    }
  } catch (error) {
    console.error('Erreur lors de la vérification du rôle:', error);
    alert('Erreur lors de la vérification de vos droits');
    return;
  }
  
  currentGameId = gameId;
  currentGameName = gameName;
  
  if (!document.getElementById('reservation-modal')) {
    createReservationModal();
  }
  
  document.getElementById('game-name').textContent = gameName;
  document.getElementById('reservation-modal').style.display = 'block';
  renderCalendar();
}

// Fermer la modal
function closeReservationModal() {
  document.getElementById('reservation-modal').style.display = 'none';
  document.querySelector('.reservation-form').style.display = 'none';
}

// Rendre le calendrier
async function renderCalendar() {
  const monthYear = document.getElementById('month-year');
  const calendarDates = document.getElementById('calendar-dates');
  
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  
  monthYear.textContent = `${monthNames[currentMonth - 1]} ${currentYear}`;
  
  // Récupérer les réservations du mois
  const reservations = await fetchReservations(currentMonth, currentYear);
  
  // Générer le calendrier
  const firstDay = new Date(currentYear, currentMonth - 1, 1);
  const lastDay = new Date(currentYear, currentMonth, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  let calendarHTML = '';
  
  for (let week = 0; week < 6; week++) {
    calendarHTML += '<div class="calendar-week">';
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + week * 7 + day);
      
      const isCurrentMonth = currentDate.getMonth() === currentMonth - 1;
      const isToday = currentDate.toDateString() === new Date().toDateString();
      
      let dayClass = 'calendar-day';
      if (!isCurrentMonth) dayClass += ' other-month';
      if (isToday) dayClass += ' today';
      
      // Vérifier si le jour a des réservations
      const dayReservations = getReservationsForDate(reservations, currentDate);
      if (dayReservations.length > 0) {
        const hasApproved = dayReservations.some(r => r.status === 'approved');
        const hasPending = dayReservations.some(r => r.status === 'pending');
        
        if (hasApproved) dayClass += ' reserved';
        else if (hasPending) dayClass += ' pending';
      }
      
      calendarHTML += `<div class="${dayClass}" data-date="${currentDate.toISOString()}">${currentDate.getDate()}</div>`;
    }
    calendarHTML += '</div>';
  }
  
  calendarDates.innerHTML = calendarHTML;
  
  // Réattacher les événements des jours du calendrier
  const modal = document.getElementById('reservation-modal');
  modal.querySelectorAll('.calendar-day').forEach(day => {
    day.addEventListener('click', function() {
      const dateString = this.getAttribute('data-date');
      if (dateString) {
        selectDate(dateString);
      }
    });
  });
}

// Récupérer les réservations
async function fetchReservations(month, year) {
  try {
    const response = await fetch(`/api/reservations/game/${currentGameId}?month=${month}&year=${year}`);
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération des réservations:', error);
    return [];
  }
}

// Obtenir les réservations pour une date spécifique
function getReservationsForDate(reservations, date) {
  const dateStr = date.toDateString();
  return reservations.filter(reservation => {
    const start = new Date(reservation.startDate);
    const end = new Date(reservation.endDate);
    const checkDate = new Date(date);
    
    return checkDate >= start && checkDate <= end;
  });
}

// Sélectionner une date
function selectDate(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  
  if (date < today) {
    alert('Vous ne pouvez pas réserver une date passée');
    return;
  }
  
  // Pré-remplir les champs de date
  const startDate = new Date(date);
  startDate.setHours(9, 0, 0, 0);
  
  const endDate = new Date(date);
  endDate.setHours(18, 0, 0, 0);
  
  document.getElementById('start-date').value = startDate.toISOString().slice(0, 16);
  document.getElementById('end-date').value = endDate.toISOString().slice(0, 16);
  
  document.querySelector('.reservation-form').style.display = 'block';
}

// Mois précédent
function previousMonth() {
  currentMonth--;
  if (currentMonth < 1) {
    currentMonth = 12;
    currentYear--;
  }
  renderCalendar();
}

// Mois suivant
function nextMonth() {
  currentMonth++;
  if (currentMonth > 12) {
    currentMonth = 1;
    currentYear++;
  }
  renderCalendar();
}

// Soumettre la réservation
async function submitReservation() {
  const startDate = document.getElementById('start-date').value;
  const endDate = document.getElementById('end-date').value;
  const userNotes = document.getElementById('user-notes').value;
  
  if (!startDate || !endDate) {
    alert('Veuillez sélectionner les dates de début et de fin');
    return;
  }
  
  if (new Date(startDate) >= new Date(endDate)) {
    alert('La date de fin doit être après la date de début');
    return;
  }
  
  try {
    const response = await fetch('/api/reservations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        gameId: currentGameId,
        startDate,
        endDate,
        userNotes
      })
    });
    
    if (response.ok) {
      alert('Demande de réservation envoyée ! Elle sera traitée par un administrateur.');
      closeReservationModal();
      renderCalendar();
      
      // Recharger les réservations de l'utilisateur
      if (typeof loadUserReservations === 'function') {
        loadUserReservations();
      }
    } else {
      const error = await response.json();
      alert(error.message || 'Erreur lors de la création de la réservation');
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de la création de la réservation');
  }
}

// Annuler la réservation
function cancelReservation() {
  document.querySelector('.reservation-form').style.display = 'none';
}

// Vérifier si l'utilisateur est connecté
async function isLoggedIn() {
  try {
    const response = await fetch('/api/auth/me', { credentials: 'include' });
    return response.ok;
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'authentification:', error);
    return false;
  }
}

// Obtenir le token (pas nécessaire avec les cookies, mais gardé pour compatibilité)
function getToken() {
  return null; // Les cookies sont envoyés automatiquement avec credentials: 'include'
}

// Fermer la modal en cliquant à l'extérieur
window.onclick = function(event) {
  const modal = document.getElementById('reservation-modal');
  if (event.target === modal) {
    closeReservationModal();
  }
} 