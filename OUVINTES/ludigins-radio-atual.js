import { db } from '../firebase-config.js';
import { ref, onValue, update, get, runTransaction } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const feed = document.getElementById('feed');
const mapa = document.getElementById('mapa');

const estilo = document.createElement('style');
estilo.textContent = `
    #rankingDiario .ranking-nome {
        display: flex !important;
        align-items: center !important;
        gap: 4px !important;
        min-width: 0 !important;
        overflow: hidden !important;
        white-space: nowrap !important;
        font-size: 9px !important;
    }
    #rankingDiario .ranking-radio-nome {
        overflow: hidden;
        text-overflow: ellipsis;
        color: #c4b5fd;
        font-weight: 900;
        cursor: pointer;
        text-decoration: underline;
        text-decoration-color: rgba(196,181,253,.45);
        text-underline-offset: 2px;
    }
    #rankingDiario .ranking-radio-ponto {
        width: 7px;
        height: 7px;
        flex: 0 0 7px;
        border-radius: 50%;
        background: #22c55e;
        box-shadow: 0 0 7px rgba(34,197,94,.95);
        animation: ranking-radio-piscar 1s ease-in-out infinite;
    }
    @keyframes ranking-radio-piscar {
        50% { opacity: .3; transform: scale(.72); }
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
let negocios = {};
let ultimaRadioEnviada = '';
let ultimaSituacaoVisualEnviada = '';
let chegadaAoDestinoConfirmada = false;

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

function tocarRadioDoRanking(nomeRadio) {
    try {
        const tocar = window.parent?.tocarRadioDoLudigins;
        return typeof tocar === 'function' && tocar(nomeRadio);
    } catch (_) {
        return false;
    }
}

document.addEventListener('click', evento => {
    const radio = evento.target?.closest?.('.ranking-radio-nome[data-radio-nome]');
    if (radio) tocarRadioDoRanking(radio.dataset.radioNome);
});

document.addEventListener('keydown', evento => {
    if (evento.key !== 'Enter' && evento.key !== ' ') return;
    const radio = evento.target?.closest?.('.ranking-radio-nome[data-radio-nome]');
    if (!radio) return;
    evento.preventDefault();
    tocarRadioDoRanking(radio.dataset.radioNome);
});

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
        if (!radio) {
            nome.textContent = nomeOriginal;
            return;
        }

        nome.replaceChildren();

        const nomeTexto = document.createElement('span');
        nomeTexto.textContent = `${nomeOriginal} |`;

        const ponto = document.createElement('span');
        ponto.className = 'ranking-radio-ponto';

        const radioTexto = document.createElement('span');
        radioTexto.className = 'ranking-radio-nome';
        radioTexto.textContent = radio;
        radioTexto.dataset.radioNome = radio;
        radioTexto.title = `Clique para ouvir ${radio}`;
        radioTexto.tabIndex = 0;
        radioTexto.setAttribute('role', 'button');

        nome.append(nomeTexto, ponto, radioTexto);
    });
}

function limparCorridaCorrompida() {
    const meuNome = nomeDoOuvinteAtual();
    const entrada = Object.entries(perfis).find(([id, perfil]) => {
        const corrida = perfil?.corridaAtual;
        return corrida &&
            !String(corrida.id || '').trim() &&
            normalizar(perfil?.nome) === meuNome &&
            id;
    });

    if (!entrada) return;

    const [usuarioId] = entrada;

    // Uma corrida sem identificador não possui registro ativo, valor ou rota
    // para finalizar. Limpa somente esse registro inválido, preservando todo
    // saldo, contadores, histórico e qualquer corrida real.
    update(ref(db, `ludigins_usuarios/${usuarioId}`), {
        corridaAtual: null,
        atualizadoEm: Date.now()
    }).then(() => {
        update(ref(db, `ludigins_jogo/jogadores/${usuarioId}`), {
            movimento: null,
            status: 'online',
            atualizadoEm: Date.now()
        }).catch(() => {});
    }).catch(() => {});
}

function atualizarAtalhoFinalizarNoMac(botao, passageirosEntregues) {
    const idAtalho = 'btnFinalizarMac';
    const existente = document.getElementById(idAtalho);

    if (!passageirosEntregues) {
        existente?.remove();
        botao.style.removeProperty('display');
        return;
    }

    if (existente) return;

    // Botão visível apenas após a confirmação oficial de entrega.
    // Ele chama a mesma finalização já registrada no botão original.
    const atalho = document.createElement('button');
    atalho.type = 'button';
    atalho.id = idAtalho;
    atalho.className = botao.className;
    atalho.textContent = botao.textContent || 'Finalizar corrida';
    atalho.setAttribute('aria-label', 'Finalizar corrida');

    atalho.addEventListener('click', () => {
        atalho.disabled = true;
        botao.disabled = false;
        botao.removeAttribute('disabled');
        botao.dataset.finalizacaoEmAndamento = '1';
        botao.dispatchEvent(new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        }));

        setTimeout(() => {
            const entregaAindaVisivel =
                /passageiros entregues|já pode finalizar/i.test(
                    document.getElementById('corridaTimer')?.textContent || ''
                );
            if (atalho.isConnected && entregaAindaVisivel) {
                atalho.disabled = false;
            }
        }, 4000);
    });

    botao.insertAdjacentElement('beforebegin', atalho);
    botao.style.display = 'none';
}

function garantirFinalizacaoDaCorrida() {
    const botao = document.getElementById('btnFinalizar');
    const aviso = document.getElementById('corridaTimer');
    if (!botao || !aviso) return;

    const passageirosEntregues =
        /passageiros entregues|já pode finalizar/i.test(aviso.textContent || '');

    if (!passageirosEntregues) {
        atualizarAtalhoFinalizarNoMac(botao, false);
        delete botao.dataset.finalizacaoEmAndamento;
        chegadaAoDestinoConfirmada = false;
        return;
    }

    atualizarAtalhoFinalizarNoMac(botao, true);

    if (botao.dataset.finalizacaoEmAndamento !== '1') {
        botao.disabled = false;
    }

    // Observa a alteração que o Safari faz no atributo "disabled" e
    // restaura o botão apenas enquanto a confirmação oficial de entrega
    // continuar na tela.
    if (!botao.dataset.observandoFinalizacao) {
        const observador = new MutationObserver(() => {
            const entregaConfirmada =
                /passageiros entregues|já pode finalizar/i.test(
                    aviso.textContent || ''
                );

            if (
                entregaConfirmada &&
                botao.disabled &&
                botao.dataset.finalizacaoEmAndamento !== '1'
            ) {
                botao.disabled = false;
            }
        });

        observador.observe(botao, {
            attributes: true,
            attributeFilter: ['disabled']
        });
        botao.dataset.observandoFinalizacao = '1';
    }
}

document.addEventListener('click', evento => {
    const botao = evento.target?.closest?.('#btnFinalizar');
    if (botao) botao.dataset.finalizacaoEmAndamento = '1';
}, true);

function atualizarCoresDosCarros() {
    if (!mapa) return;

    mapa.querySelectorAll('.carro-jogador').forEach(carro => {
        const id = String(carro.dataset.jogadorId || '');
        const jogador = jogadores[id] || {};
        const perfil = perfilDoJogador(id, jogador);
        const combustivel = Number(
            perfil.combustivel ?? jogador.combustivel
        );
        const aquecimento = Number(
            perfil.aquecimentoCorridas ?? jogador.aquecimentoCorridas ?? 0
        );
        const temRadio = Boolean(
            String(radiosAtuais[id]?.nome || jogador.radioAtual || '').trim() ||
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

function atualizarGanhosDosServicos() {
    const ancora = document.getElementById('ganhosPosto');
    if (!ancora) return;

    const meuId = String(localStorage.getItem('usuarioKey') ||
        localStorage.getItem('userId') || '').trim();
    const perfil = perfis[meuId] || Object.values(perfis).find(item =>
        normalizar(item?.nome) === nomeDoOuvinteAtual()
    ) || {};

    const servicos = [
        ['posto_combustivel', '⛽ Posto', 'ganhosPostoHoje'],
        ['caminhao_bombeiro', '🚒 Bombeiro', 'ganhosBombeiroHoje'],
        ['ambulancia', '🚑 Ambulância', 'ganhosAmbulanciaHoje'],
        ['entregador_lanche', '🛵 Entregador', 'ganhosEntregadorLancheHoje']
    ].filter(([id]) => negocios[id]?.donoId === meuId);

    let painel = document.getElementById('ganhosTodosServicos');
    if (!servicos.length) {
        painel?.remove();
        return;
    }

    if (!painel) {
        painel = document.createElement('div');
        painel.id = 'ganhosTodosServicos';
        painel.className = 'negocio-ganhos';
        ancora.insertAdjacentElement('afterend', painel);
    }

    painel.innerHTML = servicos.map(([id, nome, campo]) => {
        const ganhos = id === 'caminhao_bombeiro'
            ? Number(perfil[campo] ?? perfil.ganhosBombeiroTotal ?? 0)
            : Number(perfil[campo] || 0);
        return `<div>${nome}: ${ganhos.toLocaleString('pt-BR')} 🪙</div>`;
    }).join('');
}

function sincronizarSituacaoVisualDoCarro() {
    const usuarioId = String(
        localStorage.getItem('usuarioKey') ||
        localStorage.getItem('userId') || ''
    ).trim();
    if (!usuarioId) return;

    const meuPerfil = perfis[usuarioId] || Object.values(perfis).find(perfil =>
        normalizar(perfil?.nome) === nomeDoOuvinteAtual()
    ) || {};
    const combustivel = Number(meuPerfil.combustivel);
    const aquecimentoCorridas = Number(meuPerfil.aquecimentoCorridas || 0);

    if (!Number.isFinite(combustivel)) return;

    const situacao = [
        Math.max(0, Math.min(100, combustivel)),
        Math.max(0, aquecimentoCorridas)
    ].join('|');

    if (situacao === ultimaSituacaoVisualEnviada) return;
    ultimaSituacaoVisualEnviada = situacao;

    // Publica somente os indicadores necessários para que todos vejam
    // os alertas do carro no mapa compartilhado.
    update(ref(db, `ludigins_jogo/jogadores/${usuarioId}`), {
        combustivel: Math.max(0, Math.min(100, combustivel)),
        aquecimentoCorridas: Math.max(0, aquecimentoCorridas),
        situacaoVisualAtualizadaEm: Date.now()
    }).catch(() => {
        ultimaSituacaoVisualEnviada = '';
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
    limparCorridaCorrompida();
    sincronizarSituacaoVisualDoCarro();
    atualizarCoresDosCarros();
    atualizarGanhosDosServicos();
});

onValue(ref(db, 'ludigins_jogo/negocios'), snapshot => {
    negocios = snapshot.exists() ? (snapshot.val() || {}) : {};
    atualizarGanhosDosServicos();
});

// Reaplica depois de qualquer redesenho do jogo, inclusive no Safari/iPhone.
setInterval(() => {
    sincronizarRadioDoPainelPrincipal();
    limparCorridaCorrompida();
    sincronizarSituacaoVisualDoCarro();
    atualizarRadiosNoPainel();
    atualizarRadiosNoRanking();
    atualizarCoresDosCarros();
    atualizarGanhosDosServicos();
    garantirFinalizacaoDaCorrida();
}, 500);


/* Logística dos negócios: posto, carreta, bombeiro e moto. */
let logistica = {};
const CUSTO_CARGA_CARRETA = 120;
const CUSTO_ABASTECER_BOMBEIRO_MANUAL = 12;
const CUSTO_ABASTECER_MOTO = 3;
const CUSTO_LOTE_LANCHES = 15;
const TAMANHO_LOTE_LANCHES = 10;

estilo.textContent += \`
    .logistica-card {
        margin: 14px 0;
        padding: 16px;
        border: 2px solid rgba(139,92,246,.78);
        border-radius: 20px;
        background: linear-gradient(135deg,rgba(23,22,62,.98),rgba(10,20,39,.98));
        color: #f8fafc;
    }
    .logistica-card h3 { margin: 0 0 7px; font-size: 18px; }
    .logistica-card p { margin: 5px 0; color: #dbeafe; }
    .logistica-fatia { display:flex; gap:4px; margin:10px 0 7px; }
    .logistica-fatia i { display:block; height:19px; flex:1; border-radius:4px; background:#263246; border:1px solid #4b5563; }
    .logistica-fatia i.ativa { background:linear-gradient(180deg,#ff5b5b,#dc2626); box-shadow:0 0 9px rgba(239,68,68,.8); border-color:#ff7777; }
    .logistica-barra { height:12px; border-radius:99px; overflow:hidden; background:#263246; border:1px solid #536078; margin:8px 0; }
    .logistica-barra b { display:block; height:100%; background:linear-gradient(90deg,#38bdf8,#2563eb); border-radius:inherit; }
    .logistica-barra.lanche b { background:linear-gradient(90deg,#fb923c,#f97316); }
    .btn-logistica { width:100%; margin:10px 0 0; border:0; border-radius:14px; padding:12px; font-weight:900; font-size:15px; cursor:pointer; color:#271800; background:linear-gradient(135deg,#fff3a4,#facc15); }
    .btn-logistica:disabled { opacity:.55; cursor:not-allowed; }
    .logistica-alerta { margin-top:10px; padding:9px 11px; border:1px solid #ef4444; border-radius:12px; color:#fecaca; background:rgba(127,29,29,.25); font-weight:800; }
    .logistica-ok { margin-top:10px; padding:9px 11px; border:1px solid #22c55e; border-radius:12px; color:#bbf7d0; background:rgba(20,83,45,.24); font-weight:800; }
    .carreta-combustivel-mapa { position:absolute; z-index:15; width:46px; height:29px; pointer-events:none; transform:translate(-50%,-50%) rotate(0deg)!important; filter:drop-shadow(0 3px 4px rgba(0,0,0,.75)); transition:left 2.4s linear,top 2.4s linear; }
    .carreta-combustivel-mapa .cabine { position:absolute; left:0; bottom:0; width:18px; height:19px; border-radius:7px 4px 3px 3px; background:linear-gradient(135deg,#a855f7,#6d28d9); border:2px solid #ede9fe; }
    .carreta-combustivel-mapa .tanque { position:absolute; left:15px; top:3px; width:29px; height:19px; border-radius:10px; background:linear-gradient(135deg,#f8fafc,#cbd5e1); border:2px solid #7c3aed; }
    .carreta-combustivel-mapa .roda { position:absolute; bottom:-2px; width:9px; height:9px; border-radius:50%; background:#111827; border:2px solid #cbd5e1; }
    .carreta-combustivel-mapa .r1 { left:4px; } .carreta-combustivel-mapa .r2 { right:3px; }
    .caminhao-bombeiro-mapa { transform:translate(-50%,-50%) rotate(0deg)!important; }
    #pedidoLancheJogo { margin:9px 0; padding:11px; border:2px solid #f59e0b; border-radius:14px; background:rgba(120,53,15,.24); color:#fef3c7; font-weight:800; }
\`;

function meuIdLogistica() {
    return String(localStorage.getItem('usuarioKey') || localStorage.getItem('userId') || '').trim();
}
function meuPerfilLogistica() {
    const id = meuIdLogistica();
    return perfis[id] || Object.values(perfis).find(item => normalizar(item?.nome) === nomeDoOuvinteAtual()) || {};
}
function souDonoDoNegocio(negocio) {
    if (!negocio) return false;
    const meuId = meuIdLogistica();
    const meuNome = nomeDoOuvinteAtual();
    return String(negocio.donoId || '') === meuId ||
        normalizar(negocio.donoNome) === meuNome ||
        (String(negocio.donoId || '') === 'proprietario_luigy' && meuNome === 'luigy');
}
function inteiro(valor, minimo, maximo) {
    return Math.max(minimo, Math.min(maximo, Math.round(Number(valor) || 0)));
}
function fatiasPosto() {
    const posto = logistica.posto || {};
    return inteiro(posto.fatias, 1, 10);
}
function avisoLogistica(texto) {
    let aviso = document.getElementById('avisoLogistica');
    if (!aviso) {
        aviso = document.createElement('div');
        aviso.id = 'avisoLogistica';
        aviso.className = 'logistica-alerta';
        (document.getElementById('painelNegocios') || document.body).prepend(aviso);
    }
    aviso.textContent = texto;
    setTimeout(() => aviso?.remove(), 4200);
}
function inserirPainelLogistica() {
    const ancora = document.getElementById('ganhosTodosServicos') || document.getElementById('ganhosPosto');
    if (!ancora) return null;
    let painel = document.getElementById('painelLogisticaReal');
    if (!painel) {
        painel = document.createElement('div');
        painel.id = 'painelLogisticaReal';
        ancora.insertAdjacentElement('afterend', painel);
    }
    return painel;
}
function htmlFatias(quantidade) {
    let html = '<div class="logistica-fatia" aria-label="' + quantidade + ' de 10 fatias">';
    for (let i = 0; i < 10; i += 1) html += '<i class="' + (i < quantidade ? 'ativa' : '') + '"></i>';
    return html + '</div>';
}
function renderizarLogistica() {
    const painel = inserirPainelLogistica();
    if (!painel) return;
    const postoNegocio = negocios.posto_combustivel || {};
    const carreta = negocios.carreta_combustivel || {};
    const moto = negocios.entregador_lanche || {};
    const bombeiro = negocios.caminhao_bombeiro || {};
    const partes = [];
    const estoque = logistica.posto || { fatias:10, usosNaUltimaFatia:0 };
    const usos = inteiro(estoque.usosNaUltimaFatia, 0, 10);
    const ultimaFatia = fatiasPosto() === 1;
    if (souDonoDoNegocio(postoNegocio)) {
        partes.push(
            '<section class="logistica-card"><h3>⛽ Gestão do estoque do posto</h3>' +
            '<p>Estoque: <strong>' + fatiasPosto() + ' de 10 fatias</strong></p>' +
            htmlFatias(fatiasPosto()) +
            '<p>Uma fatia atende 10 abastecimentos.</p>' +
            (ultimaFatia ? '<div class="logistica-alerta">Última fatia: ' + Math.max(0, 5 - usos) + ' abastecimento(s) restantes antes da compra obrigatória.</div>' : '') +
            '<p>Caixa do posto: <strong>' + inteiro(postoNegocio.caixa, 0, 999999).toLocaleString('pt-BR') + ' 🪙</strong></p>' +
            '<p>Preço atual: <strong>' + inteiro(postoNegocio.precoCombustivel, 6, 20) + ' Ludigins</strong></p>' +
            '<button class="btn-logistica" data-logistica-acao="pedir-carga">🚛 Pedir carga completa — 120 🪙</button>' +
            '<p>O pagamento sai da caixa do posto e repõe as 10 fatias.</p></section>'
        );
    }
    if (souDonoDoNegocio(carreta)) {
        partes.push(
            '<section class="logistica-card"><h3>🚛 Gestão da Carreta de Combustível</h3>' +
            '<p>Modelo: <strong>caminhão-tanque roxo</strong></p>' +
            '<p>Pedidos entregues hoje: <strong>' + inteiro(carreta.entregasHoje, 0, 999999) + '</strong></p>' +
            '<p>Ganhos da carreta hoje: <strong>' + inteiro(carreta.ganhosHoje, 0, 999999).toLocaleString('pt-BR') + ' 🪙</strong></p>' +
            '<p>Você recebe 120 🪙 por carga entregue ao posto.</p>' +
            '<div class="logistica-ok">● ' + (logistica.carretaMapa?.fase === 'em_entrega' ? 'Carreta a caminho do posto.' : 'Carreta disponível para entrega.') + '</div></section>'
        );
    }
    if (souDonoDoNegocio(bombeiro)) {
        const combustivel = inteiro(bombeiro.combustivel, 0, 100);
        partes.push(
            '<section class="logistica-card"><h3>🚒 Combustível do caminhão de bombeiro</h3>' +
            '<p>Tanque: <strong>' + combustivel + '%</strong></p><div class="logistica-barra"><b style="width:' + combustivel + '%"></b></div>' +
            '<p>Caixa do caminhão: <strong>' + inteiro(bombeiro.caixa, 0, 999999) + ' 🪙</strong></p>' +
            '<button class="btn-logistica" data-logistica-acao="abastecer-bombeiro">⛽ Abastecer caminhão — 12 🪙</button></section>'
        );
    }
    if (souDonoDoNegocio(moto)) {
        const lanche = inteiro(moto.estoqueLanches, 0, 100);
        const motoComb = inteiro(moto.combustivel, 0, 100);
        const entregas = inteiro(moto.entregasDesdeAbastecimento, 0, 15);
        const preco = [2,4,6,8,10,12].includes(Number(moto.precoLanche)) ? Number(moto.precoLanche) : 6;
        partes.push(
            '<section class="logistica-card"><h3>🛵 Gestão da Moto de Lanches</h3>' +
            '<p>Combustível: <strong>' + motoComb + '%</strong> · Entregas: <strong>' + entregas + ' de 15</strong></p><div class="logistica-barra"><b style="width:' + motoComb + '%"></b></div>' +
            '<button class="btn-logistica" data-logistica-acao="abastecer-moto">⛽ Abastecer moto — 3 🪙</button>' +
            '<p>Estoque de lanches: <strong>' + lanche + ' unidades</strong></p><div class="logistica-barra lanche"><b style="width:' + Math.min(100, lanche * 5) + '%"></b></div>' +
            '<button class="btn-logistica" data-logistica-acao="comprar-lanches">🍔 Comprar 10 lanches — 15 🪙</button>' +
            '<p>Preço de venda do lanche</p><select data-logistica-acao="preco-lanche" class="select-preco">' +
            [2,4,6,8,10,12].map(v => '<option value="' + v + '"' + (v === preco ? ' selected' : '') + '>' + v + ' Ludigins</option>').join('') +
            '</select><div class="logistica-ok">A cada 7 corridas, o motorista precisa pedir um lanche.</div></section>'
        );
    }
    painel.innerHTML = partes.join('');
    renderizarCarretaNoMapa();
}
async function pedirCargaCompleta() {
    const posto = negocios.posto_combustivel || {};
    if (!souDonoDoNegocio(posto)) return;
    const pago = await runTransaction(ref(db, 'ludigins_jogo/negocios/posto_combustivel'), atual => {
        if (!atual || Number(atual.caixa || 0) < CUSTO_CARGA_CARRETA) return;
        return { ...atual, caixa:Number(atual.caixa || 0) - CUSTO_CARGA_CARRETA, atualizadoEm:Date.now() };
    });
    if (!pago.committed) { avisoLogistica('A caixa do posto precisa ter 120 🪙 para pedir a carga.'); return; }
    const agora = Date.now();
    await update(ref(db, 'ludigins_jogo/logistica'), { posto:{fatias:10,usosNaUltimaFatia:0,atualizadoEm:agora}, carretaMapa:{fase:'em_entrega',inicioEm:agora} });
    await runTransaction(ref(db, 'ludigins_jogo/negocios/carreta_combustivel'), atual => ({
        ...(atual || {}), caixa:Number(atual?.caixa || 0) + CUSTO_CARGA_CARRETA,
        ganhosHoje:Number(atual?.ganhosHoje || 0) + CUSTO_CARGA_CARRETA,
        entregasHoje:Number(atual?.entregasHoje || 0) + 1, atualizadoEm:agora
    }));
    setTimeout(() => update(ref(db, 'ludigins_jogo/logistica/carretaMapa'), {fase:'disponivel',atualizadoEm:Date.now()}).catch(() => {}), 2700);
}
async function abastecerNegocio(id, custo, campos) {
    const negocio = negocios[id] || {};
    if (!souDonoDoNegocio(negocio)) return;
    const resultado = await runTransaction(ref(db, 'ludigins_jogo/negocios/' + id), atual => {
        if (!atual || Number(atual.caixa || 0) < custo) return;
        return { ...atual, caixa:Number(atual.caixa || 0) - custo, ...campos, atualizadoEm:Date.now() };
    });
    if (!resultado.committed) avisoLogistica('A caixa deste negócio não tem saldo suficiente.');
}
async function comprarLanches() {
    const moto = negocios.entregador_lanche || {};
    if (!souDonoDoNegocio(moto)) return;
    const resultado = await runTransaction(ref(db, 'ludigins_jogo/negocios/entregador_lanche'), atual => {
        if (!atual || Number(atual.caixa || 0) < CUSTO_LOTE_LANCHES) return;
        return { ...atual, caixa:Number(atual.caixa || 0) - CUSTO_LOTE_LANCHES,
            estoqueLanches:inteiro(Number(atual.estoqueLanches || 0) + TAMANHO_LOTE_LANCHES,0,100), atualizadoEm:Date.now() };
    });
    if (!resultado.committed) avisoLogistica('A caixa da moto precisa ter 15 🪙 para comprar lanches.');
}
async function definirPrecoLanche(valor) {
    const moto = negocios.entregador_lanche || {};
    if (!souDonoDoNegocio(moto)) return;
    const preco = Number(valor);
    if (![2,4,6,8,10,12].includes(preco)) return;
    await update(ref(db, 'ludigins_jogo/negocios/entregador_lanche'), {precoLanche:preco, atualizadoEm:Date.now()});
}
document.addEventListener('click', evento => {
    const botao = evento.target?.closest?.('[data-logistica-acao]');
    if (!botao) return;
    const acao = botao.dataset.logisticaAcao;
    if (acao === 'pedir-carga') pedirCargaCompleta().catch(() => avisoLogistica('Não foi possível pedir a carga agora.'));
    if (acao === 'abastecer-bombeiro') abastecerNegocio('caminhao_bombeiro', CUSTO_ABASTECER_BOMBEIRO_MANUAL, {combustivel:100}).catch(() => {});
    if (acao === 'abastecer-moto') abastecerNegocio('entregador_lanche', CUSTO_ABASTECER_MOTO, {combustivel:100,entregasDesdeAbastecimento:0}).catch(() => {});
    if (acao === 'comprar-lanches') comprarLanches().catch(() => {});
});
document.addEventListener('change', evento => {
    if (evento.target?.matches?.('[data-logistica-acao="preco-lanche"]')) definirPrecoLanche(evento.target.value).catch(() => {});
});
function renderizarCarretaNoMapa() {
    if (!mapa) return;
    mapa.querySelectorAll('.carreta-combustivel-mapa').forEach(el => el.remove());
    const estado = logistica.carretaMapa || {};
    if (!estado.fase) return;
    const el = document.createElement('div');
    el.className = 'carreta-combustivel-mapa';
    el.innerHTML = '<span class="cabine"></span><span class="tanque"></span><span class="roda r1"></span><span class="roda r2"></span>';
    el.style.left = estado.fase === 'em_entrega' ? '34%' : '50%';
    el.style.top = estado.fase === 'em_entrega' ? '71%' : '58%';
    mapa.appendChild(el);
    if (estado.fase === 'em_entrega') requestAnimationFrame(() => { el.style.left = '50%'; el.style.top = '58%'; });
}
function estadoDoPostoPermiteAbastecer() {
    const estoque = logistica.posto || {};
    const fatias = inteiro(estoque.fatias,1,10);
    const usos = inteiro(estoque.usosNaUltimaFatia,0,10);
    return fatias > 1 || usos < 5;
}
async function reservarAbastecimentoDoPosto() {
    const resultado = await runTransaction(ref(db, 'ludigins_jogo/logistica/posto'), atual => {
        const estado = atual || {fatias:10,usosNaUltimaFatia:0};
        const fatias = inteiro(estado.fatias,1,10);
        const usos = inteiro(estado.usosNaUltimaFatia,0,10);
        if (fatias === 1 && usos >= 5) return;
        let novasFatias = fatias, novosUsos = usos + 1;
        if (fatias > 1 && novosUsos >= 10) { novasFatias = fatias - 1; novosUsos = 0; }
        return {...estado,fatias:novasFatias,usosNaUltimaFatia:novosUsos,atualizadoEm:Date.now()};
    });
    return resultado.committed;
}
document.addEventListener('click', async evento => {
    const botao = evento.target?.closest?.('#btnAbastecer');
    if (!botao || botao.dataset.logisticaLiberada === '1') return;
    const perfil = meuPerfilLogistica();
    const posto = negocios.posto_combustivel || {};
    const preco = inteiro(posto.precoCombustivel,6,20);
    if (Number(perfil.combustivel || 0) >= 100 || Number(perfil.saldo || 0) < preco || perfil.corridaAtual) return;
    evento.preventDefault();
    evento.stopImmediatePropagation();
    if (!estadoDoPostoPermiteAbastecer() || !(await reservarAbastecimentoDoPosto())) {
        avisoLogistica('O posto precisa comprar combustível da carreta para continuar abastecendo.');
        return;
    }
    botao.dataset.logisticaLiberada = '1';
    botao.click();
    setTimeout(() => delete botao.dataset.logisticaLiberada, 1200);
}, true);
function atualizarPedidoDeLanche() {
    const id = meuIdLogistica();
    const perfil = meuPerfilLogistica();
    const corridas = Number(perfil.corridasHoje || 0);
    if (!id || !corridas || corridas % 7 !== 0) return;
    if (Number(perfil.pedidoLanchePendente?.corrida || 0) === corridas || Number(perfil.ultimaRefeicaoCorrida || 0) === corridas) return;
    update(ref(db, 'ludigins_usuarios/' + id), {pedidoLanchePendente:{corrida:corridas,criadoEm:Date.now()},atualizadoEm:Date.now()}).catch(() => {});
}
function renderizarPedidoLanche() {
    const existente = document.getElementById('pedidoLancheJogo');
    const perfil = meuPerfilLogistica();
    const pedido = perfil.pedidoLanchePendente;
    if (!pedido) { existente?.remove(); return; }
    const moto = negocios.entregador_lanche || {};
    const preco = [2,4,6,8,10,12].includes(Number(moto.precoLanche)) ? Number(moto.precoLanche) : 6;
    const painel = document.getElementById('painelCorridaAtual') || document.getElementById('painelCorrida');
    if (!painel) return;
    let box = existente;
    if (!box) { box = document.createElement('div'); box.id = 'pedidoLancheJogo'; painel.prepend(box); }
    box.innerHTML = '🍔 Após 7 corridas, você precisa pedir um lanche.<button type="button" class="btn-logistica" data-logistica-acao="pedir-lanche">Pedir lanche — ' + preco + ' 🪙</button>';
}
async function pedirLanche() {
    const id = meuIdLogistica();
    const perfil = meuPerfilLogistica();
    const motoAntes = negocios.entregador_lanche || {};
    const preco = [2,4,6,8,10,12].includes(Number(motoAntes.precoLanche)) ? Number(motoAntes.precoLanche) : 6;
    if (!id || !perfil.pedidoLanchePendente) return;
    if (Number(perfil.saldo || 0) < preco) { avisoLogistica('Você precisa de ' + preco + ' 🪙 para pedir o lanche.'); return; }
    const venda = await runTransaction(ref(db, 'ludigins_jogo/negocios/entregador_lanche'), atual => {
        if (!atual || Number(atual.estoqueLanches || 0) < 1 || Number(atual.combustivel || 0) <= 0 || Number(atual.entregasDesdeAbastecimento || 0) >= 15) return;
        return {...atual,estoqueLanches:Number(atual.estoqueLanches)-1,combustivel:Math.max(0,Number(atual.combustivel)-7),
            entregasDesdeAbastecimento:Number(atual.entregasDesdeAbastecimento || 0)+1,caixa:Number(atual.caixa || 0)+preco,
            ganhosHoje:Number(atual.ganhosHoje || 0)+preco,atualizadoEm:Date.now()};
    });
    if (!venda.committed) { avisoLogistica('A moto está sem lanches ou precisa abastecer.'); return; }
    await update(ref(db, 'ludigins_usuarios/' + id), {saldo:Number(perfil.saldo || 0)-preco,ultimaRefeicaoCorrida:Number(perfil.pedidoLanchePendente.corrida || 0),pedidoLanchePendente:null,atualizadoEm:Date.now()});
}
document.addEventListener('click', evento => {
    if (evento.target?.closest?.('[data-logistica-acao="pedir-lanche"]')) pedirLanche().catch(() => avisoLogistica('Não foi possível concluir o pedido.'));
});
async function garantirBaseLogistica() {
    await runTransaction(ref(db, 'ludigins_jogo/logistica'), atual => atual || {posto:{fatias:10,usosNaUltimaFatia:0},carretaMapa:{fase:'disponivel'},criadoEm:Date.now()});
    await runTransaction(ref(db, 'ludigins_jogo/negocios/carreta_combustivel'), atual => atual || {
        donoId:'proprietario_luigy',donoNome:'Luigy',nome:'Carreta de combustível',caixa:0,ganhosHoje:0,entregasHoje:0,criadoEm:Date.now()
    });
    await runTransaction(ref(db, 'ludigins_jogo/negocios/entregador_lanche'), atual => atual ? {
        ...atual,caixa:Number(atual.caixa || 0),estoqueLanches:atual.estoqueLanches === undefined ? 20 : Number(atual.estoqueLanches),
        combustivel:atual.combustivel === undefined ? 100 : Number(atual.combustivel),entregasDesdeAbastecimento:Number(atual.entregasDesdeAbastecimento || 0),
        precoLanche:[2,4,6,8,10,12].includes(Number(atual.precoLanche)) ? Number(atual.precoLanche) : 6
    } : atual);
}
onValue(ref(db, 'ludigins_jogo/logistica'), snapshot => { logistica = snapshot.val() || {}; renderizarLogistica(); });
setTimeout(() => garantirBaseLogistica().catch(() => {}), 1200);


// Mantém os controles e os pedidos sincronizados depois dos redesenhos do jogo.
setInterval(() => {
    atualizarPedidoDeLanche();
    renderizarPedidoLanche();
    renderizarLogistica();
}, 750);


// Mantém o histórico do posto para a devolução automática ao antigo proprietário.
async function guardarHistoricoDoPosto() {
    await runTransaction(ref(db, 'ludigins_jogo/negocios/posto_combustivel'), atual => {
        if (!atual?.donoId || atual.donoRegistrado === atual.donoId) return atual;
        return {
            ...atual,
            donoAnteriorId: atual.donoRegistrado || 'proprietario_luigy',
            donoAnteriorNome: atual.donoRegistrado ? (atual.donoRegistradoNome || 'Luigy') : 'Luigy',
            donoRegistrado: atual.donoId,
            donoRegistradoNome: atual.donoNome || 'Luigy',
            atualizadoEm: Date.now()
        };
    });
}
async function devolverPostoPorFaltaDeCaixa() {
    const posto = negocios.posto_combustivel || {};
    if (!posto.donoId || Number(posto.caixa || 0) >= CUSTO_CARGA_CARRETA) return;
    const antigoId = posto.donoAnteriorId || 'proprietario_luigy';
    const antigoNome = posto.donoAnteriorNome || 'Luigy';
    await update(ref(db, 'ludigins_jogo/negocios/posto_combustivel'), {
        donoId: antigoId, donoNome: antigoNome, devolvidoPorFaltaDeCaixaEm: Date.now(), atualizadoEm: Date.now()
    });
    avisoLogistica('O posto ficou sem caixa para repor combustível e voltou ao proprietário anterior.');
}
function adicionarOfertaCarreta() {
    const loja = document.getElementById('lojaNegocios');
    if (!loja || loja.querySelector('[data-negocio-logistica="carreta_combustivel"]')) return;
    const carreta = negocios.carreta_combustivel || {};
    if (souDonoDoNegocio(carreta)) return;
    const item = document.createElement('div');
    item.className = 'negocio-item';
    item.dataset.negocioLogistica = 'carreta_combustivel';
    item.innerHTML = '<strong>🚛 Carreta de combustível</strong><em>Entrega a carga que repõe o estoque dos postos.</em><button class="btn-comprar-negocio btn-proposta-logistica" type="button">Fazer proposta</button>';
    loja.appendChild(item);
}
document.addEventListener('click', evento => {
    const botao = evento.target?.closest?.('.btn-proposta-logistica');
    if (!botao) return;
    const ponte = document.querySelector('.btn-proposta[data-negocio="posto_combustivel"]');
    if (!ponte) return;
    const negocioAntigo = ponte.dataset.negocio;
    const nomeAntigo = ponte.dataset.nome;
    ponte.dataset.negocio = 'carreta_combustivel';
    ponte.dataset.nome = 'Carreta de combustível';
    ponte.click();
    ponte.dataset.negocio = negocioAntigo;
    ponte.dataset.nome = nomeAntigo;
});
setInterval(() => {
    guardarHistoricoDoPosto().catch(() => {});
    adicionarOfertaCarreta();
}, 1400);
