const API  = "/psicologos/login";
const MENU = "menu/menu-psicologo.html";
const DEMO_EMAIL = "demo@falaleve.local";
const DEMO_PASSWORD = "Psicologo123!";
const DEMO_ACCOUNTS = [
  { email: DEMO_EMAIL, password: DEMO_PASSWORD, id: "demo-psicologo", name: "Dra. Helena Martins" },
  { email: "demo2@falaleve.local", password: "Psicologo456!", id: "demo-psicologo-2", name: "Dr. André Costa" },
  { email: "demo3@falaleve.local", password: "Psicologo789!", id: "demo-psicologo-3", name: "Dra. Beatriz Lima" },
  { email: "demo4@falaleve.local", password: "Psicologo321!", id: "demo-psicologo-4", name: "Dr. Lucas Ferreira" },
];

const form       = document.getElementById('form-login');
const emailInput = document.getElementById('email_psicologo');
const senhaInput = document.getElementById('senha');
const msgStatus  = document.getElementById('msg-status');

function toggleSenha() {
  const icone = document.getElementById('icone-olho');
  const mostrar = senhaInput.type === 'password';
  senhaInput.type = mostrar ? 'text' : 'password';
  icone.className = mostrar ? 'ti ti-eye-off' : 'ti ti-eye';
  document.getElementById('btn-olho').setAttribute('aria-pressed', String(mostrar));
}

function mostrarStatus(texto, erro = true) {
  msgStatus.textContent = texto;
  msgStatus.style.color = erro ? '#c0392b' : '#27ae60';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  mostrarStatus('');

  const payload = {
    email_psicologo: emailInput.value.trim(),
    senha:             senhaInput.value,
  };

  if (!payload.email_psicologo || !payload.senha) {
    mostrarStatus('Preencha e-mail e senha.');
    return;
  }

  const demoAccount = DEMO_ACCOUNTS.find(account =>
    payload.email_psicologo.toLowerCase() === account.email && payload.senha === account.password
  );
  if (demoAccount) {
    sessionStorage.setItem('psicologo', JSON.stringify({
      id_psicologo: demoAccount.id,
      nome_psicologo: demoAccount.name,
      email_psicologo: demoAccount.email,
      modo_demo: true,
    }));
    window.location.href = MENU;
    return;
  }

  try {
    const resp = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (resp.status === 200) {
      const dados = await resp.json();
      sessionStorage.setItem('psicologo', JSON.stringify(dados));
      mostrarStatus(`Bem-vindo(a), ${dados.nome_psicologo}!`, false);
      setTimeout(() => { window.location.href = MENU; }, 800);
      return;
    }

    let detalhe = 'E-mail ou senha incorretos.';
    try {
      const err = await resp.json();
      if (typeof err.detail === 'string') detalhe = err.detail;
    } catch { /* resposta sem JSON */ }
    mostrarStatus(detalhe);
  } catch {
    mostrarStatus('Falha de conexão com o servidor.');
  }
});


