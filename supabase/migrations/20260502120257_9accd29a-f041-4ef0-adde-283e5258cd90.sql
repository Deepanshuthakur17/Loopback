
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Category enum
create type public.feedback_category as enum ('Bug', 'Feature', 'Improvement');

-- Feedback
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  description text not null check (char_length(description) between 5 and 2000),
  category public.feedback_category not null default 'Feature',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.feedback enable row level security;

create policy "Feedback viewable by authenticated"
  on public.feedback for select to authenticated using (true);
create policy "Users insert own feedback"
  on public.feedback for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own feedback"
  on public.feedback for update to authenticated using (auth.uid() = user_id);
create policy "Users delete own feedback"
  on public.feedback for delete to authenticated using (auth.uid() = user_id);

create index feedback_created_idx on public.feedback (created_at desc);
create index feedback_category_idx on public.feedback (category);

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger feedback_touch_updated
  before update on public.feedback
  for each row execute function public.touch_updated_at();

-- Votes (one per user per feedback)
create table public.votes (
  feedback_id uuid not null references public.feedback(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (feedback_id, user_id)
);
alter table public.votes enable row level security;

create policy "Votes viewable by authenticated"
  on public.votes for select to authenticated using (true);
create policy "Users insert own vote"
  on public.votes for insert to authenticated with check (auth.uid() = user_id);
create policy "Users delete own vote"
  on public.votes for delete to authenticated using (auth.uid() = user_id);

create index votes_feedback_idx on public.votes (feedback_id);
