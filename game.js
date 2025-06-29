// game.js
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
  updateDoc,
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
      userData.milk = typeof data.milk === "number" ? data.milk : 0;
      userData.points = typeof data.points === "number" ? data.points : 0;

      // ✅ Recovery: jika map berisi sapi tapi cows tidak lengkap
      const expectedCowCount = userData.map.filter(type => type === "cow").length;
      const actualCowCount = userData.cows.length;

      if (actualCowCount < expectedCowCount) {
        const cowsToAdd = expectedCowCount - actualCowCount;
        userData.cows.push(...Array(cowsToAdd).fill(1)); // default level 1
      }

      // ✅ Recovery tambahan: jika cows ada tapi map tidak punya "cow"
      if (!userData.map.includes("cow") && userData.cows.length > 0) {
        userData.map[0] = "cow";
      }

      // ✅ Jika map dan cows tidak sinkron total, bisa juga disinkronkan ulang (opsional)
      // userData.map = userData.map.map((v, i) => v === "cow" && !userData.cows[i] ? "empty" : v);

    } else {
      // Jika user baru
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
  milkCountEl.textContent = userData.milk;
  pointsEl.textContent = userData.points;
  renderGrid();
}

function renderGrid() {
  gridMap.innerHTML = "";
  let cowIdx = 0;
  userData.map.forEach((type, i) => {
    const tile = document.createElement("div");
    tile.className = `tile ${type}`;

    if (type === "cow") {
      const level = userData.cows[cowIdx] || 1;
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
      userData.cows.push(1);
      update();
    } else {
      alert("💰 Poin tidak cukup untuk menaruh sapi!");
    }
  }
}

function upgradeCow(index) {
  if (userData.points >= 200) {
    userData.points -= 200;
    userData.cows[index] += 1;
    update();
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
  alert("Sekarang kamu bisa beli sapi dengan klik petak kosong!");
}

function buyBarn() {
  alert("Mode kandang belum diaktifkan. Nantikan update selanjutnya!");
}

async function update() {
  const user = auth.currentUser;
  if (!user) return;
  const ref = doc(db, "users", user.uid);
  await setDoc(ref, {
    cows: userData.cows,
    map: userData.map,
    milk: userData.milk,
    points: userData.points
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
// Tambahkan ini di akhir game.js
window.collectMilk = collectMilk;
window.sellMilk = sellMilk;
window.buyCow = buyCow;
window.buyBarn = buyBarn;
