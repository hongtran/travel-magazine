insert into storage.buckets (id, name, public)
values ('articles', 'articles', false);

-- only service role (backend) can access
create policy "Service role full access"
  on storage.objects for all
  using (auth.role() = 'service_role');
