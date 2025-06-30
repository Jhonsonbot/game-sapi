import { auth, db } from './firebase.js';
import {
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const container = document.getElementById("gameContainer");

const tileSize = 32;
let tileCountX = 20;
let tileCountY = 20;

let score = 0;
let snake = [];
let dx = 1, dy = 0;
let nextDx = dx, nextDy = dy;
let speed = 150;
let grow = 0;
let gameInterval;

// === GANTI BAGIAN INI DI AWAL ===
const headImg = new Image();
headImg.src = "./assets/snake_yellow_head_64.png";

const bodyImgs = [
  new Image(),
  new Image()
];
bodyImgs[0].src = "./assets/snake_green_blob_64.png";
bodyImgs[1].src = "./assets/snake_yellow_blob_64.png";

const foodImages = [
  "./assets/apple_red_32.png",
  "./assets/apple_green_32.png",
  "./assets/oliebol_32.png",
  "./assets/apple_alt_32.png"
];

let foods = [];

function resizeCanvas() {
  if (container.classList.contains("fullscreen")) {
    tileCountX = Math.floor(window.innerWidth / tileSize);
    tileCountY = Math.floor(window.innerHeight / tileSize);
  } else {
    tileCountX = Math.floor(640 / tileSize);
    tileCountY = Math.floor(640 / tileSize);
  }
  canvas.width = tileCountX * tileSize;
  canvas.height = tileCountY * tileSize;
}

let isFullscreen = true;
function toggleFullscreen() {
  isFullscreen = !isFullscreen;
  container.classList.toggle("fullscreen", isFullscreen);
  container.classList.toggle("medium", !isFullscreen);
  resizeCanvas();
  restartGame();
}
window.toggleFullscreen = toggleFullscreen;

function spawnFood(x = null, y = null) {
  const pos = {
    x: x ?? Math.floor(Math.random() * tileCountX),
    y: y ?? Math.floor(Math.random() * tileCountY),
    img: new Image()
  };
  pos.img.src = foodImages[Math.floor(Math.random() * foodImages.length)];
  foods.push(pos);
}

for (let i = 0; i < 10; i++) spawnFood();

setInterval(() => {
  if (foods.length < 40) spawnFood();
}, 2000);

function getSnakeSize() {
  const base = 32;
  const max = 64;
  return Math.min(base + Math.floor(snake.length / 5), max);
}

function draw() {
  ctx.fillStyle = "#fff7e6";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  foods.forEach(food => {
    ctx.drawImage(food.img, food.x * tileSize, food.y * tileSize, tileSize, tileSize);
  });

  const size = getSnakeSize();

  snake.forEach((part, index) => {
    const offset = (tileSize - size) / 2;
    let img;

    if (index === 0) {
      img = headImg;
    } else if (index === snake.length - 1) {
      img = tailImg;
    } else {
      img = bodyImgs[index % bodyImgs.length];
    }

    ctx.drawImage(img, part.x * tileSize + offset, part.y * tileSize + offset, size, size);
  });

  const scoreEl = document.getElementById("score");
  if (scoreEl) scoreEl.textContent = score;
}


function update() {
  dx = nextDx;
  dy = nextDy;
  const head = {
    x: (snake[0].x + dx + tileCountX) % tileCountX,
    y: (snake[0].y + dy + tileCountY) % tileCountY
  };

  if (snake.some(p => p.x === head.x && p.y === head.y)) {
    clearInterval(gameInterval);
    snake.forEach((part, i) => {
      setTimeout(() => {
        spawnFood(part.x, part.y);
        draw();
      }, i * 50);
    });
    tambahPoinKeFirestore(score).then(() => {
      setTimeout(() => {
        alert("💀 Game Over! Skor: " + score);
      }, snake.length * 50 + 200);
    });
    return;
  }

  snake.unshift(head);

  foods = foods.filter(food => {
    if (food.x === head.x && food.y === head.y) {
      score += 10;
      grow += 1;
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
window.setDirection = setDirection;

function restartGame() {
  score = 0;
  dx = 1;
  dy = 0;
  nextDx = dx;
  nextDy = dy;
  foods = [];
  snake = [{ x: Math.floor(tileCountX / 2), y: Math.floor(tileCountY / 2) }];
  for (let i = 0; i < 10; i++) spawnFood();
  clearInterval(gameInterval);
  resizeCanvas();
  gameInterval = setInterval(update, speed);
  draw();
}
window.restartGame = restartGame;

document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowUp": setDirection(0, -1); break;
    case "ArrowDown": setDirection(0, 1); break;
    case "ArrowLeft": setDirection(-1, 0); break;
    case "ArrowRight": setDirection(1, 0); break;
  }
});

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

window.toggleControls = function () {
  const controls = document.getElementById("controls");
  const toggleBtn = document.getElementById("toggleControlsBtn");

  const isHidden = controls.style.display === "none" || getComputedStyle(controls).display === "none";

  controls.style.display = isHidden ? "flex" : "none";
  toggleBtn.textContent = isHidden ? "❌ Hide Controls" : "🎮 Show Controls";
};

async function tambahPoinKeFirestore(skor) {
  const user = auth.currentUser;
  if (!user) {
    console.warn("User belum login. Poin tidak disimpan.");
    return;
  }

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const current = snap.exists() ? (snap.data().points || 0) : 0;

  await updateDoc(ref, {
    points: current + skor
  });

  console.log(`✅ Poin ditambahkan: ${skor}, total baru: ${current + skor}`);
}

resizeCanvas();
restartGame();

window.addEventListener('resize', () => {
  resizeCanvas();
  draw();
});

window.addEventListener("orientationchange", () => {
  setTimeout(() => {
    resizeCanvas();
    draw();
  }, 300);
});

window.addEventListener("DOMContentLoaded", () => {
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const controls = document.getElementById("controls");
  const toggleBtn = document.getElementById("toggleControlsBtn");

  if (isTouch) {
    controls.style.display = "none";
    toggleBtn.style.display = "block";
  } else {
    controls.style.display = "flex";
    toggleBtn.style.display = "none";
  }
}); tolong perbaiki agar tampilan cacing utuh saat mulai setelah makan baru membesar jangan seperti cacing di sambung sambung
