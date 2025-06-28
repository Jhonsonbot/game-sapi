// game.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB8cKqCn3V9-0K54eY4xVwfoTf9yfVwURQ",
  authDomain: "peternakan-sapi-c31df.firebaseapp.com",
  projectId: "peternakan-sapi-c31df",
  storageBucket: "peternakan-sapi-c31df.firebasestorage.app",
  messagingSenderId: "805090883196",
  appId: "1:805090883196:web:a19acac871d994cb353bf9",
  measurementId: "G-SGFRR6MJD7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const loginBtn = document.createElement("button");
loginBtn.textContent = "🔐 Login dengan Google";
loginBtn.style.margin = "10px";
loginBtn.onclick = () => {
  signInWithPopup(auth, provider)
    .then((result) => {
      const user = result.user;
      alert("Login berhasil: " + user.displayName);
      document.body.removeChild(loginBtn);
      startGame();
    })
    .catch((error) => {
      console.error(error);
      alert("Gagal login.");
    });
};

document.body.prepend(loginBtn);

function startGame() {
  let cowCount = parseInt(localStorage.getItem("cowCount")) || 1;
  let milkCount = parseInt(localStorage.getItem("milkCount")) || 0;
  let points = parseInt(localStorage.getItem("points")) || 0;
  let barns = parseInt(localStorage.getItem("barns")) || 1;

  function updateUI() {
    document.getElementById("cowCount").textContent = cowCount;
    document.getElementById("milkCount").textContent = milkCount;
    document.getElementById("points").textContent = points;

    const barnContainer = document.getElementById("barnContainer");
    barnContainer.innerHTML = "";

    for (let b = 0; b < barns; b++) {
      const barn = document.createElement("div");
      barn.className = "barn";
      for (let s = 0; s < 4; s++) {
        const cowIndex = b * 4 + s;
        const cow = document.createElement("div");
        cow.className = "cow";
        if (cowIndex >= cowCount) {
          cow.classList.add("empty");
          cow.textContent = "+";
        }
        barn.appendChild(cow);
      }
      barnContainer.appendChild(barn);
    }
  }

  setInterval(() => {
    milkCount += cowCount;
    localStorage.setItem("milkCount", milkCount);
    updateUI();
  }, 10000); // 10 detik

  window.collectMilk = function () {
    updateUI();
  };

  window.sellMilk = function () {
    points += milkCount * 5;
    milkCount = 0;
    localStorage.setItem("points", points);
    localStorage.setItem("milkCount", milkCount);
    updateUI();
  };

  window.buyCow = function () {
    if (points >= 100 && cowCount < barns * 4) {
      cowCount++;
      points -= 100;
      localStorage.setItem("cowCount", cowCount);
      localStorage.setItem("points", points);
      updateUI();
    } else if (cowCount >= barns * 4) {
      alert("Kandang penuh! Beli kandang baru dulu.");
    } else {
      alert("Poin tidak cukup!");
    }
  };

  window.buyBarn = function () {
    if (points >= 200000) {
      barns++;
      points -= 200000;
      localStorage.setItem("barns", barns);
      localStorage.setItem("points", points);
      updateUI();
    } else {
      alert("Poin tidak cukup untuk beli kandang!");
    }
  };

  updateUI();
}