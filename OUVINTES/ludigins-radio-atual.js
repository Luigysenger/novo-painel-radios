import { db } from '../firebase-config.js';
import { ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const feed = document.getElementById('feed');
const mapa = document.getElementById('mapa');
if (!feed || !mapa) throw new Error('Painel Ludigins não encontrado.');

const estilo = document.createElement('style');
estilo.textContent = `
    .feed-radio-atual {
        display: block;
        margin-top: 3px;
        color: #c4b5fd;
        font-size: 10px;
        font-weight: 800;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .carro-jogador.alerta-combustivel .carro-visual {
        --car-color: #ef4444 !important;
        box-shadow: 0 8px 16px rgba(0,0,0,.36), 0 0 24px rgba(239,68,68,.88) !important;
    }

    .carro-jogador.alerta-aquecimento .carro-visual {
        --car-color: #f97316 !important;
        box-shadow: 0 8px 16px rgba(0,0,0,.36), 0 0 24px rgba(249,115,22,.88) !important;
    }

    .carro-jogador.ouvindo-radio .carro-visual {
        --car-color: #a855f7 !important;
        box-shadow: 0 8px 16px rgba(0,0,0,.36), 0 0 24px rgba(168,85,247,.88) !important;
    }
`;
document.head.appendChild(estilo);

let jogadores = {};
let perfis = {};
let eventos = [];
let ultimaRadioEnviada = '';

function normalizar(valor) {
    return String(valor || '').trim().toLocaleLowerCase('pt-BR');
}

function jogadorDoItem(item) {
    const id = String(item?.usuarioId || '');
    if (jogadores[id]) return jogadores[id];

    const nome = normalizar(item?.usuarioNome);
    return Object.values(jogadores).find(jogador =>
        normalizar(jogador?.nome) === nome
    ) || {};
}

function perfilDoJogador(id, jogador) {
    if (perfis[id]) return perfis[id];

    const nome = normalizar(jogador?.nome);
    return Object.values(perfis).find(perfil =>
        normalizar(perfil?.nome) === nome
    ) || {};
}

function atualizarRadiosNoPainel() {
    const ultimos = [...eventos]
        .sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0))
        .slice(0, 12);

    [...feed.querySelectorAll('.feed-item')].forEach((cartao, indice) => {
        cartao.querySelector('.feed-radio-atual')?.remove();

        const item = ultimos[indice];
        if (!item) return;

        const jogador = jogadorDoItem(item);
        const linhaRadio = document.createElement('span');
        linhaRadio.className = 'feed-radio-atual';
        linhaRadio.textContent = '📻 ' + (
            String(jogador.radioAtual || '').trim() ||
            'Nenhuma rádio selecionada'
        );
        cartao.appendChild(linhaRadio);
    });
}

function atualizarCoresDosCarros() {
    mapa.querySelectorAll('.carro-jogador').forEach(carro => {
        const id = String(carro.dataset.jogadorId || '');
        const jogador = jogadores[id] || {};
        const perfil = perfilDoJogador(id, jogador);
        const combustivel = Number(perfil.combustivel);
        const aquecimento = Number(perfil.aquecimentoCorridas || 0);
        const ouvindoRadio = Boolean(String(jogador.radioAtual || '').trim());

        carro.classList.remove(
            'alerta-combustivel',
            'alerta-aquecimento',
            'ouvindo-radio'
        );

        // A ordem mantém alertas importantes sempre visíveis.
        if (Number.isFinite(combustivel) && combustivel <= 15) {
            carro.classList.add('alerta-combustivel');
        } else if (aquecimento >= 11) {
            carro.classList.add('alerta-aquecimento');
        } else if (ouvindoRadio) {
            carro.classList.add('ouvindo-radio');
        }
    });
}

function sincronizarRadioDoPainelPrincipal() {
    const titulo = window.parent?.document?.getElementById('playerNameDisplay');
    const radioAtual = String(titulo?.textContent || '').trim();
    const usuarioId = String(
        localStorage.getItem('usuarioKey') ||
        localStorage.getItem('userId') || ''
    ).trim();

    if (
        !usuarioId ||
        !radioAtual ||
        radioAtual === 'Nenhuma rádio selecionada' ||
        radioAtual === ultimaRadioEnviada
    ) return;

    ultimaRadioEnviada = radioAtual;
    update(ref(db, `ludigins_jogo/jogadores/${usuarioId}`), {
        radioAtual,
        radioAtualizadoEm: Date.now()
    }).catch(() => {});
}

onValue(ref(db, 'ludigins_eventos'), snapshot => {
    eventos = [];
    snapshot.forEach(child => eventos.push({
        id: child.key,
        ...(child.val() || {})
    }));
    atualizarRadiosNoPainel();
});

onValue(ref(db, 'ludigins_jogo/jogadores'), snapshot => {
    jogadores = snapshot.exists() ? (snapshot.val() || {}) : {};
    atualizarRadiosNoPainel();
    atualizarCoresDosCarros();
});

onValue(ref(db, 'ludigins_usuarios'), snapshot => {
    perfis = snapshot.exists() ? (snapshot.val() || {}) : {};
    atualizarCoresDosCarros();
});

new MutationObserver(() => {
    atualizarRadiosNoPainel();
    atualizarCoresDosCarros();
}).observe(feed, { childList: true });

setInterval(sincronizarRadioDoPainelPrincipal, 900);
sincronizarRadioDoPainelPrincipal();
