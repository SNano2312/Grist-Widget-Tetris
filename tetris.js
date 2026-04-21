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
// NORMALISATION
// =====================
function scaleHeight(value) {
  if (!value || value <= 0) return 2;
  return Math.max(2, Math.ceil(Math.log10(value) * 3));
}

// =====================
// GRIST
// =====================
window.grist.ready({ requiredAccess: 'full' });

window.grist.onRecords((records) => {

  console.log("records =", records);

  // Vérification structure
  if (!records || !records["Budget AE N"]) {
    console.warn("Colonnes non trouvées :", records);
    return;
  }

  const budgets = records["Budget AE N"];
  const consos  = records["Conso AE N"];
  const nonconsos = records["Non Conso AE N"];

  const rowCount = budgets.length;
  COLS = rowCount;

  canvas.width = COLS * SIZE;
  canvas.height = ROWS * SIZE;

  grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  pieces = [];

  for (let i = 0; i < rowCount; i++) {

    const budget = budgets[i];
    const conso  = consos[i];
    const nonconso = nonconsos[i];

    console.log("Ligne", i, budget, conso, nonconso);

    pieces.push({
      x: i,
      y: 0,
      color: COLOR_BUDGET,
      height: scaleHeight(budget)
    });

    pieces.push({
      x: i,
      y: 0,
      color: COLOR_CONSO,
      height: scaleHeight(conso)
    });

    pieces.push({
      x: i,
      y: 0,
      color: COLOR_NONCONSO,
      height: scaleHeight(nonconso)
    });
  }

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
