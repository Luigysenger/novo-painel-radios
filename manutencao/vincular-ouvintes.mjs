// Executar somente em ambiente administrativo com firebase-admin e credenciais do projeto.
// Entrada privada: JSON de vínculos confirmados, [{email, chave, apelido}]. Nunca inclua senhas.
// Sem --aplicar: somente valida. Não envia e-mails, não altera saldos nem perfis antigos.
import {readFile} from 'node:fs/promises';
import {createHash,randomBytes} from 'node:crypto';
import {initializeApp,applicationDefault} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getDatabase} from 'firebase-admin/database';
const projectId='novo-jeito-de-ouvir-radio';
const linhas=JSON.parse(await readFile(process.argv[2],'utf8'));
const emails=new Set(),chaves=new Set();
if(!Array.isArray(linhas)||!linhas.length)throw Error('Lista vazia.');
for(const r of linhas){
 if(Object.keys(r).some(k=>!['chave','apelido','email'].includes(k)))throw Error('Campos inesperados.');
 r.email=String(r.email||'').trim().toLowerCase();
 if(!/^\S+@\S+\.\S+$/.test(r.email)||typeof r.chave!=='string'||!r.chave||/[.#$\[\]\/\u0000-\u001f\u007f]/.test(r.chave)||typeof r.apelido!=='string'||!r.apelido.trim()||emails.has(r.email)||chaves.has(r.chave))throw Error('Vínculo inválido ou duplicado.');
 emails.add(r.email);chaves.add(r.chave);
}
if(!process.argv.includes('--aplicar')){console.log('Validação local:',linhas.length,'vínculos. Nenhuma alteração.');process.exit(0)}
initializeApp({projectId,credential:applicationDefault(),databaseURL:'https://novo-jeito-de-ouvir-radio-default-rtdb.firebaseio.com'});
const auth=getAuth(),db=getDatabase();
for(const r of linhas){
 const uid='legacy_'+createHash('sha256').update(r.chave).digest('hex');
 let u;try{u=await auth.getUser(uid)}catch(e){if(e.code!=='auth/user-not-found')throw e;
 // Uma colisão de e-mail com outra conta aborta; não assumimos titularidade.
 u=await auth.createUser({uid,email:r.email,password:randomBytes(48).toString('base64url'),emailVerified:false})}
 if(u.email?.toLowerCase()!==r.email||u.disabled)throw Error('Conta conflitante; conferir manualmente.');
 const tx=await db.ref('vinculos_ouvintes/'+uid).transaction(v=>v&&v.chave!==r.chave?undefined:{chave:r.chave,apelido:r.apelido});
 if(!tx.committed)throw Error('Vínculo conflitante; conferir manualmente.');
}
console.log('Vínculos preparados. Nenhuma senha antiga foi utilizada.');
