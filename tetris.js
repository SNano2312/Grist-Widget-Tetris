console.log("tetris.js chargé");

// =====================
// CONFIG
// =====================

const SIZE_Y = 20;          // hauteur d'une case
const COL_WIDTH = 30;       // largeur d'une colonne (plus large pour les légendes)
const ROWS = 25;

const AXIS_WIDTH = 70;      // marge pour l'axe des valeurs

const COLOR_BUDGET   = "#007bff"; // bleu
const COLOR_CONSO    = "#ff0033"; // rouge
const COLOR_NONCONSO = "#00cc44"; // vert

// Champs EXACTS de ta table Grist
const FIELD_BUDGET   = "Budget_AE_N";
const FIELD_CONSO    = "Conso_AE_N";
const FIELD_NONCONSO = "Non_Conso_AE_N";
const FIELD_PROG     = "Programme_de_financement";

// =====================
// CANVAS
// =====================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// =====================
// GRILLE / PIECES
// =====================
let COLS = 0;
let grid = [];
let labels = [];
let pendingPieces = [];
let activePieces = [];
let gameStarted = false;
let maxValue = 0;

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
// UTILITAIRES
// =====================

// mappe un montant en nombre de lignes
function valueToRows(value) {
  if (!value || value <= 0 || !maxValue) return 1;
  const usableRows = ROWS - 3; // garder un peu de marge
  return Math.max(1, Math.round(value / maxValue * usableRows));
}

// mélange simple
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
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

  COLS = records.length;

  // calcul du max pour l'échelle
  maxValue = 0;
  records.forEach(row => {
    maxValue = Math.max(
      maxValue,
      Number(row[FIELD_BUDGET]   ?? 0),
      Number(row[FIELD_CONSO]    ?? 0),
      Number(row[FIELD_NONCONSO] ?? 0)
    );
  });

  canvas.width  = AXIS_WIDTH + COLS * COL_WIDTH;
  canvas.height = ROWS * SIZE_Y + 40; // place pour les labels

  grid   = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  labels = [];
  pendingPieces = [];
  activePieces = [];

  // créer les pièces (une par montant) et les mettre dans la file d'attente
  records.forEach((row, colIndex) => {
    const budget   = Number(row[FIELD_BUDGET]   ?? 0);
    const conso    = Number(row[FIELD_CONSO]    ?? 0);
    const nonconso = Number(row[FIELD_NONCONSO] ?? 0);

    labels[colIndex] = String(row[FIELD_PROG] ?? "");

    if (budget > 0) {
      pendingPieces.push({
        col: colIndex,
        y: -1,
        rows: valueToRows(budget),
        color: COLOR_BUDGET
      });
    }
    if (conso > 0) {
      pendingPieces.push({
        col: colIndex,
        y: -1,
        rows: valueToRows(conso),
        color: COLOR_CONSO
      });
    }
    if (nonconso > 0) {
      pendingPieces.push({
        col: colIndex,
        y: -1,
        rows: valueToRows(nonconso),
        color: COLOR_NONCONSO
      });
    }
  });

  // ordre aléatoire de chute
  shuffle(pendingPieces);

  if (!gameStarted) {
    gameStarted = true;
    setInterval(update, 250);
  }
});

// =====================
// DESSIN
// =====================

function drawAxis() {
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 1;

  // axe vertical
  ctx.beginPath();
  ctx.moveTo(AXIS_WIDTH - 1, 0);
  ctx.lineTo(AXIS_WIDTH - 1, ROWS * SIZE_Y);
  ctx.stroke();

  // graduations
  const steps = 5;
  ctx.fillStyle = "#ccc";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "right";

  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    const y = ROWS * SIZE_Y - ratio * (ROWS * SIZE_Y);
    const val = Math.round(maxValue * ratio);
    ctx.beginPath();
    ctx.moveTo(AXIS_WIDTH - 5, y);
    ctx.lineTo(AXIS_WIDTH - 1, y);
    ctx.stroke();
    ctx.fillText(val.toString(), AXIS_WIDTH - 8, y + 3);
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawAxis();

  // grille figée
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c]) {
        ctx.fillStyle = grid[r][c];
        const x = AXIS_WIDTH + c * COL_WIDTH;
        const y = r * SIZE_Y;
        ctx.fillRect(x, y, COL_WIDTH, SIZE_Y);
      }
    }
  }

  // pièces en chute
  activePieces.forEach(p => {
    ctx.fillStyle = p.color;
    for (let i = 0; i < p.rows; i++) {
      const r = p.y - i;
      if (r >= 0 && r < ROWS) {
        const x = AXIS_WIDTH + p.col * COL_WIDTH;
        const y = r * SIZE_Y;
        ctx.fillRect(x, y, COL_WIDTH, SIZE_Y);
      }
    }
  });

  // labels (programmes)
  ctx.fillStyle = "#ffffff";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "center";
  labels.forEach((txt, i) => {
    const x = AXIS_WIDTH + i * COL_WIDTH + COL_WIDTH / 2;
    const y = ROWS * SIZE_Y + 12;
    ctx.fillText(txt, x, y);
  });
}

// =====================
// CHUTE
// =====================

function canMoveDown(piece) {
  const nextY = piece.y + 1;
  if (nextY - (piece.rows - 1) >= ROWS) return false;

  // vérifier collision avec la grille
  for (let i = 0; i < piece.rows; i++) {
    const r = nextY - i;
    if (r >= 0 && r < ROWS) {
      if (grid[r][piece.col]) return false;
    }
  }
  return true;
}

function lockPiece(piece) {
  for (let i = 0; i < piece.rows; i++) {
    const r = piece.y - i;
    if (r >= 0 && r < ROWS) {
      grid[r][piece.col] = piece.color;
    }
  }
}

function update() {
  // activer de nouvelles pièces aléatoirement
  if (pendingPieces.length && activePieces.length < 3) {
    const p = pendingPieces.shift();
    p.y = -1;
    activePieces.push(p);
  }

  // faire tomber les pièces actives
  activePieces.forEach(p => {
    if (canMoveDown(p)) {
      p.y++;
    } else {
      lockPiece(p);
      p._locked = true;
    }
  });

  // retirer les pièces verrouillées
  activePieces = activePieces.filter(p => !p._locked);

  draw();
}
