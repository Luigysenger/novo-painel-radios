
function dataCorridaSP(timestamp=Date.now()){
 const partes=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(timestamp));
 return ['year','month','day'].map(k=>partes.find(p=>p.type===k).value).join('-');
}
function normalizarDataCorrida(d){d=String(d||'');if(/^\d{4}-\d{2}-\d{2}$/.test(d))return d;const m=d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);return m?m[3]+'-'+m[1].padStart(2,'0')+'-'+m[2].padStart(2,'0'):d}
function contagensCorridas(p,dia,sem){
 const dias={...p.corridasPorDia},recibos={};
 for(const t of Object.values(p.recibosCidade||{})){if(!Number.isFinite(Number(t))||Number(t)<=0)continue;const d=dataCorridaSP(Number(t));recibos[d]=(recibos[d]||0)+1}
 for(const [d,n] of Object.entries(recibos))dias[d]=Math.max(Number(dias[d])||0,n);
 const anterior=normalizarDataCorrida(p.dataCorridas);
 if(/^\d{4}-\d{2}-\d{2}$/.test(anterior))dias[anterior]=Math.max(Number(dias[anterior])||0,Number(p.corridasHoje)||0);
 const hoje=Number(dias[dia])||0;
 const totalSemana=Object.entries(dias).reduce((n,[d,v])=>n+(d>=sem&&d<=dia?(Number(v)||0):0),0);
 return {hoje,semana:Math.max(totalSemana,normalizarDataCorrida(p.semanaCorridas)===sem?Number(p.corridasSemana)||0:0),dias};
}
import { db } from '../firebase-config.js';
import { ref, onValue, runTransaction, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
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
 const lista=recentes(ouvintes,presenca.agora()),meu=identidade()?.id,vistos=new Set();for(const [id,s] of recentes(sessoes,presenca.agora()))lista.set(id,s);
 for(const [id,s] of lista){
  if(id===meu||!posicao(s.taxi,presenca.agora()))continue;
  vistos.add(id);
  let el=carros.get(id);
  if(!el){
   el=document.createElement('div');el.className='cidade-veiculo cidade-outro-jogador';
   const desenho=document.createElement('span'),nome=document.createElement('b');
   desenho.textContent='🚕';nome.className='cidade-nome-jogador';el.append(desenho,nome);camada.append(el);carros.set(id,el);el.style.pointerEvents='auto';el.style.cursor='pointer';el.tabIndex=0;el.setAttribute('role','button');el.onclick=()=>menuReacao(id,s.nome);el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();menuReacao(id,s.nome)}};
  }
  el.querySelector('b').textContent=primeiroNome(s.nome);
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
function dataSP(){return dataCorridaSP(presenca.agora())}
function chaveSemana(dia){const d=new Date(dia+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,10)}
function rankings(){
 const dia=dataSP(),semana=chaveSemana(dia);
 for(const [alvo,campo,data,chave] of [[rankingDia,'corridasHoje','dataCorridas',dia],[rankingSemana,'corridasSemana','semanaCorridas',semana]]){
  if(!alvo)continue;
  const lista=Object.entries(perfis).filter(([,p])=>p).map(([id,p])=>{const t=contagensCorridas(p,dia,semana);return [id,{...p,corridasHoje:t.hoje,corridasSemana:t.semana}]}).filter(([,p])=>num(p[campo])>0).sort((a,b)=>num(b[1][campo])-num(a[1][campo])||String(a[1].nome||'').localeCompare(String(b[1].nome||''),'pt-BR')).slice(0,5);
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
  linha.append(nome,radio);
 if(s.id===identidade()?.id){
  const controles=document.createElement('div');controles.className='cidade-radio-controles';
  for(const [acao,icone,label] of [['anterior','⏮','Rádio anterior'],['play','▶','Tocar rádio'],['stop','■','Parar rádio'],['proxima','⏭','Próxima rádio']]){
   const b=document.createElement('button');b.type='button';b.textContent=icone;b.title=label;b.setAttribute('aria-label',label);b.onclick=()=>{try{window.parent.controlarRadioCidade?.(acao)}catch{}};controles.append(b);
  }linha.append(controles);
 }
 online.append(linha);
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
ouvir('ludigins_publico/ouvintes',s=>{ouvintes=s;desenharCarros();listaOnline()},'Não foi possível carregar os ouvintes online.');
ouvir('ludigins_usuarios',s=>{perfis=s;rankings()},'Não foi possível carregar a classificação.');
setInterval(()=>{desenharCarros();listaOnline();rankings()},5000);
animar();

function primeiroNome(nome){return String(nome||'Ouvinte').trim().split(/\s+/)[0]}
const nomeProprio=document.createElement('b');nomeProprio.className='cidade-nome-jogador';
nomeProprio.textContent=primeiroNome(identidade()?.nome);document.getElementById('taxiCidade')?.append(nomeProprio);
const estiloReacoes=document.createElement('style');estiloReacoes.textContent=`
.cidade-reacoes-menu{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;background:#0008}
.cidade-reacoes-box{max-width:90vw;background:#101b2d;color:white;border:1px solid #a78bfa;border-radius:16px;padding:18px;text-align:center}
.cidade-reacoes-box button{min-width:48px;min-height:48px;margin:5px;border-radius:10px;border:1px solid #64748b;background:#25344b;color:#fff;font-size:24px;cursor:pointer}
.cidade-reacao-chuva{position:fixed;inset:0;z-index:10001;pointer-events:none;overflow:hidden}
.cidade-reacao-chuva i{position:absolute;top:-60px;font-style:normal;font-size:32px;animation:cidadeChuva 2.8s linear forwards}
@keyframes cidadeChuva{to{transform:translateY(110vh) rotate(240deg)}}
@media(prefers-reduced-motion:reduce){.cidade-reacao-chuva i{animation:none;top:40%}}
`;document.head.append(estiloReacoes);
function menuReacao(id,nome){
 if(document.querySelector('.cidade-reacoes-menu'))return;
 const meu=identidade()?.id;if(!meu||meu===id)return;
 const fundo=document.createElement('div'),box=document.createElement('div'),titulo=document.createElement('p');
 fundo.className='cidade-reacoes-menu';box.className='cidade-reacoes-box';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','Enviar reação');
 titulo.textContent='Reagir ao táxi de '+primeiroNome(nome);box.append(titulo);
 const fechar=()=>fundo.remove();fundo.onclick=e=>{if(e.target===fundo)fechar()};fundo.onkeydown=e=>{if(e.key==='Escape')fechar()};
 for(const [icone,label] of [['👏','Palmas'],['👍','Positivo'],['🎉','Confetes']]){
  const b=document.createElement('button');b.textContent=icone;b.setAttribute('aria-label',label);box.append(b);
  b.onclick=async()=>{box.querySelectorAll('button').forEach(x=>x.disabled=true);
   try{const result=await runTransaction(ref(db,'ludigins_cidade/reacoes/'+id+'/'+meu),a=>a?undefined:{icone,em:serverTimestamp(),nome:primeiroNome(identidade()?.nome)},{applyLocally:false});
   titulo.textContent=result.committed?'Reação enviada!':'Você já enviou uma reação para este táxi.';
   }catch{titulo.textContent='Não foi possível enviar. Tente novamente.'}
   fecharBotao.disabled=false;
  };
 }
 const fecharBotao=document.createElement('button');fecharBotao.textContent='Fechar';fecharBotao.style.fontSize='14px';fecharBotao.onclick=fechar;box.append(fecharBotao);fundo.append(box);document.body.append(fundo);box.querySelector('button').focus();
}
const inicioReacoes=Date.now(),vistas=new Set();
const meuId=identidade()?.id;
if(meuId&&window.parent===window)onValue(ref(db,'ludigins_cidade/reacoes/'+meuId),snap=>{
 for(const [id,r] of Object.entries(snap.val()||{})){
  if(vistas.has(id)||!['👏','👍','🎉'].includes(r?.icone)||!Number.isFinite(r.em))continue;
  vistas.add(id);if(r.em<inicioReacoes-5000)continue;
  const chuva=document.createElement('div');chuva.className='cidade-reacao-chuva';chuva.setAttribute('aria-label',primeiroNome(r.nome)+' enviou uma reação');chuva.setAttribute('role','status');
  for(let n=0;n<24;n++){const p=document.createElement('i');p.textContent=r.icone;p.style.left=(Math.random()*94)+'%';p.style.animationDelay=(Math.random()*1.2)+'s';chuva.append(p)}
  document.body.append(chuva);setTimeout(()=>chuva.remove(),4500);
 }
});
