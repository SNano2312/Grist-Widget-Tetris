console.log("tetris.js chargé");
 
// =====================
// CONFIG AFFICHAGE
// =====================
 
const SIZE_Y = 20;
const COL_WIDTH = 55;
const ROWS = 30;
const FIXED_COLS = 20;
 
const AXIS_WIDTH = 120;
const LEGEND_WIDTH = 120;
const LEGEND_HEIGHT = 80;
 
// couleurs
const COLOR_CONSO   = "#ff0033"; // rouge
const COLOR_RAR     = "#ffd700"; // jaune
const COLOR_ATTENTE = "#3399ff"; // bleu
const COLOR_DISPO   = "#00cc44"; // vert
 
// champs Grist EXACTS
const FIELD_CONSO    = "Conso_AE_N";
const FIELD_RAR      = "Reste_a_receptionner_N";
const FIELD_ATTENTE  = "NF_en_attente_N";
const FIELD_DISPO    = "Non_Conso_AE_N";
const FIELD_PROG     = "Programme_de_financement";
const FIELD_FONDS    = "Fonds";
 
// =====================
// CANVAS
// =====================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
 
// =====================
// VARIABLES
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
 
function toNumber(v) {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const cleaned = v.replace(/\s/g, "").replace(",", ".");
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}
 
function valueToRows(value) {
  if (!value || value <= 0 || !maxValue) return 1;
  const usableRows = ROWS - 3;
  return Math.max(1, Math.round(value / maxValue * usableRows));
}
 
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
  console.log("records reçus :", records);
  console.log("Clés détectées :", Object.keys(records[0] || {}));
 
  if (!Array.isArray(records) || records.length === 0) return;
 
  COLS = records.length;
 
  maxValue = 0;
  records.forEach(row => {
    const conso   = toNumber(row[FIELD_CONSO]);
    const rar     = toNumber(row[FIELD_RAR]);
    const attente = toNumber(row[FIELD_ATTENTE]);
    const dispo   = toNumber(row[FIELD_DISPO]);
 
    // maxValue = le total de la colonne la plus haute (les pièces s'empilent)
    const total = conso + rar + attente + dispo;
    maxValue = Math.max(maxValue, total);
  });
 
  canvas.width  = LEGEND_WIDTH + AXIS_WIDTH + FIXED_COLS * COL_WIDTH + 40;
  canvas.height = ROWS * SIZE_Y + LEGEND_HEIGHT + 50;
 
  grid   = Array.from({ length: ROWS }, () => Array(FIXED_COLS).fill(null));
  labels = [];
  pendingPieces = [];
  activePieces = [];
 
  records.forEach((row, colIndex) => {
    const conso   = toNumber(row[FIELD_CONSO]);
    const rar     = toNumber(row[FIELD_RAR]);
    const attente = toNumber(row[FIELD_ATTENTE]);
    const dispo   = toNumber(row[FIELD_DISPO]);
 
    labels[colIndex] = {
      prog:  String(row[FIELD_PROG]  ?? ""),
      fonds: String(row[FIELD_FONDS] ?? "")
    };
 
    if (conso > 0)
      pendingPieces.push({ col: colIndex, y: -1, rows: valueToRows(conso), color: COLOR_CONSO });
 
    if (rar > 0)
      pendingPieces.push({ col: colIndex, y: -1, rows: valueToRows(rar), color: COLOR_RAR });
 
    if (attente > 0)
      pendingPieces.push({ col: colIndex, y: -1, rows: valueToRows(attente), color: COLOR_ATTENTE });
 
    if (dispo > 0)
      pendingPieces.push({ col: colIndex, y: -1, rows: valueToRows(dispo), color: COLOR_DISPO });
  });
 
  shuffle(pendingPieces);
 
  if (!gameStarted) {
    gameStarted = true;
    setInterval(update, 250);
  }
});
 
// =====================
// DESSIN
// =====================
 
function drawLegend() {
  let x = 10;
  let y = 20;
 
  ctx.font = "13px sans-serif";
  ctx.textAlign = "left";
 
  ctx.fillStyle = COLOR_CONSO;
  ctx.fillRect(x, y, 15, 15);
  ctx.fillStyle = "#fff";
  ctx.fillText("Conso", x + 25, y + 12);
 
  y += 25;
  ctx.fillStyle = COLOR_RAR;
  ctx.fillRect(x, y, 15, 15);
  ctx.fillStyle = "#fff";
  ctx.fillText("Reste à réceptionner", x + 25, y + 12);
 
  y += 25;
  ctx.fillStyle = COLOR_ATTENTE;
  ctx.fillRect(x, y, 15, 15);
  ctx.fillStyle = "#fff";
  ctx.fillText("NF en attente", x + 25, y + 12);
 
  y += 25;
  ctx.fillStyle = COLOR_DISPO;
  ctx.fillRect(x, y, 15, 15);
  ctx.fillStyle = "#fff";
  ctx.fillText("Disponible", x + 25, y + 12);
}
 
function drawAxis() {
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 1;
 
  const axisX = LEGEND_WIDTH + AXIS_WIDTH - 1;
 
  ctx.beginPath();
  ctx.moveTo(axisX, 0);
  ctx.lineTo(axisX, ROWS * SIZE_Y);
  ctx.stroke();
 
  const steps = 6;
  ctx.fillStyle = "#ccc";
  ctx.font = "11px sans-serif";
  ctx.textAlign = "right";
 
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    const y = ROWS * SIZE_Y - ratio * (ROWS * SIZE_Y);
    const val = Math.round(maxValue * ratio);
 
    ctx.beginPath();
    ctx.moveTo(axisX - 5, y);
    ctx.lineTo(axisX, y);
    ctx.stroke();
 
    ctx.fillText(val.toString(), axisX - 8, y + 3);
  }
}
 
function drawLabels() {
  labels.forEach((lbl, i) => {
    const x = LEGEND_WIDTH + AXIS_WIDTH + i * COL_WIDTH + COL_WIDTH / 2;
    const baseY = ROWS * SIZE_Y + 15;
 
    // Programme (ligne 1)
    ctx.fillStyle = "#ffffff";
    ctx.font = "12px sans-serif";
    ctx.save();
    ctx.translate(x, baseY);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "right";
    ctx.fillText(lbl.prog, 0, 0);
    ctx.restore();
 
    // Fonds (ligne 2, décalée de 14px)
    ctx.fillStyle = "#aaaaaa";
    ctx.font = "11px sans-serif";
    ctx.save();
    ctx.translate(x, baseY + 14);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "right";
    ctx.fillText(lbl.fonds, 0, 0);
    ctx.restore();
  });
}
 
// Dessine une pièce avec sa position réelle en pixels (pour l'animation de glissement)
function drawPieceAtPixel(p) {
  ctx.fillStyle = p.color;
  for (let i = 0; i < p.rows; i++) {
    const r = p.y - i;
    if (r >= 0 && r < ROWS) {
      const y = r * SIZE_Y;
      ctx.fillRect(p.px, y, COL_WIDTH, SIZE_Y);
    }
  }
}
 
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
 
  drawLegend();
  drawAxis();
 
  // grille figée
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < FIXED_COLS; c++) {
      if (grid[r][c]) {
        ctx.fillStyle = grid[r][c];
        const x = LEGEND_WIDTH + AXIS_WIDTH + c * COL_WIDTH;
        const y = r * SIZE_Y;
        ctx.fillRect(x, y, COL_WIDTH, SIZE_Y);
      }
    }
  }
 
  // pièces en chute/glissement
  activePieces.forEach(p => {
    drawPieceAtPixel(p);
  });
 
  drawLabels();
}
 
// =====================
// CHUTE & GLISSEMENT
// =====================
 
// Retourne la position X cible (en pixels) pour une colonne donnée
function targetPx(col) {
  return LEGEND_WIDTH + AXIS_WIDTH + col * COL_WIDTH;
}
 
function canMoveDown(piece) {
  // Ne peut descendre que si alignée sur sa colonne cible
  if (Math.abs(piece.px - targetPx(piece.col)) > 1) return false;
 
  const nextY = piece.y + 1;
  if (nextY - (piece.rows - 1) >= ROWS) return false;
 
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
  // Spawn une nouvelle pièce depuis une colonne aléatoire en haut
  if (pendingPieces.length && activePieces.length < 3) {
    const p = pendingPieces.shift();
    p.y = 0;
    // Position de départ aléatoire parmi les colonnes disponibles
    const startCol = Math.floor(Math.random() * FIXED_COLS);
    p.px = targetPx(startCol);
    // Vitesse de glissement horizontal : 1 pixel par tick si besoin
    p.slideSpeed = COL_WIDTH / 8; // glisse de ~7px par tick
    activePieces.push(p);
  }
 
  activePieces.forEach(p => {
    const tx = targetPx(p.col);
    const dx = tx - p.px;
 
    if (Math.abs(dx) > 1) {
      // Phase de glissement horizontal (et descente lente simultanée)
      const step = Math.min(p.slideSpeed, Math.abs(dx));
      p.px += Math.sign(dx) * step;
 
      // Descente lente pendant le glissement (1 ligne toutes les 2 ticks)
      if (!p._slideTick) p._slideTick = 0;
      p._slideTick++;
      if (p._slideTick % 2 === 0 && p.y < 3) {
        p.y++;
      }
    } else {
      // Aligné : snap sur la colonne exacte et descente normale
      p.px = tx;
      if (canMoveDown(p)) {
        p.y++;
      } else {
        lockPiece(p);
        p._locked = true;
      }
    }
  });
 
  activePieces = activePieces.filter(p => !p._locked);
 
  draw();
}
