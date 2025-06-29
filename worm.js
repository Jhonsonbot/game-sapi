const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const tileSize = 20;
const tileCount = 20;
canvas.width = tileSize * tileCount;
canvas.height = tileSize * tileCount;

let snake = [{ x: 10, y: 10 }];
let food = spawnFood();
let score = 0;

let dx = 1, dy = 0;
let nextDx = dx, nextDy = dy;
let speed = 150;
let gameInterval;

const snakeImg = new Image();
snakeImg.src = "./snake.png"; // pastikan file ini ada

const foodImg = new Image();
foodImg.src = "./food.png"; // pastikan file ini ada

function spawnFood() {
  let x = Math.floor(Math.random() * tileCount);
  let y = Math.floor(Math.random() * tileCount);
  return { x, y };
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff7e6";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Gambar makanan
  ctx.drawImage(foodImg, food.x * tileSize, food.y * tileSize, tileSize, tileSize);

  // Gambar cacing
  snake.forEach(part => {
    ctx.drawImage(snakeImg, part.x * tileSize, part.y * tileSize, tileSize, tileSize);
  });
}

function update() {
  dx = nextDx;
  dy = nextDy;

  let head = { x: snake[0].x + dx, y: snake[0].y + dy };

  // Wrap-around behavior
  head.x = (head.x + tileCount) % tileCount;
  head.y = (head.y + tileCount) % tileCount;

  // Tabrakan dengan badan
  if (snake.some(part => part.x === head.x && part.y === head.y)) {
    alert("Game Over!\nScore: " + score);
    clearInterval(gameInterval);
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    document.getElementById("score").textContent = "Score: " + score;
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

// Swipe touchscreen
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
