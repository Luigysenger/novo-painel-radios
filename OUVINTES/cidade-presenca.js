// Uma sessão por aba: sair em um aparelho não desconecta o outro.
import { db } from '../firebase-config.js';
import { ref, onValue, onDisconnect, set, remove, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
export function identidade(){
 const id=localStorage.getItem('usuarioKey')||localStorage.getItem('userId');
 const nome=(localStorage.getItem('usuarioLogado')||'').trim();
 return id&&nome&&nome.toLowerCase()!=='ouvinte_anonimo'?{id,nome}:null;
}
export function radioEmReproducao(){
 try{
  const doc=window.parent!==window?window.parent.document:document;
  const audio=doc.getElementById('audioStreaming');
  const nome=(doc.getElementById('playerNameDisplay')?.textContent||'').trim();
  return audio&&!audio.paused&&!audio.ended&&nome!=='Nenhuma rádio selecionada'?nome:'';
 }catch{return ''}
}
export function manterPresenca(caminho,lerDados){
 const sessao=crypto.randomUUID(),destino=ref(db,caminho+'/'+sessao);
 let conectado=false,pronto=false,encerrado=false,gravando=false,pendente=false,geracao=0;
 let offset=0,ultimo='',ultimoEnvio=0;
 const pararOffset=onValue(ref(db,'.info/serverTimeOffset'),s=>offset=Number(s.val())||0);
 function avisar(erro){window.dispatchEvent(new CustomEvent('cidade-presenca-erro',{detail:erro?.code||'conexao'}))}
 async function publicar(forcar=false){
  if(!pronto||encerrado)return;
  const pessoa=identidade();if(!pessoa)return;
  if(gravando){pendente=true;return}
  const dados={...pessoa,...lerDados(offset)},texto=JSON.stringify(dados);
  if(!forcar&&texto===ultimo&&Date.now()-ultimoEnvio<15000)return;
  gravando=true;
  try{await set(destino,{...dados,atualizadoEm:serverTimestamp()});ultimo=texto;ultimoEnvio=Date.now()}
  catch(e){avisar(e)}
  finally{gravando=false;if(pendente){pendente=false;publicar()}}
 }
 async function preparar(){
  const g=++geracao;pronto=false;
  try{await onDisconnect(destino).remove();if(g!==geracao||encerrado||!conectado)return;pronto=true;publicar(true)}
  catch(e){avisar(e)}
 }
 const pararConexao=onValue(ref(db,'.info/connected'),s=>{
  conectado=s.val()===true;pronto=false;
  if(conectado&&!encerrado)preparar();else geracao++;
 });
 const timer=setInterval(()=>{if(conectado&&!pronto&&!encerrado)preparar();else publicar()},2000);
 const sair=()=>{encerrado=true;pronto=false;geracao++;remove(destino).catch(()=>{})};
 const voltar=()=>{encerrado=false;if(conectado)preparar()};
 window.addEventListener('pagehide',sair);
 window.addEventListener('pageshow',voltar);
 return {publicar,agora:()=>Date.now()+offset,parar(){sair();clearInterval(timer);pararConexao();pararOffset();window.removeEventListener('pagehide',sair);window.removeEventListener('pageshow',voltar)}};
}
