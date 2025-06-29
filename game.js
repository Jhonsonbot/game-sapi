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
  cows: 1,
  milk: 0,
  points: 0,
  map: Array(25).fill("empty") // 5x5 tile grid
};

const cowCountEl = document.getElementById("cowCount");
const milkCountEl = document.getElementById("milkCount");
const pointsEl = document.getElementById("points");
const gridMap = document.getElementById("gridMap");

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
  userData = snap.data();
} else {
  userData.map[0] = "cow"; // letakkan sapi pertama di tile 0
  await setDoc(ref, userData);
}

    renderUI();
  } else {
    signInWithPopup(auth, provider);
  }
});

function renderUI() {
  cowCountEl.textContent = userData.cows;
  milkCountEl.textContent = userData.milk;
  pointsEl.textContent = userData.points;
  renderGrid();
}

function renderGrid() {
  gridMap.innerHTML = "";
  userData.map.forEach((type, i) => {
    const tile = document.createElement("div");
    tile.className = `tile ${type}`;
    tile.addEventListener("click", () => handleTileClick(i));
    gridMap.appendChild(tile);
  });
}

function handleTileClick(index) {
  if (userData.map[index] === "empty") {
    if (userData.points >= 100) {
      userData.points -= 100;
      userData.map[index] = "cow";
      userData.cows++;
      update();
    } else {
      alert("💰 Poin tidak cukup untuk menaruh sapi!");
    }
  }
}

function collectMilk() {
  const milkGain = userData.cows;
  userData.milk += milkGain;
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
