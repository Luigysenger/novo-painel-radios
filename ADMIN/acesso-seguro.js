
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
const ADMIN_EMAIL = "senger.luigy@gmail.com";
const auth = getAuth();
export const sairAdministrador = () => signOut(auth);

export async function exigirAdministrador() {
  const current = await new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, user => { unsub(); resolve(user); });
  });
  const autorizado = user => user && user.email?.toLowerCase() === ADMIN_EMAIL && user.emailVerified;
  if (autorizado(current)) return current;
  const overlay = document.createElement("div");
  overlay.style.cssText = "position:fixed;inset:0;z-index:2147483647;background:#080f20;display:flex;align-items:center;justify-content:center;padding:20px;overflow:auto;color:#edf5ff;font-family:Arial,sans-serif;box-sizing:border-box";
  overlay.innerHTML = `<section style="width:100%;max-width:440px;background:#162237;padding:24px;border-radius:18px;box-sizing:border-box" role="dialog" aria-modal="true" aria-labelledby="tituloAcessoAdmin">
    <h1 id="tituloAcessoAdmin" style="font-size:24px">Acesso do administrador</h1>
    <p>Confirme sua conta para acessar o painel e as conversas dos ouvintes.</p>
    <form id="formAcessoAdmin">
      <label for="adminEmailSeguro">E-mail</label>
      <input id="adminEmailSeguro" type="email" autocomplete="username" readonly style="width:100%;box-sizing:border-box;margin:8px 0 16px;padding:12px">
      <label for="adminSenhaSegura">Senha do acesso seguro</label>
      <input id="adminSenhaSegura" type="password" autocomplete="current-password" required minlength="6" style="width:100%;box-sizing:border-box;margin:8px 0 16px;padding:12px">
      <button type="submit">Entrar</button>
      <button type="button" id="criarAdminSeguro">Ativar meu acesso seguro</button>
    </form>
    <button type="button" id="recuperarAdminSeguro">Esqueci minha senha</button>
    <button type="button" id="verificarAdminSeguro">Já confirmei meu e-mail</button>
    <button type="button" id="reenviarAdminSeguro">Reenviar confirmação</button>
    <p id="statusAdminSeguro" role="status" aria-live="polite"></p>
    <a href="../index.html" style="color:#7dd3fc">Voltar ao início</a>
  </section>`;
  overlay.querySelectorAll("button").forEach(b => b.style.cssText="padding:12px;margin:5px 4px 5px 0;border-radius:8px;border:0;background:#157bb8;color:white;cursor:pointer;min-height:44px");
  document.body.appendChild(overlay);
  const email = overlay.querySelector("#adminEmailSeguro");
  const password = overlay.querySelector("#adminSenhaSegura");
  const status = overlay.querySelector("#statusAdminSeguro");
  email.value = ADMIN_EMAIL;
  password.focus();
  const message = err => ({
    "auth/invalid-credential":"E-mail ou senha não conferem. Use a recuperação de senha se necessário.",
    "auth/email-already-in-use":"Este acesso já foi criado. Entre ou use Esqueci minha senha.",
    "auth/weak-password":"Escolha uma senha com pelo menos 6 caracteres.",
    "auth/too-many-requests":"Muitas tentativas. Aguarde um pouco antes de tentar novamente.",
    "auth/network-request-failed":"Não foi possível conectar. Verifique sua conexão.",
    "auth/operation-not-allowed":"O acesso por e-mail e senha precisa estar ativado no Firebase."
  }[err.code] || "Não foi possível concluir o acesso (" + (err.code || "erro") + ").");
  let busy = false;
  return new Promise(resolve => {
    const accept = async user => {
      if (!autorizado(user)) return false;
      await user.getIdToken(true);
      localStorage.setItem("adminLogado", "true");
      password.value = "";
      overlay.remove();
      resolve(user);
      return true;
    };
    const run = async action => {
      if (busy) return;
      busy = true;
      overlay.querySelectorAll("button").forEach(b => b.disabled = true);
      status.textContent = "Aguarde…";
      try { await action(); } catch (err) { status.textContent = message(err); }
      finally { busy = false; overlay.querySelectorAll("button").forEach(b => b.disabled = false); }
    };
    const verificar = async () => {
      const user = auth.currentUser;
      if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) {
        status.textContent = "Entre na sua conta primeiro."; return;
      }
      await user.reload();
      if (!(await accept(user))) status.textContent = "Confirme o link enviado ao seu e-mail e clique em Já confirmei meu e-mail.";
    };
    overlay.querySelector("form").addEventListener("submit", event => {
      event.preventDefault();
      run(async () => {
        const {user} = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password.value);
        if (!(await accept(user))) status.textContent = "Sua conta precisa ter o e-mail confirmado. Use Reenviar confirmação.";
      });
    });
    overlay.querySelector("#criarAdminSeguro").onclick = () => {
      if (!overlay.querySelector("form").reportValidity()) return;
      run(async () => {
        const {user} = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, password.value);
        password.value = "";
        await sendEmailVerification(user);
        status.textContent = "Acesso criado. Confirme o link enviado ao seu e-mail e clique em Já confirmei meu e-mail. Os dados antigos não foram alterados.";
      });
    };
    overlay.querySelector("#recuperarAdminSeguro").onclick = () => run(async () => {
      await sendPasswordResetEmail(auth, ADMIN_EMAIL);
      status.textContent = "Se houver um acesso cadastrado, você receberá as instruções de recuperação no e-mail.";
    });
    overlay.querySelector("#verificarAdminSeguro").onclick = () => run(verificar);
    overlay.querySelector("#reenviarAdminSeguro").onclick = () => run(async () => {
      if (auth.currentUser?.email?.toLowerCase() !== ADMIN_EMAIL) { status.textContent = "Entre na conta primeiro."; return; }
      await sendEmailVerification(auth.currentUser);
      status.textContent = "Confirmação enviada. Confira também a pasta de spam.";
    });
    if (current?.email?.toLowerCase() === ADMIN_EMAIL) status.textContent = "Seu e-mail ainda não foi confirmado. Use Reenviar confirmação.";
  });
}
