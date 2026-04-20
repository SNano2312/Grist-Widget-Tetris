const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const COLS = 10;
const ROWS = 20;
const SIZE = 20;

// Couleurs Tetris (tu pourras les mapper à tes budgets)
const COLORS = {
  I: "#00f0f0",
  J: "#0000f0",
  L: "#f0a000",
  O: "#f0f000",
  S: "#00f000",
  T: "#a000f0",
  Z: "#f00000"
};

// Formes Tetris
const SHAPES = {
  I: [[1,1,1,1]],
  J: [[1,0,0],[1,1,1]],
  L: [[0,0,1],[1,1,1]],
  O: [[1,1],[1,1]],
  S: [[0,1,1],[1,1,0]],
  T: [[0,1,0],[1,1,1]],
  Z: [[1,1,0],[0,1,1]]
};

// Grille vide
let grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

// Pièce courante
let piece = null;

// Génère une nouvelle pièce
function newPiece() {
  const types = Object.keys(SHAPES);
  const type = types[Math.floor(Math.random() * types.length)];
  piece = {
    shape: SHAPES[type],
    color: COLORS[type],
    x: 3,
    y: 0
  };
}

// Dessine la grille + la pièce
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Grille
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c]) {
        ctx.fillStyle = grid[r][c];
        ctx.fillRect(c * SIZE, r * SIZE, SIZE, SIZE);
      }
    }
  }

  // Pièce courante
  if (piece) {
    ctx.fillStyle = piece.color;
    piece.shape.forEach((row, r) => {
      row.forEach((val, c) => {
        if (val) {
          ctx.fillRect((piece.x + c) * SIZE, (piece.y + r) * SIZE, SIZE, SIZE);
        }
      });
    });
  }
}

// Vérifie collision
function collision(px, py, shape) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        let x = px + c;
        let y = py + r;
        if (x < 0 || x >= COLS || y >= ROWS || (y >= 0 && grid[y][x])) {
          return true;
        }
      }
    }
  }
  return false;
}

// Fixe la pièce dans la grille
function lockPiece() {
  piece.shape.forEach((row, r) => {
    row.forEach((val, c) => {
      if (val) {
        grid[piece.y + r][piece.x + c] = piece.color;
      }
    });
  });
}

// Boucle de jeu
function update() {
  if (!piece) newPiece();

  if (!collision(piece.x, piece.y + 1, piece.shape)) {
    piece.y++;
  } else {
    lockPiece();
    newPiece();
  }

  draw();
}

setInterval(update, 400);

// Musique
document.getElementById("playMusic").onclick = () => {
  document.getElementById("tetrisMusic").play();
};
