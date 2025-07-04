// Fonction pour échapper le HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Validation côté client
function validateUsername(username) {
  if (!username || username.length < 3 || username.length > 30) {
    return 'Le nom d\'utilisateur doit contenir entre 3 et 30 caractères';
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores';
  }
  return null;
}

function validatePassword(password) {
  if (!password || password.length < 8) {
    return 'Le mot de passe doit contenir au moins 8 caractères, une minuscule, une majuscule, un chiffre et un caractère spécial (@$!%*?&)';
  }
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
    return 'Le mot de passe doit contenir au moins 8 caractères, une minuscule, une majuscule, un chiffre et un caractère spécial (@$!%*?&)';
  }
  return null;
}

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  errorDiv.style.cssText = 'color: red; background: #ffe6e6; padding: 10px; margin: 10px 0; border-radius: 4px; border: 1px solid #ff9999;';
  
  // Supprimer les anciens messages d'erreur
  const existingErrors = document.querySelectorAll('.error-message');
  existingErrors.forEach(err => err.remove());
  
  // Ajouter le nouveau message
  const form = document.querySelector('form');
  form.parentNode.insertBefore(errorDiv, form);
}

async function post(u,d){
  try {
    const response = await fetch(u, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      credentials: 'include',
      body: JSON.stringify(d)
    });
    return await response.json();
  } catch (error) {
    return { error: 'Erreur de connexion au serveur' };
  }
}

const lf = document.getElementById('login-form');
if(lf) {
  lf.addEventListener('submit', async e => {
    e.preventDefault();
    
    const formData = new FormData(lf);
    const username = formData.get('username').trim();
    const password = formData.get('password');
    
    // Validation côté client
    const usernameError = validateUsername(username);
    if (usernameError) {
      showError(usernameError);
      return;
    }
    
    if (!password) {
      showError('Mot de passe requis');
      return;
    }
    
    const r = await post('/api/auth/login', { username, password });
    if (r.ok) {
      location.href = '/';
    } else {
      showError(r.error || 'Erreur de connexion');
    }
  });
}

const rf = document.getElementById('register-form');
if(rf) {
  rf.addEventListener('submit', async e => {
    e.preventDefault();
    
    const formData = new FormData(rf);
    const username = formData.get('username').trim();
    const email = formData.get('email').trim();
    const password = formData.get('password');
    
    // Validation côté client
    const usernameError = validateUsername(username);
    if (usernameError) {
      showError(usernameError);
      return;
    }
    
    const passwordError = validatePassword(password);
    if (passwordError) {
      showError(passwordError);
      return;
    }
    
    const r = await post('/api/auth/register', { username, email, password });
    if (r.ok) {
      location.href = '/';
    } else {
      showError(r.error || 'Erreur d\'inscription');
    }
  });
}