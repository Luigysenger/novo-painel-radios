// Integração da Cidade Ludigins com patrimônio real, casas e evolução residencial.
import {perfilServicos,servicoEmCurso,fome} from './cidade-servicos.js?v=20261121b';
import { db } from '../firebase-config.js';
import { ref, get, onValue, runTransaction } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
let registroAtual=null,lotesAtuais={};
const LOTES_OFICIAIS={'LUD-RES-001':{id:'LUD-RES-001',endereco:'Rua das Flores, 1',tipo:'Residencial',preco:1200,cidade:'ludigins'},'LUD-RES-002':{id:'LUD-RES-002',endereco:'Rua das Flores, 3',tipo:'Residencial',preco:1300,cidade:'ludigins'},'LUD-RES-003':{id:'LUD-RES-003',endereco:'Rua Lago Sul, 18',tipo:'Residencial',preco:1400,cidade:'ludigins'},'LUD-RES-004':{id:'LUD-RES-004',endereco:'Rua das Palmeiras, 2',tipo:'Residencial',preco:1500,cidade:'ludigins'},'LUD-RES-005':{id:'LUD-RES-005',endereco:'Rua das Palmeiras, 6',tipo:'Residencial',preco:1600,cidade:'ludigins'},'LUD-RES-006':{id:'LUD-RES-006',endereco:'Rua do Lago, 4',tipo:'Residencial',preco:1700,cidade:'ludigins'},'LUD-RES-007':{id:'LUD-RES-007',endereco:'Avenida Residencial, 11',tipo:'Residencial',preco:1800,cidade:'ludigins'},'LUD-RES-008':{id:'LUD-RES-008',endereco:'Avenida Residencial, 15',tipo:'Residencial',preco:1900,cidade:'ludigins'},'LUD-COM-001':{id:'LUD-COM-001',endereco:'Rua do Comércio, 14',tipo:'Comercial',preco:2200,cidade:'ludigins'},'LUD-COM-002':{id:'LUD-COM-002',endereco:'Rua do Comércio, 27',tipo:'Comercial',preco:2500,cidade:'ludigins'}};
const CASAS=[{id:'casa_01_popular',nivel:1,nome:'Casa Popular',preco:800,arquivo:'assets/cidade-ludigins/casas/casa_01_popular.png'},{id:'casa_02_familiar',nivel:2,nome:'Casa Familiar',preco:1200,arquivo:'assets/cidade-ludigins/casas/casa_02_familiar.png'},{id:'casa_03_moderna',nivel:3,nome:'Casa Moderna',preco:1800,arquivo:'assets/cidade-ludigins/casas/casa_03_moderna.png'},{id:'casa_04_sobrado',nivel:4,nome:'Sobrado',preco:2400,arquivo:'assets/cidade-ludigins/casas/casa_04_sobrado.png'},{id:'casa_05_premium',nivel:5,nome:'Casa Premium',preco:3200,arquivo:'assets/cidade-ludigins/casas/casa_05_premium.png'},{id:'casa_06_piscina',nivel:6,nome:'Casa com Piscina',preco:4200,arquivo:'assets/cidade-ludigins/casas/casa_06_piscina.png'},{id:'casa_07_mansao',nivel:7,nome:'Mansão',preco:6000,arquivo:'assets/cidade-ludigins/casas/casa_07_mansao.png'},{id:'casa_08_mansao_premium',nivel:8,nome:'Mansão Premium',preco:8500,arquivo:'assets/cidade-ludigins/casas/casa_08_mansao_premium.png'}];
async function localizarPerfil(){
 const nome=(localStorage.getItem('usuarioLogado')||'').trim(),id=localStorage.getItem('usuarioKey')||localStorage.getItem('userId');
 if(!nome||nome.toLowerCase()==='ouvinte_anonimo'||!id)return null;
 const raiz='ludigins_usuarios',snap=await get(ref(db,raiz+'/'+id));
 return snap.exists()?{id,raiz,perfil:snap.val()}:null;
}
function totalPerfil(p){return numero(p.corridasTotal??p.corridasTotais??p.totalCorridas??p.corridas??p.corridasHoje)}

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

function diaSP(){return dataCorridaSP()}
function semana(d){const dt=new Date(d+'T12:00:00Z');dt.setUTCDate(dt.getUTCDate()-(dt.getUTCDay()+6)%7);return dt.toISOString().slice(0,10)}
function bloqueio(p){
 if(!p)return 'Entre pelo painel para fazer corridas.';
 if(servicoEmCurso()||p.servicoCidade)return 'Aguarde a conclusão do atendimento.';
 if(fome(p)>=7)return 'Peça seu lanche abaixo do mapa.';
 if(p.corridaAtual)return 'Finalize primeiro a corrida do mapa antigo.';
 if(numero(p.bonusAposMetaAte)>Date.now())return 'Aguarde o fim do descanso.';
 if(numero(p.aquecimentoCorridas)>=11)return 'Chame o bombeiro abaixo do mapa.';
 if(numero(p.combustivel??100)<=20)return 'Toque em Abastecer abaixo do mapa.';
 return '';
}
window.checarCorridaCidade=()=>bloqueio(registroAtual?.perfil);
window.finalizarCorridaCidade=async function(id,valor){
 const r=registroAtual;if(!r)throw Error('Perfil indisponível.');
 const dia=diaSP(),sem=semana(dia),agora=Date.now();
 const tx=await runTransaction(ref(db,r.raiz+'/'+r.id),p=>{
  if(!p||p.recibosCidade?.[id]||bloqueio(p))return;
  const contagem=contagensCorridas(p,dia,sem),hoje=contagem.hoje+1,bonus=hoje===100?50:0;
  return {...p,corridasTotal:totalPerfil(p)+1,corridasHoje:hoje,...(p.dataCorridas!==dia?{ultimaRefeicaoCorrida:0,dataUltimaRefeicao:dia}:{}),dataCorridas:dia,corridasPorDia:{...contagem.dias,[dia]:hoje},corridasSemana:contagem.semana+1,semanaCorridas:sem,saldo:saldoDoPerfil(p)+valor+bonus,ganhosHoje:(p.dataCorridas===dia?numero(p.ganhosHoje):0)+valor+bonus,bonusAposMetaAte:bonus?agora+300000:numero(p.bonusAposMetaAte),combustivel:Math.max(0,numero(p.combustivel??100)-15),aquecimentoCorridas:numero(p.aquecimentoCorridas)+1,recibosCidade:{...p.recibosCidade,[id]:agora},atualizadoEm:agora};
 },{applyLocally:false});
 if(!tx.committed&&!tx.snapshot.val()?.recibosCidade?.[id])throw Error(bloqueio(tx.snapshot.val())||'Corrida não registrada.');
};
function numero(v){const n=Number(v);return Number.isFinite(n)?n:0}function texto(v,p='—'){return v===undefined||v===null||v===''?p:String(v)}function saldoDoPerfil(p){return numero(p?.saldo??p?.ludigins??p?.moedas)}function campoSaldo(p){if(Object.prototype.hasOwnProperty.call(p||{},'saldo'))return'saldo';if(Object.prototype.hasOwnProperty.call(p||{},'ludigins'))return'ludigins';if(Object.prototype.hasOwnProperty.call(p||{},'moedas'))return'moedas';return'saldo'}
function atualizarTela(r){registroAtual=r;atualizarNegocios();perfilServicos(r);const s=document.getElementById('perfilRealStatus');if(!r){if(s)s.textContent='Entre pelo painel normal do ouvinte para usar a Prefeitura.';return}const p=r.perfil,c={perfilRealStatus:'✅ Cidadão reconhecido. Prefeitura conectada ao seu patrimônio real.',cidadaoNome:texto(p.nome??p.displayName??p.apelido,'Ouvinte'),cidadaoSaldo:saldoDoPerfil(p).toLocaleString('pt-BR')+' Ludigins',cidadaoCorridasHoje:contagensCorridas(p,diaSP(),semana(diaSP())).hoje.toLocaleString('pt-BR'),cidadaoCorridasTotal:totalPerfil(p).toLocaleString('pt-BR'),cidadaoCarro:texto(p.carroAtual??p.corCarro??p.patente,'carro atual preservado')};for(const[id,v]of Object.entries(c)){const e=document.getElementById(id);if(e)e.textContent=v}}
function dono(n){return texto(n?.donoNome??n?.proprietarioNome??n?.dono,'Sem proprietário')}function caixa(n){return numero(n?.caixa).toLocaleString('pt-BR')+' Ludigins'}const tiposNegocio=[['posto_combustivel','⛽','Posto'],['carreta_combustivel','🚛','Carreta de combustível'],['entregador_lanche','🍔','Entrega de lanches'],['caminhao_bombeiro','🚒','Caminhão do bombeiro']];
let negociosCidade={},consulta=null;
function proprietario(n){if(!registroAtual||!n?.donoId)return false;
 return n.donoId===registroAtual.id || (n.donoId==='proprietario_luigy' && [registroAtual.perfil?.email,localStorage.getItem('usuarioEmail'),localStorage.getItem('email')].some(v=>String(v||'').trim().toLowerCase()==='luigyestilofm@hotmail.com'))}
function consultarNegocio(id,nome){
 consulta?.fechar();const dialog=document.createElement('dialog');
 dialog.style.cssText='width:min(420px,92vw);max-height:80vh;margin:auto;padding:20px;border:1px solid #475569;border-radius:16px;background:#101b2d;color:white;overflow:auto';
 const titulo=document.createElement('h2'),lista=document.createElement('div'),fechar=document.createElement('button');titulo.textContent=nome+' • Propostas recebidas';lista.setAttribute('role','status');lista.style.margin='16px 0';lista.textContent='Consultando propostas…';fechar.textContent='Fechar';fechar.className='btn';dialog.append(titulo,lista,fechar);document.body.append(dialog);
 let parar=()=>{};const fim=()=>dialog.close();consulta={id,fechar:fim};fechar.onclick=fim;dialog.onclose=()=>{parar();dialog.remove();if(consulta?.fechar===fim)consulta=null};dialog.showModal();
 parar=onValue(ref(db,'ludigins_jogo/propostas_negocios'),snap=>{
 const ofertas=Object.values(snap.val()||{}).filter(p=>p?.negocio===id&&p.status==='pendente').sort((a,b)=>numero(b.criadaEm)-numero(a.criadaEm));
 lista.replaceChildren();if(!ofertas.length)lista.textContent='Nenhuma proposta pendente para este negócio.';
 for(const p of ofertas){const linha=document.createElement('p');linha.textContent=(p.compradorNome||'Jogador')+' ofereceu '+numero(p.valor).toLocaleString('pt-BR')+' Ludigins.';lista.append(linha)}
 },()=>lista.textContent='Não foi possível consultar as propostas agora.');
}
function atualizarNegocios(n=negociosCidade){negociosCidade=n;const a=document.getElementById('negociosAtuais');if(!a)return;
 const fragment=document.createDocumentFragment();for(const [id,ic,nome] of tiposNegocio){const item=n[id]||(id==='caminhao_bombeiro'?n.bombeiro:null),meu=proprietario(item);
 if(consulta?.id===id&&!meu)consulta.fechar();
 const card=document.createElement(meu?'button':'div');card.className='card'+(item?' real':'');card.style.cssText='text-align:left;color:inherit;font:inherit';const b=document.createElement('b'),d=document.createElement('span');b.textContent=ic+' '+nome;d.textContent=item?'Proprietário: '+dono(item):'Ainda não cadastrado';card.append(b,d);
 if(item){const c=document.createElement('small');c.style.cssText='display:block;margin-top:5px;color:#94a3b8';c.textContent='Caixa: '+caixa(item);card.append(c)}
 if(meu){card.type='button';card.style.cursor='pointer';const link=document.createElement('small');link.style.cssText='display:block;margin-top:8px;color:#a7f3d0';link.textContent='Ver propostas';card.append(link);card.onclick=()=>consultarNegocio(id,nome)}fragment.append(card)}a.replaceChildren(fragment)}

function loteCard(l){const casa=l.casa,res=String(l.tipo).toLowerCase()==='residencial';return`<div class="card real"><b>${casa?'🏠':'📍'} ${texto(l.id)}</b><span>${texto(l.endereco)}</span><small style="display:block;margin-top:5px;color:#94a3b8">${casa?texto(casa.nome)+' • nível '+numero(casa.nivel)+' • patrimônio permanente':'Terreno '+texto(l.tipo)+' • '+numero(l.preco).toLocaleString('pt-BR')+' Ludigins'}</small>${res?`<button class="btn" style="margin-top:8px" onclick="abrirCatalogoCasasCidadeLudigins('${l.id}')">${casa?'Melhorar / Trocar casa':'Escolher casa'}</button>`:''}${casa&&Array.isArray(l.historicoCasas)&&l.historicoCasas.length?`<small style="display:block;margin-top:7px;color:#cbd5e1">Histórico: ${l.historicoCasas.length} residência(s) anterior(es)</small>`:''}</div>`}
function atualizarLotes(lotes={}){
 lotesAtuais=lotes||{};
 const a=document.getElementById('meusTerrenosLista'),meus=registroAtual?Object.values(lotesAtuais).filter(l=>String(l?.donoId||'')===String(registroAtual.id)):[];
 if(a)a.innerHTML=meus.length?meus.map(loteCard).join(''):'<div class="card"><b>📍 Meu patrimônio</b><span>Nenhum terreno comprado nesta cidade.</span></div>';
 document.querySelectorAll('[data-lote]').forEach(el=>{
  const [id]=el.dataset.lote.split('|'),l=lotesAtuais[id],vendido=!!l?.donoId;
  const meu=vendido&&registroAtual&&String(l.donoId)===String(registroAtual.id);
  const modelo=vendido&&l.casa?CASAS.find(c=>c.id===l.casa.modeloId):null;
  let imagem=el.querySelector('.casa-construida');
  if(modelo){
   if(!imagem){imagem=document.createElement('img');imagem.className='casa-construida';imagem.draggable=false;imagem.style.cssText='position:absolute;inset:0;width:100%;height:100%;max-width:none;max-height:none;object-fit:fill;pointer-events:none;user-select:none';el.appendChild(imagem)}
   // Crescimento visual por nível, sempre dentro do lote e centralizado.
   const tamanho=[80,83,86,89,92,95,98,100][Math.max(0,Math.min(7,Number(modelo.nivel)-1))];
   imagem.style.width=tamanho+'%';
   imagem.style.height=tamanho+'%';
   imagem.style.inset=((100-tamanho)/2)+'%';
   if(imagem.getAttribute('src')!==modelo.arquivo)imagem.setAttribute('src',modelo.arquivo);
   imagem.alt=modelo.nome;
  }else imagem?.remove();
  const et=el.querySelector('.etiqueta');
  if(vendido){
   el.dataset.vendido='1';
   el.setAttribute('aria-label',(l.casa?texto(l.casa.nome,'Casa')+' de ':'Terreno de ')+texto(l.donoNome,'proprietário'));
   el.style.setProperty('border','2px dashed '+(meu?'#22c55e':'#fde047'),'important');
   el.style.setProperty('background',l.casa?'transparent':(meu?'#16653444':'#fde04716'),'important');
   if(et)et.textContent=l.casa?'CASA • '+texto(l.donoNome,'MORADOR'):'✓ '+texto(l.donoNome,'VENDIDO');
  }else{
   delete el.dataset.vendido;el.style.removeProperty('border');el.style.removeProperty('background');
   if(et)et.textContent=String((LOTES_OFICIAIS[id]||{}).tipo||'').toLowerCase()==='comercial'?'COMERCIAL':'TERRENO';
  }
 });
}
async function debitar(preco){const pr=ref(db,registroAtual.raiz+'/'+registroAtual.id),campo=campoSaldo(registroAtual.perfil);const r=await runTransaction(pr,a=>{if(!a||saldoDoPerfil(a)<preco)return;return{...a,[campo]:saldoDoPerfil(a)-preco,atualizadoEm:Date.now()}});if(r.committed){registroAtual.perfil=r.snapshot.val()||registroAtual.perfil;atualizarTela(registroAtual)}return r.committed}// Use the exact catalog displayed by the 37 map buttons, including their prices.
for(const el of document.querySelectorAll('.hotspot.lote')){
 const [id,endereco,tipo,preco]=el.dataset.lote.split('|');
 const base=LOTES_OFICIAIS[id]||{id,endereco,tipo,preco:Number(preco),cidade:'ludigins'}; LOTES_OFICIAIS[id]=base; el.dataset.lote=[id,base.endereco,base.tipo,base.preco].join('|');el.setAttribute('aria-label',base.endereco+' • '+base.preco+' Ludigins');
}
async function comprarLote(dados){
 const r=registroAtual,base=LOTES_OFICIAIS[dados.split('|')[0]];
 if(!base||!r)throw Error('Aguarde a identificação do cidadão no painel.');
 const lr=ref(db,'ludigins_cidade/lotes/'+base.id),pr=ref(db,r.raiz+'/'+r.id);
 const tentativa=crypto.randomUUID(),agora=Date.now();
 // Reserve without transferring ownership. The same buyer can resume after interruption.
 const reserva=await runTransaction(lr,l=>{
  if(l?.donoId||(l?.reserva&&l.reserva.id!==r.id))return;
  return l?.reserva?l:{...base,reserva:{id:r.id,chave:tentativa},status:'reservado'};
 },{applyLocally:false});
 if(!reserva.committed)throw Error('Este terreno já foi comprado ou está reservado.');
 const token=reserva.snapshot.val().reserva.chave;
 const pagamento=await runTransaction(pr,p=>{
  if(!p||p.comprasCidade?.[token])return;
  const pago=saldoDoPerfil(p)>=base.preco;
  return {...p,[campoSaldo(p)]:saldoDoPerfil(p)-(pago?base.preco:0),comprasCidade:{...p.comprasCidade,[token]:pago?'pago':'recusado'}};
 },{applyLocally:false});
 const resultado=pagamento.snapshot.val()?.comprasCidade?.[token];
 if(resultado==='recusado'){
  await runTransaction(lr,l=>l?.reserva?.chave===token?null:undefined,{applyLocally:false});
  throw Error('Saldo insuficiente para comprar este terreno.');
 }
 if(resultado!=='pago')throw Error('Não foi possível confirmar o pagamento. Tente novamente neste lote.');
 const fim=await runTransaction(lr,l=>l?.reserva?.chave===token?{...base,donoId:r.id,donoNome:texto(r.perfil.nome??r.perfil.displayName,'Ouvinte'),compradoEm:agora,status:'propriedade_ativa'}:undefined,{applyLocally:false});
 if(!fim.committed&&fim.snapshot.val()?.donoId!==r.id)throw Error('Pagamento registrado. Toque novamente neste lote para concluir sem novo débito.');
}
function garantirCatalogo(){let m=document.getElementById('modalCatalogoCasas');if(m)return m;m=document.createElement('div');m.id='modalCatalogoCasas';m.className='modal';m.innerHTML='<div class="box" style="width:min(760px,96vw)"><button class="fechar" id="fecharCatalogoCasas">✕</button><h2>Construtora de Ludigins</h2><p class="servico-info" id="catalogoCasasTexto"></p><div id="catalogoCasasGrid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:10px"></div></div>';document.body.appendChild(m);m.querySelector('#fecharCatalogoCasas').onclick=()=>m.classList.remove('ativo');m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('ativo')});return m}
function abrirCatalogo(id){const lote=lotesAtuais[id];if(!registroAtual||!lote||String(lote.donoId)!==String(registroAtual.id))return alert('Este terreno precisa estar registrado em seu nome.');const atual=lote.casa,m=garantirCatalogo(),g=m.querySelector('#catalogoCasasGrid'),t=m.querySelector('#catalogoCasasTexto');t.textContent=atual?'Sua casa atual é '+texto(atual.nome)+'. Você pode evoluir diretamente para qualquer modelo superior que conseguir comprar. O modelo anterior ficará no histórico.':'Escolha qualquer um dos 8 modelos. Os modelos não têm estoque: vários cidadãos podem construir a mesma casa.';g.innerHTML=CASAS.map(c=>{const mesma=atual?.modeloId===c.id,inferior=atual&&numero(c.nivel)<=numero(atual.nivel);return`<div class="card" style="text-align:center;opacity:${inferior&&!mesma?'.55':'1'}"><div style="height:82px;display:flex;align-items:center;justify-content:center;background:#091221;border-radius:10px;overflow:hidden"><img src="${c.arquivo}" alt="${c.nome}" style="max-width:100%;max-height:100%;object-fit:contain" onerror="this.style.display='none';this.parentElement.innerHTML='<small style=&quot;color:#94a3b8&quot;>Imagem do modelo aguardando arquivo PNG</small>'"></div><b style="margin-top:8px">Nível ${c.nivel} • ${c.nome}</b><span>${c.preco.toLocaleString('pt-BR')} Ludigins</span><button class="btn" style="margin-top:8px;width:100%" ${mesma||inferior?'disabled':''} onclick="construirCasaCidadeLudigins('${id}','${c.id}')">${mesma?'Casa atual':inferior?'Modelo anterior':atual?'Melhorar para esta':'Construir'}</button></div>`}).join('');m.classList.add('ativo')}
async function construirCasa(id,modeloId){const modelo=CASAS.find(c=>c.id===modeloId);if(!modelo)return alert('Modelo de casa inválido.');if(!registroAtual)return alert('Entre pelo painel normal do ouvinte.');const lote=lotesAtuais[id];if(!lote||String(lote.donoId)!==String(registroAtual.id))return alert('Este terreno não pertence a você.');if(String(lote.tipo).toLowerCase()!=='residencial')return alert('Residências só podem ser construídas em terrenos residenciais.');const anterior=lote.casa||null;if(anterior&&numero(modelo.nivel)<=numero(anterior.nivel))return alert('Para melhorar sua residência, escolha um modelo superior ao atual.');if(saldoDoPerfil(registroAtual.perfil)<modelo.preco)return alert('Saldo insuficiente para '+(anterior?'melhorar para ':'construir ')+modelo.nome+'.');const lr=ref(db,'ludigins_cidade/lotes/'+id),agora=Date.now(),obra=await runTransaction(lr,a=>{if(!a||String(a.donoId)!==String(registroAtual.id))return;const atual=a.casa||null;if(atual&&numero(modelo.nivel)<=numero(atual.nivel))return;const hist=Array.isArray(a.historicoCasas)?[...a.historicoCasas]:[];if(atual)hist.push({...atual,substituidaEm:agora});return{...a,historicoCasas:hist,casa:{modeloId:modelo.id,nivel:modelo.nivel,nome:modelo.nome,arquivo:modelo.arquivo,valorConstrucao:modelo.preco,construidaEm:agora,garagemLivre:true},residencia:true,status:'residencia_ativa',ultimaMelhoriaEm:agora}});if(!obra.committed)return alert('Não foi possível alterar a residência. Atualize e tente novamente.');if(!await debitar(modelo.preco)){await runTransaction(lr,a=>{if(!a||String(a.donoId)!==String(registroAtual.id)||a.casa?.modeloId!==modelo.id)return a;const hist=Array.isArray(a.historicoCasas)?[...a.historicoCasas]:[];const restaurar=hist.pop()||null;return{...a,historicoCasas:hist,casa:restaurar,residencia:!!restaurar,status:restaurar?'residencia_ativa':'propriedade_ativa'}});return alert('A construção foi cancelada sem cobrança.')}document.getElementById('modalCatalogoCasas')?.classList.remove('ativo');alert(anterior?'🏠 Residência melhorada!\n\n'+texto(anterior.nome)+' → '+modelo.nome+'\nSua residência anterior foi preservada no histórico.':'🏠 Construção concluída!\n\n'+modelo.nome+' foi registrada em '+texto(lote.endereco)+'.')}
function abrirPrefeitura(){const p=document.getElementById('centralCidadao'),f=document.getElementById('fecharCentral');if(matchMedia('(min-width:651px)').matches){p.classList.add('aberta');f.hidden=false;f.onclick=()=>{p.classList.remove('aberta');f.hidden=true}}else p.scrollIntoView({behavior:'smooth',block:'start'})}window.comprarLoteCidadeLudigins=comprarLote;window.abrirCatalogoCasasCidadeLudigins=abrirCatalogo;window.construirCasaCidadeLudigins=construirCasa;window.abrirPrefeituraCidadeLudigins=abrirPrefeitura;
const prefeituraHotspot=document.getElementById('prefeitura');if(prefeituraHotspot)prefeituraHotspot.addEventListener('click',()=>{const modal=document.getElementById('modalLocal'),titulo=document.getElementById('localTitulo'),badge=document.getElementById('localBadge'),textoEl=document.getElementById('localTexto'),acao=document.getElementById('localAcao');if(titulo)titulo.textContent='🏛️ Prefeitura';if(badge)badge.textContent='Central do Cidadão';if(textoEl)textoEl.textContent='Aqui você consulta seu patrimônio, compra terrenos e administra ou melhora sua residência.';if(acao){acao.textContent='Abrir Central do Cidadão';acao.onclick=()=>{modal?.classList.remove('ativo');abrirPrefeitura()}}modal?.classList.add('ativo')});
localizarPerfil().then(r=>{if(!r)return atualizarTela(null);onValue(ref(db,r.raiz+'/'+r.id),snap=>{if(!snap.exists())return atualizarTela(null);atualizarTela({...r,perfil:snap.val()});atualizarLotes(lotesAtuais);window.CidadeLudiginsTransito?.aplicarModelo({...snap.val(),corridasTotais:totalPerfil(snap.val())})},()=>atualizarTela(null))}).catch(()=>atualizarTela(null));onValue(ref(db,'ludigins_jogo/negocios'),s=>atualizarNegocios(s.exists()?(s.val()||{}):{}));onValue(ref(db,'ludigins_cidade/lotes'),s=>atualizarLotes(s.exists()?(s.val()||{}):{}));

let dataTelaCorridas=diaSP();setInterval(()=>{const hoje=diaSP();if(hoje!==dataTelaCorridas){dataTelaCorridas=hoje;if(registroAtual)atualizarTela(registroAtual)}},1000);
