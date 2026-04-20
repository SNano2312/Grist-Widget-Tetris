const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const COLS = 10;
const ROWS = 20;
const SIZE = 20;

let grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

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
}

function dropBlock() {
  let col = Math.floor(Math.random() * COLS);
  let color = "hsl(" + Math.random() * 360 + ",80%,60%)";

  for (let r = 0; r < ROWS; r++) {
    if (r === ROWS - 1 || grid[r + 1][col]) {
      grid[r][col] = color;
      break;
    }
  }

  draw();
}

setInterval(dropBlock, 500);

document.getElementById("playMusic").onclick = () => {
  document.getElementById("tetrisMusic").play();
};
