import { auth, db } from './firebase.js';
import {
  getFirestore,
  query, 
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";


const submitUsernameBtn = document.getElementById('submitUsernameBtn');
const startBtn = document.getElementById('startBtn');
const usernameInput = document.getElementById('usernameInput');

let currentUsername = "";

submitUsernameBtn.addEventListener('click', async () => {
  const username = usernameInput.value.trim();
  if (username.length === 0) {
    alert("Username cannot be empty!");
    return;
  }

  const userDoc = await getDoc(doc(db, "players", username));
  if (userDoc.exists()) {
    const confirmUse = confirm("Username already taken. Do you want to continue as this player?");
    if (!confirmUse) return;

    currentUsername = username;

    alert("Welcome back!");
    startBtn.style.display = "inline-block";
    submitUsernameBtn.disabled = true;
    usernameInput.disabled = true;
    return;
  }

  currentUsername = username;

  try {
    await setDoc(doc(db, "players", username), {
      username: username,
      createdAt: Date.now(),
      score: 0,
      length: 1,
    });
    alert("Username saved!");
    startBtn.style.display = "inline-block";
    submitUsernameBtn.disabled = true;
    usernameInput.disabled = true;
  } catch (err) {
    console.error("Error saving username:", err);
    alert("Failed to save username.");
  }
});


// script.js untuk versi HTML dari game Slither Arena
const foodImages = [
  { src: "./assets/apple_red_32.png", img: new Image() },
  { src: "./assets/apple_green_32.png", img: new Image() },
  { src: "./assets/oliebol_32.png", img: new Image() }
];

foodImages.forEach(f => f.img.src = f.src);

const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 2000;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let CANVAS_WIDTH = window.innerWidth;
let CANVAS_HEIGHT = window.innerHeight;

function resizeCanvas() {
  CANVAS_WIDTH = window.innerWidth;
  CANVAS_HEIGHT = window.innerHeight;
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const menu = document.getElementById("menu");
const gameOverEl = document.getElementById("gameOver");
const scoreEl = document.getElementById("score");
const lengthEl = document.getElementById("length");
const finalScoreEl = document.getElementById("finalScore");
const finalLengthEl = document.getElementById("finalLength");

const restartBtn = document.getElementById("restartBtn");
const menuBtn = document.getElementById("menuBtn");

let camera = { x: 0, y: 0 };

let gameState = "menu";
let score = 0;
let length = 1;

let snake, foods, direction, speed, mousePos, snakeSize, snakeTargetLength;
let snakeColor = "#4ade80";
let snakePatternType = "plain";

let bots = [];
const BOT_COUNT = 7;

let lastInputTime = Date.now();
let isMouseControl = false;

let boosting = false;
let boostSpeed = 4;
let normalSpeed = 2;

let bubbles = [];
let targetDirection = { x: 1, y: 0 }; // arah yang diinginkan

// let zoom = 1;

function getRandomColor() {
  const colors = ['#4ade80', '#f43f5e', '#3b82f6', '#f59e0b', '#a855f7', '#0ea5e9'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function resetGame() {
  snake = [{ x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 }];
  direction = { x: 1, y: 0 };
  lastDirection = { x: 1, y: 0 };

  speed = 2;
  mousePos = { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 };
  score = 0;
  length = 16; // ukuran awal 1 bawah 8
  snakeSize = 4;
  snakeTargetLength = 25; // atau sesuai panjang awal

  const patterns = ['batik', 'rainbow', 'stripe', 'plain'];
  snakeColor = getRandomColor(); // tetap ada!
  snakePatternType = patterns[Math.floor(Math.random() * patterns.length)];

  foods = [];

  bots = [
  createBot(true, 4, 16, 2), // bot immortal, ukuran kecil
  createBot(true, 4, 16, 2), // bot immortal, ukuran kecil
  ...Array.from({ length: BOT_COUNT - 2 }, () => createBot(false, 4, 16, 2)) // bot biasa
];


  for (let i = 0; i < 20; i++) foods.push(generateFood());
  updateHUD();
}


function generateFood() {
  const useImage = Math.random() < 0.4;
  if (useImage) {
    const foodImage = foodImages[Math.floor(Math.random() * foodImages.length)];
    return {
      x: Math.random() * (WORLD_WIDTH - 40) + 20,
      y: Math.random() * (WORLD_HEIGHT - 40) + 20,
      image: foodImage.img,
      size: 16
    };
  } else {
    const colors = ['#ef4444', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#10b981'];
    return {
      x: Math.random() * (WORLD_WIDTH - 20) + 10,
      y: Math.random() * (WORLD_HEIGHT - 20) + 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 3 + 2
    };
  }
}

function limitFoodCount(max = 300) {
  if (foods.length > max) {
    foods = foods.slice(foods.length - max); // sisakan hanya makanan terbaru
  }
}

let lastDirection = { x: 1, y: 0 }; // default ke kanan

function updateDirection() {
  const now = Date.now();
  const head = snake[0];

  if (isMouseControl && now - lastInputTime < 3000) {
    const dx = mousePos.x - head.x;
    const dy = mousePos.y - head.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 10) {
      targetDirection = { x: dx / dist, y: dy / dist }; // arah tujuan
    }
  }

  // Interpolasi dari direction ke targetDirection (smooth belok)
  const smoothing = 0.1; // 0.05–0.2 bagus, makin kecil makin halus
  direction.x += (targetDirection.x - direction.x) * smoothing;
  direction.y += (targetDirection.y - direction.y) * smoothing;

  // Normalisasi arah
  const mag = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
  if (mag > 0) {
    direction.x /= mag;
    direction.y /= mag;
  }

  lastDirection = { ...direction }; // tetap simpan arah terakhir
}




function updateSnake() {
  const currentSpeed = boosting ? boostSpeed : normalSpeed;
  const newHead = {
    x: snake[0].x + direction.x * currentSpeed,
    y: snake[0].y + direction.y * currentSpeed
  };

  snake.unshift(newHead);

  // Kurangi panjang jika terlalu panjang dibandingkan dengan snakeSize
  // const maxLength = Math.floor((snakeSize * 25)); //panjang cacing
  // if (snake.length > maxLength) snake.pop();
   
   const segmentDensity = 1.8;
  const maxSegments = Math.floor(length * segmentDensity);
  while (snake.length > maxSegments) {
    snake.pop();
  }

  for (let i = 1; i < snake.length; i++) {
    const prev = snake[i - 1];
    const curr = snake[i];
    const dx = prev.x - curr.x;
    const dy = prev.y - curr.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const segmentDist = Math.max(snakeSize * 0.6, 4); // lebih rapat
    if (dist > segmentDist) {
      const ratio = segmentDist / dist;
      curr.x = prev.x - dx * ratio;
      curr.y = prev.y - dy * ratio;
    }
  }
}

function checkFoodCollision() {
  const head = snake[0];
  for (let i = 0; i < foods.length; i++) {
    const food = foods[i];
    const dx = head.x - food.x;
    const dy = head.y - food.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < snakeSize + food.size) {
      foods[i] = generateFood();
      spawnBubble(food.x, food.y);
      limitFoodCount();

      // 🔹 Pertumbuhan dinamis berdasarkan ukuran makanan
      const growthFactor = food.size * 0.15;      // bisa atur ke 0.1 atau 0.2
      length += growthFactor;                     // cacing bertambah panjang
      snakeSize = Math.min(snakeSize + growthFactor * 0.08, 25); // perlambat kenaikan ukuran tubuh

      score += Math.floor(food.size);             // skor tetap berdasarkan ukuran

      updateHUD();

      const eatSound = document.getElementById("eatSound");
      if (eatSound) {
        eatSound.currentTime = 0;
        eatSound.play().catch(e => console.warn("🔇 EatSound blocked:", e));
      }
    }
  }
}

function checkBoundaryCollision() {
  const head = snake[0];
  const buffer = 10;
  return (
    head.x < -buffer || head.x > WORLD_WIDTH + buffer ||
    head.y < -buffer || head.y > WORLD_HEIGHT + buffer
  );
}

function updateHUD() {
  scoreEl.textContent = Math.floor(score);
  lengthEl.textContent = Math.floor(length);
  finalScoreEl.textContent = Math.floor(score);
  finalLengthEl.textContent = Math.floor(length);
}

//function updateZoom() {
  // Zoom akan mengecil seiring cacing makin panjang
 // const minZoom = 0.5;
 // const maxZoom = 1.2;

 // const targetZoom = Math.max(minZoom, Math.min(maxZoom, 1.2 - (length / 150)));
 // zoom += (targetZoom - zoom) * 0.05; // Smooth zooming
//}


function draw() {
  ctx.save();
  // ctx.scale(zoom, zoom);                   // 👈 Tambah
  ctx.translate(-camera.x, -camera.y); 
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  ctx.strokeStyle = '#1e293b';
  for (let x = 0; x <= WORLD_WIDTH; x += 50) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD_HEIGHT); ctx.stroke();
  }
  for (let y = 0; y <= WORLD_HEIGHT; y += 50) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD_WIDTH, y); ctx.stroke();
  }

  foods.forEach(f => {
  if (f.image) {
    ctx.drawImage(f.image, f.x - f.size / 2, f.y - f.size / 2, f.size, f.size);
  } else {
    ctx.fillStyle = f.color;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
    ctx.shadowColor = f.color;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
});

  snake.forEach((s, i) => {
    const alpha = Math.max(1 - i * 0.02, 0.5);
    ctx.globalAlpha = alpha;

    let color = getPatternColorByType(snakePatternType, i);

    if (i === 0) {
      // 🧠 Kepala: lebih besar dan warna diperkuat
      ctx.globalAlpha = 1; // kepala selalu solid
      color = enhanceColor(color, 1.4); // lebih gelap/tebal
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, snakeSize * 1.25, 0, Math.PI * 2);
      ctx.fill();

      // (Opsional) garis tepi kepala
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, snakeSize, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 5;
  ctx.strokeRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  ctx.globalAlpha = 1;

  // 🧿 Mata
  const head = snake[0];
  const eyeOffsetX = snakeSize * 0.5;
  const eyeOffsetY = snakeSize * 0.3;
  const eyeRadius = snakeSize * 0.28;
  const pupilRadius = eyeRadius * 0.5;

  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(head.x - eyeOffsetX, head.y - eyeOffsetY, eyeRadius, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(head.x + eyeOffsetX, head.y - eyeOffsetY, eyeRadius, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(head.x - eyeOffsetX, head.y - eyeOffsetY, pupilRadius, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(head.x + eyeOffsetX, head.y - eyeOffsetY, pupilRadius, 0, Math.PI * 2); ctx.fill();

  // 👄 Mulut
const mouthY = head.y + snakeSize * 0.6;
const mouthRadius = snakeSize * 0.4;
ctx.strokeStyle = '#ec4899';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.arc(head.x, mouthY, mouthRadius, 0, Math.PI);
ctx.stroke();

// Tambahkan drawBots() DI SINI!
drawBubbles();
drawBots(); // 🧠 penting agar bot ikut kamera

ctx.restore();

}

function loop() {
  if (gameState !== 'playing' || gamePaused) return;
  updateDirection();
  updateSnake();
  updateBots();
 // updateZoom(); 
  updateCamera();
  updateBubbles();
  

  checkFoodCollision();
  checkSnakeCollisions();

  if (checkBoundaryCollision()) {
    killSnake('player');
    return;
  }

  draw();
  requestAnimationFrame(loop);
}


canvas.addEventListener('mousemove', e => {
 const rect = canvas.getBoundingClientRect();
 const scaleX = canvas.width / rect.width;
 const scaleY = canvas.height / rect.height;

 mousePos = {
  x: (e.clientX - rect.left) * scaleX + camera.x,
  y: (e.clientY - rect.top) * scaleY + camera.y
};
  lastInputTime = Date.now();
  isMouseControl = true;
});


startBtn.onclick = () => {
  if (!currentUsername) {
    alert("Please submit your username first!");
    return;
  }

  resetGame();
  gameState = 'playing';
  menu.style.display = 'none';
  gameOverEl.style.display = 'none';
  document.getElementById("hud").style.display = "flex";
  canvas.focus();
  loop();
};


restartBtn.onclick = startBtn.onclick;
menuBtn.onclick = () => {
  gameState = 'menu';
  gameOverEl.style.display = 'none';
  document.getElementById("hud").style.display = "none";
  menu.style.display = 'flex';
  showLeaderboard();
};


function createBot(immortal = false, baseSize = 4, baseLength = 20, baseSpeed = 2) {
  const colors = ['#f87171', '#60a5fa', '#facc15', '#34d399', '#a78bfa', '#fb7185'];

  // Spawn dari pinggir
  let x, y;
  const edge = Math.floor(Math.random() * 4);
  switch (edge) {
    case 0: x = 0; y = Math.random() * WORLD_HEIGHT; break;     // kiri
    case 1: x = WORLD_WIDTH; y = Math.random() * WORLD_HEIGHT; break; // kanan
    case 2: x = Math.random() * WORLD_WIDTH; y = 0; break;       // atas
    case 3: x = Math.random() * WORLD_WIDTH; y = WORLD_HEIGHT; break; // bawah
  }

  return {
    snake: [{ x, y }],
    direction: randomDirection(),
    color: colors[Math.floor(Math.random() * colors.length)],
    size: baseSize,
    length: baseLength,
    speed: baseSpeed,
    immortal: immortal,
    patternType: immortal ? 'batik' : 'plain'
  };
}


function spawnBotSafely(immortal = false) {
  const maxAttempts = 20;
  const safeDistance = 200;

  for (let i = 0; i < maxAttempts; i++) {
    const bot = createBot(
  immortal,
  Math.random() * 2 + 3, // size antara 3–5
  Math.floor(Math.random() * 10 + 10), // length antara 10–20
  1.5 + Math.random() * 0.5 // speed antara 1.5–2.0
);


    const head = bot.snake[0];

    // Cek jarak ke player
    const dx = head.x - snake[0].x;
    const dy = head.y - snake[0].y;
    const distToPlayer = Math.sqrt(dx * dx + dy * dy);

    // Cek jarak ke bot lain
    let safeFromOthers = true;
    for (const other of bots) {
      const odx = head.x - other.snake[0].x;
      const ody = head.y - other.snake[0].y;
      const odist = Math.sqrt(odx * odx + ody * ody);
      if (odist < safeDistance) {
        safeFromOthers = false;
        break;
      }
    }

    if (distToPlayer > safeDistance && safeFromOthers) {
      return bot;
    }
  }

  // Kalau tidak ketemu lokasi aman, pakai cara biasa
  return createBot(immortal);
}


function respawnBot() {
  return createBot(); // Bisa kamu kembangkan nanti kalau mau spawn di tempat aman
}

function randomDirection() {
  const angle = Math.random() * Math.PI * 2;
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

function updateBotPhysics(bot) {
  const segmentDist = Math.max(bot.size * 0.6, 4);

  for (let i = 1; i < bot.snake.length; i++) {
    const prev = bot.snake[i - 1];
    const curr = bot.snake[i];
    const dx = prev.x - curr.x;
    const dy = prev.y - curr.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > segmentDist) {
      const ratio = segmentDist / dist;
      curr.x = prev.x - dx * ratio;
      curr.y = prev.y - dy * ratio;
    }
  }
}

function updateBots() {
  const aliveBots = [];

  for (const bot of bots) {
    if (bot.dead) continue;

    const head = bot.snake[0];

    // Gerak
    head.x += bot.direction.x * bot.speed;
    head.y += bot.direction.y * bot.speed;

    bot.snake.unshift({ x: head.x, y: head.y });
    if (bot.snake.length > bot.length) {
      bot.snake.pop();
    }

    updateBotPhysics(bot);

    // Ubah arah kalau nabrak dinding
    const margin = 30;
    if (
      head.x < margin || head.x > WORLD_WIDTH - margin ||
      head.y < margin || head.y > WORLD_HEIGHT - margin
    ) {
      bot.direction = randomDirection();
    }

    // Tabrakan ke player
    for (let i = 1; i < snake.length; i++) {
      const segment = snake[i];
      const dx = head.x - segment.x;
      const dy = head.y - segment.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
     if (dist < bot.size * 0.9 && !bot.immortal) {
  killSnake('bot', bot.snake);
  bot.dead = true;
  break;
}

    }

    // Tabrakan ke bot lain
    for (const other of bots) {
      if (other === bot || other.dead) continue;
      for (let i = 1; i < other.snake.length; i++) {
        const segment = other.snake[i];
        const dx = head.x - segment.x;
        const dy = head.y - segment.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < bot.size * 0.9) {
          killSnake('bot', bot.snake);
          bot.dead = true;
          break;
        }
      }
      if (bot.dead) break;
    }

    // Makan makanan jika masih hidup
    if (!bot.dead) {
      for (let i = 0; i < foods.length; i++) {
        const food = foods[i];
        const dx = head.x - food.x;
        const dy = head.y - food.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < bot.size + food.size) {
          foods[i] = generateFood();
          bot.length++;
          bot.size += 0.1;

         spawnBubble(food.x, food.y);
       const bubbleSound = document.getElementById("bubbleSound");
       if (bubbleSound) {
       bubbleSound.currentTime = 0;
       bubbleSound.play().catch(e => console.warn("🔇 BubbleSound blocked:", e));
         }
        }
      }

      aliveBots.push(bot);
   }
 }
// Ganti bot yang mati dengan bot baru agar jumlah tetap BOT_COUNT
const currentImmortal = aliveBots.filter(bot => bot.immortal).length;

while (aliveBots.length < BOT_COUNT) {
  // Pastikan hanya 2 bot immortal
  const makeImmortal = currentImmortal + aliveBots.filter(b => b.immortal).length < 2;
  aliveBots.push(spawnBotSafely(makeImmortal));
}


bots = aliveBots;

}

function checkSnakeCollisions() {
  const head = snake[0];

  for (const bot of bots) {
    for (let i = 1; i < bot.snake.length; i++) {
      const segment = bot.snake[i];
      const dx = head.x - segment.x;
      const dy = head.y - segment.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const tolerance = (bot.size + snakeSize) * 0.5;
      if (dist < tolerance) {
        killSnake('player');
        return;
      }
    }
  }
}


function killSnake(type, snakeData = []) {
  const body = (type === 'player') ? snake : snakeData;

  // Sebarkan makanan
  body.forEach(seg => {
    foods.push({
      x: seg.x,
      y: seg.y,
      color: '#fde047',
      size: Math.random() * 3 + 2
    });
  });

  limitFoodCount();

  if (type === 'player') {
  gameState = 'gameOver';
  gameOverEl.style.display = 'flex';

  document.getElementById("deathSound").play();

  // Simpan skor ke Firebase
  import('./firebase-config.js').then(({ db, doc, updateDoc }) => {
    if (currentUsername) {
      updateDoc(doc(db, "players", currentUsername), {
        score: score,
        length: length,
        updatedAt: Date.now()
      }).catch(e => console.warn("❌ Gagal update skor:", e));
    }
  });
}

}

function drawBots() {
  bots.forEach(bot => {
    const size = bot.size;
    const head = bot.snake[0];

    // Gambar tubuh bot
    bot.snake.forEach((seg, i) => {
      const alpha = Math.max(1 - i * 0.02, 0.5);
      ctx.globalAlpha = alpha;

      // Gunakan warna motif jika patternType = "batik"
      ctx.fillStyle = getPatternColorByType(bot.patternType, i);

      ctx.beginPath();
      ctx.arc(seg.x, seg.y, size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Gambar mata di kepala bot
    ctx.globalAlpha = 1;
    const eyeOffset = size * 0.3;
    const eyeSize = size * 0.15;

    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(head.x - eyeOffset, head.y - eyeOffset, eyeSize, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(head.x + eyeOffset, head.y - eyeOffset, eyeSize, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(head.x - eyeOffset, head.y - eyeOffset, eyeSize * 0.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(head.x + eyeOffset, head.y - eyeOffset, eyeSize * 0.6, 0, Math.PI * 2); ctx.fill();
  });

  
  ctx.globalAlpha = 1;
}

function getBatikPatternColor(index) {
  // Warna khas batik
  const batikColors = ['#8B4513', '#D2B48C', '#A0522D', '#FFD700', '#5C4033'];
  
  // Motif zigzag atau spiral
  const patternIndex = (Math.sin(index / 3) * 10 + index) % batikColors.length;
  return batikColors[Math.floor(Math.abs(patternIndex))];
}

function getPatternColorByType(type, index) {
  if (type === 'batik') {
    return getBatikPatternColor(index); // tetap gunakan fungsi batik lama
  }

  if (type === 'rainbow') {
    const hue = (index * 12) % 360;
    return `hsl(${hue}, 100%, 50%)`;
  }

  if (type === 'stripe') {
    return (index % 4 < 2) ? '#ffffff' : '#000000'; // putih-hitam
  }

  return snakeColor; // fallback ke warna solid biasa
}

function enhanceColor(color, factor = 1.4) {
  if (color.startsWith("hsl")) {
    const match = color.match(/hsl\((\d+),\s*(\d+)%?,\s*(\d+)%?\)/);
    if (!match) return color;

    const h = parseInt(match[1]);
    const s = Math.min(100, parseInt(match[2]) * factor); // boost saturasi
    const l = Math.max(10, Math.min(50, parseInt(match[3]) * 0.6)); // lebih gelap

    return `hsl(${h}, ${s}%, ${l}%)`;
  }

  return color;
}

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  const touch = e.touches[0];
  if (touch) {
    const rect = canvas.getBoundingClientRect();
const scaleX = canvas.width / rect.width;
const scaleY = canvas.height / rect.height;

mousePos = {
  x: (touch.clientX - rect.left) * scaleX + camera.x,
  y: (touch.clientY - rect.top) * scaleY + camera.y
};
    lastInputTime = Date.now();
    isMouseControl = true;
  }

  // Boost hanya jika 2 jari atau lebih
  boosting = e.touches.length >= 2;
}, { passive: false });


// Untuk mouse
canvas.addEventListener('mousedown', () => {
  boosting = true;
  const boostSound = document.getElementById("boostSound");
  if (boostSound) {
    boostSound.currentTime = 0;
    boostSound.play().catch(e => console.log("🔇 BoostSound blocked:", e));
  }
});
canvas.addEventListener('mouseup', () => {
  boosting = false;
});
canvas.addEventListener('mouseleave', () => {
  boosting = false;
});

// Untuk sentuh
canvas.addEventListener('touchstart', e => {
  if (e.touches.length >= 2) {
    boosting = true;
    const boostSound = document.getElementById("boostSound");
    if (boostSound) {
      boostSound.currentTime = 0;
      boostSound.play().catch(err => console.log("🔇 BoostSound blocked:", err));
    }
  }
});

canvas.addEventListener('touchend', e => {
  // Hanya nonaktifkan boost jika sisa jari < 2
  if (e.touches.length < 2) {
    boosting = false;
  }
});

canvas.addEventListener('touchcancel', () => {
  boosting = false;
});


function updateCamera() {
  const head = snake[0];

  // Target posisi kamera (tengah mengikuti kepala)
  const targetX = head.x - CANVAS_WIDTH / 2;
  const targetY = head.y - CANVAS_HEIGHT / 2;

  // Lerp (smooth mengikuti pergerakan, 0.1 = pelan, 1 = langsung)
  const smoothFactor = 0.15;

  camera.x += (targetX - camera.x) * smoothFactor;
  camera.y += (targetY - camera.y) * smoothFactor;

  // Clamp agar kamera tidak keluar world
  camera.x = Math.floor(Math.max(0, Math.min(camera.x, WORLD_WIDTH - CANVAS_WIDTH)));
  camera.y = Math.floor(Math.max(0, Math.min(camera.y, WORLD_HEIGHT - CANVAS_HEIGHT)));
}

function spawnBubble(x, y) {
  bubbles.push({
    x,
    y,
    radius: Math.random() * 4 + 3,
    speedY: Math.random() * 0.5 + 0.3,
    alpha: 1,
    color: 'rgba(255,255,255,0.8)'
  });
}


function updateBubbles() {
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i];
    b.y -= b.speedY;
    b.alpha -= 0.005;

    if (b.alpha <= 0) {
      bubbles.splice(i, 1); // hapus gelembung
    }
  }
}

function drawBubbles() {
  for (const b of bubbles) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${b.alpha})`;
    ctx.fill();
  }
}

async function showLeaderboard() {
  const q = query(collection(db, "players"), orderBy("score", "desc"), limit(10));
  const snapshot = await getDocs(q);
  const leaderboardList = document.getElementById("leaderboardList");
  leaderboardList.innerHTML = ""; // kosongkan dulu

  let rank = 1;
  snapshot.forEach(doc => {
    const data = doc.data();
    leaderboardList.innerHTML += `<li>${rank}. ${data.username} - ${data.score}</li>`;
    rank++;
  });
}

window.showLeaderboard = showLeaderboard;


window.addEventListener("load", () => {
  usernameInput.focus(); // 👈 fokus otomatis
  showLeaderboard();
});

const leaderboardBtn = document.getElementById("leaderboardBtn");
const submitEmailBtn = document.getElementById("submitEmailBtn");
const resumeBtn = document.getElementById("resumeBtn");
const restartBtnLobby = document.getElementById("restartBtnLobby");
const leaderboardEl = document.getElementById("leaderboard");

leaderboardBtn.addEventListener("click", () => {
  showLeaderboard(); // tampilkan leaderboard dari Firestore
  leaderboardEl.style.display = "block"; // pastikan muncul
  submitEmailBtn.style.display = "inline-block";
  resumeBtn.style.display = "inline-block";
  restartBtnLobby.style.display = "inline-block";
});

submitEmailBtn.addEventListener("click", () => {
  const email = prompt("Enter your email:");
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert("Invalid email format!");
    return;
  }
  if (currentUsername) {
    updateDoc(doc(db, "players", currentUsername), {
      email: email,
      emailSubmittedAt: Date.now()
    }).then(() => alert("✅ Email saved!"))
      .catch(err => alert("❌ Failed to save email."));
  }
});


resumeBtn.addEventListener("click", () => {
  leaderboardEl.style.display = "none";
  submitEmailBtn.style.display = "none";
  resumeBtn.style.display = "none";
  restartBtnLobby.style.display = "none";
});

restartBtnLobby.addEventListener("click", () => {
  location.reload(); // atau resetGame(); gameState = "playing"; dsb
});


function restartGame() {
  resetGame();
  gameState = 'playing';
  menu.style.display = 'none';
  gameOverEl.style.display = 'none';
  document.getElementById("hud").style.display = "flex";
  loop();
}

function resumeGame() {
  gameState = 'playing';
  leaderboardEl.style.display = "none";
  submitEmailBtn.style.display = "none";
  resumeBtn.style.display = "none";
  restartBtnLobby.style.display = "none";
  loop();
}

window.restartGame = restartGame;
window.resumeGame = resumeGame;

let gamePaused = false;

// Saat leaderboard ditampilkan:
leaderboardBtn.addEventListener("click", () => {
  gamePaused = true;
  showLeaderboard();
  leaderboardEl.style.display = "block";
  // ...
});

// Saat resume:
resumeBtn.addEventListener("click", () => {
  gamePaused = false;
  resumeGame();
});
