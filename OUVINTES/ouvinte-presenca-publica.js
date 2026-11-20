// Publica apenas apelido, identificador e estação; nenhum dado de login.
import { manterPresenca, radioEmReproducao } from './cidade-presenca.js?v=20261120a';
const presenca=manterPresenca('ludigins_publico/ouvintes',()=>({radio:radioEmReproducao(),local:'painel'}));
for(const evento of ['play','pause','ended'])document.getElementById('audioStreaming')?.addEventListener(evento,()=>presenca.publicar(true));
