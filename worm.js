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

const headImg = new Image();
headImg.src = "./assets/snake_green_head_32.png";
const bodyImg = new Image();
bodyImg.src = "./assets/snake_green_blob_32.png";

const foodImages = [
  "./assets/apple_red_32.png",
  "./assets/apple_green_32.png",
  "./assets/oliebol_32.png",
  "./assets/apple_alt_32.png"
];

let foods = [];

// ======================= RESIZE & MODE =======================

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
  if (isFullscreen) {
    container.classList.remove("medium");
    container.classList.add("fullscreen");
  } else {
    container.classList.remove("fullscreen");
    container.classList.add("medium");
  }
  resizeCanvas();
  restartGame(); // restart agar posisi ulang tengah
}
window.toggleFullscreen = toggleFullscreen;

// ======================= GAME =======================

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

function draw() {
  ctx.fillStyle = "#fff7e6";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  foods.forEach(food => {
    ctx.drawImage(food.img, food.x * tileSize, food.y * tileSize, tileSize, tileSize);
  });

  snake.forEach((part, index) => {
    ctx.drawImage(index === 0 ? headImg : bodyImg, part.x * tileSize, part.y * tileSize, tileSize, tileSize);
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
    snake.forEach(part => spawnFood(part.x, part.y));
    clearInterval(gameInterval);
    tambahPoinKeFirestore(score).then(() => {
      alert("💀 Game Over! Skor: " + score);
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

// ======================= INPUT =======================

document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowUp": setDirection(0, -1); break;
    case "ArrowDown": setDirection(0, 1); break;
    case "ArrowLeft": setDirection(-1, 0); break;
    case "ArrowRight": setDirection(1, 0); break;
  }
});

// Touch support
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

// ======================= FIRESTORE =======================

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

// ======================= INISIALISASI =======================

resizeCanvas();
restartGame();
window.addEventListener('resize', () => {
  resizeCanvas();
  draw();
});

// Deteksi orientasi di perangkat mobile
window.addEventListener("orientationchange", () => {
  setTimeout(() => {
    resizeCanvas();
    draw();
  }, 300);
});
