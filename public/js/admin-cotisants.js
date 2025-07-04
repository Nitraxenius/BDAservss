// Gestion des cotisants
let cotisants = [];
let editingCotisantId = null;

// Charger les cotisants
async function loadCotisants() {
  try {
    const response = await fetch('/api/cotisants', { credentials: 'include' });
    if (response.ok) {
      cotisants = await response.json();
      displayCotisants();
    } else {
      console.error('Erreur lors du chargement des cotisants');
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// Afficher les cotisants
function displayCotisants() {
  const tbody = document.getElementById('cotisants-body');
  
  if (cotisants.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="no-data">Aucun cotisant trouvé</td></tr>';
    return;
  }
  
  const cotisantsHTML = cotisants.map(cotisant => {
    const dateExpiration = new Date(cotisant.dateExpiration).toLocaleDateString('fr-FR');
    const isExpired = new Date(cotisant.dateExpiration) < new Date();
    const statusClass = cotisant.statut === 'actif' ? 'status-active' : 'status-inactive';
    const expiredClass = isExpired ? 'expired' : '';
    
    return `
      <tr class="${expiredClass}">
        <td>${cotisant.nom}</td>
        <td>${cotisant.prenom}</td>
        <td>${cotisant.email}</td>
        <td><span class="status ${statusClass}">${cotisant.statut}</span></td>
        <td>${dateExpiration}</td>
        <td>
          <button class="btn-edit" data-id="${cotisant._id}">Modifier</button>
          <button class="btn-delete" data-id="${cotisant._id}">Supprimer</button>
        </td>
      </tr>
    `;
  }).join('');
  
  tbody.innerHTML = cotisantsHTML;

  // Attacher les événements après injection du HTML
  tbody.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = this.getAttribute('data-id');
      editCotisant(id);
    });
  });
  tbody.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = this.getAttribute('data-id');
      deleteCotisant(id);
    });
  });
}

// Ouvrir la modal pour ajouter un cotisant
function openCotisantModal() {
  editingCotisantId = null;
  document.getElementById('cotisant-modal-title').textContent = 'Ajouter un cotisant';
  document.getElementById('cotisant-form').reset();
  document.getElementById('cotisant-modal').style.display = 'block';
}

// Ouvrir la modal pour modifier un cotisant
function editCotisant(id) {
  const cotisant = cotisants.find(c => c._id === id);
  if (!cotisant) return;
  
  editingCotisantId = id;
  document.getElementById('cotisant-modal-title').textContent = 'Modifier un cotisant';
  
  // Remplir le formulaire
  document.getElementById('cotisant-id').value = cotisant._id;
  document.getElementById('cotisant-nom').value = cotisant.nom;
  document.getElementById('cotisant-prenom').value = cotisant.prenom;
  document.getElementById('cotisant-email').value = cotisant.email;
  document.getElementById('cotisant-date-expiration').value = cotisant.dateExpiration.split('T')[0];
  document.getElementById('cotisant-statut').value = cotisant.statut;
  document.getElementById('cotisant-notes').value = cotisant.notes || '';
  
  document.getElementById('cotisant-modal').style.display = 'block';
}

// Fermer la modal
function closeCotisantModal() {
  document.getElementById('cotisant-modal').style.display = 'none';
  editingCotisantId = null;
}

// Sauvegarder un cotisant
async function saveCotisant(event) {
  event.preventDefault();
  
  const formData = {
    nom: document.getElementById('cotisant-nom').value,
    prenom: document.getElementById('cotisant-prenom').value,
    email: document.getElementById('cotisant-email').value,
    dateExpiration: document.getElementById('cotisant-date-expiration').value,
    statut: document.getElementById('cotisant-statut').value,
    notes: document.getElementById('cotisant-notes').value
  };
  
  try {
    const url = editingCotisantId 
      ? `/api/cotisants/${editingCotisantId}`
      : '/api/cotisants';
    
    const method = editingCotisantId ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(formData)
    });
    
    if (response.ok) {
      closeCotisantModal();
      await loadCotisants();
      alert(editingCotisantId ? 'Cotisant modifié avec succès' : 'Cotisant ajouté avec succès');
    } else {
      const error = await response.json();
      alert(error.message || 'Erreur lors de la sauvegarde');
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de la sauvegarde');
  }
}

// Supprimer un cotisant
async function deleteCotisant(id) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce cotisant ?')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/cotisants/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (response.ok) {
      await loadCotisants();
      alert('Cotisant supprimé avec succès');
    } else {
      const error = await response.json();
      alert(error.message || 'Erreur lors de la suppression');
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de la suppression');
  }
}

// Attacher les événements
document.addEventListener('DOMContentLoaded', () => {
  // Charger les cotisants au démarrage seulement si on est sur l'onglet cotisants
  if (document.getElementById('cotisants-tab').classList.contains('active')) {
    loadCotisants();
  }
  
  // Bouton ajouter un cotisant
  const addBtn = document.getElementById('add-cotisant-btn');
  if (addBtn) {
    addBtn.addEventListener('click', openCotisantModal);
  }
  
  // Formulaire cotisant
  const form = document.getElementById('cotisant-form');
  if (form) {
    form.addEventListener('submit', saveCotisant);
  }
  
  // Bouton fermer modal
  const closeBtn = document.getElementById('close-cotisant-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeCotisantModal);
  }
  
  // Bouton annuler
  const cancelBtn = document.getElementById('cancel-cotisant');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeCotisantModal);
  }
  
  // Fermer en cliquant à l'extérieur
  const modal = document.getElementById('cotisant-modal');
  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeCotisantModal();
      }
    });
  }
}); 