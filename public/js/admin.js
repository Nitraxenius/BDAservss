// Fonction pour échapper le HTML
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Fonction pour afficher les erreurs de manière détaillée
function showError(error) {
  let message = 'Erreur inconnue';
  
  if (error.error) {
    message = error.error;
  }
  
  if (error.details && Array.isArray(error.details)) {
    message += '\n\nDétails:\n';
    error.details.forEach(detail => {
      message += `- ${detail.field}: ${detail.message}\n`;
    });
  }
  
  alert(message);
}

(async () => {
  const res = await fetch('/api/auth/me', { credentials: 'include' });
  if (!res.ok) return location.href = '/login.html';         // pas connecté
  const user = await res.json();
  if (user.role !== 'admin') return location.href = '/';      // pas admin
  /* si admin → on continue et tout le reste du script peut s'exécuter */
})();

/* util ---------- */
async function api(url, opts = {}) {
  const res = await fetch(url, { credentials: 'include', ...opts });
  if (res.status === 401) return (location.href = '/login.html');
  if (res.status === 403) return (location.href = '/');
  if (!res.ok) {
    const errorData = await res.json();
    throw errorData;
  }
  return res.json();
}

/* DOM ---------- */
const tbody     = document.getElementById('games-body');
const form      = document.getElementById('game-form');
const cancelBtn = document.getElementById('cancel-edit');
const formTitle = document.getElementById('form-title');

/* LISTE ---------- */
const row = g => `<tr data-id="${g._id}">
  <td>${escapeHtml(g.name)}</td><td>${escapeHtml(g.players)}</td><td>${escapeHtml(g.age)}</td>
  <td>${escapeHtml((g.tags||[]).join(', '))}</td>
  <td><button class="edit-btn">Edit</button><button class="del-btn">Del</button></td>
</tr>`;

async function loadGames(){ 
  tbody.innerHTML = (await api('/api/games')).map(row).join(''); 
}
loadGames();

/* DELETE / EDIT ---------- */
tbody.addEventListener('click', async e=>{
  const id = e.target.closest('tr')?.dataset.id;
  if(!id) return;

  if(e.target.classList.contains('del-btn')){
    if(confirm('Supprimer ?')){
      try {
        await api(`/api/games/${id}`,{method:'DELETE'});
        loadGames();
      } catch (err) {
        showError(err);
      }
    }
  }

  if(e.target.classList.contains('edit-btn')){
    try {
      const g = (await api('/api/games')).find(x=>x._id===id);

      /* ---------- remplir le formulaire ---------- */
      form.elements['id'].value          = g._id;
      form.elements['name'].value        = g.name || '';
      form.elements['players'].value     = g.players || '';
      form.elements['duration'].value    = g.duration || '';
      form.elements['age'].value         = g.age || '';
      form.elements['tags'].value        = (g.tags || []).join(',');
      form.elements['description'].value = g.description || '';
      form.elements['rules'].value       = g.rules || '';

      formTitle.textContent  = 'Modifier un jeu';
      cancelBtn.style.display='inline-block';
    } catch (err) {
      showError(err);
    }
  }
});

/* RESET ---------- */
cancelBtn.onclick=()=>{ form.reset(); form.id.value=''; formTitle.textContent='Ajouter un jeu'; cancelBtn.style.display='none'; };

/* CREATE / UPDATE ---------- */
form.addEventListener('submit', async e=>{
  e.preventDefault();
  
  try {
    const fd = new FormData(form);
    const id = fd.get('id'); 
    if(!id) fd.delete('id');
    
    /* si tags présents -> JSON.stringify pour que le back puisse JSON.parse */
    if(fd.get('tags')) {
      const tags = fd.get('tags').split(',').map(t=>t.trim()).filter(Boolean);
      fd.set('tags', JSON.stringify(tags));
    }
    
    /* enlever imagePath si on uploade une image (sera généré par le serveur) */
    if(fd.get('image').name) fd.delete('imagePath');
    
    const method = id ? 'PUT' : 'POST';
    const url    = id ? `/api/games/${id}` : '/api/games';

    await api(url,{method, body:fd}); 
    cancelBtn.click(); 
    loadGames();
    
    // Message de succès
    alert(id ? 'Jeu modifié avec succès !' : 'Jeu créé avec succès !');
    
  } catch(err){ 
    showError(err);
  }
});

/* Logout ---------- */
document.getElementById('logout-btn').onclick = async ()=>{
  try {
    await api('/api/auth/logout',{method:'POST'}); 
    location.href='/'; 
  } catch (err) {
    showError(err);
  }
};
