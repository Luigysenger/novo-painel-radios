import { db } from '../firebase-config.js';
import { ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const feed = document.getElementById('feed');
const mapa = document.getElementById('mapa');

const estilo = document.createElement('style');
estilo.textContent = `
    #rankingDiario .ranking-nome {
        font-size: 10px !important;
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
        const painel = window.parent.document;
        const titulo = String(
            painel.getElementById('playerNameDisplay')?.textContent || ''
        ).trim();
        if (titulo && titulo !== 'Nenhuma rádio selecionada') return titulo;

        const status = String(
            painel.getElementById('playerStatusText')?.textContent || ''
        ).trim();
        const encontrada = status.match(/^Ouvindo Rádio:\s*(.+)$/i);
        if (encontrada?.[1]) return encontrada[1].trim();

        const retro = String(
            painel.getElementById('retroTitleDisplay')?.textContent || ''
        ).trim();
        return retro && retro !== 'Selecione uma Rádio' ? retro : '';
    } catch (_) {
        return '';
    }
}

function nomeDoOuvinteAtual() {
    return normalizar(
        document.getElementById('nomeOuvinte')?.textContent ||
        localStorage.getItem('usuarioNome') ||
        localStorage.getItem('usuarioLogado')
    );
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

    const nomeAtual = nomeDoOuvinteAtual();
    if (nomeAtual && normalizar(item?.usuarioNome) === nomeAtual) {
        return radioDoPainelPrincipal();
    }
    return '';
}

function atualizarRadiosNoPainel() {
    // Remove a informação da rádio do feed “Acontecendo agora”.
    feed?.querySelectorAll('.feed-radio-atual').forEach(linha => linha.remove());
}

function radioDoNome(nome) {
    const nomeNormalizado = normalizar(nome);
    const encontrado = Object.entries(jogadores).find(([, jogador]) =>
        normalizar(jogador?.nome) === nomeNormalizado
    );
    const id = encontrado?.[0] || '';
    const jogador = encontrado?.[1] || {};
    const radioPublica = String(radiosAtuais[id]?.nome || '').trim();
    const radioDoMapa = String(jogador.radioAtual || '').trim();

    if (radioPublica) return radioPublica;
    if (radioDoMapa) return radioDoMapa;
    return nomeNormalizado && nomeNormalizado === nomeDoOuvinteAtual()
        ? radioDoPainelPrincipal()
        : '';
}

function atualizarRadiosNoRanking() {
    const rankingDiario = document.getElementById('rankingDiario');
    if (!rankingDiario) return;

    rankingDiario.querySelectorAll('.ranking-item').forEach(item => {
        const nome = item.querySelector('.ranking-nome');
        if (!nome) return;

        const nomeOriginal = String(
            nome.dataset.nomeOriginal || nome.textContent.split(' | ')[0]
        ).trim();
        nome.dataset.nomeOriginal = nomeOriginal;

        const radio = radioDoNome(nomeOriginal);
        nome.textContent = radio ? `${nomeOriginal} | ${radio}` : nomeOriginal;
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
            (normalizar(jogador.nome) === nomeDoOuvinteAtual() &&
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

    const atualizadoEm = Date.now();

    update(ref(db, `ludigins_jogo/jogadores/${usuarioId}`), {
        radioAtual,
        radioAtualizadoEm: atualizadoEm
    }).catch(() => {});

    update(ref(db, `ludigins_jogo/radios_atuais/${usuarioId}`), {
        nome: radioAtual,
        atualizadoEm
    }).catch(() => {});
}

onValue(ref(db, 'ludigins_eventos'), snapshot => {
    eventos = [];
    snapshot.forEach(child => eventos.push({ id: child.key, ...(child.val() || {}) }));
    atualizarRadiosNoPainel();
    atualizarRadiosNoRanking();
});

onValue(ref(db, 'ludigins_jogo/jogadores'), snapshot => {
    jogadores = snapshot.exists() ? (snapshot.val() || {}) : {};
    atualizarRadiosNoPainel();
    atualizarRadiosNoRanking();
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
    atualizarRadiosNoRanking();
    atualizarCoresDosCarros();
}, 500);
