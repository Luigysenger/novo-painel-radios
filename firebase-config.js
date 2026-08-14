import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  // SUAS CONFIGURAÇÕES ATUAIS DO FIREBASE CONTINUAM AQUI
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
