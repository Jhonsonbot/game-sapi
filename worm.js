const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [{ x: 10, y: 10 }];
let dx = 1;
let dy = 0;
let apple = { x: 15, y: 15 };
let score = 0;
let gameLoop;

function drawTile(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
}

function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Gambar apel
  drawTile(apple.x, apple.y, "red");

  // Gambar cacing
  for (let i = 0; i < snake.length; i++) {
    drawTile(snake[i].x, snake[i].y, i === 0 ? "green" : "limegreen");
  }
}

function setDirection(x, y) {
  if (x !== -dx || y !== -dy) {
    dx = x;
    dy = y;
  }
}

function moveSnake() {
  const head = { x: snake[0].x + dx, y: snake[0].y + dy };

  // Cek tabrakan dinding
  if (
    head.x < 0 || head.x >= tileCount ||
    head.y < 0 || head.y >= tileCount
  ) {
    alert("💥 Game Over!");
    restartGame();
    return;
  }

  // Cek tabrakan dengan tubuh sendiri
  if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
    alert("💥 Cacing menabrak dirinya sendiri!");
    restartGame();
    return;
  }

  snake.unshift(head);

  // Makan apel
  if (head.x === apple.x && head.y === apple.y) {
    score++;
    scoreEl.textContent = score;
    placeApple();
  } else {
    snake.pop(); // gerakkan cacing
  }
}

function placeApple() {
  apple = {
    x: Math.floor(Math.random() * tileCount),
    y: Math.floor(Math.random() * tileCount),
  };

  // Hindari apel muncul di tubuh cacing
  if (snake.some(seg => seg.x === apple.x && seg.y === apple.y)) {
    placeApple();
  }
}

function gameTick() {
  moveSnake();
  drawGame();
}

function restartGame() {
  snake = [{ x: 10, y: 10 }];
  dx = 1;
  dy = 0;
  score = 0;
  scoreEl.textContent = score;
  placeApple();

  clearInterval(gameLoop);
  gameLoop = setInterval(gameTick, 150);
}

// Kontrol arah
document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowUp":
      if (dy !== 1) { dx = 0; dy = -1; }
      break;
    case "ArrowDown":
      if (dy !== -1) { dx = 0; dy = 1; }
      break;
    case "ArrowLeft":
      if (dx !== 1) { dx = -1; dy = 0; }
      break;
    case "ArrowRight":
      if (dx !== -1) { dx = 1; dy = 0; }
      break;
  }
});

// Mulai game
restartGame();
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener("touchstart", (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});

canvas.addEventListener("touchend", (e) => {
  const dxSwipe = e.changedTouches[0].clientX - touchStartX;
  const dySwipe = e.changedTouches[0].clientY - touchStartY;

  if (Math.abs(dxSwipe) > Math.abs(dySwipe)) {
    // Geser horizontal
    if (dxSwipe > 30 && dx !== -1) setDirection(1, 0);     // kanan
    else if (dxSwipe < -30 && dx !== 1) setDirection(-1, 0); // kiri
  } else {
    // Geser vertikal
    if (dySwipe > 30 && dy !== -1) setDirection(0, 1);     // bawah
    else if (dySwipe < -30 && dy !== 1) setDirection(0, -1); // atas
  }
});
