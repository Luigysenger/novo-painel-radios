// Integração somente-leitura da nova Cidade Ludigins com o progresso atual.
// Nesta etapa NÃO grava, NÃO desconta saldo e NÃO altera propriedades.
import { db } from '../firebase-config.js';
import { ref, get } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';

function candidatosIdJogador() {
  const chaves = ['ludigins_uid','ludigins_user_id','userId','uid','ouvinteId'];
  const ids = [];
  for (const chave of chaves) {
    const valor = localStorage.getItem(chave) || sessionStorage.getItem(chave);
    if (valor && !ids.includes(valor)) ids.push(valor);
  }
  return ids;
}

async function localizarPerfil() {
  const ids = candidatosIdJogador();
  for (const id of ids) {
    for (const raiz of ['ludigins_usuarios','usuarios']) {
      try {
        const snap = await get(ref(db, raiz + '/' + id));
        if (snap.exists()) return { id, raiz, perfil: snap.val() || {} };
      } catch (_) {}
    }
  }
  return null;
}

function numero(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }
function texto(v, padrao='—') { return v === undefined || v === null || v === '' ? padrao : String(v); }

function atualizarTela(registro) {
  const status = document.getElementById('perfilRealStatus');
  if (!registro) {
    if (status) status.textContent = 'Entre pelo painel normal do ouvinte para a prévia reconhecer seu progresso real.';
    return;
  }
  const p = registro.perfil;
  const saldo = numero(p.saldo ?? p.ludigins ?? p.moedas);
  const hoje = numero(p.corridasHoje ?? p.corridas_hoje);
  const total = numero(p.corridasTotais ?? p.corridas ?? p.totalCorridas);
  const nome = texto(p.nome ?? p.displayName ?? p.apelido, 'Ouvinte');
  const carro = texto(p.carroAtual ?? p.corCarro ?? p.patente, 'carro atual preservado');

  const campos = {
    perfilRealStatus: 'Perfil atual reconhecido em modo seguro (somente leitura).',
    cidadaoNome: nome,
    cidadaoSaldo: saldo.toLocaleString('pt-BR') + ' Ludigins',
    cidadaoCorridasHoje: hoje.toLocaleString('pt-BR'),
    cidadaoCorridasTotal: total.toLocaleString('pt-BR'),
    cidadaoCarro: carro
  };
  for (const [id, valor] of Object.entries(campos)) {
    const el = document.getElementById(id); if (el) el.textContent = valor;
  }
}

localizarPerfil().then(atualizarTela).catch(() => atualizarTela(null));
