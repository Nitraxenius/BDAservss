async function checkAuth(){
    try{
      const res=await fetch('/api/auth/me',{credentials:'include'});
      if(!res.ok)throw new Error();
      const user=await res.json();
      // switch to avatar mode
      document.getElementById('login-btn').style.display='none';
      document.querySelector('.nav-right').style.gap='0';
      document.getElementById('profile-wrapper').style.display='block';
  
      // if admin, add item inside dropdown
      if(user.role==='admin'){
        const adminItem=document.createElement('a');
        adminItem.href='/admin.html';
        adminItem.textContent='Admin';
        adminItem.style.display='block';
        adminItem.style.padding='6px 0';
        adminItem.style.textDecoration='none';
        adminItem.style.color='#333';
        adminItem.onmouseover=()=>adminItem.style.color='#4caf50';
        adminItem.onmouseout=()=>adminItem.style.color='#333';
        const dropdown=document.getElementById('profile-dropdown');
        dropdown.prepend(adminItem);
      }
      
      // Afficher le nom d'utilisateur
      const usernameDisplay = document.getElementById('username-display');
      if (usernameDisplay) {
        usernameDisplay.textContent = user.username;
      }
      
      // Masquer le bouton "Mes réservations" pour les utilisateurs simples
      const reservationsBtn = document.getElementById('my-reservations-btn');
      if (reservationsBtn) {
        if (user.role === 'user') {
          reservationsBtn.style.display = 'none';
        } else {
          reservationsBtn.style.display = 'block';
        }
      }
    }catch{}
  }
  
  const profileWrapper=document.getElementById('profile-wrapper');
  const dropdown=document.getElementById('profile-dropdown');
  profileWrapper.addEventListener('click',()=>{
    dropdown.style.display=dropdown.style.display==='block'?'none':'block';
  });
  
  document.getElementById('logout-btn').onclick=async()=>{
    await fetch('/api/auth/logout',{method:'POST',credentials:'include'});
    location.reload();
  };
  
  checkAuth();
  
  // Attacher les événements des réservations et profil
  document.addEventListener('DOMContentLoaded', () => {
    // Bouton "Mes réservations"
    const reservationsBtn = document.getElementById('my-reservations-btn');
    if (reservationsBtn) {
      reservationsBtn.addEventListener('click', openUserReservationsModal);
    }
    
    // Bouton "Mon profil"
    const profileBtn = document.getElementById('profile-btn-menu');
    if (profileBtn) {
      profileBtn.addEventListener('click', openProfileModal);
    }
    
    // Bouton "Changer mot de passe"
    const changePasswordBtn = document.getElementById('change-password-btn');
    if (changePasswordBtn) {
      changePasswordBtn.addEventListener('click', openChangePasswordModal);
    }
    
    // Boutons fermer les modals
    const closeReservationsBtn = document.getElementById('close-reservations-modal');
    if (closeReservationsBtn) {
      closeReservationsBtn.addEventListener('click', closeUserReservationsModal);
    }
    
    const closeProfileBtn = document.getElementById('close-profile-modal');
    if (closeProfileBtn) {
      closeProfileBtn.addEventListener('click', closeProfileModal);
    }
    
    const closePasswordBtn = document.getElementById('close-password-modal');
    if (closePasswordBtn) {
      closePasswordBtn.addEventListener('click', closeChangePasswordModal);
    }
    
    // Bouton annuler changement de mot de passe
    const cancelPasswordBtn = document.getElementById('cancel-password');
    if (cancelPasswordBtn) {
      cancelPasswordBtn.addEventListener('click', closeChangePasswordModal);
    }
    
    // Formulaire changement de mot de passe
    const changePasswordForm = document.getElementById('change-password-form');
    if (changePasswordForm) {
      changePasswordForm.addEventListener('submit', handleChangePassword);
    }
    
    // Fermer en cliquant à l'extérieur
    const modals = ['user-reservations-modal', 'profile-modal', 'change-password-modal'];
    modals.forEach(modalId => {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.addEventListener('click', (event) => {
          if (event.target === modal) {
            if (modalId === 'user-reservations-modal') {
              closeUserReservationsModal();
            } else if (modalId === 'profile-modal') {
              closeProfileModal();
            } else if (modalId === 'change-password-modal') {
              closeChangePasswordModal();
            }
          }
        });
      }
         });
   });
   
   // Fonctions pour les modals
   
   // Ouvrir la modal du profil
   async function openProfileModal() {
     try {
       const response = await fetch('/api/auth/me', { credentials: 'include' });
       if (response.ok) {
         const user = await response.json();
         
         document.getElementById('profile-username').textContent = user.username;
         document.getElementById('profile-role').textContent = getRoleDisplayName(user.role);
         document.getElementById('profile-created').textContent = user.createdAt ? 
           new Date(user.createdAt).toLocaleDateString('fr-FR') : 'Non disponible';
         
         document.getElementById('profile-modal').style.display = 'block';
       }
     } catch (error) {
       console.error('Erreur lors du chargement du profil:', error);
       alert('Erreur lors du chargement du profil');
     }
   }
   
   // Fermer la modal du profil
   function closeProfileModal() {
     document.getElementById('profile-modal').style.display = 'none';
   }
   
   // Ouvrir la modal de changement de mot de passe
   function openChangePasswordModal() {
     document.getElementById('change-password-form').reset();
     document.getElementById('change-password-modal').style.display = 'block';
   }
   
   // Fermer la modal de changement de mot de passe
   function closeChangePasswordModal() {
     document.getElementById('change-password-modal').style.display = 'none';
   }
   
   // Gérer le changement de mot de passe
   async function handleChangePassword(event) {
     event.preventDefault();
     
     const currentPassword = document.getElementById('current-password').value;
     const newPassword = document.getElementById('new-password').value;
     const confirmPassword = document.getElementById('confirm-password').value;
     
     if (newPassword !== confirmPassword) {
       alert('Les nouveaux mots de passe ne correspondent pas');
       return;
     }
     
           if (newPassword.length < 8) {
        alert('Le nouveau mot de passe doit contenir au moins 8 caractères, une minuscule, une majuscule, un chiffre et un caractère spécial (@$!%*?&)');
        return;
      }
      
      // Vérifier la complexité du mot de passe
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(newPassword)) {
        alert('Le nouveau mot de passe doit contenir au moins 8 caractères, une minuscule, une majuscule, un chiffre et un caractère spécial (@$!%*?&)');
        return;
      }
     
     try {
       const response = await fetch('/api/auth/change-password', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json'
         },
         credentials: 'include',
         body: JSON.stringify({
           currentPassword,
           newPassword
         })
       });
       
       if (response.ok) {
         alert('Mot de passe changé avec succès !');
         closeChangePasswordModal();
       } else {
         const error = await response.json();
         alert(error.message || 'Erreur lors du changement de mot de passe');
       }
     } catch (error) {
       console.error('Erreur:', error);
       alert('Erreur lors du changement de mot de passe');
     }
   }
   
   // Fonction pour afficher le nom du rôle
   function getRoleDisplayName(role) {
     switch (role) {
       case 'admin': return 'Administrateur';
       case 'cotisant': return 'Cotisant';
       case 'user': return 'Utilisateur';
       default: return role;
     }
   }