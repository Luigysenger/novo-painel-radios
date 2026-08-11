// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCLKtEJ2RIwc27RYX7x85QM5P2EQd9Vo",
  authDomain: "novo-jeito-de-ouvir-radio.firebaseapp.com",
  projectId: "novo-jeito-de-ouvir-radio",
  storageBucket: "novo-jeito-de-ouvir-radio.firebasestorage.app",
  messagingSenderId: "938297469983",
  appId: "1:938297469983:web:9f52d127522363be1100ba"
};

// Inicialização (usando o script via CDN para facilitar no Notepad)
firebase.initializeApp(firebaseConfig);
const database = firebase.database();