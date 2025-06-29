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
      userData = snap.data();
    } else {
      userData.map[0] = "cow";
      userData.cows.push(1);
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
  userData.map.forEach((type, i) => {
    const tile = document.createElement("div");
    tile.className = `tile ${type}`;

    if (type === "cow") {
      const cowIndex = userData.map.slice(0, i + 1).filter(t => t === "cow").length - 1;
      const level = userData.cows[cowIndex] || 1;
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
      upBtn.onclick = () => upgradeCow(cowIndex);

      tile.appendChild(label);
      tile.appendChild(upBtn);
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
  await updateDoc(ref, userData);
  renderUI();
}

function startAutoMilk() {
  setInterval(() => {
    const total = userData.cows.reduce((sum, lv) => sum + lv, 0);
    userData.milk += total;
    update();
  }, 20000); // tiap 20 detik
}
