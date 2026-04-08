-- Tabela de leads SDR: rastreia cada lead na cadência de prospecção
create table if not exists public.sdr_leads (
  id                 uuid        primary key default gen_random_uuid(),
  client_id          uuid        not null references public.clients(id) on delete cascade,

  -- Dados do lead
  nome               text,
  telefone           text        not null,
  email              text,
  origem             text        default 'desconhecido',  -- meta_ads | google_ads

  -- Controle de cadência
  estado             text        not null default 'novo',
  -- novo | tentativa_1 | tentativa_2 | tentativa_3 | em_conversa
  -- qualificado | nao_qualificado | reuniao_agendada | descartado

  proxima_acao       text,
  -- follow_up_5min | tentativa_2 | follow_up_4h | tentativa_3 | descarte | null

  proxima_acao_at    timestamptz,
  ultima_acao_at     timestamptz default now(),

  -- Histórico de conversa para o Claude
  historico_conversa jsonb       not null default '[]'::jsonb,

  -- BANT (preenchido pela IA durante qualificação)
  bant_budget        text,
  bant_authority     text,
  bant_need          text,
  bant_timeline      text,
  qualificado        boolean,
  motivo_perda       text,

  -- CRM
  crm_deal_id        text,

  -- Reunião
  reuniao_at         timestamptz,

  created_at         timestamptz not null default now()
);

-- RLS
alter table public.sdr_leads enable row level security;
create policy "Service role full access" on public.sdr_leads
  using (true) with check (true);

-- Índices
create index if not exists idx_sdr_leads_pendentes
  on public.sdr_leads(proxima_acao_at)
  where estado not in ('descartado', 'nao_qualificado', 'reuniao_agendada');

create index if not exists idx_sdr_leads_telefone  on public.sdr_leads(telefone);
create index if not exists idx_sdr_leads_client_id on public.sdr_leads(client_id);
