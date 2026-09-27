-- SamaCoach AI — schéma MVP. 6 tables exactement.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  email text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.learning_paths (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  skill text not null,
  level text not null check (level in ('beginner','intermediate','advanced')),
  goal text not null,
  daily_time integer not null check (daily_time between 15 and 240),
  duration integer not null check (duration between 1 and 365),
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  path_id uuid not null references public.learning_paths (id) on delete cascade,
  day integer not null,
  title text not null,
  content text not null default '',
  difficulty integer not null default 1 check (difficulty between 1 and 5),
  created_at timestamptz not null default now()
);

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  kind text not null default 'qcm' check (kind in ('qcm','code')),
  topic text not null default '',
  question text not null,
  options jsonb,
  correct_answer text,
  explanation text not null default '',
  difficulty integer not null default 1 check (difficulty between 1 and 5),
  starter_code text,
  reference_solution text,
  created_at timestamptz not null default now()
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  answer text not null default '',
  is_correct boolean not null default false,
  score integer not null default 0 check (score between 0 and 100),
  feedback jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  path_id uuid not null references public.learning_paths (id) on delete cascade,
  completed_lessons integer not null default 0,
  total_lessons integer not null default 0,
  mastery_score integer not null default 0,
  current_level integer not null default 1,
  updated_at timestamptz not null default now()
);

create index if not exists attempts_user_created_idx on public.attempts (user_id, created_at desc);
create index if not exists exercises_lesson_idx on public.exercises (lesson_id);
create index if not exists lessons_path_idx on public.lessons (path_id);
create index if not exists learning_paths_user_idx on public.learning_paths (user_id);

-- UNIQUE, et pas seulement indexé : `progress` est un état courant unique par
-- utilisateur. Les .upsert({ onConflict: "user_id" }) du seed et de
-- services/learning-path s'appuient sur cette contrainte — Postgres refuse
-- `ON CONFLICT (user_id)` si aucun index unique ne correspond.
create unique index if not exists progress_user_unique_idx on public.progress (user_id);

-- Provisionnement automatique du profil à l'inscription
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS sur les 6 tables
alter table public.profiles       enable row level security;
alter table public.learning_paths enable row level security;
alter table public.lessons        enable row level security;
alter table public.exercises      enable row level security;
alter table public.attempts       enable row level security;
alter table public.progress       enable row level security;

drop policy if exists "own profiles" on public.profiles;
create policy "own profiles" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "own learning_paths" on public.learning_paths;
create policy "own learning_paths" on public.learning_paths
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own progress" on public.progress;
create policy "own progress" on public.progress
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own attempts" on public.attempts;
create policy "own attempts" on public.attempts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own lessons" on public.lessons;
create policy "own lessons" on public.lessons
  for select using (
    exists (
      select 1 from public.learning_paths lp
      where lp.id = lessons.path_id and lp.user_id = auth.uid()
    )
  );

-- INSERT et UPDATE sont nécessaires : createLearningPath insère les leçons,
-- ensureLessonContent les complète au fil de l'eau, et les deux passent par le
-- client authentifié de l'utilisateur, donc soumis à la RLS. Sans ces policies
-- l'onboarding échoue sur « new row violates row-level security policy ».
drop policy if exists "insert own lessons" on public.lessons;
create policy "insert own lessons" on public.lessons
  for insert with check (
    exists (
      select 1 from public.learning_paths lp
      where lp.id = lessons.path_id and lp.user_id = auth.uid()
    )
  );

drop policy if exists "update own lessons" on public.lessons;
create policy "update own lessons" on public.lessons
  for update using (
    exists (
      select 1 from public.learning_paths lp
      where lp.id = lessons.path_id and lp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.learning_paths lp
      where lp.id = lessons.path_id and lp.user_id = auth.uid()
    )
  );

drop policy if exists "own exercises" on public.exercises;
create policy "own exercises" on public.exercises
  for select using (
    exists (
      select 1 from public.lessons l
      join public.learning_paths lp on lp.id = l.path_id
      where l.id = exercises.lesson_id and lp.user_id = auth.uid()
    )
  );

-- Même raison que pour les leçons : generateExercise insère via le client de
-- l'utilisateur.
drop policy if exists "insert own exercises" on public.exercises;
create policy "insert own exercises" on public.exercises
  for insert with check (
    exists (
      select 1 from public.lessons l
      join public.learning_paths lp on lp.id = l.path_id
      where l.id = exercises.lesson_id and lp.user_id = auth.uid()
    )
  );

drop policy if exists "update own exercises" on public.exercises;
create policy "update own exercises" on public.exercises
  for update using (
    exists (
      select 1 from public.lessons l
      join public.learning_paths lp on lp.id = l.path_id
      where l.id = exercises.lesson_id and lp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.lessons l
      join public.learning_paths lp on lp.id = l.path_id
      where l.id = exercises.lesson_id and lp.user_id = auth.uid()
    )
  );
