-- Run once in Supabase Dashboard → SQL Editor if you prefer client-side uploads.
-- Creates the chronicle bucket and anon access policies.

insert into storage.buckets (id, name, public)
values ('chronicle', 'chronicle', false)
on conflict (id) do nothing;

create policy "Allow anon uploads to chronicle"
on storage.objects for insert
to anon
with check (bucket_id = 'chronicle');

create policy "Allow anon reads from chronicle"
on storage.objects for select
to anon
using (bucket_id = 'chronicle');
