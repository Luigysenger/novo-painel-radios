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
// Inserção cirúrgica no cabeçalho real do Painel do Ouvinte.
// Não substitui nem altera o botão do jogo atual.
// =============================================================
function instalarNovaCidadeLudigins() {
  if (document.getElementById('btnNovaCidadeLudigins')) return true;

  const botaoJogo = document.getElementById('btnAbrirLudigins');
  if (!botaoJogo || !botaoJogo.parentElement) return false;

  const botaoNovaCidade = document.createElement('button');
  botaoNovaCidade.type = 'button';
  botaoNovaCidade.id = 'btnNovaCidadeLudigins';
  botaoNovaCidade.className = 'btn-ludigins';
  botaoNovaCidade.innerHTML = '🏙️ IR PARA NOVA CIDADE LUDIGINS';
  botaoNovaCidade.setAttribute('aria-label', 'Ir para Nova Cidade Ludigins');
  botaoNovaCidade.style.cssText = [
    'background:linear-gradient(135deg,#059669 0%,#047857 100%)',
    'box-shadow:0 4px 12px rgba(5,150,105,.45)',
    'color:#fff',
    'border:0',
    'cursor:pointer',
    'font-weight:800',
    'white-space:nowrap'
  ].join(';');

  // Coloca fisicamente logo depois do JOGAR LUDIGINS.
  botaoJogo.insertAdjacentElement('afterend', botaoNovaCidade);

  let overlay = document.getElementById('novaCidadeLudiginsOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'novaCidadeLudiginsOverlay';
    overlay.style.cssText = 'display:none;position:fixed;inset:0;z-index:1000000;background:#07111f;width:100%;height:100vh;height:100dvh;';

    const frame = document.createElement('iframe');
    frame.id = 'novaCidadeLudiginsFrame';
    frame.title = 'Nova Cidade Ludigins';
    frame.setAttribute('allow', 'autoplay');
    frame.style.cssText = 'display:block;width:100%;height:100%;border:0;background:#07111f;';

    const voltar = document.createElement('button');
    voltar.type = 'button';
    voltar.id = 'btnVoltarNovaCidadeLudigins';
    voltar.textContent = '← VOLTAR AO PAINEL';
    voltar.style.cssText = 'position:absolute;top:max(12px,env(safe-area-inset-top));right:12px;z-index:10;border:1px solid rgba(255,255,255,.3);border-radius:10px;padding:10px 14px;background:rgba(15,23,42,.96);color:#fff;font-weight:900;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.4);';

    overlay.append(frame, voltar);
    document.body.appendChild(overlay);

    voltar.addEventListener('click', () => {
      overlay.style.display = 'none';
      document.body.style.overflow = '';
      frame.src = 'about:blank';
    });
  }

  botaoNovaCidade.addEventListener('click', () => {
    const frame = document.getElementById('novaCidadeLudiginsFrame');
    if (!frame) return;
    frame.src = './cidade-ludigins-preview.html?embed=1&v=' + Date.now();
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
  });

  return true;
}

function garantirNovaCidadeLudigins() {
  if (instalarNovaCidadeLudigins()) return;

  // Observa o DOM até o cabeçalho real existir. Isso evita falhas no Safari/iPhone
  // e também em restauração de página pelo cache do navegador.
  const observer = new MutationObserver(() => {
    if (instalarNovaCidadeLudigins()) observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // Segurança adicional para páginas que terminam de montar sem nova mutação.
  let tentativas = 0;
  const timer = setInterval(() => {
    tentativas++;
    if (instalarNovaCidadeLudigins() || tentativas >= 120) {
      clearInterval(timer);
      if (document.getElementById('btnNovaCidadeLudigins')) observer.disconnect();
    }
  }, 250);
}

garantirNovaCidadeLudigins();
document.addEventListener('DOMContentLoaded', garantirNovaCidadeLudigins);
window.addEventListener('load', garantirNovaCidadeLudigins);
window.addEventListener('pageshow', garantirNovaCidadeLudigins);
