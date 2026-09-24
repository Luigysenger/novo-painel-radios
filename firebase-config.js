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

// =============================================================
// ACESSO DE TESTE — NOVA CIDADE LUDIGINS
// Alteração isolada: só é ativada no Painel do Ouvinte quando o
// botão original "JOGAR LUDIGINS" e o overlay do jogo existem.
// O jogo/cidade atual continua sendo o principal e não é alterado.
// =============================================================
function instalarAcessoNovaCidadeLudigins() {
  const botaoJogoAtual = document.getElementById('btnAbrirLudigins');
  const overlay = document.getElementById('ludiginsOverlay');
  const frame = document.getElementById('ludiginsFrame');

  if (!botaoJogoAtual || !overlay || !frame) return;
  if (document.getElementById('btnNovaCidadeLudigins')) return;

  const botao = document.createElement('button');
  botao.id = 'btnNovaCidadeLudigins';
  botao.type = 'button';
  botao.textContent = '🏙️ IR PARA NOVA CIDADE LUDIGINS';
  botao.className = botaoJogoAtual.className || 'btn-ludigins';
  botao.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
  botao.style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.4)';
  botao.style.whiteSpace = 'nowrap';

  botaoJogoAtual.insertAdjacentElement('afterend', botao);

  let voltar = document.getElementById('btnVoltarNovaCidadeLudigins');
  if (!voltar) {
    voltar = document.createElement('button');
    voltar.id = 'btnVoltarNovaCidadeLudigins';
    voltar.type = 'button';
    voltar.textContent = '← VOLTAR AO PAINEL';
    voltar.style.cssText = [
      'display:none',
      'position:fixed',
      'top:12px',
      'right:12px',
      'z-index:100001',
      'border:1px solid rgba(255,255,255,.25)',
      'border-radius:10px',
      'padding:10px 14px',
      'background:rgba(15,23,42,.94)',
      'color:#fff',
      'font-weight:800',
      'cursor:pointer',
      'box-shadow:0 6px 20px rgba(0,0,0,.35)'
    ].join(';');
    document.body.appendChild(voltar);
  }

  botao.addEventListener('click', () => {
    frame.src = './cidade-ludigins-preview.html?embed=1&v=' + Date.now();
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
    voltar.style.display = 'block';
  });

  voltar.addEventListener('click', () => {
    overlay.classList.remove('show');
    document.body.style.overflow = '';
    voltar.style.display = 'none';
    frame.src = 'about:blank';
  });

  // Se a cidade nova for fechada por mensagem, mantém a interface sincronizada.
  window.addEventListener('message', event => {
    if (event.data && event.data.type === 'fecharLudigins') {
      voltar.style.display = 'none';
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', instalarAcessoNovaCidadeLudigins, { once: true });
} else {
  instalarAcessoNovaCidadeLudigins();
}
