const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const tileSize = 32;
const tileCount = 20;
canvas.width = tileSize * tileCount;
canvas.height = tileSize * tileCount;

let score = 0;
let snake = [{ x: 10, y: 10 }];
let food = spawnFood();

let dx = 1, dy = 0;
let nextDx = dx, nextDy = dy;
let speed = 150;
let gameInterval;

// Gambar
const headImg = new Image();
headImg.src = "./assets/snake_green_head_32.png";

const bodyImg = new Image();
bodyImg.src = "./assets/snake_green_blob_32.png";

const foodImg = new Image();
foodImg.src = "./assets/apple_red_32.png";

function spawnFood() {
  return {
    x: Math.floor(Math.random() * tileCount),
    y: Math.floor(Math.random() * tileCount)
  };
}

function draw() {
  ctx.fillStyle = "#fff7e6";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Gambar makanan
  ctx.drawImage(foodImg, food.x * tileSize, food.y * tileSize, tileSize, tileSize);

  // Gambar cacing
  snake.forEach((part, index) => {
    if (index === 0) {
      ctx.drawImage(headImg, part.x * tileSize, part.y * tileSize, tileSize, tileSize);
    } else {
      ctx.drawImage(bodyImg, part.x * tileSize, part.y * tileSize, tileSize, tileSize);
    }
  });

  // Gambar skor
  ctx.fillStyle = "#000";
  ctx.font = "16px Arial";
  ctx.fillText("Score: " + score, 10, 20);
}

function update() {
  dx = nextDx;
  dy = nextDy;

  const head = { x: snake[0].x + dx, y: snake[0].y + dy };

  // Loop ke sisi lain
  head.x = (head.x + tileCount) % tileCount;
  head.y = (head.y + tileCount) % tileCount;

  // Tabrak badan sendiri
  if (snake.some((part) => part.x === head.x && part.y === head.y)) {
    alert("Game Over! Skor: " + score);
    clearInterval(gameInterval);
    location.reload();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
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

// Swipe layar sentuh
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
