import { db } from '../firebase-config.js';
import { ref, onValue } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { identidade, manterPresenca, radioEmReproducao } from './cidade-presenca.js?v=20261120a';
const transito=window.CidadeLudiginsTransito;
const camada=document.querySelector('.cidade-transito');
const rankingDia=document.getElementById('cidadeRankingDia'),rankingSemana=document.getElementById('cidadeRankingSemana'),online=document.getElementById('cidadeOuvintes');
const nota=document.getElementById('cidadeComunidadeStatus');
let sessoes={},ouvintes={},perfis={};
const carros=new Map();
const filtros=['none','hue-rotate(82deg) saturate(1.5)','hue-rotate(310deg) saturate(1.8)','hue-rotate(165deg) saturate(1.6)','hue-rotate(135deg)','hue-rotate(220deg)','hue-rotate(335deg)','grayscale(.95)','hue-rotate(270deg)','saturate(1.8) brightness(1.2)'];
const num=v=>Number.isFinite(Number(v))?Number(v):0;
function recentes(dados,agora){
 const porId=new Map();
 for(const s of Object.values(dados)){
  if(!s?.id||!s.nome||!num(s.atualizadoEm)||agora-num(s.atualizadoEm)>45000)continue;
  if(!porId.has(s.id)||num(s.atualizadoEm)>num(porId.get(s.id).atualizadoEm))porId.set(s.id,s);
 }
 return porId;
}
function posicao(e,agora){
 const valido=p=>Array.isArray(p)&&p.length===2&&p.every(v=>Number.isFinite(v)&&v>=0&&v<=100);
 if(!e||!valido(e.de)||!valido(e.para))return null;
 const t=e.duracao>0?Math.max(0,Math.min(1,(agora-num(e.inicioEm))/e.duracao)):1;
 return e.de.map((v,i)=>v+(e.para[i]-v)*t);
}
const presenca=manterPresenca('ludigins_cidade/sessoes',offset=>{
 const e=transito?.estadoPublico;
 return {radio:radioEmReproducao(),local:'cidade',taxi:e?{...e,inicioEm:e.inicioEm+offset}:null};
});
window.addEventListener('cidade-taxi-movimento',()=>presenca.publicar(true));
window.addEventListener('cidade-presenca-erro',()=>{if(nota)nota.textContent='Conexão interrompida. Reconectando os jogadores…'});
function desenharCarros(){
 if(!camada)return;
 const lista=recentes(sessoes,presenca.agora()),meu=identidade()?.id,vistos=new Set();
 for(const [id,s] of lista){
  if(id===meu||!posicao(s.taxi,presenca.agora()))continue;
  vistos.add(id);
  let el=carros.get(id);
  if(!el){
   el=document.createElement('div');el.className='cidade-veiculo cidade-outro-jogador';
   const desenho=document.createElement('span'),nome=document.createElement('b');
   desenho.textContent='🚕';nome.className='cidade-nome-jogador';el.append(desenho,nome);camada.append(el);carros.set(id,el);
  }
  el.querySelector('b').textContent=s.nome;
  el.title=s.nome+(s.radio?' • '+s.radio:'');
  const nivel=Math.max(1,Math.min(10,Math.floor(num(s.taxi.nivel)||1)));
  el.querySelector('span').style.setProperty('--taxi-filtro',filtros[nivel-1]);
  // Orientações produzidas pelo trânsito, sem aceitar CSS livre do banco.
  const o=String(s.taxi.orientacao||'none');
  el.querySelector('span').style.transform=/^rotate\((-?90|0)deg\) scaleX\((-?1)\)$/.test(o)?o:'none';
  el.estado=s.taxi;
 }
 for(const [id,el] of carros)if(!vistos.has(id)){el.remove();carros.delete(id)}
}
function animar(){
 const agora=presenca.agora();
 for(const el of carros.values()){const p=posicao(el.estado,agora);if(p){el.style.left=p[0]+'%';el.style.top=p[1]+'%'}}
 requestAnimationFrame(animar);
}
function dataSP(){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(presenca.agora()))}
function chaveSemana(dia){const d=new Date(dia+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,10)}
function rankings(){
 const dia=dataSP(),semana=chaveSemana(dia);
 for(const [alvo,campo,data,chave] of [[rankingDia,'corridasHoje','dataCorridas',dia],[rankingSemana,'corridasSemana','semanaCorridas',semana]]){
  if(!alvo)continue;
  const lista=Object.entries(perfis).filter(([,p])=>p&&p[data]===chave&&num(p[campo])>0).sort((a,b)=>num(b[1][campo])-num(a[1][campo])||String(a[1].nome||'').localeCompare(String(b[1].nome||''),'pt-BR')).slice(0,5);
  alvo.replaceChildren();
  if(!lista.length){const li=document.createElement('li');li.textContent='Aguardando as primeiras corridas.';alvo.append(li)}
  lista.forEach(([id,p],i)=>{const li=document.createElement('li'),pos=document.createElement('b'),nome=document.createElement('span'),total=document.createElement('strong');li.className='cidade-ranking-linha';if(id===identidade()?.id)li.classList.add('cidade-eu');pos.textContent=(i+1)+'º';nome.textContent=p.nome||p.displayName||p.apelido||'Ouvinte';total.textContent=num(p[campo]).toLocaleString('pt-BR')+' corridas';li.append(pos,nome,total);alvo.append(li)});
 }
}
function listaOnline(){
 if(!online)return;
 const lista=recentes({...ouvintes,...sessoes},presenca.agora());
 const foco=online.contains(document.activeElement)?document.activeElement?.dataset?.ouvinteId:null;
 online.replaceChildren();
 const contador=document.getElementById('cidadeOnlineTotal');if(contador)contador.textContent=String(lista.size);
 for(const s of [...lista.values()].sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'))){
  const linha=document.createElement('li'),nome=document.createElement('b'),radio=document.createElement('span');
  linha.className='cidade-ouvinte-linha';nome.textContent=s.nome;nome.title=s.nome;radio.className='cidade-ouvinte-radio';radio.textContent=s.radio||'Sem rádio em reprodução';
  if(s.radio){
   const botao=document.createElement('button'),ponto=document.createElement('i'),titulo=document.createElement('span');
   botao.type='button';botao.className='cidade-radio-ouvir';botao.dataset.radio=s.radio;
   botao.title='Ouvir '+s.radio;botao.dataset.ouvinteId=s.id;botao.setAttribute('aria-label','Ouvir '+s.radio);
   ponto.className='cidade-radio-ponto';ponto.setAttribute('aria-hidden','true');
   titulo.textContent=s.radio;botao.append(ponto,titulo);radio.replaceChildren(botao);
  }
  linha.append(nome,radio);online.append(linha);
 }
 if(foco)for(const b of online.querySelectorAll('button[data-ouvinte-id]'))if(b.dataset.ouvinteId===foco){b.focus({preventScroll:true});break}
 if(!lista.size){const li=document.createElement('li');li.textContent='Nenhum ouvinte online no momento.';online.append(li)}
}

function ouvirRadioDaCidade(nome){
 const aviso=document.getElementById('cidadeRadioAviso');
 try{
  const painel=window.parent;
  if(typeof painel?.tocarRadioDoLudigins!=='function'){
   if(aviso)aviso.textContent='Abra a cidade pelo painel de rádios para ouvir esta estação.';
   return;
  }
  const encontrada=painel.tocarRadioDoLudigins(nome);
  if(aviso)aviso.textContent=encontrada?'Rádio selecionada: '+nome+'. Confira a reprodução no player.':'Esta rádio não está disponível no painel agora.';
 }catch{
  if(aviso)aviso.textContent='Não foi possível selecionar a rádio. Tente pelo player do painel.';
 }
}
online?.addEventListener('click',evento=>{
 const botao=evento.target.closest?.('button.cidade-radio-ouvir');
 if(botao&&online.contains(botao))ouvirRadioDaCidade(botao.dataset.radio);
});

function ouvir(caminho,receber,erro){
 onValue(ref(db,caminho),s=>{receber(s.val()||{})},()=>{if(nota)nota.textContent=erro});
}
ouvir('ludigins_cidade/sessoes',s=>{sessoes=s;desenharCarros();listaOnline();if(nota)nota.textContent='Atualização em tempo real';},'Não foi possível carregar os jogadores da cidade.');
ouvir('ludigins_publico/ouvintes',s=>{ouvintes=s;listaOnline()},'Não foi possível carregar os ouvintes online.');
ouvir('ludigins_usuarios',s=>{perfis=s;rankings()},'Não foi possível carregar a classificação.');
setInterval(()=>{desenharCarros();listaOnline();rankings()},5000);
animar();
