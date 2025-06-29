const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const tileSize = 20;
const tileCount = 20;
canvas.width = tileSize * tileCount;
canvas.height = tileSize * tileCount;

let snake = [{ x: 10, y: 10 }];
let food = spawnFood();

let dx = 1, dy = 0;
let nextDx = dx, nextDy = dy;
let speed = 150; // lebih lambat = lebih mudah dikendalikan
let gameInterval;

function spawnFood() {
  let x = Math.floor(Math.random() * tileCount);
  let y = Math.floor(Math.random() * tileCount);
  return { x, y };
}

function draw() {
  ctx.fillStyle = "#fff7e6";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // gambar makanan
  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.arc(food.x * tileSize + tileSize / 2, food.y * tileSize + tileSize / 2, tileSize / 2.5, 0, Math.PI * 2);
  ctx.fill();

  // gambar cacing
  ctx.fillStyle = "green";
  snake.forEach((part, i) => {
    ctx.fillRect(part.x * tileSize, part.y * tileSize, tileSize, tileSize);
  });
}

function update() {
  dx = nextDx;
  dy = nextDy;

  const head = { x: snake[0].x + dx, y: snake[0].y + dy };

  // tabrakan
  if (
    head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount ||
    snake.some(p => p.x === head.x && p.y === head.y)
  ) {
    alert("Game Over!");
    clearInterval(gameInterval);
    location.reload();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    food = spawnFood();
  } else {
    snake.pop();
  }

  draw();
}

function setDirection(x, y) {
  if (x !== -dx || y !== -dy) {
    nextDx = x;
    nextDy = y;
  }
}

document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowUp": setDirection(0, -1); break;
    case "ArrowDown": setDirection(0, 1); break;
    case "ArrowLeft": setDirection(-1, 0); break;
    case "ArrowRight": setDirection(1, 0); break;
  }
});

// Tombol arah layar
window.setDirection = setDirection;

// Swipe
let touchStartX = 0, touchStartY = 0;
canvas.addEventListener("touchstart", e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});
canvas.addEventListener("touchend", e => {
  const dxSwipe = e.changedTouches[0].clientX - touchStartX;
  const dySwipe = e.changedTouches[0].clientY - touchStartY;

  if (Math.abs(dxSwipe) > Math.abs(dySwipe)) {
    if (dxSwipe > 30) setDirection(1, 0);
    else if (dxSwipe < -30) setDirection(-1, 0);
  } else {
    if (dySwipe > 30) setDirection(0, 1);
    else if (dySwipe < -30) setDirection(0, -1);
  }
});

draw();
gameInterval = setInterval(update, speed);
