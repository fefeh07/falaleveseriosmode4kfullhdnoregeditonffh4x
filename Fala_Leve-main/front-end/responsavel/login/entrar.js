const API  = "/responsaveis/login";
const HOME = "menu/menu-responsavel.html";
const DEMO_ACCOUNTS = [
  { email: "responsavel1@falaleve.local", password: "Responsavel123!", id: "demo-responsavel-1", name: "Responsável de demonstração 1" },
  { email: "responsavel2@falaleve.local", password: "Responsavel456!", id: "demo-responsavel-2", name: "Responsável de demonstração 2" },
];

const form       = document.getElementById('form-login');
const emailInput = document.getElementById('email_responsavel');
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
    email_responsavel: emailInput.value.trim(),
    senha:             senhaInput.value,
  };

  if (!payload.email_responsavel || !payload.senha) {
    mostrarStatus('Preencha e-mail e senha.');
    return;
  }

  const demoAccount = DEMO_ACCOUNTS.find(account =>
    payload.email_responsavel.toLowerCase() === account.email && payload.senha === account.password
  );
  if (demoAccount) {
    localStorage.setItem('responsavel', JSON.stringify({
      id_responsavel: demoAccount.id,
      nome_responsavel: demoAccount.name,
      email_responsavel: demoAccount.email,
      modo_demo: true,
    }));
    mostrarStatus('Entrando no modo demonstração...', false);
    setTimeout(() => { window.location.href = HOME; }, 250);
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
      localStorage.setItem('responsavel', JSON.stringify(dados));
      mostrarStatus(`Bem-vindo(a), ${dados.nome_responsavel}!`, false);
      setTimeout(() => { window.location.href = HOME; }, 800);
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

