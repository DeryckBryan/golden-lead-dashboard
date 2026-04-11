alter table client_actions
  add column if not exists sdr_tempo_resposta text default 'mediano',
  add column if not exists sdr_max_mensagens  text default 'normal';
