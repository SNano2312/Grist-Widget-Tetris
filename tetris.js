console.log("tetris.js chargé");

// =====================
// CONFIG
// =====================

const COLOR_BUDGET   = "#007bff"; // bleu
const COLOR_CONSO    = "#ff0033"; // rouge
const COLOR_NONCONSO = "#00cc44"; // vert;

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
// NORMALISATION HAUTEUR
// =====================
function scaleHeight(value) {
  if (!value || isNaN(value) || value <= 0) return 2;
  return Math.max(2, Math.ceil(Math.log10(value) * 3));
}

// =====================
// GRIST
// =====================
window.grist.ready({ requiredAccess: "full" });

window.grist.onRecords((records) => {
  console.log("records reçus (tableau) :", records);

  if (!Array.isArray(records) || records.length === 0) {
    console.warn("Aucune ligne reçue.");
    return;
  }

  // ⚠️ ADAPTER ICI LES NOMS DE CHAMPS EXACTS DE GRIST ⚠️
  // Regarde dans la console une ligne de records[0] pour confirmer :
  // ex: console.log(Object.keys(records[0]));
  const FIELD_BUDGET   = "Budget_AE_N";     // ou "Budget AE N" ou autre
  const FIELD_CONSO    = "Conso_AE_N";      // idem
  const FIELD_NONCONSO = "Non_Conso_AE_N";  // idem

  // Vérif rapide sur la première ligne
  console.log("Clés d'une ligne :", Object.keys(records[0]));

  COLS = records.length;
  canvas.width  = COLS * SIZE;
  canvas.height = ROWS * SIZE;

  grid   = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  pieces = [];

  records.forEach((row, colIndex) => {
    const budget   = Number(row[FIELD_BUDGET]   ?? 0);
    const conso    = Number(row[FIELD_CONSO]    ?? 0);
    const nonconso = Number(row[FIELD_NONCONSO] ?? 0);

    console.log(`Col ${colIndex} → budget=${budget}, conso=${conso}, nonconso=${nonconso}`);

    pieces.push({
      x: colIndex,
      y: 0,
      color: COLOR_BUDGET,
      height: scaleHeight(budget)
    });

    pieces.push({
      x: colIndex,
      y: 0,
      color: COLOR_CONSO,
      height: scaleHeight(conso)
    });

    pieces.push({
      x: colIndex,
      y: 0,
      color: COLOR_NONCONSO,
      height: scaleHeight(nonconso)
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

  // grille figée
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
    if (p.y < 0) return; // pièce déjà "retirée"
    ctx.fillStyle = p.color;
    for (let i = 0; i < p.height; i++) {
      const yy = p.y + i;
      if (yy >= 0 && yy < ROWS) {
        ctx.fillRect(p.x * SIZE, yy * SIZE, SIZE, SIZE);
      }
    }
  });
}

// =====================
// CHUTE
// =====================
function update() {
  if (!pieces.length) return;

  pieces.forEach(p => {
    if (p.y < 0) return; // déjà verrouillée et retirée

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
    const yy = p.y + i;
    if (yy >= 0 && yy < ROWS) {
      grid[yy][p.x] = p.color;
    }
  }
}
