console.log("tetris.js chargé");

// =====================
// CONFIG
// =====================

const COLOR_BUDGET = "#007bff";
const COLOR_CONSO  = "#ff0033";
const COLOR_NONCONSO = "#00cc44";

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

  COLS = records.length;
  canvas.width = COLS * SIZE;
  canvas.height = ROWS * SIZE;

  grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  pieces = [];

  records.forEach((rec, indexCol) => {

    const budgetAE = rec.F;
    const consoAE  = rec.G;
    const nonConso = rec.H;

    pieces.push({
      x: indexCol,
      y: 0,
      color: COLOR_BUDGET,
      height: Math.ceil(1 + Math.log10(Math.max(1, budgetAE)))
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

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c]) {
        ctx.fillStyle = grid[r][c];
        ctx.fillRect(c * SIZE, r * SIZE, SIZE, SIZE);
      }
    }
  }

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

    if (p.y + p.height >= ROWS) {
      lockPiece(p);
      p.y = -999;
      return;
    }

    if (grid[p.y + p.height][p.x]) {
      lockPiece(p);
      p.y = -999;
      return;
    }

    p.y++;
  });

  draw();
}

function lockPiece(p) {
  for (let i = 0; i < p.height; i++) {
    grid[p.y + i][p.x] = p.color;
  }
}
