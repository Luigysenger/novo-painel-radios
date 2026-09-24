// Trânsito da Nova Cidade Ludigins — circulação estritamente pelas ruas da arte oficial.
(function(){
const shell=document.querySelector('.mapa-shell');if(!shell)return;
const CARROS=[
{nivel:1,nome:'Popular',arquivo:'assets/cidade-ludigins/carros/carro_01_popular.png',corridas:0},
{nivel:2,nome:'Conforto',arquivo:'assets/cidade-ludigins/carros/carro_02_conforto.png',corridas:200},
{nivel:3,nome:'Esportivo',arquivo:'assets/cidade-ludigins/carros/carro_03_esportivo.png',corridas:500},
{nivel:4,nome:'Executivo',arquivo:'assets/cidade-ludigins/carros/carro_04_executivo.png',corridas:1000},
{nivel:5,nome:'SUV',arquivo:'assets/cidade-ludigins/carros/carro_05_suv.png',corridas:1500},
{nivel:6,nome:'Premium',arquivo:'assets/cidade-ludigins/carros/carro_06_premium.png',corridas:2000},
{nivel:7,nome:'Aventura',arquivo:'assets/cidade-ludigins/carros/carro_07_aventura.png',corridas:3000},
{nivel:8,nome:'Elite',arquivo:'assets/cidade-ludigins/carros/carro_08_elite.png',corridas:4500},
{nivel:9,nome:'VIP',arquivo:'assets/cidade-ludigins/carros/carro_09_vip.png',corridas:6500},
{nivel:10,nome:'Luxo',arquivo:'assets/cidade-ludigins/carros/carro_10_luxo.png',corridas:9000}
];
const css=document.createElement('style');css.textContent=`
.cidade-transito{position:absolute;inset:0;z-index:7;pointer-events:none;overflow:hidden}.cidade-veiculo{position:absolute;left:0;top:0;transform:translate(-50%,-50%);width:clamp(150px,10.8vw,205px);height:clamp(82px,6.1vw,112px);z-index:8;filter:drop-shadow(0 4px 7px #000e);transform-origin:center center;will-change:left,top,transform}.cidade-veiculo img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:center;user-select:none;-webkit-user-drag:none}.cidade-passageiro{position:absolute;transform:translate(-50%,-105%);font-size:clamp(14px,1.45vw,23px);z-index:9;pointer-events:auto;cursor:pointer;filter:drop-shadow(0 2px 2px #000)}.cidade-passageiro b{display:block;background:#101827e8;color:#fff;border:2px solid #facc15;border-radius:999px;padding:2px 6px;font:900 clamp(7px,.65vw,10px) Arial;white-space:nowrap}.cidade-status{position:absolute;left:50%;top:2%;transform:translateX(-50%);background:#07101def;border:1px solid #475569;border-radius:999px;padding:6px 10px;color:#e2e8f0;font:900 clamp(8px,.8vw,11px) Arial;z-index:10;white-space:nowrap}.cidade-status.corrida{background:#3b0764ef;border-color:#c084fc;color:#fff}@media(max-width:650px){.cidade-veiculo{width:clamp(96px,22vw,126px);height:clamp(54px,12vw,72px)}}
`;document.head.appendChild(css);
const layer=document.createElement('div');layer.className='cidade-transito';layer.innerHTML='<div class="cidade-status" id="cidadeTransitoStatus">ESCOLHA UMA CORRIDA</div><div class="cidade-veiculo" id="taxiCidade"><img id="taxiCidadeImagem" alt="Táxi do jogador"></div>';shell.appendChild(layer);
/* MALHA RECALIBRADA SOBRE O PRINT REAL DO JOGO. Cada nó está no centro de um cruzamento asfaltado. Entre nós, o movimento é SOMENTE horizontal ou vertical pelo centro da rua. */
const P={
R0C0:[25.9,12.4],R0C1:[40.3,12.4],R0C2:[53.8,12.4],R0C3:[71.3,12.4],R0C4:[87.7,12.4],
R1C0:[25.9,33.3],R1C1:[40.3,33.3],R1C2:[53.8,33.3],R1C3:[71.3,33.3],R1C4:[87.7,33.3],
R2C0:[25.9,51.7],R2C1:[40.3,51.7],R2C2:[53.8,51.7],R2C3:[71.3,51.7],R2C4:[87.7,51.7],
R3C0:[25.9,71.8],R3C1:[40.3,71.8],R3C2:[53.8,71.8],R3C3:[71.3,71.8],R3C4:[87.7,71.8]
};
const edges=[];for(let r=0;r<4;r++)for(let c=0;c<4;c++)edges.push([`R${r}C${c}`,`R${r}C${c+1}`]);for(let c=0;c<5;c++)for(let r=0;r<3;r++)edges.push([`R${r}C${c}`,`R${r+1}C${c}`]);
const adj={};Object.keys(P).forEach(k=>adj[k]=[]);edges.forEach(([a,b])=>{adj[a].push(b);adj[b].push(a)});
const taxi=document.getElementById('taxiCidade'),taxiImg=document.getElementById('taxiCidadeImagem'),status=document.getElementById('cidadeTransitoStatus');let atual='R0C3',movendo=false,corridaAtiva=false,modeloAtual=CARROS[0];
function numero(v){const n=Number(v);return Number.isFinite(n)?n:0}
function escolherModelo(perfil={}){const explicito=numero(perfil.carroNivel??perfil.nivelCarro??perfil.modeloCarro);if(explicito>=1&&explicito<=10)return CARROS[explicito-1];const total=numero(perfil.corridasTotais??perfil.corridas??perfil.totalCorridas);let escolhido=CARROS[0];for(const c of CARROS)if(total>=c.corridas)escolhido=c;return escolhido}
function aplicarModelo(perfil={}){modeloAtual=escolherModelo(perfil);taxiImg.src=modeloAtual.arquivo+'?v=20260924-5';taxiImg.alt='Táxi '+modeloAtual.nome;taxi.dataset.modelo=String(modeloAtual.nivel);taxi.title='Táxi '+modeloAtual.nome;return modeloAtual}
function posXY(x,y){taxi.style.left=x+'%';taxi.style.top=y+'%'}function pos(no){posXY(P[no][0],P[no][1])}pos(atual);aplicarModelo({});
function rota(a,b){const q=[a],prev={[a]:null};while(q.length){const n=q.shift();if(n===b)break;for(const x of(adj[n]||[]))if(!(x in prev)){prev[x]=n;q.push(x)}}if(!(b in prev))return[a];const r=[];for(let x=b;x!==null;x=prev[x])r.push(x);return r.reverse()}
/* O PNG do carro é lateral. Nas ruas horizontais ele aparece lateral; nas verticais gira 90 graus, apontando no sentido do deslocamento. Nunca usa diagonal e nunca gira 180 graus de cabeça para baixo. */
function orientar(de,para){const dx=para[0]-de[0],dy=para[1]-de[1];let sx=1,ang=0;if(Math.abs(dx)>=Math.abs(dy)){sx=dx>=0?1:-1;ang=0}else{sx=1;ang=dy>=0?90:-90}taxi.style.transform=`translate(-50%,-50%) rotate(${ang}deg) scaleX(${sx})`}
/* Mais lento: cerca de 7 a 10 segundos por quarteirão, conforme o comprimento. */
function animarTrecho(de,para,cb){orientar(de,para);const dx=para[0]-de[0],dy=para[1]-de[1],dist=Math.hypot(dx,dy);const dur=Math.max(6500,dist*430);taxi.style.transition=`left ${dur}ms linear,top ${dur}ms linear,transform 280ms ease`;requestAnimationFrame(()=>{posXY(para[0],para[1]);setTimeout(cb,dur+60)})}
function moverAte(dest,cb){if(movendo||!P[dest])return;movendo=true;const r=rota(atual,dest);let i=1;(function passo(){if(i>=r.length){movendo=false;cb&&cb();return}const de=P[r[i-1]],para=P[r[i]];animarTrecho(de,para,()=>{atual=r[i];i++;passo()})})()}
const corridas=[{o:'R0C1',d:'R2C3',v:4,n:'Hospital → Academia'},{o:'R0C2',d:'R3C2',v:3,n:'Bombeiros → Bairro Central'},{o:'R1C0',d:'R1C4',v:5,n:'Bairro das Flores → Lanchonete'},{o:'R1C2',d:'R2C0',v:2,n:'Prefeitura → Bairro das Flores'},{o:'R1C4',d:'R3C1',v:6,n:'Lanchonete → Bairro Lago Sul'},{o:'R2C0',d:'R0C3',v:5,n:'Bairro das Flores → Posto'},{o:'R2C2',d:'R0C1',v:4,n:'Loja de Roupas → Hospital'},{o:'R2C4',d:'R1C1',v:6,n:'Indústria → Supermercado'},{o:'R3C1',d:'R1C2',v:3,n:'Bairro Lago Sul → Prefeitura'},{o:'R3C2',d:'R1C3',v:4,n:'Bairro Central → Restaurante'},{o:'R3C4',d:'R0C2',v:5,n:'Nova Esperança → Bombeiros'}];
function passageiros(){layer.querySelectorAll('.cidade-passageiro').forEach(x=>x.remove());if(corridaAtiva)return;[...corridas].sort(()=>Math.random()-.5).slice(0,5).forEach(c=>{const el=document.createElement('div');el.className='cidade-passageiro';el.dataset.origem=c.o;el.dataset.destino=c.d;el.dataset.valor=c.v;el.dataset.nome=c.n;el.style.left=P[c.o][0]+'%';el.style.top=P[c.o][1]+'%';el.innerHTML=`<b>+${c.v} LUDIGINS</b><span aria-label="Passageiro">●</span>`;layer.appendChild(el);el.addEventListener('click',()=>aceitar(el))})}
function aceitar(el){if(corridaAtiva||movendo)return;corridaAtiva=true;layer.querySelectorAll('.cidade-passageiro').forEach(p=>{if(p!==el)p.remove()});status.classList.add('corrida');status.textContent='EM CORRIDA • indo buscar passageiro';const origem=el.dataset.origem,destino=el.dataset.destino,nome=el.dataset.nome;moverAte(origem,()=>{el.remove();status.textContent='EM CORRIDA • passageiro a bordo • '+nome;moverAte(destino,()=>{status.textContent='PASSAGEIRO ENTREGUE • corrida em teste';status.classList.remove('corrida');corridaAtiva=false;setTimeout(()=>{status.textContent='ESCOLHA UMA CORRIDA';passageiros()},1000)})})}
window.addEventListener('message',e=>{const d=e.data||{};if(d.tipo==='cidadeLudiginsPerfil'||d.tipo==='ludiginsPerfil')aplicarModelo(d.perfil||d.dados||{})});
passageiros();window.CidadeLudiginsTransito={moverAte,pontos:P,recriarPassageiros:passageiros,aplicarModelo,modelos:CARROS,get modeloAtual(){return modeloAtual}};
})();