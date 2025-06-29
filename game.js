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
  map: Array(25).fill("empty")
};

const cowCountEl = document.getElementById("cowCount");
const milkCountEl = document.getElementById("milkCount");
const pointsEl = document.getElementById("points");
const gridMap = document.getElementById("gridMap");

const loginButton = document.createElement("button");
loginButton.textContent = "🔐 Login Google";
loginButton.style.marginTop = "20px";
loginButton.onclick = () => signInWithPopup(auth, provider);
document.body.appendChild(loginButton);

onAuthStateChanged(auth, async (user) => {
  if (user) {
    loginButton.style.display = "none";
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();
      userData.map = Array.isArray(data.map) ? data.map : Array(25).fill("empty");
      userData.cows = Array.isArray(data.cows) ? data.cows : [];
      userData.milk = Number.isFinite(data.milk) ? data.milk : 0;
      userData.points = Number.isFinite(data.points) ? data.points : 0;

      // Sinkronisasi jika cows tidak sesuai jumlah sapi di map
      const expected = userData.map.filter(t => t === "cow").length;
      while (userData.cows.length < expected) userData.cows.push(1);
    } else {
      userData.map[0] = "cow";
      userData.cows = [1];
      userData.milk = 0;
      userData.points = 0;
      await setDoc(ref, userData);
    }

    renderUI();
    startAutoMilk();
  } else {
    loginButton.style.display = "block";
  }
});

function renderUI() {
  cowCountEl.textContent = userData.cows.length;
  milkCountEl.textContent = Math.floor(userData.milk);
  pointsEl.textContent = Math.floor(userData.points);
  renderGrid();
}

function renderGrid() {
  gridMap.innerHTML = "";
  let cowIdx = 0;

  userData.map.forEach((type, i) => {
    const tile = document.createElement("div");
    tile.className = `tile ${type}`;

    if (type === "cow") {
      // Ambil level dari userData.cows berdasarkan cowIdx
      const level = Number.isInteger(userData.cows[cowIdx]) ? userData.cows[cowIdx] : 1;

      tile.style.backgroundImage = level > 1
        ? "url('./assets/cow-upgrade.gif')"
        : "url('./assets/cow-real.jpeg')";

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
      upBtn.disabled = (level >= 5); // Matikan tombol jika sudah max
      upBtn.onclick = () => upgradeCow(cowIdx);

      tile.appendChild(label);
      tile.appendChild(upBtn);
      cowIdx++;
    } else {
      tile.addEventListener("click", () => handleTileClick(i));
    }

    gridMap.appendChild(tile);
  });
}

function handleTileClick(index) {
  if (userData.map[index] === "empty") {
    if (userData.points >= 100) {
      userData.points -= 100;
      userData.map[index] = "cow";
      userData.cows.push(1); // hanya tambahkan sapi baru di sini
      update();
    } else {
      alert("💰 Poin tidak cukup untuk menaruh sapi!");
    }
  }
}


function upgradeCow(cowIndex) {
  const currentLevel = userData.cows[cowIndex];

  if (!Number.isInteger(currentLevel)) {
    userData.cows[cowIndex] = 1;
  }

  if (userData.cows[cowIndex] >= 5) {
    alert("🔝 Sapi sudah di level maksimal!");
    return;
  }

  if (userData.points >= 200) {
    userData.points -= 200;
    userData.cows[cowIndex] += 1;
    update(); // hanya update, tidak ubah struktur cows atau map
  } else {
    alert("🔼 Poin tidak cukup untuk upgrade sapi!");
  }
}




function collectMilk() {
  const total = userData.cows.reduce((sum, lv) => sum + lv, 0);
  userData.milk += total;
  update();
}

function sellMilk() {
  const earn = userData.milk * 10;
  userData.points += earn;
  userData.milk = 0;
  update();
}

function buyCow() {
  alert("Klik petak kosong untuk menaruh sapi (biaya 100 poin).");
}

function buyBarn() {
  alert("Kandang belum tersedia. Nantikan update selanjutnya.");
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
    update();
  }, 20000);
}

// Bind tombol HTML ke fungsi
window.collectMilk = collectMilk;
window.sellMilk = sellMilk;
window.buyCow = buyCow;
window.buyBarn = buyBarn;
