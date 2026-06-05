alter table public.app_config
  add column max_daily_generations int not null default 5;
