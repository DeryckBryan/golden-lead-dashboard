alter table client_actions
  add column if not exists sdr_instrucoes text default null;
