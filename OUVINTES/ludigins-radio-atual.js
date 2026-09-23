import { db } from '../firebase-config.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const feed = document.getElementById('feed');
if (!feed) throw new Error('Painel Acontecendo agora não encontrado.');

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
`;
document.head.appendChild(estilo);

let jogadores = {};
let eventos = [];

function atualizarRadiosNoPainel() {
    const ultimos = [...eventos]
        .sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0))
        .slice(0, 12);

    [...feed.querySelectorAll('.feed-item')].forEach((cartao, indice) => {
        cartao.querySelector('.feed-radio-atual')?.remove();

        const item = ultimos[indice];
        if (!item) return;

        const radioAtual = String(
            jogadores[String(item.usuarioId || '')]?.radioAtual || ''
        ).trim();

        const linhaRadio = document.createElement('span');
        linhaRadio.className = 'feed-radio-atual';
        linhaRadio.textContent = '📻 ' + (
            radioAtual || 'Nenhuma rádio selecionada'
        );
        cartao.appendChild(linhaRadio);
    });
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
});

// O painel original se redesenha quando chegam novas corridas/eventos.
new MutationObserver(atualizarRadiosNoPainel).observe(feed, {
    childList: true
});
