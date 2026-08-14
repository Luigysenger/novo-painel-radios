// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Configuração Oficial do Firebase para o seu Projeto
const firebaseConfig = {
  apiKey: "AIzaSyD-ExemploChaveConfiguradaCorretamenteParaSeuProjeto",
  authDomain: "novo-jeito-de-ouvir-radio.firebaseapp.com",
  databaseURL: "https://novo-jeito-de-ouvir-radio-default-rtdb.firebaseio.com",
  projectId: "novo-jeito-de-ouvir-radio",
  storageBucket: "novo-jeito-de-ouvir-radio.appspot.com",
  messagingSenderId: "100000000000",
  appId: "1:100000000000:web:abcdef123456789"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
