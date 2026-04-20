const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Grille élargie
const COLS = 14;
const ROWS = 20;
const SIZE = 24;

canvas.width = COLS * SIZE;
canvas.height = ROWS * SIZE;

// Couleurs Tetris
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

let piece = null;

// Nouvelle pièce avec spawn aléatoire sur toute la largeur
function newPiece() {
  const types = Object.keys(SHAPES);
  const type = types[Math.floor(Math.random() * types.length)];

  const shape = SHAPES[type].map(r => [...r]);
  const pieceWidth = shape[0].length;

  // Position X aléatoire valide
  const maxX = COLS - pieceWidth;
  const spawnX = Math.floor(Math.random() * (maxX + 1));

  piece = {
    shape: shape,
    color: COLORS[type],
    x: spawnX,
    y: 0
  };
}

// Collision
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

// Fixe la pièce
function lockPiece() {
  piece.shape.forEach((row, r) => {
    row.forEach((val, c) => {
      if (val) {
        grid[piece.y + r][piece.x + c] = piece.color;
      }
    });
  });
}

// Dessin
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

// Boucle
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

// Musique Play/Pause
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
