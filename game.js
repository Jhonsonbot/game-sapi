import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB8cKqCn3V9-0K54eY4xVwfoTf9yfVwURQ",
  authDomain: "peternakan-sapi-c31df.firebaseapp.com",
  projectId: "peternakan-sapi-c31df",
  storageBucket: "peternakan-sapi-c31df.appspot.com",
  messagingSenderId: "805090883196",
  appId: "1:805090883196:web:a19acac871d994cb353bf9",
  measurementId: "G-SGFRR6MJD7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

let userData = {
  cows: [],
  milk: 0,
  points: 0,
  map: Array(4).fill("empty")
};

const cowCountEl = document.getElementById("cowCount");
const milkCountEl = document.getElementById("milkCount");
const pointsEl = document.getElementById("points");
const gridMap = document.getElementById("gridMap");
const audioSapi = new Audio("./assets/cow.mp3");
const audioKoin = new Audio("./assets/coin.mp3");
const audioBGM = new Audio("./assets/farm.mp3");
audioBGM.loop = true;  // agar diputar terus-menerus
// Ambil ID referral dari URL
const urlParams = new URLSearchParams(window.location.search);
const referralId = urlParams.get("ref");

function signInWithGoogle() {
  signInWithPopup(auth, provider).catch((error) => {
    alert("❌ Login gagal: " + error.message);
  });
}

onAuthStateChanged(auth, async (user) => {
  const loginBtn = document.querySelector("button[onclick='signInWithGoogle()']");

  if (user) {
    if (loginBtn) loginBtn.style.display = "none";
     const gameArea = document.getElementById("gameArea");
     if (gameArea) gameArea.style.display = "block";

    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();
      userData.map = Array.isArray(data.map) ? data.map : Array(25).fill("empty");
      userData.cows = Array.isArray(data.cows) ? data.cows : [];
      userData.milk = Number.isFinite(data.milk) ? data.milk : 0;
      userData.points = Number.isFinite(data.points) ? data.points : 0;

      // Sinkronisasi jumlah cows sesuai jumlah cow di map
      const expected = userData.map.filter(t => t === "cow").length;
      while (userData.cows.length < expected) userData.cows.push(1);
    } else {
      // Buat data awal untuk user baru
      userData.map[0] = "cow";
      userData.cows = [1];
      userData.milk = 0;
      userData.points = 0;
      await setDoc(ref, userData);
    }

    renderUI();
    startAutoMilk();
    autoTutupKandang(); // aktifkan fungsi auto tutup kandang
   audioBGM.play().catch(e => console.warn("Audio auto-play diblokir:", e)); 
  } else {
    if (loginBtn) loginBtn.style.display = "inline-block";
  }
});

function renderUI() {
  cowCountEl.textContent = userData.cows.length;
  milkCountEl.textContent = Math.floor(userData.milk);
  pointsEl.textContent = Math.floor(userData.points);

  const buyBarnBtn = document.getElementById("buyBarnBtn");
  if (buyBarnBtn) {
    buyBarnBtn.style.display = userData.map.length >= 36 ? "none" : "inline-block";
  }
  renderGrid();
}

function renderGrid() {
  gridMap.innerHTML = "";

  const gridSize = Math.ceil(Math.sqrt(userData.map.length));
  gridMap.style.display = "grid";
  gridMap.style.gridTemplateColumns = `repeat(${gridSize}, 80px)`;

  const cowIndexes = userData.map
    .map((type, idx) => (type === "cow" ? idx : null))
    .filter(idx => idx !== null);

  userData.map.forEach((type, i) => {
    const tile = document.createElement("div");
    tile.className = `tile ${type}`;

    if (type === "cow") {
      const cowIdx = cowIndexes.indexOf(i);
      const level = userData.cows[cowIdx] || 1;

      let imageUrl;
      switch (level) {
        case 1: imageUrl = "./assets/cow-real.jpeg"; break;
        case 2: imageUrl = "./assets/cow-lv2.gif"; break;
        case 3: imageUrl = "./assets/cow-lv3.gif"; break;
        case 4: imageUrl = "./assets/cow-lv4.gif"; break;
        case 5: imageUrl = "./assets/cow-lv5.gif"; break;
        default: imageUrl = "./assets/cow-real.jpeg";
      }

      tile.style.backgroundImage = `url('${imageUrl}')`;

      const label = document.createElement("div");
      label.textContent = `Lv${level}`;
      label.style.fontSize = "12px";
      label.style.background = "#fff9";
      label.style.borderRadius = "6px";
      label.style.padding = "1px 4px";
      label.style.marginTop = "60px";
      label.style.display = "inline-block";

      const upBtn = document.createElement("button");
      upBtn.textContent = "🔼";
      upBtn.style.fontSize = "10px";
      upBtn.onclick = () => upgradeCow(cowIdx);

      tile.appendChild(label);
      tile.appendChild(upBtn);
    } else {
      tile.addEventListener("click", () => handleTileClick(i));
    }

    gridMap.appendChild(tile);
  });

  // Tampilkan kandangPenutup jika ada
  const kandang = document.getElementById("kandangPenutup");
  if (kandang) {
    kandang.style.display = "block";
  }
}



function handleTileClick(index) {
  if (userData.map[index] === "empty") {
    if (userData.points >= 10000) {
      userData.points -= 10000;
      userData.map[index] = "cow";
      userData.cows.push(1); // hanya tambahkan sapi baru di sini
      update();
    } else {
      alert("💰 Poin tidak cukup untuk menaruh sapi!");
    }
  }
}


function upgradeCow(cowIndex) {
  let currentLevel = userData.cows[cowIndex];

  if (!Number.isInteger(currentLevel)) {
    userData.cows[cowIndex] = 1;
    currentLevel = 1;
  }

  if (currentLevel >= 5) {
    alert("🔝 Sapi sudah di level maksimal!");
    return;
  }

  // Harga berdasarkan level saat ini
  const upgradeCosts = {
    1: 20000,
    2: 40000,
    3: 80000,
    4: 150000
  };

  const cost = upgradeCosts[currentLevel] || 99999;

  if (userData.points >= cost) {
    userData.points -= cost;
    userData.cows[cowIndex] += 1;
    update();
  } else {
    alert(`🔼 Poin tidak cukup! Butuh ${cost} poin untuk upgrade ke Lv${currentLevel + 1}.`);
  }
}

function collectMilk() {
  const total = userData.cows.reduce((sum, lv) => sum + lv, 0);
  userData.milk += total;
  update();
}

function sellMilk() {
  if (userData.milk < 100) {
    alert("❌ Minimum jual susu 100!");
    return;
  }

  const earn = Math.floor(userData.milk * 0.1);
  userData.points += earn;
  userData.milk = 0;

  // Putar suara coin dari folder assets
  const audio = new Audio("./assets/coin.mp3");
  audio.play();

  update();
}


function buyCow() {
  alert("Klik petak kosong untuk menaruh sapi (biaya 100000 poin).");
}

function buyBarn() {
  if (userData.map.length >= 36) {
    alert("📦 Kandang sudah mencapai ukuran maksimal (6x6)!");
    return;
  }

  if (userData.points >= 200000) {
    userData.points -= 200000;
    userData.map.push("empty");
    update();
  } else {
    alert("💰 Poin tidak cukup untuk beli kandang! (200k poin)");
  }
}



async function update() {
  const user = auth.currentUser;
  if (!user) return;

  // Pastikan semua data sapi valid (hanya angka)
  userData.cows = userData.cows.map(lv =>
    Number.isInteger(lv) && lv > 0 ? lv : 1
  );

  const ref = doc(db, "users", user.uid);
  await setDoc(ref, {
    cows: userData.cows,
    map: userData.map,
    milk: Number.isFinite(userData.milk) ? userData.milk : 0,
    points: Number.isFinite(userData.points) ? userData.points : 0
  });

  renderUI();
}


function startAutoMilk() {
  setInterval(() => {
    const total = userData.cows.reduce((sum, lv) => sum + lv, 0);
    userData.milk += total;

    // Tampilkan animasi di setiap tile sapi
    const cowTiles = document.querySelectorAll(".tile.cow");
    cowTiles.forEach(tile => animateMilkAtTile(tile));

    update();
  }, 10000);
}


// Bind tombol HTML ke fungsi
window.collectMilk = collectMilk;
window.sellMilk = sellMilk;
window.buyCow = buyCow;
window.buyBarn = buyBarn;

function animateMilkAtTile(tile) {
  const milk = document.createElement("div");
  milk.className = "milk-animation";
  milk.style.left = "28px";
  milk.style.top = "10px";

  tile.appendChild(milk);

  // Tambahkan delay animasi acak (0-0.5s)
  const delay = Math.random() * 0.5;
  milk.style.animationDelay = `${delay}s`;

  setTimeout(() => {
    milk.remove();
  }, 3000); // durasi + sedikit buffer
}
// Fungsi untuk membuka kandang (hilangkan gambar penutup)
window.bukaPetak = function () {
  const kandang = document.getElementById("kandangPenutup");
  if (kandang) {
    kandang.style.display = "none";
    audioSapi.play(); // 🔊 Suara sapi
  }
};

let lastActivity = Date.now();

function autoTutupKandang() {
  const kandang = document.getElementById("kandangPenutup");
  if (!kandang) return;
  
  setInterval(() => {
    if (Date.now() - lastActivity > 50000) { // 50 detik
      kandang.style.display = "block";
    }
  }, 5000);
}

document.addEventListener("click", () => {
  lastActivity = Date.now();
});

// panggil setelah login berhasil
autoTutupKandang();
const btnMute = document.getElementById("btnMute");
let isMuted = false;

btnMute.onclick = () => {
  if (isMuted) {
    audioBGM.play();
    btnMute.textContent = "🔊";
  } else {
    audioBGM.pause();
    btnMute.textContent = "🔇";
  }
  isMuted = !isMuted;
};

function showReferralLink() {
  const user = auth.currentUser;
  if (!user) return;

  const refLink = `${window.location.origin}?ref=${user.uid}`;
  prompt("🎉 Bagikan link referral kamu:", refLink);
}
