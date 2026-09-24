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

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// =============================================================
// ACESSO DE TESTE — NOVA CIDADE LUDIGINS
// Mantém o jogo atual intacto e cria um segundo acesso independente.
// =============================================================
function instalarAcessoNovaCidadeLudigins() {
  const botaoJogoAtual = document.getElementById('btnAbrirLudigins');
  if (!botaoJogoAtual) return false;
  if (document.getElementById('btnNovaCidadeLudigins')) return true;

  const botao = document.createElement('button');
  botao.id = 'btnNovaCidadeLudigins';
  botao.type = 'button';
  botao.textContent = '🏙️ IR PARA NOVA CIDADE LUDIGINS';
  botao.className = botaoJogoAtual.className || 'btn-ludigins';
  botao.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
  botao.style.boxShadow = '0 4px 12px rgba(5,150,105,.45)';
  botao.style.whiteSpace = 'nowrap';
  botao.style.margin = '0';
  botaoJogoAtual.insertAdjacentElement('afterend', botao);

  const overlay = document.createElement('div');
  overlay.id = 'novaCidadeLudiginsOverlay';
  overlay.style.cssText = 'display:none;position:fixed;inset:0;z-index:1000000;background:#07111f;width:100%;height:100%;height:100dvh;';

  const frame = document.createElement('iframe');
  frame.id = 'novaCidadeLudiginsFrame';
  frame.title = 'Nova Cidade Ludigins';
  frame.style.cssText = 'width:100%;height:100%;border:0;background:#07111f;display:block;';
  frame.setAttribute('allow','autoplay');

  const voltar = document.createElement('button');
  voltar.id = 'btnVoltarNovaCidadeLudigins';
  voltar.type = 'button';
  voltar.textContent = '← VOLTAR AO PAINEL';
  voltar.style.cssText = 'position:absolute;top:max(12px,env(safe-area-inset-top));right:12px;z-index:3;border:1px solid rgba(255,255,255,.25);border-radius:10px;padding:10px 14px;background:rgba(15,23,42,.94);color:#fff;font-weight:800;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.35);';

  overlay.appendChild(frame);
  overlay.appendChild(voltar);
  document.body.appendChild(overlay);

  function abrirNovaCidade() {
    frame.src = './cidade-ludigins-preview.html?embed=1&v=' + Date.now();
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }

  function fecharNovaCidade() {
    overlay.style.display = 'none';
    document.body.style.overflow = '';
    frame.src = 'about:blank';
  }

  botao.addEventListener('click', abrirNovaCidade);
  voltar.addEventListener('click', fecharNovaCidade);
  window.addEventListener('message', event => {
    if (event.data && event.data.type === 'fecharLudigins') fecharNovaCidade();
  });
  return true;
}

// O módulo é carregado pelo próprio index do Painel do Ouvinte.
// As tentativas extras cobrem Safari/iPhone e carregamentos restaurados do cache.
function garantirAcessoNovaCidade() {
  if (instalarAcessoNovaCidadeLudigins()) return;
  let tentativas = 0;
  const timer = setInterval(() => {
    tentativas += 1;
    if (instalarAcessoNovaCidadeLudigins() || tentativas >= 40) clearInterval(timer);
  }, 250);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', garantirAcessoNovaCidade, { once:true });
} else {
  garantirAcessoNovaCidade();
}
window.addEventListener('pageshow', garantirAcessoNovaCidade);
