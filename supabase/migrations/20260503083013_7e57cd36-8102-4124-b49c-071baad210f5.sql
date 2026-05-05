
-- Avatar storage bucket
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are publicly accessible"
on storage.objects for select using (bucket_id = 'avatars');

create policy "Users can upload own avatar"
on storage.objects for insert
with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update own avatar"
on storage.objects for update
using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own avatar"
on storage.objects for delete
using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Reason columns on feedback
alter table public.feedback
  add column if not exists pin_reason text,
  add column if not exists hide_reason text;

-- Audit log table
create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null,
  action text not null,
  feedback_id uuid,
  feedback_title text,
  reason text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_log enable row level security;

create policy "Moderators view audit log"
on public.admin_audit_log for select to authenticated
using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'));

create policy "Moderators insert audit log"
on public.admin_audit_log for insert to authenticated
with check (
  admin_id = auth.uid()
  and (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'))
);

create index admin_audit_log_created_at_idx on public.admin_audit_log (created_at desc);
