// Camada visual de trânsito da Nova Cidade Ludigins.
// Nesta fase NÃO altera saldo/corridas: prepara ruas, táxi, passageiros e destinos com segurança.
(function(){
const shell=document.querySelector('.mapa-shell'); if(!shell)return;
const css=document.createElement('style');css.textContent=`
.cidade-transito{position:absolute;inset:0;z-index:7;pointer-events:none;overflow:hidden}.cidade-veiculo{position:absolute;left:0;top:0;transform:translate(-50%,-50%);font-size:clamp(17px,2.2vw,34px);line-height:1;filter:drop-shadow(0 2px 2px #000a);transition:left .9s linear,top .9s linear,transform .25s;z-index:8}.cidade-passageiro{position:absolute;transform:translate(-50%,-100%);font-size:clamp(15px,1.8vw,27px);filter:drop-shadow(0 2px 2px #000);z-index:9}.cidade-passageiro b{display:block;background:#111c;color:#fff;border:1px solid #a855f7;border-radius:8px;padding:2px 5px;font:800 clamp(7px,.7vw,10px) Arial;white-space:nowrap;margin-bottom:2px}.cidade-status{position:absolute;left:50%;top:2%;transform:translateX(-50%);background:#07101ddd;border:1px solid #475569;border-radius:999px;padding:5px 9px;color:#e2e8f0;font:800 clamp(8px,.8vw,11px) Arial;z-index:10;white-space:nowrap}.cidade-rota-debug{display:none;position:absolute;width:5px;height:5px;border-radius:50%;background:#22c55e;transform:translate(-50%,-50%)}
`;document.head.appendChild(css);
const layer=document.createElement('div');layer.className='cidade-transito';layer.innerHTML='<div class="cidade-status" id="cidadeTransitoStatus">🚕 Trânsito da nova cidade preparado</div><div class="cidade-veiculo" id="taxiCidade" aria-label="Táxi">🚕</div>';shell.appendChild(layer);
// Pontos percentuais ficam exclusivamente sobre vias visíveis da arte aprovada.
const P={
A:[24,20],B:[42,20],C:[61,20],D:[81,20],E:[24,45],F:[42,45],G:[61,45],H:[81,45],I:[24,67],J:[42,67],K:[61,67],L:[81,67],M:[24,88],N:[42,88],O:[61,88],P:[81,88]
};
const E=[['A','B'],['B','C'],['C','D'],['A','E'],['B','F'],['C','G'],['D','H'],['E','F'],['F','G'],['G','H'],['E','I'],['F','J'],['G','K'],['H','L'],['I','J'],['J','K'],['K','L'],['I','M'],['J','N'],['K','O'],['L','P'],['M','N'],['N','O'],['O','P']];
const adj={};Object.keys(P).forEach(k=>adj[k]=[]);E.forEach(([a,b])=>{adj[a].push(b);adj[b].push(a)});
const destinos={prefeitura:'F',hospital:'B',bombeiros:'C',posto:'D',supermercado:'E',igreja:'G',restaurante:'H',lanchonete:'H',banco:'I',roupas:'J',petshop:'K',academia:'K',industria:'L'};
function rota(a,b){const q=[a],prev={[a]:null};while(q.length){const n=q.shift();if(n===b)break;for(const x of adj[n])if(!(x in prev)){prev[x]=n;q.push(x)}}if(!(b in prev))return[a];const r=[];for(let x=b;x!==null;x=prev[x])r.push(x);return r.reverse()}
const taxi=document.getElementById('taxiCidade');let atual='M',movendo=false;function pos(k){const[x,y]=P[k];taxi.style.left=x+'%';taxi.style.top=y+'%'}pos(atual);
function moverAte(dest,cb){if(movendo||!P[dest])return;movendo=true;const r=rota(atual,dest);let i=1;const passo=()=>{if(i>=r.length){atual=dest;movendo=false;cb&&cb();return}const anterior=P[r[i-1]],proximo=P[r[i]],dx=proximo[0]-anterior[0],dy=proximo[1]-anterior[1];taxi.style.transform=`translate(-50%,-50%) rotate(${Math.atan2(dy,dx)*180/Math.PI+90}deg)`;pos(r[i]);atual=r[i++];setTimeout(passo,950)};passo()}
function criarPassageiro(){layer.querySelectorAll('.cidade-passageiro').forEach(e=>e.remove());const candidatos=['A','C','E','G','I','K','N','P'].filter(x=>x!==atual),origem=candidatos[Math.floor(Math.random()*candidatos.length)],el=document.createElement('div');el.className='cidade-passageiro';el.dataset.no=origem;el.innerHTML='<b>PASSAGEIRO</b>🧍';el.style.left=P[origem][0]+'%';el.style.top=P[origem][1]+'%';layer.appendChild(el);return el}
const passageiro=criarPassageiro();
// Nesta primeira implantação, clicar no passageiro demonstra a malha sem gravar corrida no Firebase.
passageiro.style.pointerEvents='auto';passageiro.style.cursor='pointer';passageiro.addEventListener('click',()=>{if(movendo)return;document.getElementById('cidadeTransitoStatus').textContent='🚕 Indo buscar passageiro...';moverAte(passageiro.dataset.no,()=>{passageiro.remove();const keys=Object.keys(destinos),d=keys[Math.floor(Math.random()*keys.length)];document.getElementById('cidadeTransitoStatus').textContent='👤 A bordo • destino: '+d;moverAte(destinos[d],()=>{document.getElementById('cidadeTransitoStatus').textContent='✅ Rota concluída em '+d+' • modo de teste seguro';setTimeout(()=>location.reload(),2200)})})});
window.CidadeLudiginsTransito={moverAte,destinos,pontos:P};
})();