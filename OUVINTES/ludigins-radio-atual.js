import { db } from '../firebase-config.js';
import { ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const feed = document.getElementById('feed');
const mapa = document.getElementById('mapa');

const estilo = document.createElement('style');
estilo.textContent = `
    .feed-radio-atual {
        display: block !important;
        margin-top: 4px !important;
        color: #c4b5fd !important;
        font-size: 10px !important;
        font-weight: 900 !important;
        line-height: 1.25 !important;
    }
    .carro-jogador.alerta-combustivel .carro-visual {
        --car-color: #ef4444 !important;
        border-color: #ef4444 !important;
        box-shadow: 0 0 26px rgba(239,68,68,.95) !important;
    }
    .carro-jogador.alerta-aquecimento .carro-visual {
        --car-color: #f97316 !important;
        border-color: #f97316 !important;
        box-shadow: 0 0 26px rgba(249,115,22,.95) !important;
    }
    .carro-jogador.ouvindo-radio .carro-visual {
        --car-color: #a855f7 !important;
        border-color: #a855f7 !important;
        box-shadow: 0 0 26px rgba(168,85,247,.95) !important;
    }
`;
document.head.appendChild(estilo);

let jogadores = {};
let perfis = {};
let radiosAtuais = {};
let eventos = [];
let ultimaRadioEnviada = '';

const normalizar = valor =>
    String(valor || '').trim().toLocaleLowerCase('pt-BR');

function radioDoPainelPrincipal() {
    try {
        const titulo = window.parent.document.getElementById('playerNameDisplay');
        const radio = String(titulo?.textContent || '').trim();
        return radio && radio !== 'Nenhuma rádio selecionada' ? radio : '';
    } catch (_) {
        return '';
    }
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

function radioDoItem(item) {
    const idEvento = String(item?.usuarioId || '');
    const jogador = jogadorDoItem(item);
    const idJogador = Object.entries(jogadores).find(([, valor]) => valor === jogador)?.[0] || '';
    const registroPublico = radiosAtuais[idEvento] || radiosAtuais[idJogador] || {};
    const radioPublica = String(registroPublico.nome || '').trim();
    if (radioPublica) return radioPublica;

    const radioDoMapa = String(jogador.radioAtual || '').trim();
    if (radioDoMapa) return radioDoMapa;

    const nomeAtual = normalizar(
        localStorage.getItem('usuarioNome') || localStorage.getItem('usuarioLogado')
    );
    if (nomeAtual && normalizar(item?.usuarioNome) === nomeAtual) {
        return radioDoPainelPrincipal();
    }
    return '';
}

function atualizarRadiosNoPainel() {
    if (!feed) return;
    const ultimos = [...eventos]
        .sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0))
        .slice(0, 12);

    [...feed.querySelectorAll('.feed-item')].forEach((cartao, indice) => {
        const item = ultimos[indice];
        if (!item) return;

        let linha = cartao.querySelector('.feed-radio-atual');
        if (!linha) {
            linha = document.createElement('span');
            linha.className = 'feed-radio-atual';
            cartao.appendChild(linha);
        }
        linha.textContent = '📻 ' + (
            radioDoItem(item) || 'Nenhuma rádio selecionada'
        );
    });
}

function atualizarCoresDosCarros() {
    if (!mapa) return;

    mapa.querySelectorAll('.carro-jogador').forEach(carro => {
        const id = String(carro.dataset.jogadorId || '');
        const jogador = jogadores[id] || {};
        const perfil = perfilDoJogador(id, jogador);
        const combustivel = Number(perfil.combustivel);
        const aquecimento = Number(perfil.aquecimentoCorridas || 0);
        const temRadio = Boolean(
            String(jogador.radioAtual || '').trim() ||
            (normalizar(jogador.nome) === normalizar(localStorage.getItem('usuarioNome')) &&
                radioDoPainelPrincipal())
        );

        carro.classList.remove('alerta-combustivel', 'alerta-aquecimento', 'ouvindo-radio');

        if (Number.isFinite(combustivel) && combustivel <= 20) {
            carro.classList.add('alerta-combustivel');
        } else if (aquecimento >= 11) {
            carro.classList.add('alerta-aquecimento');
        } else if (temRadio) {
            carro.classList.add('ouvindo-radio');
        }
    });
}

function sincronizarRadioDoPainelPrincipal() {
    const radioAtual = radioDoPainelPrincipal();
    const usuarioId = String(
        localStorage.getItem('usuarioKey') ||
        localStorage.getItem('userId') || ''
    ).trim();

    if (!usuarioId || !radioAtual || radioAtual === ultimaRadioEnviada) return;
    ultimaRadioEnviada = radioAtual;

    update(ref(db, `ludigins_jogo/jogadores/${usuarioId}`), {
        radioAtual,
        radioAtualizadoEm: Date.now()
    }).catch(() => {});
}

onValue(ref(db, 'ludigins_eventos'), snapshot => {
    eventos = [];
    snapshot.forEach(child => eventos.push({ id: child.key, ...(child.val() || {}) }));
    atualizarRadiosNoPainel();
});

onValue(ref(db, 'ludigins_jogo/jogadores'), snapshot => {
    jogadores = snapshot.exists() ? (snapshot.val() || {}) : {};
    atualizarRadiosNoPainel();
    atualizarCoresDosCarros();
});

onValue(ref(db, 'ludigins_jogo/radios_atuais'), snapshot => {
    radiosAtuais = snapshot.exists() ? (snapshot.val() || {}) : {};
    atualizarRadiosNoPainel();
});

onValue(ref(db, 'ludigins_usuarios'), snapshot => {
    perfis = snapshot.exists() ? (snapshot.val() || {}) : {};
    atualizarCoresDosCarros();
});

// Reaplica depois de qualquer redesenho do jogo, inclusive no Safari/iPhone.
setInterval(() => {
    sincronizarRadioDoPainelPrincipal();
    atualizarRadiosNoPainel();
    atualizarCoresDosCarros();
}, 500);
