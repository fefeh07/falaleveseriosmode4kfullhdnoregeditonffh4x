const cpfInput = document.getElementById('cpf');
const senhaInput = document.getElementById('senha');
const toggleSenha = document.getElementById('toggleSenha');

toggleSenha.addEventListener('click', function () {
  const mostrarSenha = senhaInput.type === 'password';
  senhaInput.type = mostrarSenha ? 'text' : 'password';
  toggleSenha.setAttribute('aria-label', mostrarSenha ? 'Ocultar senha' : 'Mostrar senha');
  toggleSenha.setAttribute('aria-pressed', String(mostrarSenha));
  toggleSenha.querySelector('i').className = mostrarSenha ? 'ti ti-eye-off' : 'ti ti-eye';
});

cpfInput.addEventListener('input', function () {
  const digits = this.value.replace(/\D/g, '').slice(0, 11);
  let formattedCpf = digits;

  if (digits.length > 9) {
    formattedCpf = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  } else if (digits.length > 6) {
    formattedCpf = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  } else if (digits.length > 3) {
    formattedCpf = `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }

  this.value = formattedCpf;
});

function atualizarRequisitosSenha() {
  const senha = senhaInput.value;
  const requisitos = [
    { elemento: document.getElementById('req-length'), valido: senha.length >= 8 && senha.length <= 16 },
    { elemento: document.getElementById('req-uppercase'), valido: /[A-Z]/.test(senha) },
    { elemento: document.getElementById('req-special'), valido: /[^A-Za-z0-9]/.test(senha) }
  ];

  requisitos.forEach(function (requisito) {
    requisito.elemento.classList.toggle('is-valid', requisito.valido);
    requisito.elemento.querySelector('i').className = requisito.valido
      ? 'ti ti-circle-check'
      : 'ti ti-circle';
  });
}

senhaInput.addEventListener('input', atualizarRequisitosSenha);
atualizarRequisitosSenha();

function enviarFormulario() {
  const nome = document.getElementById('nome').value.trim();
  const cpf = document.getElementById('cpf').value.trim();
  const idade = document.getElementById('idade').value.trim();
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;

  if (!nome || !cpf || !idade || !email || !senha) {
    alert('Por favor, preencha todos os campos antes de continuar.');
    return;
  }

  const senhaValida = senha.length >= 8 && senha.length <= 16 && /[A-Z]/.test(senha) && /[^A-Za-z0-9]/.test(senha);
  if (!senhaValida) {
    alert('A senha deve ter de 8 a 16 caracteres, pelo menos uma letra maiúscula e um caractere especial.');
    senhaInput.focus();
    return;
  }

  alert('Cadastro realizado com sucesso! Em breve entraremos em contato.');
}