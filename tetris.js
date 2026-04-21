console.log("=== DIAGNOSTIC TETRIS ===");

// =====================
// CANVAS
// =====================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = 600;
canvas.height = 200;

ctx.fillStyle = "white";
ctx.font = "16px monospace";
ctx.fillText("En attente des données Grist...", 10, 30);

// =====================
// GRIST
// =====================
window.grist.ready({ requiredAccess: "full" });

window.grist.onRecords((records, mappings) => {

  console.log("=== STRUCTURE REÇUE ===");
  console.log(records);
  console.log("=== CLES ===");
  console.log(Object.keys(records));

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  ctx.font = "14px monospace";

  ctx.fillText("Clés reçues :", 10, 20);

  const keys = Object.keys(records);
  keys.forEach((k, i) => {
    ctx.fillText("- " + k, 10, 50 + i * 20);
  });

});
