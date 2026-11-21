// Publica apenas apelido, identificador e estação; nenhum dado de login.
import { manterPresenca, radioEmReproducao, identidade } from './cidade-presenca.js?v=20261120a';
const presenca=manterPresenca('ludigins_publico/ouvintes',()=>{let taxi=null;try{taxi=JSON.parse(localStorage.getItem('cidadeTaxiUltimo_'+identidade()?.id)||'null')}catch{}return {radio:radioEmReproducao(),local:'painel',taxi}});
for(const evento of ['play','pause','ended'])document.getElementById('audioStreaming')?.addEventListener(evento,()=>presenca.publicar(true));

import {db} from '../firebase-config.js';
import {ref,onValue} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
function primeiroNome(nome){return String(nome||'Ouvinte').trim().split(/\s+/)[0]}
const estiloReacoes=document.createElement('style');estiloReacoes.textContent=`
.cidade-reacoes-menu{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;background:#0008}
.cidade-reacoes-box{max-width:90vw;background:#101b2d;color:white;border:1px solid #a78bfa;border-radius:16px;padding:18px;text-align:center}
.cidade-reacoes-box button{min-width:48px;min-height:48px;margin:5px;border-radius:10px;border:1px solid #64748b;background:#25344b;color:#fff;font-size:24px;cursor:pointer}
.cidade-reacao-chuva{position:fixed;inset:0;z-index:10001;pointer-events:none;overflow:hidden}
.cidade-reacao-chuva i{position:absolute;top:-60px;font-style:normal;font-size:32px;animation:cidadeChuva 2.8s linear forwards}
@keyframes cidadeChuva{to{transform:translateY(110vh) rotate(240deg)}}
@media(prefers-reduced-motion:reduce){.cidade-reacao-chuva i{animation:none;top:40%}}
`;document.head.append(estiloReacoes);

const inicioReacoes=Date.now(),vistas=new Set();
const meuId=identidade()?.id;
if(meuId)onValue(ref(db,'ludigins_cidade/reacoes/'+meuId),snap=>{
 for(const [id,r] of Object.entries(snap.val()||{})){
  if(vistas.has(id)||!['👏','👍','🎉'].includes(r?.icone)||!Number.isFinite(r.em))continue;
  vistas.add(id);if(r.em<inicioReacoes-5000)continue;
  const chuva=document.createElement('div');chuva.className='cidade-reacao-chuva';chuva.setAttribute('aria-label',primeiroNome(r.nome)+' enviou uma reação');chuva.setAttribute('role','status');
  for(let n=0;n<24;n++){const p=document.createElement('i');p.textContent=r.icone;p.style.left=(Math.random()*94)+'%';p.style.animationDelay=(Math.random()*1.2)+'s';chuva.append(p)}
  document.body.append(chuva);setTimeout(()=>chuva.remove(),4500);
 }
});
