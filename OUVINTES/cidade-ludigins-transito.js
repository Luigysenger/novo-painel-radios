// Trânsito da Nova Cidade Ludigins — veículos restritos à malha de asfalto.
(function(){
const shell=document.querySelector('.mapa-shell');if(!shell)return;
const css=document.createElement('style');css.textContent=`
.cidade-transito{position:absolute;inset:0;z-index:7;pointer-events:none;overflow:hidden}.cidade-veiculo{position:absolute;left:0;top:0;transform:translate(-50%,-50%);font-size:clamp(17px,2vw,31px);line-height:1;filter:drop-shadow(0 2px 2px #000a);transition:left .7s linear,top .7s linear;z-index:8}.cidade-veiculo .sprite{display:block;transition:transform .12s linear}.cidade-passageiro{position:absolute;transform:translate(-50%,-92%);font-size:clamp(14px,1.55vw,24px);filter:drop-shadow(0 2px 2px #000);z-index:9;pointer-events:auto;cursor:pointer}.cidade-passageiro b{display:block;background:#111c;color:#fff;border:1px solid #a855f7;border-radius:8px;padding:2px 5px;font:800 clamp(7px,.65vw,10px) Arial;white-space:nowrap;margin-bottom:2px}.cidade-status{position:absolute;left:50%;top:2%;transform:translateX(-50%);background:#07101ddd;border:1px solid #475569;border-radius:999px;padding:5px 9px;color:#e2e8f0;font:800 clamp(8px,.8vw,11px) Arial;z-index:10;white-space:nowrap}
`;document.head.appendChild(css);
const layer=document.createElement('div');layer.className='cidade-transito';layer.innerHTML='<div class="cidade-status" id="cidadeTransitoStatus">🚕 Táxi aguardando corrida</div><div class="cidade-veiculo" id="taxiCidade"><span class="sprite">🚕</span></div>';shell.appendChild(layer);
/* Coordenadas recalibradas pela arte oficial: centros das pistas de asfalto, nunca praia/lago/calçada. */
const P={
T0:[74,19.7],T1:[63,19.7],T2:[46,19.7],T3:[29,19.7],
V1A:[43.5,19.7],V1B:[43.5,42.8],V1C:[43.5,65.0],V1D:[43.5,83.2],
V2A:[61.5,19.7],V2B:[61.5,42.8],V2C:[61.5,65.0],V2D:[61.5,83.2],
V3A:[81.5,19.7],V3B:[81.5,42.8],V3C:[81.5,65.0],V3D:[81.5,83.2],
H1L:[27,42.8],H1A:[43.5,42.8],H1B:[61.5,42.8],H1C:[81.5,42.8],H1R:[95,42.8],
H2L:[28,65.0],H2A:[43.5,65.0],H2B:[61.5,65.0],H2C:[81.5,65.0],H2R:[94,65.0],
H3L:[36,83.2],H3A:[43.5,83.2],H3B:[61.5,83.2],H3C:[81.5,83.2],H3R:[91,83.2]
};
const edges=[['T0','T1'],['T1','V2A'],['V2A','V1A'],['V1A','T2'],['T2','T3'],['V1A','V1B'],['V1B','V1C'],['V1C','V1D'],['V2A','V2B'],['V2B','V2C'],['V2C','V2D'],['V3A','V3B'],['V3B','V3C'],['V3C','V3D'],['H1L','V1B'],['V1B','V2B'],['V2B','V3B'],['V3B','H1R'],['H2L','V1C'],['V1C','V2C'],['V2C','V3C'],['V3C','H2R'],['H3L','V1D'],['V1D','V2D'],['V2D','V3D'],['V3D','H3R'],['T0','V3A']];
const adj={};Object.keys(P).forEach(k=>adj[k]=[]);edges.forEach(([a,b])=>{adj[a].push(b);adj[b].push(a)});
const destinos={hospital:'T3',bombeiros:'T2',posto:'T0',prefeitura:'V2B',supermercado:'H1A',igreja:'H1B',restaurante:'H1C',lanchonete:'H1R',banco:'H2A',roupas:'H2B',petshop:'H2B',academia:'H2C',industria:'H2R'};
function rota(a,b){const q=[a],prev={[a]:null};while(q.length){const n=q.shift();if(n===b)break;(adj[n]||[]).forEach(x=>{if(!(x in prev)){prev[x]=n;q.push(x)}})}if(!(b in prev))return[a];const r=[];for(let x=b;x!==null;x=prev[x])r.push(x);return r.reverse()}
const taxi=document.getElementById('taxiCidade'),sprite=taxi.querySelector('.sprite');let atual='T0',movendo=false,ultimoDx=1;
function pos(k){taxi.style.left=P[k][0]+'%';taxi.style.top=P[k][1]+'%'}
/* O táxi nasce na rua imediatamente atrás/abaixo do Posto de Combustível. */pos(atual);
function orientar(a,b){const dx=b[0]-a[0],dy=b[1]-a[1];if(Math.abs(dx)>=Math.abs(dy)){ultimoDx=dx||ultimoDx;sprite.style.transform=ultimoDx<0?'scaleX(-1)':'scaleX(1)'}else{ /* emoji não é girado: evita ficar de cabeça para baixo; direção vertical mantém carro em pé */ sprite.style.transform=ultimoDx<0?'scaleX(-1)':'scaleX(1)'}}
function moverAte(dest,cb){if(movendo||!P[dest])return;movendo=true;const r=rota(atual,dest);let i=1;function passo(){if(i>=r.length){movendo=false;cb&&cb();return}const de=P[r[i-1]],para=P[r[i]];orientar(de,para);pos(r[i]);atual=r[i++];setTimeout(passo,760)}passo()}
const origens=['T3','T2','H1L','H1B','H1R','H2L','H2B','H2R','H3L','H3B','H3R'];
function criarPassageiros(){layer.querySelectorAll('.cidade-passageiro').forEach(e=>e.remove());const mist=[...origens].sort(()=>Math.random()-.5).slice(0,5);mist.forEach((no,i)=>{const el=document.createElement('div');el.className='cidade-passageiro';el.dataset.no=no;el.innerHTML='<b>+'+(i%3+1)+' • PASSAGEIRO</b>🧍';el.style.left=P[no][0]+'%';el.style.top=P[no][1]+'%';layer.appendChild(el);el.addEventListener('click',()=>aceitar(el))})}
function aceitar(el){if(movendo||!el.isConnected)return;document.getElementById('cidadeTransitoStatus').textContent='🚕 Indo buscar passageiro...';moverAte(el.dataset.no,()=>{el.remove();const keys=Object.keys(destinos),d=keys[Math.floor(Math.random()*keys.length)];document.getElementById('cidadeTransitoStatus').textContent='👤 Passageiro a bordo • '+d;moverAte(destinos[d],()=>{document.getElementById('cidadeTransitoStatus').textContent='✅ Passageiro entregue • escolha outra corrida';setTimeout(()=>{criarPassageiros()},700)})})}
criarPassageiros();
window.CidadeLudiginsTransito={moverAte,destinos,pontos:P,recriarPassageiros:criarPassageiros};
})();