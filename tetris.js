// =====================
// CONFIG
// =====================

// Couleurs fixes
const COLOR_BUDGET = "#007bff";   // bleu
const COLOR_CONSO  = "#ff0033";   // rouge
const COLOR_NONCONSO = "#00cc44"; // vert

// Taille d'un bloc
const SIZE = 20;

// =====================
// CANVAS
// =====================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// =====================
// GRILLE (sera définie après lecture Grist)
// =====================
let COLS = 0;
let ROWS = 25;
let grid = [];

// =====================
// PIÈCES
// =====================
let pieces = [];   // toutes les pièces à faire tomber

// =====================
// MUSIQUE
// =====================
const music = document.getElementById("tetrisMusic");
const btn = document.getElementById("playMusic");

btn.onclick = () => {
  if (music.paused) {
    music.play();
    btn.textContent = "⏸️ Pause musique";
  } else {
    music.pause();
    btn.textContent = "🎵 Play musique";
  }
};

// =====================
// LECTURE DES DONNÉES GRIST
// =====================

// 🔥 CORRECTION CRITIQUE : déclarer les colonnes attendues
window.grist.ready({
  requiredAccess: 'full',
  columns: ["B", "F", "G", "H"]
});

// 🔥 CORRECTION CRITIQUE : signature correcte
window.grist.onRecords((records, mappings) => {

  console.log("RECORDS REÇUS :", records); // debug

  if (!records || records.length === 0) {
    console.warn("Aucune donnée reçue de Grist.");
    return;
  }

  // 1. Nombre de programmes = nombre de colonnes
  COLS = records.length;
  canvas.width = COLS * SIZE;
  canvas.height = ROWS * SIZE;

  // 2. Grille vide
  grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

  // 3. Génération des pièces
  pieces = [];

  records.forEach((rec, indexCol) => {

    const programme = rec.B;
    const budgetAE = rec.F;
    const consoAE  = rec.G;
    const nonConso = rec.H;

    // Taille des pièces proportionnelle au montant
    const scale = 1 + Math.log10(Math.max(1, budgetAE));

    // 3 pièces par programme
    pieces.push({
      x: indexCol,
      y: 0,
      color: COLOR_BUDGET,
      height: Math.ceil(scale)
    });

    pieces.push({
      x: indexCol,
      y: 0,
      color: COLOR_CONSO,
      height: Math.ceil(Math.log10(Math.max(1, consoAE)))
    });

    pieces.push({
      x: indexCol,
      y: 0,
      color: COLOR_NONCONSO,
      height: Math.ceil(Math.log10(Math.max(1, nonConso)))
    });

  });

});

// =====================
// DESSIN
// =====================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // grille
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c]) {
        ctx.fillStyle = grid[r][c];
        ctx.fillRect(c * SIZE, r * SIZE, SIZE, SIZE);
      }
    }
  }

  // pièces en chute
  pieces.forEach(p => {
    ctx.fillStyle = p.color;
    for (let i = 0; i < p.height; i++) {
      ctx.fillRect(p.x * SIZE, (p.y + i) * SIZE, SIZE, SIZE);
    }
  });
}

// =====================
// CHUTE
// =====================
function update() {
  pieces.forEach(p => {
    // collision sol
    if (p.y + p.height >= ROWS) {
      lockPiece(p);
      p.y = -999; // retirée
      return;
    }

    // collision autre pièce
    if (grid[p.y + p.height][p.x]) {
      lockPiece(p);
      p.y = -999;
      return;
    }

    // sinon chute
    p.y++;
  });

  draw();
}

function lockPiece(p) {
  for (let i = 0; i < p.height; i++) {
    grid[p.y + i][p.x] = p.color;
  }
}

setInterval(update, 300);
