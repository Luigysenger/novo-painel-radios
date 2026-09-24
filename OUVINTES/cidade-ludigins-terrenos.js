// Mantém os lotes exatamente alinhados ao desenho do mapa, inclusive em tela cheia.
(function(){
  const MAP_W=1663, MAP_H=945;
  const LOTES=[
    [104,80,185,156],[192,80,273,156],[279,80,360,156],
    [100,211,177,280],[181,211,257,280],[261,211,337,280],[341,211,419,280],
    [100,289,177,365],[181,289,257,365],[261,289,337,365],[341,289,419,365],
    [75,430,166,495],[170,430,254,495],[258,430,339,495],[343,430,419,495],
    [75,499,166,563],[170,499,254,563],[258,499,339,563],[343,499,419,563],
    [449,626,517,680],[531,626,598,680],[614,626,683,680],
    [449,710,517,766],[531,710,598,766],[614,710,683,766],
    [777,615,843,674],[858,615,923,674],[938,615,1004,674],
    [777,693,843,759],[858,693,923,759],[938,693,1004,759],
    [1087,615,1152,674],[1167,615,1232,674],[1247,615,1311,674],
    [1087,693,1152,759],[1167,693,1232,759],[1247,693,1311,759]
  ];
  const shell=document.querySelector('.mapa-shell');
  const img=document.querySelector('.mapa-img');
  if(!shell||!img)return;

  function alinhar(){
    const lotes=[...document.querySelectorAll('.hotspot.lote')];
    if(!lotes.length)return;
    const sr=shell.getBoundingClientRect();
    const ir=img.getBoundingClientRect();
    // getBoundingClientRect da imagem inclui a caixa do elemento. Em object-fit:contain,
    // calculamos a área visual real para impedir deslocamento por letterbox.
    const boxW=ir.width, boxH=ir.height;
    const escala=Math.min(boxW/MAP_W,boxH/MAP_H);
    const visualW=MAP_W*escala, visualH=MAP_H*escala;
    const offX=(ir.left-sr.left)+(boxW-visualW)/2;
    const offY=(ir.top-sr.top)+(boxH-visualH)/2;
    const inset=Math.max(1,Math.min(2.5,escala*2));
    lotes.forEach((el,i)=>{
      const p=LOTES[i]; if(!p)return;
      const x=offX+p[0]*escala+inset;
      const y=offY+p[1]*escala+inset;
      const w=(p[2]-p[0])*escala-inset*2;
      const h=(p[3]-p[1])*escala-inset*2;
      el.style.left=x+'px';el.style.top=y+'px';
      el.style.width=Math.max(2,w)+'px';el.style.height=Math.max(2,h)+'px';
      el.style.borderRadius=Math.max(2,7*escala)+'px';
    });
  }

  // Garante sempre somente um terreno marcado.
  document.addEventListener('click',e=>{
    const lote=e.target.closest?.('.hotspot.lote');
    if(!lote)return;
    document.querySelectorAll('.hotspot.lote.selecionado').forEach(el=>{if(el!==lote)el.classList.remove('selecionado')});
    lote.classList.add('selecionado');
  },true);

  img.addEventListener('load',alinhar);
  window.addEventListener('resize',()=>requestAnimationFrame(alinhar));
  document.addEventListener('fullscreenchange',()=>{requestAnimationFrame(alinhar);setTimeout(alinhar,120);setTimeout(alinhar,350)});
  if(window.ResizeObserver)new ResizeObserver(()=>requestAnimationFrame(alinhar)).observe(shell);
  requestAnimationFrame(alinhar);setTimeout(alinhar,100);setTimeout(alinhar,500);
})();