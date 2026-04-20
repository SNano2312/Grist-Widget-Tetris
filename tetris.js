// =====================
// DIAGNOSTIC GRIST
// =====================

const output = document.getElementById("output");

// 1. Le widget demande l'accès complet
window.grist.ready({
  requiredAccess: 'full'
});

// 2. Log pour vérifier que le script est chargé
console.log("tetris.js chargé");

// 3. Callback Grist
window.grist.onRecords((records, mappings) => {

  console.log("onRecords déclenché");
  console.log("records =", records);

  if (!records || records.length === 0) {
    output.textContent = "Aucune donnée reçue depuis Grist.";
    return;
  }

  // Affichage lisible
  output.textContent = JSON.stringify(records, null, 2);
});
