// Formata CPF e CRP durante a digitação
function formatarCpf(valor) {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);
  return numeros
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3}\.\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3}\.\d{3}\.\d{3})(\d{1,2})$/, "$1-$2");
}

function formatarCrp(valor) {
  const numeros = valor.replace(/\D/g, "").slice(0, 7);
  return numeros.replace(/^(\d{2})(\d)/, "$1/$2");
}

document.getElementById("cpf").addEventListener("input", function () {
  this.value = formatarCpf(this.value);
});

document.getElementById("crp").addEventListener("input", function () {
  this.value = formatarCrp(this.value);
});

// Olhinho
function toggleSenha() {
    const input = document.getElementById('senha');
    const icone = document.getElementById('icone-olho');
    if (input.type === 'password') {
      input.type = 'text';
      icone.className = 'ti ti-eye-off';
    } else {
      input.type = 'password';
      icone.className = 'ti ti-eye';
    }
  }
  
  // Validação em tempo real
  document.getElementById('senha').addEventListener('input', function () {
    const val = this.value;
  
    const temTamanho  = val.length >= 8 && val.length <= 16;
    const temMaiuscula = /[A-Z]/.test(val);
    const temEspecial  = /[!@#$%^&*(),.?":{}|<>_\-]/.test(val);
  
    marcarRequisito('req-tamanho',  temTamanho);
    marcarRequisito('req-maiuscula', temMaiuscula);
    marcarRequisito('req-especial',  temEspecial);
  });
  
  function marcarRequisito(id, valido) {
    const el = document.getElementById(id);
    const icone = el.querySelector('i');
    if (valido) {
      el.classList.add('ok');
      icone.className = 'ti ti-circle-check';
    } else {
      el.classList.remove('ok');
      icone.className = 'ti ti-circle';
    }
  }