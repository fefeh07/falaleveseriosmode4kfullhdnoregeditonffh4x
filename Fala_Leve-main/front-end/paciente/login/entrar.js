const API  = "/pacientes/login";
const HOME = "menu/menu-paciente.html";
const DEMO_EMAIL = "demo-paciente@falaleve.local";
const DEMO_PASSWORD = "Paciente123!";

const form        = document.getElementById('form-login');
const emailInput  = document.getElementById('email_paciente');
const senhaInput  = document.getElementById('senha');
const toggleSenha = document.getElementById('toggleSenha');
const msgStatus   = document.getElementById('msg-status');

// ─── Olhinho ─────────────────────────────────────────────────
toggleSenha.addEventListener('click', function () {
  const mostrar = senhaInput.type === 'password';
  senhaInput.type = mostrar ? 'text' : 'password';
  toggleSenha.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
  toggleSenha.setAttribute('aria-pressed', String(mostrar));
  toggleSenha.querySelector('i').className = mostrar ? 'ti ti-eye-off' : 'ti ti-eye';
});

function mostrarStatus(texto, erro = true) {
  msgStatus.textContent = texto;
  msgStatus.style.color = erro ? '#c0392b' : '#34785e';
}

// ─── Envio ───────────────────────────────────────────────────
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  mostrarStatus('');

  const payload = {
    email_paciente: emailInput.value.trim(),
    senha:          senhaInput.value,
  };

  if (!payload.email_paciente || !payload.senha) {
    mostrarStatus('Preencha e-mail e senha.');
    return;
  }

  if (payload.email_paciente.toLowerCase() === DEMO_EMAIL && payload.senha === DEMO_PASSWORD) {
    localStorage.setItem('paciente', JSON.stringify({
      id_paciente: 'demo-paciente',
      nome_paciente: 'Paciente de demonstração',
      email_paciente: DEMO_EMAIL,
      modo_demo: true
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
      localStorage.setItem('paciente', JSON.stringify(dados));
      mostrarStatus(`Bem-vindo(a), ${dados.nome_paciente}!`, false);
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
