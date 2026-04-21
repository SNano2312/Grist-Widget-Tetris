console.log("tetris.js chargé");

// =====================
// CONFIG
// =====================

const COLOR_BUDGET = "#007bff";   // bleu
const COLOR_CONSO  = "#ff0033";   // rouge
const COLOR_NONCONSO = "#00cc44"; // vert

const SIZE = 20;

// =====================
// CANVAS
// =====================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// =====================
// GRILLE
// =====================
let COLS = 0;
let ROWS = 25;
let grid = [];
let pieces = [];
let gameStarted = false;

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
// FONCTION DE NORMALISATION DES HAUTEURS
// =====================

function scaleHeight(value) {
  if (!value || value <= 0) return 2;   // minimum visible
  return Math.max(2, Math.ceil(Math.log10(value) * 3));
}

// =====================
// GRIST
// =====================

window.grist.ready({
  requiredAccess: 'full'
});

console.log("Grist ready envoyé");

window.grist.onRecords((records, mappings) => {

  console.log("onRecords déclenché");
  console.log("records =", records);

  if (!records || records.length === 0) {
    console.warn("Aucune donnée reçue.");
    return;
  }

  // Nombre de colonnes = nombre de programmes
  COLS = records.length;

  // Redimensionner le canvas
  canvas.width = COLS * SIZE;
  canvas.height = ROWS * SIZE;

  // Réinitialiser la grille
  grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  pieces = [];

  // Génération des pièces
  records.forEach((rec, indexCol) => {

    console.log("Programme", rec.B, "F=", rec.F, "G=", rec.G, "H=", rec.H);

    pieces.push({
      x: indexCol,
      y: 0,
      color: COLOR_BUDGET,
      height: scaleHeight(rec.F)
    });

    pieces.push({
      x: indexCol,
      y: 0,
      color: COLOR_CONSO,
      height: scaleHeight(rec.G)
    });

    pieces.push({
      x: indexCol,
      y: 0,
      color: COLOR_NONCONSO,
      height: scaleHeight(rec.H)
    });

  });

  // Lancer le jeu une seule fois
  if (!gameStarted) {
    gameStarted = true;
    setInterval(update, 300);
  }
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

  if (!pieces.length) return;

  pieces.forEach(p => {

    // collision sol
    if (p.y + p.height >= ROWS) {
      lockPiece(p);
      p.y = -999;
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
