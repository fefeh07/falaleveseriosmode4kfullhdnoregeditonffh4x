-- Como usar: SQL Editor > New query > colar > Run
-- Segue a modelagem da imagem enviada (8 tabelas).

-- ============================================================ metodo_pagamento
create table if not exists public.metodo_pagamento (
  id_metodo   serial primary key,
  descricao   varchar(100) not null
);

-- ================================================================ responsavel
create table if not exists public.responsavel (
  id_responsavel          serial primary key,
  nome_responsavel        varchar(150) not null,
  cpf_responsavel         varchar(14)  not null unique,
  rg_responsavel          varchar(20),
  pagamento_responsavel   varchar(50),
  telefone_responsavel    varchar(20),
  email_responsavel       varchar(150) not null unique,
  estado_responsavel      varchar(2),
  cidade_responsavel      varchar(100),
  bairro_responsavel      varchar(100),
  rua_responsavel         varchar(150),
  numero_responsavel      varchar(10),
  endereco_responsavel    varchar(255),
  cep_responsavel         varchar(10),
  data_nascimento_responsavel date,
  id_metodo_pagamento     integer references public.metodo_pagamento(id_metodo),
  criado_em               timestamptz not null default now()
);

-- ==================================================================== paciente
create table if not exists public.paciente (
  id_paciente            serial primary key,
  id_responsavel         integer references public.responsavel(id_responsavel),
  nome_paciente          varchar(150) not null,
  cpf_paciente           varchar(14)  not null unique,
  data_nascimento_paciente date,
  data_inicio_tratamento   date,
  pagamento_paciente     varchar(50),
  telefone_paciente      varchar(20),
  email_paciente         varchar(150) not null unique,
  estado_paciente        varchar(2),
  cidade_paciente        varchar(100),
  bairro_paciente        varchar(100),
  rua_paciente           varchar(150),
  endereco_paciente      varchar(255),
  cep_paciente           varchar(10),
  senha_hash             text not null,           -- hash Argon2
  criado_em              timestamptz not null default now()
);

-- =================================================================== psicologo
create table if not exists public.psicologo (
  id_psicologo            serial primary key,
  nome_psicologo          varchar(150) not null,
  cpf_psicologo           varchar(14)  not null unique,
  rg_psicologo            varchar(20),
  crp_psicologo           varchar(20)  not null unique,
  regiao_psicologo        varchar(50),
  status_psicologo        varchar(30),
  data_formatura_psicologo date,
  email_psicologo         varchar(150) not null unique,
  telefone_psicologo      varchar(20),
  area_especialidade      varchar(100),
  data_nascimento_psicologo date,
  senha_hash              text not null,           -- hash Argon2
  criado_em               timestamptz not null default now()
);

-- ================================================================== assinatura
create table if not exists public.assinatura (
  id_assinatura      serial primary key,
  id_paciente        integer not null references public.paciente(id_paciente) on delete cascade,
  status_assinatura  varchar(30),
  data_inicio        date,
  data_renovacao     date,
  valor_mensalidade  numeric(10,2),
  criado_em          timestamptz not null default now()
);

-- =============================================================== mensagem_chat
create table if not exists public.mensagem_chat (
  id_mensagem    serial primary key,
  id_paciente    integer not null references public.paciente(id_paciente) on delete cascade,
  id_psicologo   integer not null references public.psicologo(id_psicologo) on delete cascade,
  enviado_por    varchar(20) not null check (enviado_por in ('paciente','psicologo')),
  conteudo_texto text not null,
  data_envio     timestamptz not null default now()
);

-- ================================================================ sessao_video
create table if not exists public.sessao_video (
  id_sessao     serial primary key,
  id_paciente   integer not null references public.paciente(id_paciente) on delete cascade,
  id_psicologo  integer not null references public.psicologo(id_psicologo) on delete cascade,
  data_sessao   date not null,
  hora_inicio   time not null,
  hora_fim      time not null,
  status_sessao varchar(30) not null default 'agendada',
  criado_em     timestamptz not null default now()
);

-- =============================================================== ficha_clinica
create table if not exists public.ficha_clinica (
  id_ficha             serial primary key,
  id_paciente          integer not null references public.paciente(id_paciente) on delete cascade,
  id_psicologo         integer not null references public.psicologo(id_psicologo) on delete cascade,
  data_registro        date not null default current_date,
  anotacoes_avaliacao  text,
  diagnostico_observado text,
  criado_em            timestamptz not null default now()
);

-- ============================================================== Segurança (RLS)
alter table public.metodo_pagamento enable row level security;
alter table public.responsavel      enable row level security;
alter table public.paciente         enable row level security;
alter table public.psicologo        enable row level security;
alter table public.assinatura       enable row level security;
alter table public.mensagem_chat    enable row level security;
alter table public.sessao_video     enable row level security;
alter table public.ficha_clinica    enable row level security;