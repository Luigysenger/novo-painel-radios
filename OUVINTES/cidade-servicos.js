// Atendimentos da nova cidade. Uma ordem pendente por perfil; recibos permitem
// retomar após recarga sem repetir o débito, o consumo ou a parte do dono.
import {db} from '../firebase-config.js';
import {ref,get,onValue,runTransaction} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
const T=window.CidadeLudiginsTransito, $=id=>document.getElementById(id);
const cfg={posto:['posto_combustivel','A4','⛽'],bombeiro:['caminhao_bombeiro','baseBombeiro','🚒'],lanche:['entregador_lanche','X10','🛵']};
const loja=k=>'ludigins_jogo/negocios/'+cfg[k][0],num=v=>Number(v)||0;
const dia=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function fome(p){const h=p.dataCorridas===dia()?num(p.corridasHoje):0;return p.pedidoLanchePendente?7:Math.min(7,Math.max(0,h-(p.dataUltimaRefeicao&&p.dataUltimaRefeicao!==dia()?0:num(p.ultimaRefeicaoCorrida))))}
function nivel(k,p){return k==='posto'?100-(p.combustivel??100):k==='bombeiro'?Math.round(num(p.aquecimentoCorridas)*100/11):Math.round(fome(p)*100/7)}
const precisa=(k,p)=>k==='posto'?nivel(k,p)>0:nivel(k,p)>=100;
const preco=(k,b)=>k==='posto'?([6,8,10,12,14,16,18,20].includes(+b.precoCombustivel)?+b.precoCombustivel:6):k==='bombeiro'?4:([2,4,6,8,10,12].includes(+b.precoLanche)?+b.precoLanche:6);
let perfil,uid,ocupado=false,offset=0;const lojas={},visuais={},agora=()=>Date.now()+offset;
const nota=t=>{$('servNota').textContent=t},espera=ms=>new Promise(r=>setTimeout(r,Math.max(0,ms)));
function render(){for(const k in cfg){const b=$('svc-'+k),n=perfil?Math.max(0,Math.min(100,nivel(k,perfil))):0;b.style.setProperty('--nivel',n+'%');b.querySelector('small').textContent=perfil?(k==='posto'?100-n:n)+'%':'—';b.disabled=!perfil||ocupado||!!perfil.servicoCidade||!precisa(k,perfil);b.title=lojas[k]?'Atendimento: '+preco(k,lojas[k])+' Ludigins':'Aguardando negócio'}
 if(perfil){for(const [id,n] of [['cpFuel',100-nivel('posto',perfil)],['cpHeat',Math.min(100,nivel('bombeiro',perfil))]]){if($(id))$(id).textContent=n+'%';if($(id+'Bar'))$(id+'Bar').style.width=n+'%'}if($('cpHeatInfo'))$('cpHeatInfo').textContent=Math.max(0,11-num(perfil.aquecimentoCorridas))+' corridas até a temperatura máxima.'}}
const base='baseBombeiro',vaga=[95.4,61.2],curva=[94.4,41.7];
function trajeto(a,b){const pontos=T.rota(a===base?'B5':a,b===base?'B5':b).map(n=>T.pontos[n]);if(a===base)pontos.unshift(vaga,curva);if(b===base)pontos.push(curva,vaga);return pontos.slice(1).map((p,i)=>({a:pontos[i],b:p,ms:Math.max(420,72*Math.hypot(p[0]-pontos[i][0],p[1]-pontos[i][1]))}))}
const dur=segs=>Math.ceil(segs.reduce((n,s)=>n+s.ms,0));
function posicionar(el,p){el.style.left=p[0]+'%';el.style.top=p[1]+'%'}
function mover(el,segs,t){for(const s of segs){if(t<=s.ms){const f=Math.max(0,t/s.ms),dx=s.b[0]-s.a[0],dy=s.b[1]-s.a[1];posicionar(el,[s.a[0]+dx*f,s.a[1]+dy*f]);el.firstChild.style.transform=Math.abs(dx)>=Math.abs(dy)?'scaleX('+(dx>0?-1:1)+')':'rotate('+(dy>0?-90:90)+'deg)';return}t-=s.ms}if(segs.length)posicionar(el,segs.at(-1).b)}
function visualizar(k,j){
 if(k==='posto')return;
 const fogo=k==='bombeiro',t=agora();
 const ativo=j&&T.pontos[j.alvo]&&t<j.fim+(fogo?0:120000);
 const id=ativo?j.id:fogo?'estacionado':null;
 if((visuais[k]?.id??null)===id)return;
 visuais[k]?.cancel();if(id===null)return;
 const el=document.createElement('div');el.className='svc-veiculo';el.innerHTML='<span>'+cfg[k][2]+'</span>';
 const fx=document.createElement('div');fx.className='svc-efeito';fx.hidden=true;fx.textContent=fogo?'💧💧💧':'🍔';
 const layer=document.querySelector('.cidade-transito');layer.append(el,fx);let frame,timer;
 const cancel=()=>{cancelAnimationFrame(frame);clearTimeout(timer);el.remove();fx.remove();delete visuais[k]};visuais[k]={id,cancel};
 function estacionar(){posicionar(el,vaga);el.firstChild.style.transform='rotate(90deg)';el.setAttribute('aria-label','Bombeiro estacionado ao lado da Indústria');visuais[k].id='estacionado'}
 if(!ativo){estacionar();return}
 const a=trajeto(cfg[k][1],j.alvo),v=trajeto(j.alvo,cfg[k][1]);
 function tick(){const t=agora();fx.hidden=true;if(t<j.chegada)mover(el,a,t-j.inicio);else if(t<j.saida){posicionar(el,T.pontos[j.alvo]);posicionar(fx,T.pontos[j.alvo]);fx.hidden=false}else if(t<j.fim)mover(el,v,t-j.saida);else{if(fogo)estacionar();else{posicionar(el,T.pontos[cfg[k][1]]);timer=setTimeout(cancel,Math.max(0,j.fim+120000-t))}return}frame=requestAnimationFrame(tick)}tick()}
visualizar('bombeiro',null);
const tx=async(path,fn)=>{const r=ref(db,path);await get(r);return (await runTransaction(r,fn,{applyLocally:false})).snapshot.val()};
async function processar(p){
 const {tipo:k,id,alvo,valor}=p,pr='ludigins_usuarios/'+uid,biz=loja(k);
 async function cancelar(msg){await tx(pr,a=>a?.servicoCidade?.id===id?{...a,servicoCidade:null,saldo:num(a.saldo)+valor}:undefined);throw Error(msg)}
 // A reservation is authoritative for all clients in this city.
 const b=await tx(biz,a=>{if(!a||a.servicosRecibos?.[id])return;
 const t=agora(),n=cfg[k][1],chegada=t+(k==='posto'?0:dur(trajeto(n,alvo))),saida=chegada+3200,fim=saida+(k==='posto'?0:dur(trajeto(alvo,n)));
 const job={id,alvo,inicio:t,chegada,saida,fim,valor,dono:a.donoId||''};
 if(a.despachoCidade?.fim>t||preco(k,a)!==valor||(k==='lanche'&&(num(a.estoqueLanches)<1||num(a.combustivel)<=0||num(a.entregasDesdeAbastecimento)>=15))||(k==='bombeiro'&&num(a.combustivel)<15))return;
 const resto=num(a.combustivel)-15,auto=k==='bombeiro'&&resto<=20&&a.modoAtendimento==='automatico'&&num(a.caixa)>=12;
 const extra=k==='lanche'?{estoqueLanches:num(a.estoqueLanches)-1,combustivel:Math.max(0,num(a.combustivel)-7),entregasDesdeAbastecimento:num(a.entregasDesdeAbastecimento)+1}:k==='bombeiro'?{combustivel:auto?100:resto,...(auto?{caixa:num(a.caixa)-12}:{})}:{};
 return {...a,...extra,despachoCidade:job,servicosRecibos:{...a.servicosRecibos,[id]:job}};
 });const j=b?.servicosRecibos?.[id];if(!j)return cancelar('Atendimento indisponível ou ocupado. Seus Ludigins foram devolvidos.');
 if(k==='posto'){const stock=await tx('ludigins_jogo/logistica/posto',s=>{s=s||{fatias:10,usosNaUltimaFatia:0};if(s.recibosCidade?.[id])return;let f=s.fatias??10,u=num(s.usosNaUltimaFatia);const ok=f>1||(f===1&&u<5);if(ok&&++u>=10&&f>1){f--;u=0}return {...s,fatias:f,usosNaUltimaFatia:u,recibosCidade:{...s.recibosCidade,[id]:ok?'ok':'vazio'}}});if(stock.recibosCidade[id]!=='ok')return cancelar('O posto está sem estoque. Seus Ludigins foram devolvidos.');
 await new Promise(resolve=>T.moverAte('A4',resolve));nota('Táxi no posto • abastecendo…');await espera(3200)}
 else{nota(k==='lanche'?'A moto está levando seu lanche.':'O bombeiro está a caminho do táxi.');await espera(j.saida-agora())}
 // Settle each ledger once, even if the page closed midway.
 await tx(biz,a=>{if(!a||a.servicosRecibos?.[id]?.liquidado)return;const parte=k==='lanche'?valor:valor/2;return {...a,caixa:num(a.caixa)+parte,...(k==='lanche'?{ganhosHoje:num(a.ganhosHoje)+valor}:k==='bombeiro'?{atendimentos:num(a.atendimentos)+1}:{abastecimentos:num(a.abastecimentos)+1}),servicosRecibos:{...a.servicosRecibos,[id]:{...j,liquidado:true}}}});
 if(k!=='lanche'&&j.dono){await tx('ludigins_usuarios/'+j.dono,a=>{if(!a||a.receitasServicoCidade?.[id])return;const c=k==='posto'?'ganhosPostoTotal':'ganhosBombeiroTotal';return {...a,saldo:num(a.saldo)+valor/2,[c]:num(a[c])+valor/2,...(k==='posto'?{ganhosPostoHoje:(a.dataCorridas===dia()?num(a.ganhosPostoHoje):0)+valor/2}:{}),receitasServicoCidade:{...a.receitasServicoCidade,[id]:true}}})}
 await tx(pr,a=>a?.servicoCidade?.id===id?{...a,servicoCidade:null,...(k==='posto'?{combustivel:100}:k==='bombeiro'?{aquecimentoCorridas:0}:{pedidoLanchePendente:null,ultimaRefeicaoCorrida:num(a.corridasHoje),dataUltimaRefeicao:dia()})}:undefined);
 nota(k==='posto'?'Tanque cheio.':k==='lanche'?'Lanche entregue.':'Táxi resfriado.');
}
async function atender(k,pendente){if(ocupado||!uid)return;ocupado=true;render();try{
 if(!pendente){if(T.ocupado||!lojas[k])throw Error('Aguarde o fim da corrida ou a conexão do serviço.');
 const b=lojas[k],valor=preco(k,b);
 if(k==='bombeiro'&&b.modoAtendimento!=='automatico'){const d=b.donoId&&(await get(ref(db,'ludigins_jogo/jogadores/'+b.donoId))).val();if(!d||d.status==='offline'||agora()-num(d.atualizadoEm)>60000)throw Error('O dono do bombeiro está offline.')}
 if(k==='posto'){nota('Táxi a caminho do posto…');await new Promise(resolve=>T.moverAte('A4',resolve))}
 const id=crypto.randomUUID(),alvo=T.atual;
 const a=await tx('ludigins_usuarios/'+uid,p=>p&&!p.corridaAtual&&!p.servicoCidade&&precisa(k,p)&&num(p.saldo)>=valor?{...p,saldo:num(p.saldo)-valor,servicoCidade:{id,tipo:k,alvo,valor}}:undefined);
 if(a?.servicoCidade?.id!==id)throw Error('Confira o saldo, a necessidade do táxi e se há outro atendimento.');pendente=a.servicoCidade;}
 await processar(pendente);
 }catch(e){nota(e.message||'Falha de conexão.');}finally{ocupado=false;render();$('svcRetomar').hidden=!perfil?.servicoCidade}}
export function perfilServicos(r){uid=r?.id;perfil=r?.perfil;render();$('svcRetomar').hidden=!perfil?.servicoCidade||ocupado}
export function servicoEmCurso(){return ocupado||!!perfil?.servicoCidade}
onValue(ref(db,'.info/serverTimeOffset'),s=>offset=num(s.val()));
for(const k in cfg){$('svc-'+k).onclick=()=>atender(k);onValue(ref(db,loja(k)),s=>{lojas[k]=s.val();visualizar(k,lojas[k]?.despachoCidade);render()})}
$('svcRetomar').onclick=()=>{if(perfil?.servicoCidade)atender(perfil.servicoCidade.tipo,perfil.servicoCidade)};
