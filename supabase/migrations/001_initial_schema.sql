-- profiles: one row per user, linked to Supabase auth
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  role        text not null default 'author',
  created_at  timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

-- auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- app_config: single row, admin-editable
create table public.app_config (
  id                  int primary key default 1,
  word_count_target   int not null default 800,
  max_regenerations   int not null default 3,
  house_style_notes   text
);
insert into public.app_config (id) values (1);

-- articles
create table public.articles (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  title               text,
  status              text not null default 'draft',
  hook                text,
  body                jsonb,
  best_for            text,
  not_for             text,
  ethics_notes        text,
  key_facts           jsonb,
  sourced_fields      jsonb,
  images              jsonb not null default '[]',
  original_file_url   text,
  regeneration_count  int not null default 0,
  word_count_target   int,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index articles_user_id_idx on public.articles (user_id);

-- auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger articles_updated_at
  before update on public.articles
  for each row execute function public.set_updated_at();
