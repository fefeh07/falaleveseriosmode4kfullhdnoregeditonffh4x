// ─── Máscara CPF ───────────────────────────────────────────────
document.getElementById('cpf').addEventListener('input', function () {
  let v = this.value.replace(/\D/g, '').slice(0, 11);
  if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
  else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
  else if (v.length > 3) v = v.replace(/(\d{3})(\d{0,3})/, '$1.$2');
  this.value = v;
});

// ─── Limpa erros ao digitar ────────────────────────────────────
document.querySelectorAll('input').forEach(input => {
  input.addEventListener('input', function () {
    const erro = document.getElementById('erro-' + this.id);
    if (erro) erro.style.display = 'none';
    this.style.borderColor = '#FFD0A8';
  });
});

// ─── Olhinho (mostrar/ocultar senha) ──────────────────────────
function toggleSenha() {
  const input = document.getElementById('senha');
  const icone = document.getElementById('icone-olho');
  if (input.type === 'password') {
    input.type = 'text';
    icone.className = 'ti ti-eye-off';
    document.getElementById('btn-olho').setAttribute('aria-label', 'Ocultar senha');
    document.getElementById('btn-olho').setAttribute('aria-pressed', 'true');
  } else {
    input.type = 'password';
    icone.className = 'ti ti-eye';
    document.getElementById('btn-olho').setAttribute('aria-label', 'Mostrar senha');
    document.getElementById('btn-olho').setAttribute('aria-pressed', 'false');
  }
}

// ─── Requisitos de senha em tempo real ────────────────────────
document.getElementById('senha').addEventListener('input', function () {
  const val = this.value;

  const temTamanho   = val.length >= 8 && val.length <= 16;
  const temMaiuscula = /[A-Z]/.test(val);
  const temEspecial  = /[!@#$%^&*(),.?":{}|<>_\-]/.test(val);

  marcarRequisito('req-tamanho',   temTamanho);
  marcarRequisito('req-maiuscula', temMaiuscula);
  marcarRequisito('req-especial',  temEspecial);
});

function marcarRequisito(id, valido) {
  const el    = document.getElementById(id);
  const icone = el.querySelector('i');
  if (valido) {
    el.classList.add('ok');
    icone.className = 'ti ti-circle-check';
  } else {
    el.classList.remove('ok');
    icone.className = 'ti ti-circle';
  }
}

// ─── Mostrar erro nos campos ───────────────────────────────────
function mostrarErro(id) {
  const input = document.getElementById(id);
  const erro  = document.getElementById('erro-' + id);
  if (input) input.style.borderColor = '#c0392b';
  if (erro)  erro.style.display = 'block';
}

// ─── Envio / validação final ───────────────────────────────────
function entrar() {
  const nome  = document.getElementById('nome').value.trim();
  const cpf   = document.getElementById('cpf').value.trim();
  const idade = document.getElementById('idade').value.trim();
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;

  const senhaValida =
    senha.length >= 8 &&
    senha.length <= 16 &&
    /[A-Z]/.test(senha) &&
    /[!@#$%^&*(),.?":{}|<>_\-]/.test(senha);

  let valido = true;

  if (!nome)                                  { mostrarErro('nome');  valido = false; }
  if (cpf.length < 14)                        { mostrarErro('cpf');   valido = false; }
  if (!idade || idade < 0 || idade > 120)     { mostrarErro('idade'); valido = false; }
  if (!email.includes('@') || !email.includes('.')) { mostrarErro('email'); valido = false; }
  if (!senhaValida)                           { mostrarErro('senha'); valido = false; }

  if (!valido) return;

  // Substitua pelo redirecionamento ou chamada de API
  alert('Cadastro realizado com sucesso! Em breve entraremos em contato.');
}
