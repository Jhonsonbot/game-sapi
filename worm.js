const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const tileSize = 32;
const tileCount = 20;
canvas.width = tileSize * tileCount;
canvas.height = tileSize * tileCount;

let score = 0;
let snake = [{ x: 10, y: 10 }];
let dx = 1, dy = 0;
let nextDx = dx, nextDy = dy;
let speed = 150;
let grow = 0;
let gameInterval;

// Gambar
const headImg = new Image();
headImg.src = "./assets/snake_green_head_32.png";
const bodyImg = new Image();
bodyImg.src = "./assets/snake_green_blob_32.png";

// Kumpulan gambar makanan
const foodImages = [
  "./assets/apple_red_32.png",
  "./assets/apple_green_32.png",
  "./assets/oliebol_32.png",
  "./assets/apple_alt_32.png"
];

let foods = [];

function spawnFood(x = null, y = null) {
  const pos = {
    x: x ?? Math.floor(Math.random() * tileCount),
    y: y ?? Math.floor(Math.random() * tileCount),
    img: new Image()
  };
  const imgPath = foodImages[Math.floor(Math.random() * foodImages.length)];
  pos.img.src = imgPath;
  foods.push(pos);
}

// Spawn makanan awal
for (let i = 0; i < 10; i++) spawnFood();

// Tambahkan makanan tiap 2 detik
setInterval(() => {
  if (foods.length < 40) spawnFood();
}, 2000);

function draw() {
  ctx.fillStyle = "#fff7e6";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Gambar makanan
  foods.forEach(food => {
    ctx.drawImage(food.img, food.x * tileSize, food.y * tileSize, tileSize, tileSize);
  });

  // Gambar cacing
  snake.forEach((part, index) => {
    if (index === 0) {
      ctx.drawImage(headImg, part.x * tileSize, part.y * tileSize, tileSize, tileSize);
    } else {
      ctx.drawImage(bodyImg, part.x * tileSize, part.y * tileSize, tileSize, tileSize);
    }
  });

  // Skor
  document.getElementById("score").textContent = score;
}

function update() {
  dx = nextDx;
  dy = nextDy;
  const head = { x: (snake[0].x + dx + tileCount) % tileCount, y: (snake[0].y + dy + tileCount) % tileCount };

  // Tabrakan badan
  if (snake.some(p => p.x === head.x && p.y === head.y)) {
    // tubuh jadi makanan
    snake.forEach(part => spawnFood(part.x, part.y));
    alert("💀 Game Over! Skor: " + score);
    clearInterval(gameInterval);
    return;
  }

  snake.unshift(head);

  // Makan makanan
  let ate = false;
  foods = foods.filter(food => {
    if (food.x === head.x && food.y === head.y) {
      score += 10;
      grow += 1;
      ate = true;
      return false;
    }
    return true;
  });

  if (grow > 0) {
    grow--;
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

// Touch screen support
window.setDirection = setDirection;
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

// Mulai game
draw();
gameInterval = setInterval(update, speed);
