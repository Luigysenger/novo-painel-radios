// Seleção precisa dos prédios da Cidade Ludigins.
// Coordenadas na arte original 1663 x 945. Mantém a marcação alinhada também em tela cheia/object-fit: contain.
(function(){
  const shell=document.querySelector('.mapa-shell');
  const img=shell?.querySelector('.mapa-img');
  if(!shell||!img)return;

  const BASE_W=1663, BASE_H=945;
  // x1,y1,x2,y2: somente a área física do prédio/estabelecimento, sem ocupar rua ou quarteirão inteiro.
  const PREDIOS={
    hospital:[535,43,665,171],
    bombeiros:[793,49,950,177],
    posto:[1092,55,1266,172],
    lava:[1378,58,1535,171],
    supermercado:[523,232,707,373],
    prefeitura:[763,225,957,383],
    igreja:[1002,221,1150,385],
    restaurante:[1238,235,1380,385],
    lanchonete:[1394,236,1535,384],
    banco:[522,444,699,568],
    roupas:[781,449,952,567],
    petshop:[993,449,1134,566],
    academia:[1141,448,1278,567],
    industria:[1360,438,1518,603]
  };

  const style=document.createElement('style');
  style.textContent=`
    .hotspot.local{border:2px dashed transparent!important;border-radius:9px!important;outline:none!important;background:transparent!important;box-shadow:none!important;transition:border-color .12s,background .12s,box-shadow .12s}
    .hotspot.local:hover,.hotspot.local:focus-visible{border-color:#a855f788!important;background:#a855f70c!important;outline:none!important}
    .hotspot.local.predio-selecionado{border:3px dashed #a855f7!important;background:#a855f716!important;box-shadow:0 0 0 1px #0008,0 0 14px #a855f799!important;z-index:9!important}
    @media(max-width:650px){.hotspot.local.predio-selecionado{border-width:2px!important}}
  `;
  document.head.appendChild(style);

  function areaImagem(){
    const sw=shell.clientWidth, sh=shell.clientHeight;
    const naturalW=img.naturalWidth||BASE_W, naturalH=img.naturalHeight||BASE_H;
    const scale=Math.min(sw/naturalW,sh/naturalH);
    const w=naturalW*scale,h=naturalH*scale;
    return {left:(sw-w)/2,top:(sh-h)/2,w,h,naturalW,naturalH};
  }
  function posicionar(){
    const a=areaImagem();
    document.querySelectorAll('.hotspot.local[data-local]').forEach(el=>{
      const p=PREDIOS[el.dataset.local]; if(!p)return;
      const margem=3;
      const x1=p[0]+margem,y1=p[1]+margem,x2=p[2]-margem,y2=p[3]-margem;
      el.style.left=(a.left+(x1/BASE_W)*a.w)+'px';
      el.style.top=(a.top+(y1/BASE_H)*a.h)+'px';
      el.style.width=((x2-x1)/BASE_W*a.w)+'px';
      el.style.height=((y2-y1)/BASE_H*a.h)+'px';
    });
  }
  function selecionar(el){
    document.querySelectorAll('.hotspot.local.predio-selecionado').forEach(x=>x.classList.remove('predio-selecionado'));
    document.querySelectorAll('.hotspot.lote.selecionado').forEach(x=>x.classList.remove('selecionado'));
    el.classList.add('predio-selecionado');
  }
  document.querySelectorAll('.hotspot.local[data-local]').forEach(el=>el.addEventListener('click',()=>selecionar(el),true));
  document.querySelectorAll('.hotspot.lote[data-lote]').forEach(el=>el.addEventListener('click',()=>document.querySelectorAll('.hotspot.local.predio-selecionado').forEach(x=>x.classList.remove('predio-selecionado')),true));
  img.addEventListener('load',posicionar);
  window.addEventListener('resize',posicionar);
  document.addEventListener('fullscreenchange',()=>requestAnimationFrame(()=>requestAnimationFrame(posicionar)));
  if(window.ResizeObserver)new ResizeObserver(posicionar).observe(shell);
  requestAnimationFrame(posicionar);
})();