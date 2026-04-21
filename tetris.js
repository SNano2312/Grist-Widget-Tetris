console.log("tetris.js chargé");

// =====================
// CONFIG
// =====================

const SIZE = 20;
const ROWS = 25;

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
let pieces = [];
let labels = [];
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
// FORMES DE PIECES
// =====================
// Chaque forme est un tableau de [dx, dy] en cases
const SHAPE_I = [ [0,0], [0,1], [0,2], [0,3] ];
const SHAPE_L = [ [0,0], [0,1], [0,2], [1,2] ];
const SHAPE_T = [ [0,0], [1,0], [2,0], [1,1] ];

// =====================
// UTILITAIRES
// =====================

function scaleHeight(value) {
  if (!value || isNaN(value) || value <= 0) return 2;
  return Math.max(2, Math.ceil(Math.log10(value) * 2));
}

// Crée les pièces pour une ligne (colonne) donnée
function makePiecesFromRow(row, colIndex) {
  const budget   = Number(row[FIELD_BUDGET]   ?? 0);
  const conso    = Number(row[FIELD_CONSO]    ?? 0);
  const nonconso = Number(row[FIELD_NONCONSO] ?? 0);

  const hB = scaleHeight(budget);
  const hC = scaleHeight(conso);
  const hN = scaleHeight(nonconso);

  // On “étire” verticalement les formes en fonction des valeurs
  pieces.push({
    x: colIndex,
    y: 0,
    color: COLOR_BUDGET,
    shape: SHAPE_I,
    height: hB
  });

  pieces.push({
    x: colIndex,
    y: 0,
    color: COLOR_CONSO,
    shape: SHAPE_L,
    height: hC
  });

  pieces.push({
    x: colIndex,
    y: 0,
    color: COLOR_NONCONSO,
    shape: SHAPE_T,
    height: hN
  });
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
  canvas.width  = COLS * SIZE;
  canvas.height = ROWS * SIZE + 40; // un peu de place pour les labels

  grid   = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  pieces = [];
  labels = [];

  records.forEach((row, colIndex) => {
    makePiecesFromRow(row, colIndex);
    labels[colIndex] = String(row[FIELD_PROG] ?? "");
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
    if (p.y < 0) return;
    ctx.fillStyle = p.color;

    // on répète la forme verticalement selon height
    for (let k = 0; k < p.height; k++) {
      p.shape.forEach(([dx, dy]) => {
        const xx = (p.x + dx) * SIZE;
        const yy = (p.y + dy + k) * SIZE;
        if (yy >= 0 && yy < ROWS * SIZE) {
          ctx.fillRect(xx, yy, SIZE, SIZE);
        }
      });
    }
  });

  // labels (programmes de financement)
  ctx.fillStyle = "#ffffff";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "center";
  labels.forEach((txt, i) => {
    const x = i * SIZE + SIZE / 2;
    const y = ROWS * SIZE + 12;
    ctx.fillText(txt, x, y);
  });
}

// =====================
// CHUTE
// =====================

function update() {
  if (!pieces.length) return;

  pieces.forEach(p => {
    if (p.y < 0) return;

    // collision sol
    const maxY = ROWS - p.height - 4; // marge pour la forme
    if (p.y >= maxY) {
      lockPiece(p);
      p.y = -999;
      return;
    }

    // collision autre pièce (approx simple : on regarde sous la forme)
    const nextY = p.y + 1;
    let collision = false;
    p.shape.forEach(([dx, dy]) => {
      const gy = nextY + dy;
      const gx = p.x + dx;
      if (gy >= 0 && gy < ROWS && gx >= 0 && gx < COLS) {
        if (grid[gy][gx]) collision = true;
      }
    });

    if (collision) {
      lockPiece(p);
      p.y = -999;
      return;
    }

    p.y++;
  });

  draw();
}

function lockPiece(p) {
  p.shape.forEach(([dx, dy]) => {
    for (let k = 0; k < p.height; k++) {
      const gy = p.y + dy + k;
      const gx = p.x + dx;
      if (gy >= 0 && gy < ROWS && gx >= 0 && gx < COLS) {
        grid[gy][gx] = p.color;
      }
    }
  });
}
