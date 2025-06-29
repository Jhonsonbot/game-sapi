const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const restartBtn = document.getElementById("btnRestart");

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [{ x: 10, y: 10 }];
let apple = { x: 5, y: 5 };
let dx = 0;
let dy = 0;
let score = 0;
let gameLoop;

function drawTile(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * gridSize, y * gridSize, gridSize - 2, gridSize - 2);
}

function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Gambar cacing
  snake.forEach((part, index) =>
    drawTile(part.x, part.y, index === 0 ? "#0a0" : "#2ecc71")
  );

  // Gambar apel
  drawTile(apple.x, apple.y, "#e74c3c");
}

function moveSnake() {
  const head = { x: snake[0].x + dx, y: snake[0].y + dy };

  // Game over: tabrak diri atau keluar batas
  if (
    head.x < 0 || head.y < 0 ||
    head.x >= tileCount || head.y >= tileCount ||
    snake.some(p => p.x === head.x && p.y === head.y)
  ) {
    clearInterval(gameLoop);
    alert("💀 Game Over!\nSkor kamu: " + score);
    return;
  }

  snake.unshift(head);

  // Apakah makan apel?
  if (head.x === apple.x && head.y === apple.y) {
    score += 10;
    scoreEl.textContent = score;
    placeApple();
  } else {
    snake.pop();
  }
}

function placeApple() {
  let valid = false;
  while (!valid) {
    apple.x = Math.floor(Math.random() * tileCount);
    apple.y = Math.floor(Math.random() * tileCount);
    valid = !snake.some(p => p.x === apple.x && p.y === apple.y);
  }
}

function gameTick() {
  moveSnake();
  drawGame();
}

function restartGame() {
  snake = [{ x: 10, y: 10 }];
  dx = 0;
  dy = 0;
  score = 0;
  scoreEl.textContent = score;
  placeApple();
  clearInterval(gameLoop);
  gameLoop = setInterval(gameTick, 200);
}

// Kontrol arah
document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowUp":
      if (dy === 0) { dx = 0; dy = -1; }
      break;
    case "ArrowDown":
      if (dy === 0) { dx = 0; dy = 1; }
      break;
    case "ArrowLeft":
      if (dx === 0) { dx = -1; dy = 0; }
      break;
    case "ArrowRight":
      if (dx === 0) { dx = 1; dy = 0; }
      break;
  }
});

restartBtn.addEventListener("click", restartGame);

restartGame();
