// Fonction pour échapper le HTML et prévenir XSS
function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  
  // D'abord décoder les entités HTML communes
  let decoded = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
  
  // Puis échapper seulement les caractères dangereux
  return decoded
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

let allGames = [];
let currentFilters = { tags: [], players: '', duration: '' };

async function fetchGames() {
  try {
    const res = await fetch("/api/games");
    const games = await res.json();
    allGames = games;
    renderFilters(games);
    renderGames(games);
  } catch (err) {
    console.error(err);
  }
}

function getUniqueTags(games) {
  const tags = new Set();
  games.forEach(g => (g.tags||[]).forEach(t => tags.add(t)));
  return Array.from(tags).sort();
}
function getUniquePlayers(games) {
  const players = new Set();
  games.forEach(g => g.players && players.add(g.players));
  return Array.from(players).sort();
}
function getUniqueDurations(games) {
  const durations = new Set();
  games.forEach(g => g.duration && durations.add(g.duration));
  return Array.from(durations).sort();
}

function renderFilters(games) {
  // Tags
  const tags = getUniqueTags(games);
  const tagsSelect = document.getElementById('filter-tags');
  const selectedTags = document.getElementById('selected-tags');
  
  if (tagsSelect) {
    // Filtrer les tags déjà sélectionnés
    const availableTags = tags.filter(tag => !currentFilters.tags.includes(tag));
    
    tagsSelect.innerHTML = `<option value="">Sélectionner un tag</option>` +
      availableTags.map(tag => `<option value="${escapeHtml(tag)}">${escapeHtml(tag)}</option>`).join('');
    
    tagsSelect.onchange = e => {
      const selectedTag = e.target.value;
      if (selectedTag && !currentFilters.tags.includes(selectedTag)) {
        currentFilters.tags.push(selectedTag);
        renderFilters(games);
        renderGames(filterGames());
        // Remettre la sélection à vide
        e.target.value = '';
      }
    };
  }
  
  if (selectedTags) {
    selectedTags.innerHTML = currentFilters.tags.map(tag =>
      `<span class="tag-chip">${escapeHtml(tag)} <span class="remove-tag" data-tag="${escapeHtml(tag)}">&times;</span></span>`
    ).join(' ');
    selectedTags.querySelectorAll('.remove-tag').forEach(cross => {
      cross.onclick = () => {
        const tag = cross.getAttribute('data-tag');
        currentFilters.tags = currentFilters.tags.filter(t => t !== tag);
        renderFilters(games);
        renderGames(filterGames());
      };
    });
  }
  // Joueurs
  const players = getUniquePlayers(games);
  const playersSelect = document.getElementById('filter-players');
  if (playersSelect) {
    playersSelect.innerHTML = `<option value="">Tous</option>` +
      players.map(p => `<option value="${escapeHtml(p)}" ${currentFilters.players === p ? 'selected' : ''}>${escapeHtml(p)}</option>`).join('');
    playersSelect.onchange = e => {
      currentFilters.players = e.target.value;
      renderGames(filterGames());
    };
  }
  // Durée
  const durations = getUniqueDurations(games);
  const durationsSelect = document.getElementById('filter-duration');
  if (durationsSelect) {
    durationsSelect.innerHTML = `<option value="">Toutes</option>` +
      durations.map(d => `<option value="${escapeHtml(d)}" ${currentFilters.duration === d ? 'selected' : ''}>${escapeHtml(d)}</option>`).join('');
    durationsSelect.onchange = e => {
      currentFilters.duration = e.target.value;
      renderGames(filterGames());
    };
  }
  // Reset
  const resetBtn = document.getElementById('reset-filters');
  if (resetBtn) {
    resetBtn.onclick = () => {
      currentFilters = { tags: [], players: '', duration: '' };
      renderFilters(games);
      renderGames(allGames);
    };
  }
}

function filterGames() {
  return allGames.filter(game => {
    const tagsOk = !currentFilters.tags.length || (game.tags||[]).some(tag => currentFilters.tags.includes(tag));
    const playersOk = !currentFilters.players || game.players === currentFilters.players;
    const durationOk = !currentFilters.duration || game.duration === currentFilters.duration;
    return tagsOk && playersOk && durationOk;
  });
}

function renderGames(games) {
  const container = document.getElementById("games-container");
  container.innerHTML = "";
  games.forEach((game) => {
    const card = document.createElement("div");
    card.className = "card";

    // Échapper toutes les données pour prévenir XSS
    const safeName = escapeHtml(game.name);
    const safePlayers = escapeHtml(game.players);
    const safeDuration = escapeHtml(game.duration);
    const safeAge = escapeHtml(game.age);
    const safeDescription = escapeHtml(game.description);
    const safeImagePath = escapeHtml(game.imagePath);
    const safeRules = game.rules ? escapeHtml(game.rules) : '';
    // Créer les tags de manière sécurisée
    const safeTags = game.tags ? game.tags.map(tag => 
      `<span class="tag">${escapeHtml(tag)}</span>`
    ).join(' ') : '';

    card.innerHTML = `
  <img src="${safeImagePath}" alt="${safeName}" onerror="this.src='assets/images/base.png'" />
  <div class="card-content">
    <h2>${safeName}</h2>
    <p><strong>Joueurs :</strong> ${safePlayers}</p>
    <p><strong>Durée :</strong> ${safeDuration}</p>
    <p><strong>Âge :</strong> ${safeAge}</p>
    <p>${safeDescription}</p>
 ${safeRules ? `
      <div class="rules-wrapper">
        <span class="rules-icon"></span>
        <a href="${safeRules}" target="_blank" rel="noopener noreferrer">Règles</a>
      </div>` : ''}    
      <div>${safeTags}</div>
      <button class="reserve-btn" data-game-id="${game._id}" data-game-name="${safeName}">Réserver</button>
  </div>`;

    container.appendChild(card);
  });

  // Attacher les événements de réservation (respect CSP)
  document.querySelectorAll('.reserve-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      openReservationModal(
        btn.getAttribute('data-game-id'),
        btn.getAttribute('data-game-name')
      );
    });
  });
}

// Charger les réservations de l'utilisateur
async function loadUserReservations() {
  try {
    const response = await fetch('/api/reservations/user', { credentials: 'include' });
    if (response.ok) {
      const reservations = await response.json();
      displayUserReservations(reservations);
    }
  } catch (error) {
    console.error('Erreur lors du chargement des réservations:', error);
  }
}

// Ouvrir la modal des réservations
async function openUserReservationsModal() {
  await loadUserReservations();
  document.getElementById('user-reservations-modal').style.display = 'block';
}

// Fermer la modal des réservations
function closeUserReservationsModal() {
  document.getElementById('user-reservations-modal').style.display = 'none';
}

// Afficher les réservations de l'utilisateur
function displayUserReservations(reservations) {
  // Limiter à 10 réservations les plus récentes
  const recentReservations = reservations.slice(0, 10);
  
  const listContainer = document.getElementById('user-reservations-list');
  
  if (recentReservations.length === 0) {
    listContainer.innerHTML = '<div class="no-reservations">Aucune réservation trouvée</div>';
    return;
  }
  
  const reservationsHTML = recentReservations.map(reservation => {
    const startDate = new Date(reservation.startDate).toLocaleString('fr-FR');
    const endDate = new Date(reservation.endDate).toLocaleString('fr-FR');
    
    const statusText = {
      'pending': 'En attente',
      'approved': 'Approuvée',
      'rejected': 'Rejetée'
    };
    
    const statusClass = reservation.status;
    
    return `
      <div class="reservation-card" data-id="${reservation._id}">
        <div class="reservation-info">
          <div class="reservation-game">${reservation.gameId.name}</div>
          <div class="reservation-dates">Du ${startDate} au ${endDate}</div>
          ${reservation.userNotes ? `<div class="reservation-notes">"${reservation.userNotes}"</div>` : ''}
          ${reservation.adminNotes ? `<div class="reservation-notes">Admin: "${reservation.adminNotes}"</div>` : ''}
        </div>
        <div class="reservation-status ${statusClass}">
          ${statusText[reservation.status]}
        </div>
        <div class="reservation-actions">
          ${reservation.status === 'pending' ? `<button class="btn-cancel-reservation" data-id="${reservation._id}">Annuler</button>` : ''}
        </div>
      </div>
    `;
  }).join('');
  
  listContainer.innerHTML = reservationsHTML;
  
  // Attacher les événements des boutons d'annulation
  attachCancelEvents();
}

// Attacher les événements d'annulation
function attachCancelEvents() {
  document.querySelectorAll('.btn-cancel-reservation').forEach(btn => {
    btn.addEventListener('click', function() {
      const reservationId = this.getAttribute('data-id');
      cancelUserReservation(reservationId);
    });
  });
}

// Annuler une réservation utilisateur
async function cancelUserReservation(reservationId) {
  if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/reservations/${reservationId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (response.ok) {
      alert('Réservation annulée avec succès !');
      loadUserReservations(); // Recharger la liste
    } else {
      const error = await response.json();
      alert(error.message || 'Erreur lors de l\'annulation');
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de l\'annulation de la réservation');
  }
}

document.addEventListener("DOMContentLoaded", () => {
  fetchGames();
  loadUserReservations();
});