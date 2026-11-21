// Publica apenas apelido, identificador e estação; nenhum dado de login.
import { manterPresenca, radioEmReproducao, identidade } from './cidade-presenca.js?v=20261120a';
const presenca=manterPresenca('ludigins_publico/ouvintes',()=>{let taxi=null;try{taxi=JSON.parse(localStorage.getItem('cidadeTaxiUltimo_'+identidade()?.id)||'null')}catch{}return {radio:radioEmReproducao(),local:'painel',taxi}});
for(const evento of ['play','pause','ended'])document.getElementById('audioStreaming')?.addEventListener(evento,()=>presenca.publicar(true));
