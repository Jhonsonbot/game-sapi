// Perbaikan utama: menggambar cacing utuh dari awal, baru membesar saat makan
// Gambar awal: kepala.png, badan1.png, badan2.png, ekor.png di folder ./assets

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

// === Gambar cacing ===
const headImg = new Image(); headImg.src = "./assets/kepala.png";
const bodyImgs = [new Image(), new Image()];
bodyImgs[0].src = "./assets/badan1.png";
bodyImgs[1].src = "./assets/badan2.png";
const tailImg = new Image(); tailImg.src = "./assets/ekor.png";

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

function toggleFullscreen() {
  container.classList.toggle("fullscreen");
  container.classList.toggle("medium");
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

function getSnakeSize() {
  const base = 32;
  const max = 64;
  return Math.min(base + Math.floor(score / 50), max); // membesar setelah makan beberapa kali
}

function draw() {
  ctx.fillStyle = "#fff7e6";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  foods.forEach(food => {
    ctx.drawImage(food.img, food.x * tileSize, food.y * tileSize, tileSize, tileSize);
  });

  const size = getSnakeSize();
  const offset = (tileSize - size) / 2;

  snake.forEach((part, index) => {
    let img;
    if (index === 0) img = headImg;
    else if (index === snake.length - 1) img = tailImg;
    else img = bodyImgs[index % 2];
    ctx.drawImage(img, part.x * tileSize + offset, part.y * tileSize + offset, size, size);
  });

  const scoreEl = document.getElementById("score");
  if (scoreEl) scoreEl.textContent = score;
}

function update() {
  dx = nextDx; dy = nextDy;
  const head = {
    x: (snake[0].x + dx + tileCountX) % tileCountX,
    y: (snake[0].y + dy + tileCountY) % tileCountY
  };

  if (snake.some(p => p.x === head.x && p.y === head.y)) {
    clearInterval(gameInterval);
    snake.forEach((part, i) => setTimeout(() => { spawnFood(part.x, part.y); draw(); }, i * 50));
    tambahPoinKeFirestore(score).then(() => {
      setTimeout(() => alert("\uD83D\uDC80 Game Over! Skor: " + score), snake.length * 50 + 200);
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

  if (grow > 0) grow--;
  else snake.pop();

  draw();
}

function setDirection(x, y) {
  if (x !== -dx || y !== -dy) {
    nextDx = x; nextDy = y;
  }
}
window.setDirection = setDirection;

function restartGame() {
  score = 0;
  dx = 1; dy = 0; nextDx = dx; nextDy = dy;
  foods = [];
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 }
  ];
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

async function tambahPoinKeFirestore(skor) {
  const user = auth.currentUser;
  if (!user) return;
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const current = snap.exists() ? (snap.data().points || 0) : 0;
  await updateDoc(ref, { points: current + skor });
}

resizeCanvas();
restartGame();
