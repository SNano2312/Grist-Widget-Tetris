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
let colStacks = [];
let colSegments = [];
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

// Lance la musique dès le premier clic sur la page (contourne l'autoplay)
let musicStarted = false;
function startMusicOnce() {
  if (!musicStarted) {
    musicStarted = true;
    music.play().then(() => {
      btn.textContent = "⏸️ Pause musique";
    }).catch(() => {});
  }
  document.removeEventListener("click", startMusicOnce);
  canvas.removeEventListener("click", startMusicOnce);
}
document.addEventListener("click", startMusicOnce);
canvas.addEventListener("click", startMusicOnce);

btn.onclick = (e) => {
  e.stopPropagation();
  if (music.paused) {
    music.play();
    btn.textContent = "⏸️ Pause musique";
    musicStarted = true;
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

// Calcule les hauteurs en pixels pour les valeurs d'une colonne.
// Garantit que la somme est exacte (pas de dérive par arrondis).
function computeHeights(values) {
  const total = values.reduce((a, b) => a + b, 0);
  if (total <= 0 || !maxValue) return values.map(() => 0);

  const usablePixels = (ROWS - 1) * SIZE_Y * (total / maxValue);

  const raw = values.map(v => v / total * usablePixels);
  const floored = raw.map(v => Math.floor(v));
  const remainders = raw.map((v, i) => ({ i, r: v - floored[i] }));
  const deficit = Math.round(usablePixels) - floored.reduce((a, b) => a + b, 0);
  remainders.sort((a, b) => b.r - a.r);
  for (let k = 0; k < deficit && k < remainders.length; k++) floored[remainders[k].i]++;
  return floored;
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

  colStacks   = Array(FIXED_COLS).fill(0);
  colSegments = Array.from({ length: FIXED_COLS }, () => []);
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

    // Calcul des hauteurs en pixels par colonne (somme exacte, pas d'arrondi cumulatif)
    const values  = [conso, rar, attente, dispo];
    const colors  = [COLOR_CONSO, COLOR_RAR, COLOR_ATTENTE, COLOR_DISPO];
    const heights = computeHeights(values);

    const total = conso + rar + attente + dispo;
    console.log(
      `Col ${colIndex} (${row[FIELD_PROG]}) | total=${total.toFixed(0)} | maxValue=${maxValue.toFixed(0)}`,
      `| heights=[${heights.join(',')}] | sumH=${heights.reduce((a,b)=>a+b,0)}`,
      `| attendu=${((ROWS-1)*SIZE_Y*(total/maxValue)).toFixed(1)}px`
    );

    values.forEach((val, idx) => {
      if (val > 0 && heights[idx] > 0) {
        pendingPieces.push({
          col:    colIndex,
          y:      -1,
          px:     0,
          pixels: heights[idx],   // hauteur en pixels
          color:  colors[idx]
        });
      }
    });
  });

  shuffle(pendingPieces);

  if (!gameStarted) {
    gameStarted = true;
    music.play().then(() => {
      btn.textContent = "⏸️ Pause musique";
    }).catch(() => {
      // Autoplay bloqué par le navigateur, l'utilisateur peut cliquer manuellement
    });
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
    // Centre de la colonne
    const x = LEGEND_WIDTH + AXIS_WIDTH + i * COL_WIDTH + COL_WIDTH / 2;
    // Point de départ juste sous la grille
    const baseY = ROWS * SIZE_Y + 10;

    // Programme (colonne de gauche dans l'espace rotatif = x - 8)
    ctx.fillStyle = "#ffffff";
    ctx.font = "12px sans-serif";
    ctx.save();
    ctx.translate(x - 7, baseY);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "right";
    ctx.fillText(lbl.prog, 0, 0);
    ctx.restore();

    // Fonds (colonne de droite dans l'espace rotatif = x + 8)
    ctx.fillStyle = "#aaaaaa";
    ctx.font = "11px sans-serif";
    ctx.save();
    ctx.translate(x + 7, baseY);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "right";
    ctx.fillText(lbl.fonds, 0, 0);
    ctx.restore();
  });
}

// =====================
// CHUTE & GLISSEMENT (tout en pixels)
// =====================

function targetPx(col) {
  return LEGEND_WIDTH + AXIS_WIDTH + col * COL_WIDTH;
}

const gridH = () => ROWS * SIZE_Y; // hauteur totale de la grille en pixels

function canMoveDown(piece) {
  if (Math.abs(piece.px - targetPx(piece.col)) > 1) return false;
  // Le bas de la pièce en cours de chute = piece.pyBottom
  const nextBottom = piece.pyBottom + 2; // vitesse de chute en pixels
  const floor = gridH() - (colStacks[piece.col] || 0);
  return nextBottom + piece.pixels <= floor;
}

function lockPiece(piece) {
  const c = piece.col;
  const h = piece.pixels;
  const bottom = gridH() - (colStacks[c] || 0);
  const top = bottom - h;
  colSegments[c].push({ top, height: h, color: piece.color });
  colStacks[c] = (colStacks[c] || 0) + h;
}

function drawPieceAtPixel(p) {
  ctx.fillStyle = p.color;
  const x = p.px;
  const top = p.pyBottom - p.pixels;
  if (top < gridH()) {
    const clippedTop = Math.max(0, top);
    const clippedH   = p.pyBottom - clippedTop;
    ctx.fillRect(x, clippedTop, COL_WIDTH, clippedH);
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawLegend();
  drawAxis();

  // segments figés
  for (let c = 0; c < FIXED_COLS; c++) {
    (colSegments[c] || []).forEach(seg => {
      ctx.fillStyle = seg.color;
      const x = LEGEND_WIDTH + AXIS_WIDTH + c * COL_WIDTH;
      ctx.fillRect(x, seg.top, COL_WIDTH, seg.height);
    });
  }

  // pièces en chute/glissement
  activePieces.forEach(p => drawPieceAtPixel(p));

  drawLabels();
}

function update() {
  // Spawn une nouvelle pièce depuis une colonne aléatoire en haut
  if (pendingPieces.length && activePieces.length < 3) {
    const p = pendingPieces.shift();
    // Démarre en haut, position X aléatoire
    const startCol = Math.floor(Math.random() * FIXED_COLS);
    p.px        = targetPx(startCol);
    p.pyBottom  = 0; // bas de la pièce en pixels depuis le haut de la grille
    p.slideSpeed = COL_WIDTH / 8;
    p.fallSpeed  = 4; // pixels par tick de descente
    activePieces.push(p);
  }

  activePieces.forEach(p => {
    const tx = targetPx(p.col);
    const dx = tx - p.px;

    if (Math.abs(dx) > 1) {
      // Phase de glissement horizontal + légère descente
      const step = Math.min(p.slideSpeed, Math.abs(dx));
      p.px += Math.sign(dx) * step;
      if (p.pyBottom < p.pixels + SIZE_Y) p.pyBottom += 2;
    } else {
      // Aligné : chute normale en pixels
      p.px = tx;
      if (canMoveDown(p)) {
        p.pyBottom += p.fallSpeed;
      } else {
        // Snap précis sur la pile
        p.pyBottom = gridH() - (colStacks[p.col] || 0);
        lockPiece(p);
        p._locked = true;
      }
    }
  });

  activePieces = activePieces.filter(p => !p._locked);

  draw();
}
