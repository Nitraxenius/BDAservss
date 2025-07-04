// Gestion de la navigation des onglets
document.addEventListener('DOMContentLoaded', () => {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // Fonction pour changer d'onglet
  function switchTab(tabName) {
    // Retirer la classe active de tous les onglets et boutons
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    // Ajouter la classe active à l'onglet sélectionné
    const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
    const activeContent = document.getElementById(`${tabName}-tab`);

    if (activeButton && activeContent) {
      activeButton.classList.add('active');
      activeContent.classList.add('active');
    }

    // Charger les données spécifiques à l'onglet si nécessaire
    loadTabData(tabName);
  }

  // Fonction pour charger les données spécifiques à chaque onglet
  function loadTabData(tabName) {
    switch (tabName) {
      case 'games':
        // Les jeux sont déjà chargés par admin.js
        break;
      case 'reservations':
        // Charger les réservations si la fonction existe
        if (typeof loadPendingReservations === 'function') {
          loadPendingReservations();
        }
        break;
      case 'cotisants':
        // Charger les cotisants si la fonction existe
        if (typeof loadCotisants === 'function') {
          loadCotisants();
        }
        break;
    }
  }

  // Attacher les événements aux boutons d'onglets
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');
      switchTab(tabName);
    });
  });

  // Charger les données de l'onglet actif au démarrage
  const activeTab = document.querySelector('.tab-btn.active');
  if (activeTab) {
    const tabName = activeTab.getAttribute('data-tab');
    loadTabData(tabName);
  }
}); 