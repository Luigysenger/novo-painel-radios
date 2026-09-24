// Integração somente-leitura da nova Cidade Ludigins com o progresso atual.
// NÃO grava, NÃO desconta saldo e NÃO altera proprietários.
import { db } from '../firebase-config.js';
import { ref, get, onValue } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';

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
  for (const id of ids) for (const raiz of ['ludigins_usuarios','usuarios']) {
    try { const snap=await get(ref(db,raiz+'/'+id)); if(snap.exists()) return {id,raiz,perfil:snap.val()||{}}; } catch(_){}
  }
  return null;
}
function numero(v){const n=Number(v);return Number.isFinite(n)?n:0}function texto(v,p='—'){return v===undefined||v===null||v===''?p:String(v)}
function atualizarTela(registro){
 const status=document.getElementById('perfilRealStatus');if(!registro){if(status)status.textContent='Entre pelo painel normal do ouvinte para a prévia reconhecer seu progresso real.';return}
 const p=registro.perfil,saldo=numero(p.saldo??p.ludigins??p.moedas),hoje=numero(p.corridasHoje??p.corridas_hoje),total=numero(p.corridasTotais??p.corridas??p.totalCorridas),nome=texto(p.nome??p.displayName??p.apelido,'Ouvinte'),carro=texto(p.carroAtual??p.corCarro??p.patente,'carro atual preservado');
 const campos={perfilRealStatus:'Perfil atual reconhecido em modo seguro (somente leitura).',cidadaoNome:nome,cidadaoSaldo:saldo.toLocaleString('pt-BR')+' Ludigins',cidadaoCorridasHoje:hoje.toLocaleString('pt-BR'),cidadaoCorridasTotal:total.toLocaleString('pt-BR'),cidadaoCarro:carro};for(const[id,valor]of Object.entries(campos)){const el=document.getElementById(id);if(el)el.textContent=valor}
}
function dono(n){return texto(n?.donoNome??n?.proprietarioNome??n?.dono,'Sem proprietário')}
function caixa(n){return numero(n?.caixa).toLocaleString('pt-BR')+' Ludigins'}
function negocioCard(id,icone,nome,n){const existe=n&&typeof n==='object';return `<div class="card ${existe?'real':''}"><b>${icone} ${nome}</b><span>${existe?'Proprietário: '+dono(n):'Ainda não cadastrado'}</span>${existe?`<small style="display:block;margin-top:5px;color:#94a3b8">Caixa: ${caixa(n)}</small>`:''}</div>`}
function atualizarNegocios(negocios={}){
 const area=document.getElementById('negociosAtuais');if(!area)return;
 area.innerHTML=negocioCard('posto','⛽','Posto',negocios.posto_combustivel)+negocioCard('carreta','🚛','Carreta de combustível',negocios.carreta_combustivel)+negocioCard('lanche','🍔','Entrega de lanches',negocios.entregador_lanche)+negocioCard('bombeiro','🚒','Caminhão do bombeiro',negocios.caminhao_bombeiro||negocios.bombeiro);
 const posto=negocios.posto_combustivel;const postoMapa=document.querySelector('[data-negocio-mapa="posto_combustivel"]');if(postoMapa&&posto)postoMapa.innerHTML='⛽<br>POSTO<br><small>'+dono(posto)+'</small>';
 const lanche=negocios.entregador_lanche;const lancheMapa=document.querySelector('[data-negocio-mapa="entregador_lanche"]');if(lancheMapa&&lanche)lancheMapa.innerHTML='🍔<br>LANCHONETE<br><small>'+dono(lanche)+'</small>';
}
localizarPerfil().then(atualizarTela).catch(()=>atualizarTela(null));
onValue(ref(db,'ludigins_jogo/negocios'),snap=>atualizarNegocios(snap.exists()?(snap.val()||{}):{}));
