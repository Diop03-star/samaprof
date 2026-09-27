# SamaCoach AI — Plan d'implémentation de la tranche verticale MVP

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer le parcours complet Onboarding → Plan → Leçon → Exercice → Évaluation IA → Faiblesse détectée → Exercice correctif → Progression, fonctionnel de bout en bout et démontrable sans clé IA.

**Architecture:** Contrat `AIProvider` à 5 fonctions, trois implémentations indépendantes (NVIDIA, Gemini, demo) résolues par une chaîne de fallback silencieuse. La décision adaptative n'est jamais déléguée au modèle : `lib/adaptation/rules.ts` recalcule le mastery et tranche ; l'IA ne fournit que le texte du conseil. Le mode démo est un scénario déterministe, pas un bouchon.

**Tech Stack:** Next.js 15 (App Router), TypeScript strict, Tailwind CSS, shadcn/ui, Supabase (PostgreSQL + Auth), Vitest, tsx, Vercel.

## Amendements au spec

| Spec | Plan | Raison |
|---|---|---|
| Aucune dépendance hors `@supabase/ssr` | Ajout de `vitest` et `tsx` (devDependencies) | Tester et exécuter du TypeScript sans runner impose `--experimental-strip-types` avec imports à extension explicite, en conflit avec les imports Next.js |
| `supabase/seed.sql` | `scripts/seed.ts` | Créer l'utilisateur démo dans `auth.users` en SQL suppose un accès au schéma interne ; `supabase.auth.admin.createUser` est plus fiable et s'exécute via `npm run seed` |
| Deux branches : `develop` en intégration, `main` réservée au déploiement | Une seule branche, `main`, en intégration et par défaut | Le propriétaire du dépôt a renommé `develop` en `main` le 2026-09-27. La contrainte « on ne travaille jamais sur `main` » reste respectée en substance : elle est portée par la protection de branche (pull request obligatoire, `typecheck` et `test` verts, une approbation), pas par le nom de la branche. Voir `docs/superpowers/specs/2026-09-27-workflow-equipe-git-design.md` |

## Global Constraints

- TypeScript `strict: true`. Aucune erreur `tsc --noEmit` tolérée.
- Aucune clé API dans un Client Component. Aucun secret commité. `.env.local` gitignoré, `.env.example` fourni.
- Le fallback de la chaîne IA est **silencieux** : l'utilisateur ne voit jamais la panne d'un provider interne.
- `AI_PROVIDER` ∈ {`nvidia`, `gemini`, `demo`}. Absent ou invalide → `demo`. `AI_PROVIDER=demo` force le mode démo.
- Timeout HTTP : 15 000 ms sur tout appel provider.
- Seuils d'adaptation : `score < 40` → `remediation` ; `40 ≤ score < 75` → `same_level` ; `score ≥ 75` → `increase_difficulty`.
- `masteryScore` = moyenne des `score` des **5** derniers `attempts`, du plus récent au plus ancien. 0 attempt → `next_topic`.
- 6 tables exactement : `profiles`, `learning_paths`, `lessons`, `exercises`, `attempts`, `progress`. Aucune autre.
- RLS sur les 6 tables, chaque policy fondée sur `auth.uid()`. `lessons` et `exercises` ont une policy par opération (`select`, `insert`, `update`) car les services écrivent avec le client de l'utilisateur.
- On ne travaille jamais directement sur `main`. Toute modification passe par une branche `feature/*` et une pull request, mergeée seulement au vert. Voir l'amendement sur la branche d'intégration dans le tableau ci-dessus.
- Préfixes de commit : `feat:`, `fix:`, `ui:`, `ai:`, `db:`, `test:`, `refactor:`, `docs:`.
- **Critère de non-régression principal** : le parcours fonctionne intégralement avec `AI_PROVIDER` absent.

## Fichiers du plan

| Fichier | Responsabilité |
|---|---|
| `supabase/schema.sql` | DDL des 6 tables, index, RLS, policies, trigger de profil |
| `lib/supabase/client.ts` | Client Supabase navigateur |
| `lib/supabase/server.ts` | Client Supabase serveur + `getCurrentUser` |
| `middleware.ts` | Rafraîchissement de session |
| `lib/validation/onboarding.ts` | Validation manuelle des 4 champs d'onboarding |
| `types/index.ts` | Types du domaine, contrat IA, types de lignes |
| `lib/ai/provider.ts` | Interface `AIProvider` |
| `lib/ai/validate.ts` | Validation manuelle des 5 sorties IA |
| `lib/ai/http.ts` | `fetchJson` avec timeout 15 s et `AIError` |
| `lib/ai/demo.ts` | Provider déterministe du scénario Amadou |
| `lib/ai/nvidia.ts` | Provider NVIDIA / Brev |
| `lib/ai/gemini.ts` | Provider Gemini |
| `lib/ai/index.ts` | Chaîne de résolution + fallback |
| `lib/adaptation/rules.ts` | Autorité de la décision adaptative |
| `services/*.ts` | Orchestration métier, seule couche qui parle à `lib/ai` et `lib/supabase` |
| `app/api/*/route.ts` | 4 Route Handlers |
| `scripts/seed.ts` | Seed idempotent du persona Amadou |

## Répartition équipe

- **Member 1** (Full Stack) → Tasks 1, 2, 3, 7, 8
- **Member 2** (IA / NVIDIA) → Tasks 4, 5, 6, 9
- **Member 3** (Frontend / UX / QA) → Tasks 10, 11, 12, 13, 14, 15, 16, 17

Tasks 4, 5, 6, 9 ne dépendent d'aucune tâche de Member 1 : elles peuvent commencer en parallèle immédiatement.

---

### Task 1: Scaffolding, TypeScript strict, env, Vitest

**Files:**
- Create: base Next.js via `create-next-app`
- Modify: `tsconfig.json`, `.gitignore`, `package.json`
- Create: `.env.example`, `vitest.config.ts`, `tests/smoke.test.ts`

**Interfaces:**
- Consumes: rien
- Produces: scripts `test`, `test:watch`, `typecheck`, `seed`. Arborescence `app/`, `components/`, `lib/`, `types/`, `tests/`.

Le chemin du projet contient un espace, ce qui fait échouer `create-next-app`. On scaffolder dans un dossier temporaire sans espace, puis on déplace.

- [ ] **Step 1: Scaffolder dans un dossier temporaire sans espace**

```bash
cd /c/Users/Admin/AppData/Local/Temp/opencode
npx --yes create-next-app@15 samacoach-tmp --typescript --tailwind --eslint --app --import-alias "@/*" --use-npm --no-turbopack
```

Expected: dossier `samacoach-tmp` créé, dépendances installées.

- [ ] **Step 2: Déplacer le contenu dans le projet**

```bash
cd "C:/Users/Admin/Desktop/Freelancing Website/SamaCoach AI"
cp -r /c/Users/Admin/AppData/Local/Temp/opencode/samacoach-tmp/. .
rm -rf /c/Users/Admin/AppData/Local/Temp/opencode/samacoach-tmp
ls
```

Expected: `app/`, `components/`, `package.json`, `tsconfig.json` présents.

- [ ] **Step 3: Installer les dépendances**

```bash
npm install @supabase/ssr @supabase/supabase-js
npm install -D vitest tsx
```

- [ ] **Step 4: Durcir `.gitignore`**

Ajouter en fin de fichier, sans dupliquer ce qui existe déjà :

```
.env
.env*.local
!.env.example
.vercel
```

- [ ] **Step 5: Créer `.env.example`**

```bash
# URL du projet Supabase (Settings > API)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Serveur uniquement. Jamais exposée au client.
SUPABASE_SERVICE_ROLE_KEY=

# Fournisseur IA. Absent => demo. Forcer "demo" pour répéter la démo.
AI_PROVIDER=

# Serveur uniquement.
NVIDIA_API_KEY=
NVIDIA_MODEL=qwen/qwen2.5-coder-32b-instruct
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
```

- [ ] **Step 6: TypeScript strict et scripts npm**

Remplacer `tsconfig.json` :

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Remplacer `scripts` dans `package.json` :

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "vitest run",
  "test:watch": "vitest",
  "typecheck": "tsc --noEmit",
  "seed": "tsx --env-file=.env.local scripts/seed.ts"
}
```

- [ ] **Step 7: Configurer Vitest**

Créer `vitest.config.ts` :

> **Pourquoi `process.cwd()` et pas `__dirname`** : ce fichier est écrit en syntaxe ESM
> alors que `package.json` ne déclare pas `"type": "module"`. Vite le charge donc en
> CommonJS, et `__dirname` n'existe que par cet accident. Les deux remèdes évidents
> (`vitest.config.mts`, ou ajout de `"type": "module"`) suppriment `__dirname` et ont
> été testés : ils lèvent `ReferenceError: __dirname is not defined` et font échouer la
> suite complète. `process.cwd()` vaut le racine projet sous tout chargeur.
>
> Ce que ce changement corrige : la dépendance à un global propre au CommonJS. Ce
> qu'il ne corrige pas : l'avertissement `configLoader: 'native'`, qui porte sur la
> façon dont Vite charge le fichier (il vise `vitest.config.ts:1:1`, la ligne d'import,
> pas l'alias) et qui exige les deux remèdes interdits pour disparaître. Il est
> cosmétique, il est laissé en place tel quel.

```typescript
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(process.cwd(), ".") },
  },
});
```

- [ ] **Step 8: Test de fumée**

Créer `tests/smoke.test.ts` :

```typescript
import { describe, it, expect } from "vitest";

describe("harnais de test", () => {
  it("s'exécute", () => {
    expect(1 + 1).toBe(2);
  });
});
```

Créer `tests/alias.test.ts` — garde-fou sur la cible de l'alias `@`, la ligne de config
dont dépendent tous les imports des 16 tâches suivantes :

```typescript
import { describe, it, expect } from "vitest";
import path from "node:path";
import config from "../vitest.config";

describe("alias @", () => {
  it("pointe sur la racine du projet", () => {
    const alias = (config.resolve?.alias ?? {}) as Record<string, string>;
    expect(alias["@"]).toBe(path.resolve(process.cwd(), "."));
  });
});
```

> Ce test vérifie la **cible** de l'alias, pas le mécanisme. Il échouerait si `@` était
> repointé ailleurs, mais il ne peut pas distinguer `__dirname` de `process.cwd()` : les
> deux valent le même chemin ici, la config étant à la racine du dépôt. C'est mesuré, pas
> supposé. Il porte sur la config et non sur un import réel, parce qu'aucun module de
> `lib/` n'existe avant la Task 3 ; la Task 3 importe `lib/supabase/server` via `@/` dans
> ses propres tests, ce qui couvre le côté résolution réelle.

- [ ] **Step 9: Vérifier**

```bash
npm run test
npm run typecheck
```

Expected: 2 tests passés (1 smoke + 1 alias), `tsc` sans sortie.

- [ ] **Step 10: Branche et commit**

```bash
git checkout -b feature/scaffold
git add .
git commit -m "feat: scaffold Next.js project with strict TypeScript and vitest"
```

---

### Task 2: Schéma Supabase, RLS, trigger de profil

**Files:**
- Create: `supabase/schema.sql`

**Interfaces:**
- Consumes: rien
- Produces: 6 tables, RLS active sur les 6, policies nommé `own *`, trigger `on_auth_user_created` qui crée la ligne `profiles` à chaque inscription.

- [ ] **Step 1: Écrire `supabase/schema.sql`**

```sql
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

-- Un SEUL parcours par utilisateur. Le code applicatif teste déjà l'existence d'un
-- chemin avant d'en créer un, et toutes les lectures filtrent par `user_id` seul
-- (jamais par `path_id`) — mais sans cette contrainte, un second createLearningPath
-- insérerait un second chemin puis l'upsert suivant, dont l'arbitre est `user_id`,
-- réécrirait `path_id` et remettrait les compteurs à zéro. Perte silencieuse, sans
-- erreur. La base doit imposer le modèle, pas seulement le code.
create unique index if not exists learning_paths_user_unique_idx on public.learning_paths (user_id);

-- UNIQUE, et pas seulement indexé : `progress` est un état courant unique par
-- utilisateur. Les .upsert({ onConflict: "user_id" }) du seed et de
-- services/learning-path s'appuient sur cette contrainte — Postgres refuse
-- `ON CONFLICT (user_id)` si aucun index unique ne correspond. Cohérent avec
-- learning_paths_user_unique_idx ci-dessus : un chemin, une progression.
create unique index if not exists progress_user_unique_idx on public.progress (user_id);

-- `updated_at` n'est pas écrit par les payloads d'upsert : PostgREST n'écrit que les
-- colonnes présentes dans le payload, donc la colonne resterait figée à la date de
-- création. Un trigger la maintient à la source plutôt qu'à chaque site d'appel.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists progress_touch_updated_at on public.progress;
create trigger progress_touch_updated_at
  before update on public.progress
  for each row execute function public.touch_updated_at();

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

-- `own attempts` valide `user_id` mais doit aussi prouver que l'exercice visé
-- appartient bien à l'utilisateur : `exercises.lesson_id` est une contrainte
-- d'intégrité, pas d'autorisation. Sans cette sous-requête, n'importe quel UUID
-- d'exercice valide est accepté, y compris celui d'un autre utilisateur. Les lignes
-- injectées sont invisibles pour la victime, mais faussent tout agrégat inter-utilisateurs.
drop policy if exists "own attempts" on public.attempts;
create policy "own attempts" on public.attempts
  for all using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.exercises e
      join public.lessons l on l.id = e.lesson_id
      join public.learning_paths lp on lp.id = l.path_id
      where e.id = attempts.exercise_id and lp.user_id = auth.uid()
    )
  );

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
```

- [ ] **Step 2: Appliquer dans Supabase**

Dashboard Supabase → **SQL Editor** → coller le contenu de `supabase/schema.sql` → Run. Ou, si la CLI est installée :

```bash
supabase link --project-ref <ref>
supabase db push
```

Expected: aucune erreur.

- [ ] **Step 3: Vérifier les 6 tables et la RLS**

```sql
select table_name, row_security
from pg_tables
where schemaname = 'public'
order by table_name;
```

Expected: 6 lignes, toutes `row_security = true`. Moins de 6 lignes → une table manque.

- [ ] **Step 4: Vérifier les policies**

```sql
select tablename, policyname
from pg_policies
where schemaname = 'public'
order by tablename;
```

Expected: 10 policies — `own profiles`, `own learning_paths`, `own progress`, `own attempts` (une chacune, `for all`), plus `own lessons`, `insert own lessons`, `update own lessons`, `own exercises`, `insert own exercises`, `update own exercises`.

Vérifier aussi les index uniques qui portent les `upsert`, et le trigger de `updated_at` :

```sql
select indexname, indexdef
from pg_indexes
where schemaname = 'public' and tablename in ('progress', 'learning_paths')
order by indexname;

select tgname, tgrelid::regclass
from pg_trigger
where not tgisinternal and tgname = 'progress_touch_updated_at';
```

Expected: `learning_paths_user_unique_idx` et `progress_user_unique_idx` avec `UNIQUE` dans `indexdef` — sans quoi le seed échoue sur `ON CONFLICT (user_id)` et un second parcours écraserait la progression. Une ligne pour le trigger `progress_touch_updated_at` sur `public.progress`. Si un `indexdef` ne contient pas `UNIQUE`, le seed échouera.

- [ ] **Step 5: Commit**

```bash
git checkout -b feature/db-schema
git add supabase/schema.sql
git commit -m "db: add 6-table schema with RLS and profile provisioning trigger"
```

---

### Task 3: Clients Supabase et authentification minimale

**Files:**
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `middleware.ts`
- Create: `app/login/page.tsx`, `app/login/actions.ts`
- Create: `lib/validation/onboarding.ts`
- Test: `tests/onboarding-validation.test.ts`

**Interfaces:**
- Consumes: `supabase/schema.sql` (Task 2)
- Produces:
  - `lib/supabase/client.ts` → `createClient(): SupabaseClient`
  - `lib/supabase/server.ts` → `createClient(): Promise<SupabaseClient>`, `getCurrentUser(): Promise<{ userId: string } | null>`
  - `lib/validation/onboarding.ts` → `LEVELS`, `Level`, `OnboardingInput`, `validateOnboardingInput(raw: unknown): { ok: true; value: OnboardingInput } | { ok: false; error: string }`
  - `app/login/actions.ts` → `signIn`, `signUp`

- [ ] **Step 1: Créer `lib/supabase/client.ts`**

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: Créer `lib/supabase/server.ts`**

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Appelé depuis un Server Component : le middleware rafraîchit la session.
          }
        },
      },
    }
  );
}

export type CurrentUser = { userId: string };

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  return { userId: user.id };
}
```

- [ ] **Step 3: Créer `middleware.ts`**

```typescript
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 4: Écrire le test de validation (doit échouer)**

Créer `tests/onboarding-validation.test.ts` :

```typescript
import { describe, it, expect } from "vitest";
import { validateOnboardingInput } from "@/lib/validation/onboarding";

const valid = {
  skill: "Python",
  level: "beginner",
  goal: "Build Python applications",
  dailyTime: 60,
  duration: 30,
};

describe("validateOnboardingInput", () => {
  it("accepte une entrée valide", () => {
    expect(validateOnboardingInput(valid).ok).toBe(true);
  });

  it("rejette un niveau hors liste fermée", () => {
    expect(validateOnboardingInput({ ...valid, level: "expert" }).ok).toBe(false);
  });

  it("rejette un dailyTime hors bornes", () => {
    expect(validateOnboardingInput({ ...valid, dailyTime: 5 }).ok).toBe(false);
    expect(validateOnboardingInput({ ...valid, dailyTime: 500 }).ok).toBe(false);
  });

  it("rejette un duration hors bornes", () => {
    expect(validateOnboardingInput({ ...valid, duration: 0 }).ok).toBe(false);
    expect(validateOnboardingInput({ ...valid, duration: 400 }).ok).toBe(false);
  });

  it("rejette un skill vide ou trop long", () => {
    expect(validateOnboardingInput({ ...valid, skill: "" }).ok).toBe(false);
    expect(validateOnboardingInput({ ...valid, skill: "a".repeat(101) }).ok).toBe(false);
  });

  it("rejette une goal vide", () => {
    expect(validateOnboardingInput({ ...valid, goal: "   " }).ok).toBe(false);
  });

  it("rejette un objet non conforme", () => {
    expect(validateOnboardingInput(null).ok).toBe(false);
    expect(validateOnboardingInput("python").ok).toBe(false);
  });
});
```

- [ ] **Step 5: Lancer le test pour vérifier qu'il échoue**

```bash
npm run test -- tests/onboarding-validation.test.ts
```

Expected: FAIL, module `@/lib/validation/onboarding` introuvable.

- [ ] **Step 6: Implémenter `lib/validation/onboarding.ts`**

```typescript
export const LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type Level = (typeof LEVELS)[number];

export type OnboardingInput = {
  skill: string;
  level: Level;
  goal: string;
  dailyTime: number;
  duration: number;
};

export type ValidationResult =
  | { ok: true; value: OnboardingInput }
  | { ok: false; error: string };

const MAX_SKILL = 100;
const MAX_GOAL = 200;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateOnboardingInput(raw: unknown): ValidationResult {
  if (!isRecord(raw)) return { ok: false, error: "Invalid input." };

  const skill = typeof raw.skill === "string" ? raw.skill.trim() : "";
  const goal = typeof raw.goal === "string" ? raw.goal.trim() : "";
  const { level, dailyTime, duration } = raw;

  if (skill.length === 0 || skill.length > MAX_SKILL) {
    return { ok: false, error: "Skill is required." };
  }
  if (goal.length === 0 || goal.length > MAX_GOAL) {
    return { ok: false, error: "Goal is required." };
  }
  if (typeof level !== "string" || !LEVELS.includes(level as Level)) {
    return { ok: false, error: "Invalid level." };
  }
  if (
    typeof dailyTime !== "number" ||
    !Number.isInteger(dailyTime) ||
    dailyTime < 15 ||
    dailyTime > 240
  ) {
    return { ok: false, error: "Invalid daily time." };
  }
  if (
    typeof duration !== "number" ||
    !Number.isInteger(duration) ||
    duration < 1 ||
    duration > 365
  ) {
    return { ok: false, error: "Invalid duration." };
  }

  return {
    ok: true,
    value: { skill, goal, level: level as Level, dailyTime, duration },
  };
}
```

- [ ] **Step 7: Lancer le test pour vérifier qu'il passe**

```bash
npm run test -- tests/onboarding-validation.test.ts
```

Expected: 7 tests passés.

- [ ] **Step 8: Créer `app/login/actions.ts`**

```typescript
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(
  _prev: string | null,
  formData: FormData
): Promise<string | null> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return "Email and password are required.";

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return "Invalid email or password.";

  redirect("/dashboard");
}

export async function signUp(
  _prev: string | null,
  formData: FormData
): Promise<string | null> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || password.length < 8) {
    return "Email is required and password must be at least 8 characters.";
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) return error.message;

  redirect("/login");
}
```

- [ ] **Step 9: Créer `app/login/page.tsx`**

```tsx
"use client";

import { useActionState, useState } from "react";
import { signIn, signUp } from "./actions";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signInError, signInAction, signInPending] = useActionState(signIn, null);
  const [signUpError, signUpAction, signUpPending] = useActionState(signUp, null);

  const action = mode === "signin" ? signInAction : signUpAction;
  const error = mode === "signin" ? signInError : signUpError;
  const pending = mode === "signin" ? signInPending : signUpPending;

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <h1 className="text-2xl font-semibold text-white">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Your learning path. Your pace. Your AI coach.
        </p>

        <form action={action} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="text-sm text-slate-300">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm text-slate-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-orange-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white disabled:opacity-60"
          >
            {pending ? "Please wait..." : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 text-sm text-indigo-400 hover:underline"
        >
          {mode === "signin" ? "No account? Sign up" : "Already registered? Sign in"}
        </button>
      </div>
    </main>
  );
}
```

- [ ] **Step 10: Vérifier**

```bash
npm run typecheck
npm run test
```

Expected: `tsc` propre, 8 tests passés (1 smoke + 7 validation).

- [ ] **Step 11: Commit**

```bash
git checkout -b feature/auth
git add lib/supabase lib/validation app/login middleware.ts tests/onboarding-validation.test.ts
git commit -m "feat: add Supabase clients, session middleware, minimal auth and onboarding validation"
```

---

### Task 4: Types, contrat `AIProvider`, validation des sorties IA

**Files:**
- Create: `types/index.ts`, `lib/ai/provider.ts`, `lib/ai/validate.ts`
- Test: `tests/ai-validate.test.ts`

**Interfaces:**
- Consumes: `Level`, `OnboardingInput`, `ValidationResult` de `lib/validation/onboarding.ts` (Task 3)
- Produces:
  - Types `PlanInput`, `LessonInput`, `ExerciseInput`, `EvaluationInput`, `AdaptationInput`, `Module`, `LearningPlan`, `Lesson`, `Exercise`, `Evaluation`, `AdaptationAction`, `Adaptation`, `AdaptiveDecision`, `LessonRow`, `ExerciseRow`, `AttemptRow`, `AIProvider`
  - `interface AIProvider` : `readonly name: string` + `generateLearningPlan`, `generateLesson`, `generateExercise`, `evaluateAnswer`, `suggestAdaptation`
  - `parseLearningPlan`, `parseLesson`, `parseExercise`, `parseEvaluation`, `parseAdaptation` — toutes `(raw: unknown) => T | null`, renvoient `null` sur toute entrée non conforme

`lib/ai/provider.ts` réexporte tous ces types depuis `@/types`, pour que les providers n'importent qu'un seul module.

- [ ] **Step 1: Créer `types/index.ts`**

```typescript
import type { Level, OnboardingInput } from "@/lib/validation/onboarding";

export type { Level, OnboardingInput };

/* ---------- entrées ---------- */

export type PlanInput = {
  skill: string;
  level: Level;
  goal: string;
  dailyTime: number;
  duration: number;
};

export type LessonInput = {
  skill: string;
  level: Level;
  topic: string;
  goal: string;
  difficulty: number;
};

export type ExerciseInput = {
  topic: string;
  level: Level;
  difficulty: number;
  kind: "qcm" | "code";
};

export type EvaluationInput = {
  question: string;
  kind: "qcm" | "code";
  correctAnswer: string | null;
  referenceSolution: string | null;
  learnerAnswer: string;
  level: Level;
  topic: string;
};

export type AdaptationInput = {
  topic: string;
  level: Level;
  recentScores: number[];
  previousMistakes: string[];
  weaknesses: string[];
  masteryScore: number;
};

/* ---------- sorties ---------- */

export type Module = { title: string; objective: string; difficulty: number };

export type LearningPlan = {
  skill: string;
  level: Level;
  goal: string;
  modules: Module[];
};

export type Lesson = {
  title: string;
  objective: string;
  explanation: string;
  example: string;
  keyPoints: string[];
};

export type Exercise = {
  kind: "qcm" | "code";
  topic: string;
  question: string;
  difficulty: number;
  options: string[] | null;
  correctAnswer: string | null;
  starterCode: string | null;
  referenceSolution: string | null;
  explanation: string;
};

export type Evaluation = {
  correct: boolean;
  score: number;
  mistake: string;
  explanation: string;
  hint: string;
  weakness: string;
  masteryLevel: string;
};

export const ADAPTATION_ACTIONS = [
  "remediation",
  "same_level",
  "increase_difficulty",
  "next_topic",
] as const;

export type AdaptationAction = (typeof ADAPTATION_ACTIONS)[number];

export type Adaptation = {
  action: AdaptationAction;
  topic: string;
  difficulty: number;
  reason: string;
  nextActivity: string;
};

export type AdaptiveDecision = Adaptation & {
  source: "rules";
  masteryScore: number;
};

/* ---------- lignes base ---------- */

export type LessonRow = {
  id: string;
  path_id: string;
  day: number;
  title: string;
  content: string;
  difficulty: number;
};

export type ExerciseRow = {
  id: string;
  lesson_id: string;
  kind: "qcm" | "code";
  topic: string;
  question: string;
  options: string[] | null;
  correct_answer: string | null;
  explanation: string;
  difficulty: number;
  starter_code: string | null;
  reference_solution: string | null;
};

export type AttemptRow = {
  id: string;
  user_id: string;
  exercise_id: string;
  answer: string;
  is_correct: boolean;
  score: number;
  feedback: Record<string, unknown>;
  created_at: string;
};

/* ---------- contrat fournisseur ---------- */

export interface AIProvider {
  readonly name: string;
  generateLearningPlan(input: PlanInput): Promise<LearningPlan>;
  generateLesson(input: LessonInput): Promise<Lesson>;
  generateExercise(input: ExerciseInput): Promise<Exercise>;
  evaluateAnswer(input: EvaluationInput): Promise<Evaluation>;
  suggestAdaptation(input: AdaptationInput): Promise<Adaptation>;
}
```

- [ ] **Step 2: Créer `lib/ai/provider.ts`**

```typescript
export type {
  AIProvider,
  Adaptation,
  AdaptationAction,
  AdaptationInput,
  AdaptiveDecision,
  Evaluation,
  EvaluationInput,
  Exercise,
  ExerciseInput,
  LearningPlan,
  Lesson,
  LessonInput,
  Level,
  PlanInput,
} from "@/types";
```

- [ ] **Step 3: Écrire les tests de validation (doivent échouer)**

Créer `tests/ai-validate.test.ts` :

```typescript
import { describe, it, expect } from "vitest";
import {
  parseLearningPlan,
  parseLesson,
  parseExercise,
  parseEvaluation,
  parseAdaptation,
} from "@/lib/ai/validate";

describe("parseLearningPlan", () => {
  const valid = {
    skill: "Python",
    level: "beginner",
    goal: "Build Python applications",
    modules: [{ title: "Variables", objective: "Store values", difficulty: 1 }],
  };

  it("accepte un plan valide", () => {
    expect(parseLearningPlan(valid)).not.toBeNull();
  });

  it("rejette du JSON tronqué", () => {
    expect(parseLearningPlan({ skill: "Python" })).toBeNull();
  });

  it("rejette un module sans difficulty", () => {
    expect(
      parseLearningPlan({ ...valid, modules: [{ title: "V", objective: "O" }] })
    ).toBeNull();
  });

  it("rejette modules qui n'est pas un tableau", () => {
    expect(parseLearningPlan({ ...valid, modules: "Variables" })).toBeNull();
  });

  it("rejette un niveau invalide", () => {
    expect(parseLearningPlan({ ...valid, level: "expert" })).toBeNull();
  });

  it("rejette null", () => {
    expect(parseLearningPlan(null)).toBeNull();
  });
});

describe("parseLesson", () => {
  const valid = {
    title: "Conditions",
    objective: "Use if/else",
    explanation: "An if runs code conditionally.",
    example: "if age >= 18: print('adult')",
    keyPoints: ["if", "else"],
  };

  it("accepte une leçon valide", () => {
    expect(parseLesson(valid)).not.toBeNull();
  });

  it("rejette keyPoints non tableau", () => {
    expect(parseLesson({ ...valid, keyPoints: "if" })).toBeNull();
  });

  it("rejette un champ string manquant", () => {
    expect(parseLesson({ ...valid, explanation: undefined })).toBeNull();
  });
});

describe("parseExercise", () => {
  const qcm = {
    kind: "qcm",
    topic: "if/else conditions",
    question: "What does this print?",
    difficulty: 1,
    options: ["a", "b"],
    correctAnswer: "a",
    starterCode: null,
    referenceSolution: null,
    explanation: "Because a is first.",
  };

  it("accepte un QCM valide", () => {
    expect(parseExercise(qcm)).not.toBeNull();
  });

  it("rejette un kind inconnu", () => {
    expect(parseExercise({ ...qcm, kind: "essay" })).toBeNull();
  });

  it("rejette un QCM sans options", () => {
    expect(parseExercise({ ...qcm, options: null })).toBeNull();
  });

  it("rejette un QCM sans correctAnswer", () => {
    expect(parseExercise({ ...qcm, correctAnswer: null })).toBeNull();
  });

  it("rejette un correctAnswer absent des options", () => {
    expect(parseExercise({ ...qcm, correctAnswer: "z" })).toBeNull();
  });

  it("accepte un exercice de code avec starterCode", () => {
    expect(
      parseExercise({
        ...qcm,
        kind: "code",
        options: null,
        correctAnswer: null,
        starterCode: "age = 20",
        referenceSolution: "if age >= 18: print('adult')",
      })
    ).not.toBeNull();
  });

  it("rejette un exercice de code sans starterCode", () => {
    expect(
      parseExercise({
        ...qcm,
        kind: "code",
        options: null,
        correctAnswer: null,
        starterCode: null,
        referenceSolution: "x",
      })
    ).toBeNull();
  });
});

describe("parseEvaluation", () => {
  const valid = {
    correct: false,
    score: 35,
    mistake: "Used = instead of ==",
    explanation: "= assigns, == compares.",
    hint: "Check the comparison operator.",
    weakness: "if/else conditions",
    masteryLevel: "beginner",
  };

  it("accepte une évaluation valide", () => {
    expect(parseEvaluation(valid)).not.toBeNull();
  });

  it("borne le score à 0-100", () => {
    expect(parseEvaluation({ ...valid, score: 150 })).toBeNull();
    expect(parseEvaluation({ ...valid, score: -5 })).toBeNull();
  });

  it("rejette un score non entier", () => {
    expect(parseEvaluation({ ...valid, score: 35.7 })).toBeNull();
  });

  it("rejette correct non booléen", () => {
    expect(parseEvaluation({ ...valid, correct: "true" })).toBeNull();
  });

  it("rejette weakness vide", () => {
    expect(parseEvaluation({ ...valid, weakness: "" })).toBeNull();
  });
});

describe("parseAdaptation", () => {
  const valid = {
    action: "remediation",
    topic: "if/else conditions",
    difficulty: 1,
    reason: "Repeated errors detected",
    nextActivity: "Practice basic if/else conditions",
  };

  it("accepte une adaptation valide", () => {
    expect(parseAdaptation(valid)).not.toBeNull();
  });

  it("rejette une action inconnue", () => {
    expect(parseAdaptation({ ...valid, action: "give_up" })).toBeNull();
  });

  it("rejette une difficulty hors bornes 1-5", () => {
    expect(parseAdaptation({ ...valid, difficulty: 0 })).toBeNull();
    expect(parseAdaptation({ ...valid, difficulty: 9 })).toBeNull();
  });
});
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils échouent**

```bash
npm run test -- tests/ai-validate.test.ts
```

Expected: FAIL, module `@/lib/ai/validate` introuvable.

- [ ] **Step 5: Implémenter `lib/ai/validate.ts`**

```typescript
import {
  ADAPTATION_ACTIONS,
  type Adaptation,
  type AdaptationAction,
  type Evaluation,
  type Exercise,
  type LearningPlan,
  type Lesson,
  type Level,
  type Module,
} from "@/types";
import { LEVELS } from "@/lib/validation/onboarding";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStr(value: unknown): value is string {
  return typeof value === "string";
}

function isNonEmptyStr(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isIntInRange(value: unknown, min: number, max: number): value is number {
  return (
    typeof value === "number" && Number.isInteger(value) && value >= min && value <= max
  );
}

function isStrArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isStr);
}

function isLevel(value: unknown): value is Level {
  return isStr(value) && (LEVELS as readonly string[]).includes(value);
}

function parseModule(raw: unknown): Module | null {
  if (!isRecord(raw)) return null;
  if (!isNonEmptyStr(raw.title) || !isNonEmptyStr(raw.objective)) return null;
  if (!isIntInRange(raw.difficulty, 1, 5)) return null;
  return { title: raw.title, objective: raw.objective, difficulty: raw.difficulty };
}

export function parseLearningPlan(raw: unknown): LearningPlan | null {
  if (!isRecord(raw)) return null;
  if (!isNonEmptyStr(raw.skill) || !isLevel(raw.level) || !isNonEmptyStr(raw.goal)) {
    return null;
  }
  if (!Array.isArray(raw.modules) || raw.modules.length === 0) return null;

  const modules: Module[] = [];
  for (const item of raw.modules) {
    const parsed = parseModule(item);
    if (!parsed) return null;
    modules.push(parsed);
  }

  return { skill: raw.skill, level: raw.level, goal: raw.goal, modules };
}

export function parseLesson(raw: unknown): Lesson | null {
  if (!isRecord(raw)) return null;
  if (!isNonEmptyStr(raw.title) || !isNonEmptyStr(raw.objective)) return null;
  if (!isNonEmptyStr(raw.explanation) || !isNonEmptyStr(raw.example)) return null;
  if (!isStrArray(raw.keyPoints)) return null;
  return {
    title: raw.title,
    objective: raw.objective,
    explanation: raw.explanation,
    example: raw.example,
    keyPoints: raw.keyPoints,
  };
}

export function parseExercise(raw: unknown): Exercise | null {
  if (!isRecord(raw)) return null;

  const { kind } = raw;
  if (kind !== "qcm" && kind !== "code") return null;
  if (!isNonEmptyStr(raw.topic) || !isNonEmptyStr(raw.question)) return null;
  if (!isIntInRange(raw.difficulty, 1, 5)) return null;
  if (!isStr(raw.explanation)) return null;

  if (kind === "qcm") {
    if (!isStrArray(raw.options) || raw.options.length < 2) return null;
    if (!isNonEmptyStr(raw.correctAnswer)) return null;
    if (!raw.options.includes(raw.correctAnswer)) return null;
    return {
      kind: "qcm",
      topic: raw.topic,
      question: raw.question,
      difficulty: raw.difficulty,
      options: raw.options,
      correctAnswer: raw.correctAnswer,
      starterCode: null,
      referenceSolution: null,
      explanation: raw.explanation,
    };
  }

  if (!isNonEmptyStr(raw.starterCode)) return null;
  if (raw.referenceSolution !== null && !isStr(raw.referenceSolution)) return null;

  return {
    kind: "code",
    topic: raw.topic,
    question: raw.question,
    difficulty: raw.difficulty,
    options: null,
    correctAnswer: null,
    starterCode: raw.starterCode,
    referenceSolution: raw.referenceSolution ?? null,
    explanation: raw.explanation,
  };
}

export function parseEvaluation(raw: unknown): Evaluation | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.correct !== "boolean") return null;
  if (!isIntInRange(raw.score, 0, 100)) return null;
  if (!isStr(raw.mistake) || !isStr(raw.explanation) || !isStr(raw.hint)) return null;
  if (!isNonEmptyStr(raw.weakness)) return null;
  if (!isNonEmptyStr(raw.masteryLevel)) return null;
  return {
    correct: raw.correct,
    score: raw.score,
    mistake: raw.mistake,
    explanation: raw.explanation,
    hint: raw.hint,
    weakness: raw.weakness,
    masteryLevel: raw.masteryLevel,
  };
}

export function parseAdaptation(raw: unknown): Adaptation | null {
  if (!isRecord(raw)) return null;
  if (
    !isStr(raw.action) ||
    !(ADAPTATION_ACTIONS as readonly string[]).includes(raw.action)
  ) {
    return null;
  }
  if (!isNonEmptyStr(raw.topic)) return null;
  if (!isIntInRange(raw.difficulty, 1, 5)) return null;
  if (!isStr(raw.reason) || !isNonEmptyStr(raw.nextActivity)) return null;
  return {
    action: raw.action as AdaptationAction,
    topic: raw.topic,
    difficulty: raw.difficulty,
    reason: raw.reason,
    nextActivity: raw.nextActivity,
  };
}
```

- [ ] **Step 6: Lancer les tests pour vérifier qu'ils passent**

```bash
npm run test -- tests/ai-validate.test.ts
npm run typecheck
```

Expected: 24 tests passés, `tsc` propre.

- [ ] **Step 7: Commit**

```bash
git checkout -b feature/ai-contract
git add types lib/ai/provider.ts lib/ai/validate.ts tests/ai-validate.test.ts
git commit -m "ai: add domain types, AIProvider contract and strict output validation"
```

---

### Task 5: Provider démo, transport HTTP, chaîne de fallback

**Files:**
- Create: `lib/ai/http.ts`, `lib/ai/demo.ts`, `lib/ai/index.ts`
- Test: `tests/ai-fallback.test.ts`, `tests/demo-scenario.test.ts`

**Interfaces:**
- Consumes: `AIProvider` (Task 4), `parse*` (Task 4)
- Produces:
  - `lib/ai/http.ts` → `DEFAULT_TIMEOUT_MS = 15_000`, `class AIError extends Error { code: string }`, `fetchJson(url, body, apiKey, timeoutMs?): Promise<unknown>`
  - `lib/ai/demo.ts` → `demoProvider: AIProvider`
  - `lib/ai/index.ts` → `getProviderChain(): AIProvider[]`, `runWithFallback<T>(run, parse, chain?): Promise<T>`, `generateLearningPlan`, `generateLesson`, `generateExercise`, `evaluateAnswer`, `suggestAdaptation`, réexporte `AIError` et `demoProvider`

- [ ] **Step 1: Créer `lib/ai/http.ts`**

```typescript
export const DEFAULT_TIMEOUT_MS = 15_000;

export class AIError extends Error {
  readonly code: string;

  constructor(message: string, code = "AI_ERROR") {
    super(message);
    this.name = "AIError";
    this.code = code;
  }
}

export async function fetchJson(
  url: string,
  body: unknown,
  apiKey: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new AIError(`HTTP ${response.status} from provider`, "HTTP_ERROR");
    }

    return await response.json();
  } catch (error) {
    if (error instanceof AIError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new AIError("Provider timeout", "TIMEOUT");
    }
    throw new AIError("Network error", "NETWORK_ERROR");
  } finally {
    clearTimeout(timer);
  }
}
```

- [ ] **Step 2: Créer `lib/ai/demo.ts`**

```typescript
import type { AIProvider } from "@/types";

const IF_ELSE_TOPIC = "if/else conditions";

export const demoProvider: AIProvider = {
  name: "demo",

  async generateLearningPlan(input) {
    return {
      skill: input.skill,
      level: input.level,
      goal: input.goal,
      modules: [
        { title: "Variables", objective: "Store and reuse values", difficulty: 1 },
        { title: "Conditions", objective: "Use if/else to make decisions", difficulty: 1 },
        { title: "Loops", objective: "Repeat work with for and while", difficulty: 1 },
      ],
    };
  },

  async generateLesson(input) {
    if (input.topic === IF_ELSE_TOPIC) {
      return {
        title: "if/else conditions",
        objective: "Choose between two branches of code",
        explanation:
          "An if statement runs a block of code only when a condition is true. " +
          "An else block runs it when the condition is false. Conditions are " +
          "comparisons such as age >= 18, and each one is either true or false.",
        example:
          'age = 20\n\nif age >= 18:\n    print("You are an adult")\nelse:\n    print("You are a minor")',
        keyPoints: [
          "if runs code when the condition is true",
          "else runs code when the condition is false",
          "use == to compare, = to assign",
          "indent the code inside the block",
        ],
      };
    }

    return {
      title: input.topic,
      objective: `Understand ${input.topic}`,
      explanation:
        `This lesson introduces ${input.topic} step by step, with plain ` +
        `explanations written for a ${input.level} learner.`,
      example: `# ${input.topic}\nprint("hello")`,
      keyPoints: [
        `What ${input.topic} is for`,
        "A worked example",
        "Common mistakes",
      ],
    };
  },

  async generateExercise(input) {
    if (input.kind === "qcm") {
      const options = [
        "It prints 'You are an adult'",
        "It prints 'You are a minor'",
        "It prints nothing",
        "It raises an error",
      ];
      return {
        kind: "qcm",
        topic: input.topic,
        question:
          'What does this code print?\n\nage = 20\nif age >= 18:\n    print("You are an adult")',
        difficulty: input.difficulty,
        options,
        correctAnswer: options[0],
        starterCode: null,
        referenceSolution: null,
        explanation: "age is 20, so age >= 18 is true, and the if branch runs.",
      };
    }

    return {
      kind: "code",
      topic: input.topic,
      question:
        "Write an if/else that prints 'You are an adult' when age is 18 or more, and 'You are a minor' otherwise.",
      difficulty: input.difficulty,
      options: null,
      correctAnswer: null,
      starterCode: "age = 20\n\n# write your if/else here\n",
      referenceSolution:
        'age = 20\n\nif age >= 18:\n    print("You are an adult")\nelse:\n    print("You are a minor")',
      explanation:
        "The condition age >= 18 is true, so the if branch prints. The else branch is skipped.",
    };
  },

  async evaluateAnswer(input) {
    const answer = input.learnerAnswer.toLowerCase();
    const hasIfBranch = /if\s+[^:\n]+:/.test(answer);
    const hasElseBranch = /else\s*:/.test(answer);
    const hasComparison = /=>/.test(answer) || />=/.test(answer) || /==/.test(answer);

    if (input.kind === "qcm") {
      const correct = input.correctAnswer
        ? answer === input.correctAnswer.toLowerCase()
        : false;

      return correct
        ? {
            correct: true,
            score: 100,
            mistake: "",
            explanation: input.correctAnswer
              ? `Correct. ${input.correctAnswer}`
              : "Correct.",
            hint: "",
            weakness: input.topic,
            masteryLevel: "intermediate",
          }
        : {
            correct: false,
            score: 35,
            mistake: "You selected the wrong outcome of the condition.",
            explanation:
              "age is 20, so the condition age >= 18 is true and the if branch runs. " +
              "The else branch only runs when the condition is false.",
            hint: "Read the condition from left to right, then ask what happens if it is true.",
            weakness: IF_ELSE_TOPIC,
            masteryLevel: "beginner",
          };
    }

    const correct = hasIfBranch && hasElseBranch && hasComparison;

    if (correct) {
      return {
        correct: true,
        score: 100,
        mistake: "",
        explanation: "Your if/else is correct and prints the right message.",
        hint: "",
        weakness: input.topic,
        masteryLevel: "intermediate",
      };
    }

    return {
      correct: false,
      score: 35,
      mistake: !hasIfBranch || !hasElseBranch
        ? "Your code is missing the if/else structure."
        : "Your comparison operator is wrong: you used = where >= or == is needed.",
      explanation:
        "A comparison such as age >= 18 must use >= to compare values. " +
        "A single = assigns a value instead, which is why the condition never behaves as expected.",
      hint: "Write if age >= 18: with two characters before the equals sign.",
      weakness: IF_ELSE_TOPIC,
      masteryLevel: "beginner",
    };
  },

  async suggestAdaptation(input) {
    const weak = input.masteryScore < 40;
    return {
      action: weak ? "remediation" : "same_level",
      topic: input.weaknesses[0] ?? input.topic,
      difficulty: weak ? 1 : 2,
      reason: weak ? "Repeated errors detected" : "Progressing at a steady pace",
      nextActivity: weak
        ? "Practice: Basic if/else conditions"
        : "Practice: if/else with several conditions",
    };
  },
};
```

- [ ] **Step 3: Écrire le test de fallback (doit échouer)**

Créer `tests/ai-fallback.test.ts` :

```typescript
import { describe, it, expect } from "vitest";
import type { AIProvider, PlanInput } from "@/types";
import { runWithFallback, AIError } from "@/lib/ai";

const input: PlanInput = {
  skill: "Python",
  level: "beginner",
  goal: "Build Python applications",
  dailyTime: 60,
  duration: 30,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function acceptOk(raw: unknown): { ok: boolean } | null {
  return isRecord(raw) && raw.ok === true ? { ok: true } : null;
}

function stub(name: string, behaviour: () => Promise<unknown>): AIProvider {
  return {
    name,
    generateLearningPlan: behaviour as never,
    generateLesson: behaviour as never,
    generateExercise: behaviour as never,
    evaluateAnswer: behaviour as never,
    suggestAdaptation: behaviour as never,
  };
}

describe("runWithFallback", () => {
  it("renvoie le résultat du premier provider qui réussit", async () => {
    const chain = [stub("p1", async () => ({ ok: true })), stub("p2", async () => ({ ok: false }))];
    const result = await runWithFallback(
      (p) => p.generateLearningPlan(input),
      acceptOk,
      chain
    );
    expect(result).toEqual({ ok: true });
  });

  it("bascule si le premier provider lève", async () => {
    const chain = [
      stub("p1", async () => {
        throw new AIError("boom", "NETWORK_ERROR");
      }),
      stub("p2", async () => ({ ok: true })),
    ];
    const result = await runWithFallback(
      (p) => p.generateLearningPlan(input),
      acceptOk,
      chain
    );
    expect(result).toEqual({ ok: true });
  });

  it("bascule si la sortie ne passe pas la validation", async () => {
    const chain = [stub("p1", async () => ({ unexpected: true })), stub("p2", async () => ({ ok: true }))];
    const result = await runWithFallback(
      (p) => p.generateLearningPlan(input),
      acceptOk,
      chain
    );
    expect(result).toEqual({ ok: true });
  });

  it("lève une AIError si tous les providers échouent", async () => {
    const chain = [
      stub("p1", async () => {
        throw new AIError("boom", "TIMEOUT");
      }),
      stub("p2", async () => ({ invalid: true })),
    ];
    await expect(
      runWithFallback((p) => p.generateLearningPlan(input), acceptOk, chain)
    ).rejects.toBeInstanceOf(AIError);
  });

  it("ne tente pas le provider suivant après un succès", async () => {
    let secondCalled = false;
    const chain = [
      stub("p1", async () => ({ ok: true })),
      stub("p2", async () => {
        secondCalled = true;
        return { ok: true };
      }),
    ];
    await runWithFallback((p) => p.generateLearningPlan(input), acceptOk, chain);
    expect(secondCalled).toBe(false);
  });
});
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il échoue**

```bash
npm run test -- tests/ai-fallback.test.ts
```

Expected: FAIL, module `@/lib/ai` introuvable.

- [ ] **Step 5: Créer `lib/ai/index.ts`**

```typescript
import type {
  AIProvider,
  Adaptation,
  AdaptationInput,
  Evaluation,
  EvaluationInput,
  Exercise,
  ExerciseInput,
  LearningPlan,
  Lesson,
  LessonInput,
  PlanInput,
} from "@/types";
import { demoProvider } from "./demo";
import { AIError } from "./http";
import {
  parseAdaptation,
  parseEvaluation,
  parseExercise,
  parseLearningPlan,
  parseLesson,
} from "./validate";

type ProviderName = "nvidia" | "gemini" | "demo";

function envProviderName(): ProviderName {
  const raw = process.env.AI_PROVIDER?.toLowerCase().trim();
  if (raw === "nvidia" || raw === "gemini" || raw === "demo") return raw;
  return "demo";
}

function remoteProviders(): AIProvider[] {
  const chain: AIProvider[] = [];

  if (envProviderName() === "nvidia" && process.env.NVIDIA_API_KEY) {
    const { nvidiaProvider } = require("./nvidia") as typeof import("./nvidia");
    chain.push(nvidiaProvider);
  }

  if (envProviderName() === "gemini" && process.env.GEMINI_API_KEY) {
    const { geminiProvider } = require("./gemini") as typeof import("./gemini");
    chain.push(geminiProvider);
  }

  return chain;
}

export function getProviderChain(): AIProvider[] {
  return [...remoteProviders(), demoProvider];
}

export async function runWithFallback<T>(
  run: (provider: AIProvider) => Promise<T>,
  parse: (raw: unknown) => T | null,
  chain: AIProvider[] = getProviderChain()
): Promise<T> {
  let lastError = "no provider available";

  for (const provider of chain) {
    try {
      const parsed = parse(await run(provider));
      if (parsed !== null) return parsed;
      lastError = `invalid response from ${provider.name}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  throw new AIError(`All AI providers failed: ${lastError}`, "ALL_PROVIDERS_FAILED");
}

export function generateLearningPlan(input: PlanInput): Promise<LearningPlan> {
  return runWithFallback((p) => p.generateLearningPlan(input), parseLearningPlan);
}

export function generateLesson(input: LessonInput): Promise<Lesson> {
  return runWithFallback((p) => p.generateLesson(input), parseLesson);
}

export function generateExercise(input: ExerciseInput): Promise<Exercise> {
  return runWithFallback((p) => p.generateExercise(input), parseExercise);
}

export function evaluateAnswer(input: EvaluationInput): Promise<Evaluation> {
  return runWithFallback((p) => p.evaluateAnswer(input), parseEvaluation);
}

export function suggestAdaptation(input: AdaptationInput): Promise<Adaptation> {
  return runWithFallback((p) => p.suggestAdaptation(input), parseAdaptation);
}

export { AIError } from "./http";
export { demoProvider } from "./demo";
```

- [ ] **Step 6: Lancer le test pour vérifier qu'il passe**

```bash
npm run test -- tests/ai-fallback.test.ts
```

Expected: 5 tests passés.

- [ ] **Step 7: Écrire le test de scénario démo (doit échouer si le provider est faux)**

Créer `tests/demo-scenario.test.ts` :

```typescript
import { describe, it, expect } from "vitest";
import { demoProvider } from "@/lib/ai";

describe("scénario démo Amadou", () => {
  it("plan: 3 modules", async () => {
    const plan = await demoProvider.generateLearningPlan({
      skill: "Python",
      level: "beginner",
      goal: "Build Python applications",
      dailyTime: 60,
      duration: 30,
    });
    expect(plan.modules).toHaveLength(3);
  });

  it("leçon: titre et keyPoints non vides", async () => {
    const lesson = await demoProvider.generateLesson({
      skill: "Python",
      level: "beginner",
      topic: "if/else conditions",
      goal: "Build Python applications",
      difficulty: 1,
    });
    expect(lesson.title).toBe("if/else conditions");
    expect(lesson.keyPoints.length).toBeGreaterThan(0);
  });

  it("code faux: 35 et faiblesse if/else", async () => {
    const evaluation = await demoProvider.evaluateAnswer({
      question: "Write an if/else",
      kind: "code",
      correctAnswer: null,
      referenceSolution: "if age >= 18:\n    print('adult')",
      learnerAnswer: "if age = 18\nprint('adult')",
      level: "beginner",
      topic: "if/else conditions",
    });
    expect(evaluation.correct).toBe(false);
    expect(evaluation.score).toBe(35);
    expect(evaluation.weakness).toBe("if/else conditions");
    expect(evaluation.masteryLevel).toBe("beginner");
  });

  it("code correct: 100", async () => {
    const evaluation = await demoProvider.evaluateAnswer({
      question: "Write an if/else",
      kind: "code",
      correctAnswer: null,
      referenceSolution: null,
      learnerAnswer:
        'age = 20\nif age >= 18:\n    print("adult")\nelse:\n    print("minor")',
      level: "beginner",
      topic: "if/else conditions",
    });
    expect(evaluation.correct).toBe(true);
    expect(evaluation.score).toBe(100);
  });

  it("QCM faux: 35 et faiblesse if/else", async () => {
    const evaluation = await demoProvider.evaluateAnswer({
      question: "What does this print?",
      kind: "qcm",
      correctAnswer: "It prints 'You are an adult'",
      referenceSolution: null,
      learnerAnswer: "It prints nothing",
      level: "beginner",
      topic: "if/else conditions",
    });
    expect(evaluation.correct).toBe(false);
    expect(evaluation.score).toBe(35);
  });

  it("adaptation: mastery 30 propose remediation", async () => {
    const adaptation = await demoProvider.suggestAdaptation({
      topic: "if/else conditions",
      level: "beginner",
      recentScores: [35, 40, 30],
      previousMistakes: ["= instead of >="],
      weaknesses: ["if/else conditions"],
      masteryScore: 30,
    });
    expect(adaptation.action).toBe("remediation");
  });
});
```

- [ ] **Step 8: Lancer tous les tests**

```bash
npm run test
npm run typecheck
```

Expected: 44 tests passés (2 harnais + 7 onboarding + 24 validate + 5 fallback + 6 scénario démo), `tsc` propre.

- [ ] **Step 9: Commit**

```bash
git checkout -b feature/ai-fallback
git add lib/ai tests
git commit -m "ai: add demo provider, HTTP transport with timeout and silent fallback chain"
```

---

### Task 6: Règles d'adaptation — l'autorité de la décision

**Files:**
- Create: `lib/adaptation/rules.ts`
- Test: `tests/adaptation-rules.test.ts`

**Interfaces:**
- Consumes: `AdaptiveDecision`, `Adaptation`, `AdaptationAction` de `types/index.ts` (Task 4)
- Produces:
  - `type AttemptRecord = { score: number; isCorrect: boolean; topic: string }`
  - `type DecideInput = { attempts: AttemptRecord[]; aiSuggestion: Adaptation | null; currentTopic: string; currentDifficulty: number }`
  - `computeMasteryScore(attempts: AttemptRecord[]): number` — moyenne des 5 plus récents, 0 si vide
  - `decide(input: DecideInput): AdaptiveDecision` — toujours `source: "rules"`

Règle centrale : **la suggestion de l'IA ne peut jamais contrevenir aux seuils.** Elle ne fournit que `reason` et `nextActivity`.

`attempts` est toujours ordonné du plus récent au plus ancien. C'est la convention admise par `loadAttemptRecords` (Task 8).

- [ ] **Step 1: Écrire les tests (doivent échouer)**

Créer `tests/adaptation-rules.test.ts` :

```typescript
import { describe, it, expect } from "vitest";
import { computeMasteryScore, decide } from "@/lib/adaptation/rules";

const a = (score: number, topic = "if/else conditions") => ({
  score,
  isCorrect: score >= 60,
  topic,
});

describe("computeMasteryScore", () => {
  it("retourne 0 sans attempt", () => {
    expect(computeMasteryScore([])).toBe(0);
  });

  it("moyenne les 5 plus récents seulement", () => {
    // `attempts` est ordonné du plus récent au plus ancien : les 5 plus récents
    // sont donc les 5 premiers, soit [0, 0, 100, 100, 100] → 300/5 = 60.
    // La valeur 40 initialement prévue ici correspondait au tri inverse
    // ([0, 0, 0, 100, 100]), contraire à la convention déclarée plus haut.
    expect(computeMasteryScore([a(0), a(0), a(100), a(100), a(100), a(100), a(100)])).toBe(60);
  });

  it("moyenne les attempts existants si moins de 5", () => {
    expect(computeMasteryScore([a(80), a(60)])).toBe(70);
  });

  it("arrondit à l'entier", () => {
    expect(computeMasteryScore([a(33), a(34), a(50)])).toBe(39);
  });
});

describe("decide — les seuils sont l'autorité", () => {
  it("mastery 39 => remediation", () => {
    const decision = decide({
      attempts: [a(39)],
      aiSuggestion: null,
      currentTopic: "if/else conditions",
      currentDifficulty: 2,
    });
    expect(decision.action).toBe("remediation");
  });

  it("mastery 40 => same_level", () => {
    const decision = decide({
      attempts: [a(40)],
      aiSuggestion: null,
      currentTopic: "if/else conditions",
      currentDifficulty: 2,
    });
    expect(decision.action).toBe("same_level");
  });

  it("mastery 74 => same_level", () => {
    const decision = decide({
      attempts: [a(74)],
      aiSuggestion: null,
      currentTopic: "if/else conditions",
      currentDifficulty: 2,
    });
    expect(decision.action).toBe("same_level");
  });

  it("mastery 75 => increase_difficulty", () => {
    const decision = decide({
      attempts: [a(75)],
      aiSuggestion: null,
      currentTopic: "if/else conditions",
      currentDifficulty: 2,
    });
    expect(decision.action).toBe("increase_difficulty");
  });
});

describe("decide — l'IA ne peut pas voter contre les règles", () => {
  it("IA propose next_topic mais mastery 30 => remediation sur le topic courant", () => {
    const decision = decide({
      attempts: [a(30)],
      aiSuggestion: {
        action: "next_topic",
        topic: "loops",
        difficulty: 2,
        reason: "Learner looks ready",
        nextActivity: "Move to loops",
      },
      currentTopic: "if/else conditions",
      currentDifficulty: 2,
    });
    expect(decision.action).toBe("remediation");
    expect(decision.topic).toBe("if/else conditions");
  });

  it("IA propose remediation mais mastery 90 => increase_difficulty", () => {
    const decision = decide({
      attempts: [a(90)],
      aiSuggestion: {
        action: "remediation",
        topic: "if/else conditions",
        difficulty: 1,
        reason: "Looks shaky",
        nextActivity: "Practice basics again",
      },
      currentTopic: "if/else conditions",
      currentDifficulty: 2,
    });
    expect(decision.action).toBe("increase_difficulty");
  });

  it("IA fournit le texte du conseil, la source reste rules", () => {
    const decision = decide({
      attempts: [a(30)],
      aiSuggestion: {
        action: "next_topic",
        topic: "loops",
        difficulty: 3,
        reason: "Repeated errors detected",
        nextActivity: "Practice: Basic if/else conditions",
      },
      currentTopic: "if/else conditions",
      currentDifficulty: 2,
    });
    expect(decision.nextActivity).toBe("Practice: Basic if/else conditions");
    expect(decision.reason).toBe("Repeated errors detected");
    expect(decision.source).toBe("rules");
    expect(decision.masteryScore).toBe(30);
  });
});

describe("decide — échecs consécutifs sur le même topic", () => {
  it("2 échecs consécutifs sur le même topic => retour au prérequis", () => {
    const decision = decide({
      attempts: [a(90, "loops"), a(20, "loops"), a(20, "loops")],
      aiSuggestion: null,
      currentTopic: "loops",
      currentDifficulty: 3,
    });
    expect(decision.action).toBe("remediation");
    expect(decision.difficulty).toBe(2);
  });

  it("2 échecs sur des topics différents n'abaissent pas la difficulté", () => {
    const decision = decide({
      attempts: [a(20, "loops"), a(20, "functions")],
      aiSuggestion: null,
      currentTopic: "functions",
      currentDifficulty: 3,
    });
    expect(decision.action).toBe("remediation");
    expect(decision.difficulty).toBe(2);
  });
});

describe("decide — cas limites", () => {
  it("sans attempt => next_topic, difficulté conservée", () => {
    const decision = decide({
      attempts: [],
      aiSuggestion: null,
      currentTopic: "Variables",
      currentDifficulty: 1,
    });
    expect(decision.action).toBe("next_topic");
    expect(decision.difficulty).toBe(1);
  });

  it("remediation ne descend jamais sous difficulté 1", () => {
    const decision = decide({
      attempts: [a(10)],
      aiSuggestion: null,
      currentTopic: "if/else conditions",
      currentDifficulty: 1,
    });
    expect(decision.difficulty).toBe(1);
  });

  it("increase_difficulty ne monte jamais au-dessus de 5", () => {
    const decision = decide({
      attempts: [a(95)],
      aiSuggestion: null,
      currentTopic: "loops",
      currentDifficulty: 5,
    });
    expect(decision.action).toBe("increase_difficulty");
    expect(decision.difficulty).toBe(5);
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

```bash
npm run test -- tests/adaptation-rules.test.ts
```

Expected: FAIL, module `@/lib/adaptation/rules` introuvable.

- [ ] **Step 3: Implémenter `lib/adaptation/rules.ts`**

```typescript
import type { Adaptation, AdaptationAction, AdaptiveDecision } from "@/types";

export type AttemptRecord = {
  score: number;
  isCorrect: boolean;
  topic: string;
};

export type DecideInput = {
  attempts: AttemptRecord[];
  aiSuggestion: Adaptation | null;
  currentTopic: string;
  currentDifficulty: number;
};

const WINDOW = 5;
const REMEDIATION_BELOW = 40;
const ADVANCE_AT = 75;
const MAX_DIFFICULTY = 5;

export function computeMasteryScore(attempts: AttemptRecord[]): number {
  const recent = attempts.slice(0, WINDOW);
  if (recent.length === 0) return 0;

  const total = recent.reduce((sum, item) => sum + item.score, 0);
  return Math.round(total / recent.length);
}

function hasConsecutiveFailures(attempts: AttemptRecord[], topic: string): boolean {
  const firstIndex = attempts.findIndex((item) => item.topic === topic);
  if (firstIndex === -1) return false;
  if (attempts[firstIndex].isCorrect) return false;

  const second = attempts
    .slice(firstIndex + 1)
    .find((item) => item.topic === topic);

  return Boolean(second && !second.isCorrect);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function thresholdAction(score: number): AdaptationAction {
  if (score < REMEDIATION_BELOW) return "remediation";
  if (score < ADVANCE_AT) return "same_level";
  return "increase_difficulty";
}

function defaultNextActivity(action: AdaptationAction, topic: string): string {
  switch (action) {
    case "remediation":
      return `Practice: Basic ${topic}`;
    case "increase_difficulty":
      return `Practice: Advanced ${topic}`;
    case "next_topic":
      return "Continue to the next topic";
    case "same_level":
      return `Practice: ${topic}`;
  }
}

export function decide(input: DecideInput): AdaptiveDecision {
  const { attempts, aiSuggestion, currentTopic, currentDifficulty } = input;
  const masteryScore = computeMasteryScore(attempts);

  let action: AdaptationAction;
  if (attempts.length === 0) {
    action = "next_topic";
  } else {
    action = thresholdAction(masteryScore);
    if (action !== "remediation" && hasConsecutiveFailures(attempts, currentTopic)) {
      action = "remediation";
    }
  }

  const difficulty = clamp(
    action === "remediation"
      ? currentDifficulty - 1
      : action === "increase_difficulty"
        ? currentDifficulty + 1
        : currentDifficulty,
    1,
    MAX_DIFFICULTY
  );

  const topic =
    action === "remediation" ? currentTopic : (aiSuggestion?.topic ?? currentTopic);

  return {
    action,
    topic,
    difficulty,
    reason: aiSuggestion?.reason ?? "Based on your recent performance",
    nextActivity: aiSuggestion?.nextActivity ?? defaultNextActivity(action, topic),
    source: "rules",
    masteryScore,
  };
}
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

```bash
npm run test -- tests/adaptation-rules.test.ts
npm run typecheck
```

Expected: 14 tests passés, `tsc` propre.

- [ ] **Step 5: Commit**

```bash
git checkout -b feature/adaptation-rules
git add lib/adaptation tests/adaptation-rules.test.ts
git commit -m "ai: add deterministic adaptation rules as decision authority"
```

---

### Task 7: Seed du persona Amadou

**Files:**
- Create: `scripts/seed.ts`

**Interfaces:**
- Consumes: `supabase/schema.sql` (Task 2), `createClient` de `@supabase/supabase-js` (Task 1)
- Produces: utilisateur `amadou@samacoach.dev` / `Demo1234!`, profil nommé Amadou, 1 learning path (Python/beginner/60 min/30 j), 3 leçons, 4 exercices dont 1 QCM `if/else` et 1 code `if/else`. **Aucun `attempt` pré-rempli** : l'échec doit se produire en direct pendant la démo.

- [ ] **Step 1: Créer `scripts/seed.ts`**

```typescript
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = "amadou@samacoach.dev";
const password = "Demo1234!";

if (!url || !serviceKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureUser(): Promise<string> {
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Amadou" },
  });

  if (created?.user) return created.user.id;

  if (createError && !/already been registered|already exists/i.test(createError.message)) {
    throw createError;
  }

  const { data: list, error: listError } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  });
  if (listError) throw listError;

  const found = list.users.find((u) => u.email === email);
  if (!found) throw new Error(`User ${email} not found after create failure.`);
  return found.id;
}

async function main() {
  const userId = await ensureUser();
  console.log(`user: ${userId}`);

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: userId, name: "Amadou", email }, { onConflict: "id" });
  if (profileError) throw profileError;
  console.log("profile ok");

  const { data: existingPath } = await supabase
    .from("learning_paths")
    .select("id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  let pathId = existingPath?.id;

  if (!pathId) {
    const { data: created, error } = await supabase
      .from("learning_paths")
      .insert({
        user_id: userId,
        skill: "Python",
        level: "beginner",
        goal: "Build Python applications",
        daily_time: 60,
        duration: 30,
      })
      .select()
      .single();
    if (error) throw error;
    pathId = created.id;
  }
  console.log(`learning_path: ${pathId}`);

  const lessons = [
    { day: 1, title: "Variables", difficulty: 1, topic: "variables" },
    { day: 2, title: "Conditions", difficulty: 1, topic: "if/else conditions" },
    { day: 3, title: "Loops", difficulty: 2, topic: "loops" },
  ];

  const lessonIds: Record<string, string> = {};

  for (const lesson of lessons) {
    const { data: existing } = await supabase
      .from("lessons")
      .select("id")
      .eq("path_id", pathId)
      .eq("title", lesson.title)
      .maybeSingle();

    if (existing) {
      lessonIds[lesson.topic] = existing.id;
      continue;
    }

    const { data: created, error } = await supabase
      .from("lessons")
      .insert({
        path_id: pathId,
        day: lesson.day,
        title: lesson.title,
        content: lesson.objective ?? "",
        difficulty: lesson.difficulty,
      })
      .select()
      .single();
    if (error) throw error;
    lessonIds[lesson.topic] = created.id;
  }
  console.log("lessons ok");

  const exercises = [
    {
      topic: "if/else conditions",
      kind: "qcm" as const,
      question:
        'What does this print?\n\nage = 20\nif age >= 18:\n    print("You are an adult")',
      difficulty: 1,
      options: [
        "It prints 'You are an adult'",
        "It prints 'You are a minor'",
        "It prints nothing",
        "It raises an error",
      ],
      correctAnswer: "It prints 'You are an adult'",
      starterCode: null,
      referenceSolution: null,
      explanation: "age is 20, so age >= 18 is true, and the if branch runs.",
    },
    {
      topic: "if/else conditions",
      kind: "code" as const,
      question:
        "Write an if/else that prints 'You are an adult' when age is 18 or more, and 'You are a minor' otherwise.",
      difficulty: 1,
      options: null,
      correctAnswer: null,
      starterCode: "age = 20\n\n# write your if/else here\n",
      referenceSolution:
        'age = 20\n\nif age >= 18:\n    print("You are an adult")\nelse:\n    print("You are a minor")',
      explanation:
        "The condition age >= 18 is true, so the if branch prints. The else branch is skipped.",
    },
    {
      topic: "variables",
      kind: "qcm" as const,
      question: "What is printed?\n\nage = 20\nprint(age + 1)",
      difficulty: 1,
      options: ["20", "21", "Error", "None"],
      correctAnswer: "21",
      starterCode: null,
      referenceSolution: null,
      explanation: "age is 20, so age + 1 is 21.",
    },
    {
      topic: "loops",
      kind: "code" as const,
      question: "Write a for loop that prints each number from 1 to 3, one per line.",
      difficulty: 2,
      options: null,
      correctAnswer: null,
      starterCode: "# write your for loop here\n",
      referenceSolution: "for i in range(1, 4):\n    print(i)",
      explanation: "range(1, 4) yields 1, 2 and 3.",
    },
  ];

  for (const exercise of exercises) {
    const lessonId = lessonIds[exercise.topic];
    if (!lessonId) throw new Error(`No lesson for topic ${exercise.topic}`);

    const { data: existing } = await supabase
      .from("exercises")
      .select("id")
      .eq("lesson_id", lessonId)
      .eq("question", exercise.question)
      .maybeSingle();
    if (existing) continue;

    const { error } = await supabase.from("exercises").insert({
      lesson_id: lessonId,
      kind: exercise.kind,
      topic: exercise.topic,
      question: exercise.question,
      options: exercise.options,
      correct_answer: exercise.correctAnswer,
      explanation: exercise.explanation,
      difficulty: exercise.difficulty,
      starter_code: exercise.starterCode,
      reference_solution: exercise.referenceSolution,
    });
    if (error) throw error;
  }
  console.log("exercises ok");

  const { error: progressError } = await supabase.from("progress").upsert(
    {
      user_id: userId,
      path_id: pathId,
      completed_lessons: 0,
      total_lessons: lessons.length,
      mastery_score: 0,
      current_level: 1,
    },
    { onConflict: "user_id" }
  );
  if (progressError) throw progressError;
  console.log("progress ok");

  const { count } = await supabase
    .from("attempts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  console.log(`attempts: ${count ?? 0} (doit être 0 avant la démo)`);
  console.log("Seed terminé.");
  console.log(`Connexion: ${email} / ${password}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 2: Créer `.env.local` et lancer le seed**

Copier `.env.example` vers `.env.local` et remplir `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Laisser `AI_PROVIDER` vide pour rester en mode démo. Puis :

```bash
npm run seed
```

Expected en sortie :

```
user: <uuid>
profile ok
learning_path: <uuid>
lessons ok
exercises ok
progress ok
attempts: 0 (doit être 0 avant la démo)
Seed terminé.
Connexion: amadou@samacoach.dev / Demo1234!
```

- [ ] **Step 3: Vérifier l'idempotence**

Relancer exactement la même commande.

Expected: aucune erreur, `attempts: 0` toujours. Aucun doublon créé.

- [ ] **Step 4: Vérifier la RLS avec la clé anon sans session**

```bash
npx tsx --env-file=.env.local -e "import { createClient } from '@supabase/supabase-js'; const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!); const { data, error } = await s.from('learning_paths').select('id'); console.log('lignes visibles sans session:', data?.length ?? 0, error?.message ?? '');"
```

Expected: `lignes visibles sans session: 0`. C'est la preuve que la RLS bloque bien.

- [ ] **Step 5: Vérifier le typecheck et commiter**

```bash
npm run typecheck
git checkout -b feature/seed
git add scripts
git commit -m "db: add idempotent seed script for the Amadou demo persona"
```

---

### Task 8: Services métier et Route Handlers

**Files:**
- Create: `services/adaptation.ts`, `services/learning-plan.ts`, `services/lesson.ts`, `services/evaluation.ts`
- Create: `app/api/learning-plan/route.ts`, `app/api/lesson/route.ts`, `app/api/exercise/route.ts`, `app/api/evaluate/route.ts`
- Test: `tests/evaluation-service.test.ts`

**Interfaces:**
- Consumes: `getCurrentUser` (Task 3), `generate*` de `lib/ai` (Task 5), `decide` (Task 6)
- Produces:
  - `services/adaptation.ts` → `loadAttemptRecords(userId): Promise<AttemptRecord[]>`, `getAdaptationFor(userId, topic, difficulty): Promise<AdaptiveDecision>`
  - `services/learning-plan.ts` → `createLearningPath(userId, input): Promise<LearningPlan>`
  - `services/lesson.ts` → `getLessonsForUser(userId): Promise<LessonRow[]>`, `getLessonById(userId, lessonId): Promise<LessonRow | null>`, `ensureLessonContent(lesson, goal, skill): Promise<LessonRow>`
  - `services/evaluation.ts` → `buildEvaluationInput(exercise, learnerAnswer, level): EvaluationInput`, `submitAttempt(userId, exerciseId, learnerAnswer): Promise<SubmitAttemptResult>`
  - `type SubmitAttemptResult = { attemptId: string; evaluation: Evaluation; decision: AdaptiveDecision }`
  - Routes : `POST /api/learning-plan`, `GET /api/lesson`, `GET /api/exercise`, `POST|GET /api/evaluate`

- [ ] **Step 1: Créer `services/adaptation.ts`**

```typescript
import { createClient } from "@/lib/supabase/server";
import { suggestAdaptation } from "@/lib/ai";
import { decide, type AttemptRecord } from "@/lib/adaptation/rules";
import type { AdaptiveDecision, Level } from "@/types";

export async function loadAttemptRecords(userId: string): Promise<AttemptRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("attempts")
    .select("score, is_correct, exercises(topic)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw new Error(`Failed to load attempts: ${error.message}`);

  return (data ?? []).map((row) => {
    const exercise = row.exercises as { topic: string } | null;
    return {
      score: row.score,
      isCorrect: row.is_correct,
      topic: exercise?.topic ?? "unknown",
    };
  });
}

export async function getAdaptationFor(
  userId: string,
  currentTopic: string,
  currentDifficulty: number,
  level: Level = "beginner"
): Promise<AdaptiveDecision> {
  const attempts = await loadAttemptRecords(userId);
  const recentScores = attempts.map((a) => a.score);
  const weaknesses = [...new Set(attempts.filter((a) => !a.isCorrect).map((a) => a.topic))];

  let aiSuggestion = null;
  try {
    aiSuggestion = await suggestAdaptation({
      topic: currentTopic,
      level,
      recentScores,
      previousMistakes: [],
      weaknesses,
      masteryScore: 0,
    });
  } catch {
    aiSuggestion = null;
  }

  return decide({ attempts, aiSuggestion, currentTopic, currentDifficulty });
}
```

- [ ] **Step 2: Créer `services/learning-plan.ts`**

```typescript
import { createClient } from "@/lib/supabase/server";
import { generateLearningPlan } from "@/lib/ai";
import type { LearningPlan, OnboardingInput } from "@/types";

export async function createLearningPath(
  userId: string,
  input: OnboardingInput
): Promise<LearningPlan> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("learning_paths")
    .select("id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { data: lessons } = await supabase
      .from("lessons")
      .select("title, difficulty")
      .eq("path_id", existing.id)
      .order("day");

    return {
      skill: input.skill,
      level: input.level,
      goal: input.goal,
      modules: (lessons ?? []).map((lesson) => ({
        title: lesson.title,
        objective: `Learn ${lesson.title}`,
        difficulty: lesson.difficulty,
      })),
    };
  }

  const plan = await generateLearningPlan({
    skill: input.skill,
    level: input.level,
    goal: input.goal,
    dailyTime: input.dailyTime,
    duration: input.duration,
  });

  const { data: path, error: pathError } = await supabase
    .from("learning_paths")
    .insert({
      user_id: userId,
      skill: plan.skill,
      level: plan.level,
      goal: plan.goal,
      daily_time: input.dailyTime,
      duration: input.duration,
    })
    .select()
    .single();
  if (pathError) throw new Error(`Failed to create learning path: ${pathError.message}`);

  const { error: lessonsError } = await supabase.from("lessons").insert(
    plan.modules.map((module, index) => ({
      path_id: path.id,
      day: index + 1,
      title: module.title,
      content: module.objective,
      difficulty: module.difficulty,
    }))
  );
  if (lessonsError) throw new Error(`Failed to create lessons: ${lessonsError.message}`);

  const { count } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("path_id", path.id);

  const { error: progressError } = await supabase.from("progress").upsert(
    {
      user_id: userId,
      path_id: path.id,
      completed_lessons: 0,
      total_lessons: count ?? plan.modules.length,
      mastery_score: 0,
      current_level: 1,
    },
    { onConflict: "user_id" }
  );
  if (progressError) throw new Error(`Failed to create progress: ${progressError.message}`);

  return plan;
}
```

- [ ] **Step 3: Créer `services/lesson.ts`**

```typescript
import { createClient } from "@/lib/supabase/server";
import { generateLesson } from "@/lib/ai";
import type { Level, LessonRow } from "@/types";

export type LessonContent = {
  objective: string;
  explanation: string;
  example: string;
  keyPoints: string[];
};

export async function getLessonsForUser(userId: string): Promise<LessonRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lessons")
    .select("id, path_id, day, title, content, difficulty")
    .order("day");

  if (error) throw new Error(`Failed to load lessons: ${error.message}`);

  // RLS garantit déjà le filtrage ; on ne retourne que les lignes lisibles.
  return (data ?? []) as LessonRow[];
}

export function parseLessonContent(lesson: LessonRow): LessonContent | null {
  if (!lesson.content || lesson.content.length < 10) return null;
  try {
    const parsed = JSON.parse(lesson.content) as Partial<LessonContent>;
    if (
      typeof parsed.objective !== "string" ||
      typeof parsed.explanation !== "string" ||
      typeof parsed.example !== "string" ||
      !Array.isArray(parsed.keyPoints)
    ) {
      return null;
    }
    return {
      objective: parsed.objective,
      explanation: parsed.explanation,
      example: parsed.example,
      keyPoints: parsed.keyPoints,
    };
  } catch {
    return null;
  }
}

export async function ensureLessonContent(
  lesson: LessonRow,
  skill: string,
  goal: string,
  level: Level = "beginner"
): Promise<LessonRow> {
  if (parseLessonContent(lesson)) return lesson;

  const generated = await generateLesson({
    skill,
    level,
    topic: lesson.title,
    goal,
    difficulty: lesson.difficulty,
  });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lessons")
    .update({
      title: generated.title,
      content: JSON.stringify({
        objective: generated.objective,
        explanation: generated.explanation,
        example: generated.example,
        keyPoints: generated.keyPoints,
      }),
    })
    .eq("id", lesson.id)
    .select()
    .single();

  if (error) throw new Error(`Failed to save lesson content: ${error.message}`);
  return data as LessonRow;
}

export async function getLessonById(
  userId: string,
  lessonId: string
): Promise<LessonRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lessons")
    .select("id, path_id, day, title, content, difficulty")
    .eq("id", lessonId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load lesson: ${error.message}`);
  if (!data) return null;

  const { data: path } = await supabase
    .from("learning_paths")
    .select("user_id")
    .eq("id", (data as LessonRow).path_id)
    .maybeSingle();

  if (!path || path.user_id !== userId) return null;
  return data as LessonRow;
}
```

- [ ] **Step 4: Écrire le test du service d'évaluation (doit échouer)**

Créer `tests/evaluation-service.test.ts` :

```typescript
import { describe, it, expect } from "vitest";
import { buildEvaluationInput } from "@/services/evaluation";
import type { ExerciseRow } from "@/types";

const codeExercise: ExerciseRow = {
  id: "e1",
  lesson_id: "l1",
  kind: "code",
  topic: "if/else conditions",
  question: "Write an if/else",
  options: null,
  correct_answer: null,
  explanation: "",
  difficulty: 1,
  starter_code: "age = 20",
  reference_solution: "if age >= 18:\n    print('adult')",
};

const qcmExercise: ExerciseRow = {
  ...codeExercise,
  id: "e2",
  kind: "qcm",
  options: ["a", "b"],
  correct_answer: "a",
  starter_code: null,
  reference_solution: null,
};

describe("buildEvaluationInput", () => {
  it("construit une entrée correcte pour un exercice de code", () => {
    const input = buildEvaluationInput(codeExercise, "if age = 18", "beginner");
    expect(input.kind).toBe("code");
    expect(input.correctAnswer).toBeNull();
    expect(input.referenceSolution).toBe("if age >= 18:\n    print('adult')");
    expect(input.learnerAnswer).toBe("if age = 18");
    expect(input.topic).toBe("if/else conditions");
  });

  it("construit une entrée correcte pour un QCM", () => {
    const input = buildEvaluationInput(qcmExercise, "a", "beginner");
    expect(input.kind).toBe("qcm");
    expect(input.correctAnswer).toBe("a");
    expect(input.referenceSolution).toBeNull();
  });

  it("refuse une réponse vide ou uniquement des espaces", () => {
    expect(() => buildEvaluationInput(codeExercise, "", "beginner")).toThrow();
    expect(() => buildEvaluationInput(codeExercise, "   ", "beginner")).toThrow();
  });
});
```

- [ ] **Step 5: Lancer le test pour vérifier qu'il échoue**

```bash
npm run test -- tests/evaluation-service.test.ts
```

Expected: FAIL, module `@/services/evaluation` introuvable.

- [ ] **Step 6: Créer `services/evaluation.ts`**

```typescript
import { createClient } from "@/lib/supabase/server";
import { evaluateAnswer, suggestAdaptation } from "@/lib/ai";
import { decide } from "@/lib/adaptation/rules";
import { loadAttemptRecords } from "./adaptation";
import type {
  AdaptiveDecision,
  Evaluation,
  EvaluationInput,
  ExerciseRow,
  Level,
} from "@/types";

export function buildEvaluationInput(
  exercise: ExerciseRow,
  learnerAnswer: string,
  level: Level
): EvaluationInput {
  if (!learnerAnswer || learnerAnswer.trim().length === 0) {
    throw new Error("Answer is required.");
  }

  return {
    question: exercise.question,
    kind: exercise.kind,
    correctAnswer: exercise.correct_answer,
    referenceSolution: exercise.reference_solution,
    learnerAnswer,
    level,
    topic: exercise.topic,
  };
}

export type SubmitAttemptResult = {
  attemptId: string;
  evaluation: Evaluation;
  decision: AdaptiveDecision;
};

export async function submitAttempt(
  userId: string,
  exerciseId: string,
  learnerAnswer: string,
  level: Level = "beginner"
): Promise<SubmitAttemptResult> {
  const supabase = await createClient();

  const { data: exerciseData, error: exerciseError } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", exerciseId)
    .maybeSingle();

  if (exerciseError) throw new Error(`Failed to load exercise: ${exerciseError.message}`);
  if (!exerciseData) throw new Error("Exercise not found.");

  const exercise = exerciseData as ExerciseRow;
  const input = buildEvaluationInput(exercise, learnerAnswer, level);
  const evaluation = await evaluateAnswer(input);

  const { data: attempt, error: attemptError } = await supabase
    .from("attempts")
    .insert({
      user_id: userId,
      exercise_id: exercise.id,
      answer: learnerAnswer,
      is_correct: evaluation.correct,
      score: evaluation.score,
      feedback: {
        mistake: evaluation.mistake,
        explanation: evaluation.explanation,
        hint: evaluation.hint,
        weakness: evaluation.weakness,
        masteryLevel: evaluation.masteryLevel,
      },
    })
    .select()
    .single();
  if (attemptError) throw new Error(`Failed to save attempt: ${attemptError.message}`);

  const attempts = await loadAttemptRecords(userId);
  const weaknesses = [
    ...new Set(attempts.filter((a) => !a.isCorrect).map((a) => a.topic)),
  ];

  let aiSuggestion = null;
  try {
    aiSuggestion = await suggestAdaptation({
      topic: exercise.topic,
      level,
      recentScores: attempts.map((a) => a.score),
      previousMistakes: [],
      weaknesses,
      masteryScore: 0,
    });
  } catch {
    aiSuggestion = null;
  }

  const decision = decide({
    attempts,
    aiSuggestion,
    currentTopic: exercise.topic,
    currentDifficulty: exercise.difficulty,
  });

  return { attemptId: attempt.id, evaluation, decision };
}
```

- [ ] **Step 7: Lancer les tests pour vérifier qu'ils passent**

```bash
npm run test -- tests/evaluation-service.test.ts
npm run typecheck
```

Expected: 3 tests passés, `tsc` propre.

- [ ] **Step 8: Créer `app/api/learning-plan/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { validateOnboardingInput } from "@/lib/validation/onboarding";
import { createLearningPath } from "@/services/learning-plan";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validation = validateOnboardingInput(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const plan = await createLearningPath(user.userId, validation.value);
    return NextResponse.json(plan);
  } catch (error) {
    console.error("learning-plan failed", error);
    return NextResponse.json(
      { error: "We couldn't generate your learning path right now. Please try again." },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 9: Créer `app/api/lesson/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { getLessonsForUser } from "@/services/lesson";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const lessons = await getLessonsForUser(user.userId);
    return NextResponse.json({ lessons });
  } catch (error) {
    console.error("lesson failed", error);
    return NextResponse.json(
      { error: "We couldn't load your lesson right now. Please try again." },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 10: Créer `app/api/exercise/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { generateExercise } from "@/lib/ai";
import type { ExerciseRow } from "@/types";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const lessonId = url.searchParams.get("lessonId") ?? "";
  const topic = url.searchParams.get("topic");
  const kindParam = url.searchParams.get("kind");
  const kind = kindParam === "qcm" || kindParam === "code" ? kindParam : undefined;
  const difficultyParam = url.searchParams.get("difficulty");
  const difficulty = difficultyParam ? Number(difficultyParam) : undefined;
  const regenerate = url.searchParams.get("regenerate") === "1";

  if (!lessonId) {
    return NextResponse.json({ error: "lessonId is required" }, { status: 400 });
  }

  const supabase = await createClient();

  try {
    if (regenerate && topic) {
      const generated = await generateExercise({
        topic,
        level: "beginner",
        difficulty: difficulty ?? 1,
        kind: kind ?? "code",
      });

      const { data, error } = await supabase
        .from("exercises")
        .insert({
          lesson_id: lessonId,
          kind: generated.kind,
          topic: generated.topic,
          question: generated.question,
          options: generated.options,
          correct_answer: generated.correctAnswer,
          explanation: generated.explanation,
          difficulty: generated.difficulty,
          starter_code: generated.starterCode,
          reference_solution: generated.referenceSolution,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);

      return NextResponse.json({ exercise: sanitize(data as ExerciseRow) });
    }

    let query = supabase.from("exercises").select("*").eq("lesson_id", lessonId);
    if (topic) query = query.eq("topic", topic);
    if (kind) query = query.eq("kind", kind);
    if (difficulty !== undefined) query = query.eq("difficulty", difficulty);

    const { data, error } = await query.order("difficulty").limit(1).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) {
      return NextResponse.json({ error: "No exercise available." }, { status: 404 });
    }

    return NextResponse.json({ exercise: sanitize(data as ExerciseRow) });
  } catch (error) {
    console.error("exercise failed", error);
    return NextResponse.json(
      { error: "We couldn't load the exercise right now. Please try again." },
      { status: 500 }
    );
  }
}

function sanitize(exercise: ExerciseRow) {
  const { correct_answer: _a, reference_solution: _b, ...rest } = exercise;
  return rest;
}
```

- [ ] **Step 11: Créer `app/api/evaluate/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { submitAttempt } from "@/services/evaluation";
import { getAdaptationFor } from "@/services/adaptation";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>).exerciseId !== "string" ||
    typeof (body as Record<string, unknown>).answer !== "string"
  ) {
    return NextResponse.json(
      { error: "exerciseId and answer are required" },
      { status: 400 }
    );
  }

  const { exerciseId, answer } = body as { exerciseId: string; answer: string };

  try {
    const result = await submitAttempt(user.userId, exerciseId, answer);
    return NextResponse.json(result);
  } catch (error) {
    console.error("evaluate failed", error);
    return NextResponse.json(
      { error: "We couldn't analyze your answer right now. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const topic = url.searchParams.get("topic") ?? "";
  const difficulty = Number(url.searchParams.get("difficulty") ?? "1");

  try {
    const decision = await getAdaptationFor(user.userId, topic, difficulty);
    return NextResponse.json({ decision });
  } catch (error) {
    console.error("adapt failed", error);
    return NextResponse.json(
      { error: "We couldn't adapt your path right now. Please try again." },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 12: Lancer tous les tests et le typecheck**

```bash
npm run test
npm run typecheck
```

Expected: tous les tests passés, `tsc` propre.

- [ ] **Step 13: Commit**

```bash
git checkout -b feature/api
git add services app/api tests/evaluation-service.test.ts
git commit -m "feat: add learning services and API routes for plan, lesson, exercise and evaluation"
```

---

### Task 9: Providers NVIDIA et Gemini, prompts

**Files:**
- Create: `lib/ai/nvidia.ts`, `lib/ai/gemini.ts`
- Create: `prompts/learning-plan.ts`, `prompts/lesson.ts`, `prompts/exercise.ts`, `prompts/evaluation.ts`, `prompts/adaptation.ts`

**Interfaces:**
- Consumes: `AIProvider` (Task 4), `fetchJson` (Task 5)
- Produces: `nvidiaProvider: AIProvider`, `geminiProvider: AIProvider`, et pour chaque module de prompt `SYSTEM: string` et `buildUser(input): string`

Seule tâche dépendant d'une clé externe. Si elle n'est pas faite, `getProviderChain()` renvoie `[demoProvider]` et la démo fonctionne. Ne pas la bloquer sur l'obtention d'une clé.

- [ ] **Step 1: Créer `prompts/learning-plan.ts`**

```typescript
import type { PlanInput } from "@/types";

export const SYSTEM =
  "You are a senior curriculum designer. You always answer with valid JSON and nothing else.";

export function buildUser(input: PlanInput): string {
  return [
    "Design a learning plan as a JSON object with this exact shape:",
    '{"skill":string,"level":string,"goal":string,"modules":[{"title":string,"objective":string,"difficulty":number}]}',
    "",
    `Skill: ${input.skill}`,
    `Level: ${input.level}`,
    `Goal: ${input.goal}`,
    `Minutes available per day: ${input.dailyTime}`,
    `Days: ${input.duration}`,
    "",
    "Rules:",
    "- 3 to 5 modules, ordered from simplest to most complex.",
    "- difficulty is an integer from 1 to 5.",
    "- objectives must be concrete, written simply when level is beginner.",
    "- Return the JSON object only, with no markdown fence and no commentary.",
  ].join("\n");
}
```

- [ ] **Step 2: Créer `prompts/lesson.ts`**

```typescript
import type { LessonInput } from "@/types";
import { SYSTEM } from "./learning-plan";

export { SYSTEM };

export function buildUser(input: LessonInput): string {
  return [
    "Write a lesson as a JSON object with this exact shape:",
    '{"title":string,"objective":string,"explanation":string,"example":string,"keyPoints":string[]}',
    "",
    `Skill: ${input.skill}`,
    `Level: ${input.level}`,
    `Topic: ${input.topic}`,
    `Goal: ${input.goal}`,
    `Difficulty: ${input.difficulty}`,
    "",
    "Rules:",
    "- explanation must be plain language, under 150 words.",
    "- example must be runnable code for the topic.",
    "- keyPoints must contain 3 to 5 short strings.",
    "- Return the JSON object only, with no markdown fence.",
  ].join("\n");
}
```

- [ ] **Step 3: Créer `prompts/exercise.ts`**

```typescript
import type { ExerciseInput } from "@/types";
import { SYSTEM } from "./learning-plan";

export { SYSTEM };

export function buildUser(input: ExerciseInput): string {
  const shape =
    input.kind === "qcm"
      ? '{"kind":"qcm","topic":string,"question":string,"difficulty":number,"options":string[],"correctAnswer":string,"explanation":string}'
      : '{"kind":"code","topic":string,"question":string,"difficulty":number,"starterCode":string,"referenceSolution":string,"explanation":string}';

  return [
    `Write one ${input.kind} exercise as a JSON object with this exact shape:`,
    shape,
    "",
    `Topic: ${input.topic}`,
    `Level: ${input.level}`,
    `Difficulty: ${input.difficulty}`,
    "",
    "Rules:",
    input.kind === "qcm"
      ? "- options must contain 4 strings, exactly one of which equals correctAnswer."
      : "- starterCode is the code the learner starts from. referenceSolution is a working answer.",
    "- Return the JSON object only, with no markdown fence.",
  ].join("\n");
}
```

- [ ] **Step 4: Créer `prompts/evaluation.ts`**

```typescript
import type { EvaluationInput } from "@/types";
import { SYSTEM } from "./learning-plan";

export { SYSTEM };

export function buildUser(input: EvaluationInput): string {
  return [
    "Evaluate a learner answer as a JSON object with this exact shape:",
    '{"correct":boolean,"score":number,"mistake":string,"explanation":string,"hint":string,"weakness":string,"masteryLevel":string}',
    "",
    `Topic: ${input.topic}`,
    `Learner level: ${input.level}`,
    `Question: ${input.question}`,
    input.kind === "qcm"
      ? `Correct answer: ${input.correctAnswer ?? "unknown"}`
      : `Reference solution:\n${input.referenceSolution ?? "none"}`,
    `Learner answer:\n${input.learnerAnswer}`,
    "",
    "Rules:",
    "- score is an integer from 0 to 100.",
    "- weakness is the single specific concept the learner is missing, lowercase, at most 6 words.",
    "- mistake names the exact token or operator involved in the error.",
    "- hint is a nudge, never the full answer.",
    "- mistake and hint are empty strings when correct is true.",
    "- Return the JSON object only, with no markdown fence.",
  ].join("\n");
}
```

- [ ] **Step 5: Créer `prompts/adaptation.ts`**

```typescript
import type { AdaptationInput } from "@/types";
import { SYSTEM } from "./learning-plan";

export { SYSTEM };

export function buildUser(input: AdaptationInput): string {
  return [
    "Suggest the next learning activity as a JSON object with this exact shape:",
    '{"action":string,"topic":string,"difficulty":number,"reason":string,"nextActivity":string}',
    "",
    `Current topic: ${input.topic}`,
    `Learner level: ${input.level}`,
    `Recent scores: ${input.recentScores.join(", ") || "none"}`,
    `Previous mistakes: ${input.previousMistakes.join("; ") || "none"}`,
    `Known weaknesses: ${input.weaknesses.join(", ") || "none"}`,
    `Mastery score: ${input.masteryScore}`,
    "",
    "Rules:",
    "- action is one of: remediation, same_level, increase_difficulty, next_topic.",
    "- difficulty is an integer from 1 to 5.",
    "- nextActivity is a short imperative sentence shown to the learner.",
    "- Return the JSON object only, with no markdown fence.",
  ].join("\n");
}
```

- [ ] **Step 6: Créer `lib/ai/nvidia.ts`**

```typescript
import type { AIProvider } from "@/types";
import { fetchJson } from "./http";
import * as planPrompt from "@/prompts/learning-plan";
import * as lessonPrompt from "@/prompts/lesson";
import * as exercisePrompt from "@/prompts/exercise";
import * as evaluationPrompt from "@/prompts/evaluation";
import * as adaptationPrompt from "@/prompts/adaptation";

const BASE_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

function model(): string {
  return process.env.NVIDIA_MODEL ?? "qwen/qwen2.5-coder-32b-instruct";
}

async function call(system: string, user: string): Promise<unknown> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error("NVIDIA_API_KEY is not set");

  const response = await fetchJson(
    BASE_URL,
    {
      model: model(),
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    },
    apiKey
  );

  const content = (response as { choices?: { message?: { content?: string } }[] })
    ?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from NVIDIA");

  return JSON.parse(content) as unknown;
}

export const nvidiaProvider: AIProvider = {
  name: "nvidia",
  generateLearningPlan: (input) => call(planPrompt.SYSTEM, planPrompt.buildUser(input)),
  generateLesson: (input) => call(lessonPrompt.SYSTEM, lessonPrompt.buildUser(input)),
  generateExercise: (input) => call(exercisePrompt.SYSTEM, exercisePrompt.buildUser(input)),
  evaluateAnswer: (input) => call(evaluationPrompt.SYSTEM, evaluationPrompt.buildUser(input)),
  suggestAdaptation: (input) =>
    call(adaptationPrompt.SYSTEM, adaptationPrompt.buildUser(input)),
};
```

- [ ] **Step 7: Créer `lib/ai/gemini.ts`**

```typescript
import type { AIProvider } from "@/types";
import { fetchJson } from "./http";
import * as planPrompt from "@/prompts/learning-plan";
import * as lessonPrompt from "@/prompts/lesson";
import * as exercisePrompt from "@/prompts/exercise";
import * as evaluationPrompt from "@/prompts/evaluation";
import * as adaptationPrompt from "@/prompts/adaptation";

const BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

function model(): string {
  return process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
}

async function call(system: string, user: string): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const response = await fetchJson(
    `${BASE_URL}/${encodeURIComponent(model())}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { temperature: 0.3, responseMimeType: "application/json" },
    },
    "unused"
  );

  const text = (
    response as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
  )?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini");

  return JSON.parse(text) as unknown;
}

export const geminiProvider: AIProvider = {
  name: "gemini",
  generateLearningPlan: (input) => call(planPrompt.SYSTEM, planPrompt.buildUser(input)),
  generateLesson: (input) => call(lessonPrompt.SYSTEM, lessonPrompt.buildUser(input)),
  generateExercise: (input) => call(exercisePrompt.SYSTEM, exercisePrompt.buildUser(input)),
  evaluateAnswer: (input) => call(evaluationPrompt.SYSTEM, evaluationPrompt.buildUser(input)),
  suggestAdaptation: (input) =>
    call(adaptationPrompt.SYSTEM, adaptationPrompt.buildUser(input)),
};
```

- [ ] **Step 8: Vérifier que la démo n'est pas affectée**

```bash
npm run typecheck
npm run test
```

Expected: `tsc` propre, tous les tests passent. Aucun test ne touche NVIDIA ni Gemini, donc l'absence de clé ne change rien.

- [ ] **Step 9: Vérifier la bascule silencieuse (une seule fois, si une clé est disponible)**

```bash
# .env.local : AI_PROVIDER=nvidia, NVIDIA_API_KEY=<clé invalide volontairement>
npm run dev
```

Puis suivre le parcours jusqu'à la correction.

Expected: le parcours fonctionne intégralement, et le logger serveur contient une erreur de provider. **Aucun message d'erreur n'apparaît à l'écran.** C'est le comportement qui protège le jour J.

- [ ] **Step 10: Remettre `AI_PROVIDER` vide et commiter**

```bash
git checkout -b feature/ai-providers
git add lib/ai prompts
git commit -m "ai: add NVIDIA and Gemini providers with structured prompts"
```

---

### Task 10: Landing et composants partagés

**Files:**
- Modify: `app/page.tsx`
- Create: `components/ui/ai-thinking.tsx`, `components/ui/ai-error.tsx`, `components/ui/progress-bar.tsx`

**Interfaces:**
- Consumes: rien
- Produces:
  - `<AiThinking label: string>` — indicateur animé, `role="status"`, `aria-live="polite"`
  - `<AiError message: string; onRetry?: () => void>` — `role="alert"`
  - `<ProgressBar value: number>` — `role="progressbar"`, borné 0-100
  - `app/page.tsx` — landing avec tagline et CTA `Start learning` vers `/onboarding`

- [ ] **Step 1: Créer `components/ui/ai-thinking.tsx`**

```tsx
export function AiThinking({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3"
    >
      <span className="h-2 w-2 animate-ping rounded-full bg-indigo-400" />
      <span className="text-sm text-indigo-200">{label}</span>
    </div>
  );
}
```

- [ ] **Step 2: Créer `components/ui/ai-error.tsx`**

```tsx
"use client";

export function AiError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3"
    >
      <p className="text-sm text-orange-200">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-orange-400/50 px-3 py-1.5 text-sm text-orange-100 hover:bg-orange-500/20"
        >
          Try again
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Créer `components/ui/progress-bar.tsx`**

```tsx
export function ProgressBar({ value }: { value: number }) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800"
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-[width] duration-500"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
```

- [ ] **Step 4: Remplacer `app/page.tsx`**

```tsx
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-5xl font-bold tracking-tight text-white">SamaCoach AI</h1>
        <p className="mt-6 text-2xl leading-relaxed text-slate-300">
          Your learning path.
          <br />
          Your pace.
          <br />
          <span className="text-indigo-400">Your AI coach.</span>
        </p>
        <p className="mx-auto mt-6 max-w-xl text-lg text-slate-400">
          Learn smarter with an AI coach that adapts to you.
        </p>
        <Link
          href="/onboarding"
          className="mt-10 inline-block rounded-xl bg-indigo-600 px-8 py-3 text-lg font-medium text-white transition hover:bg-indigo-500"
        >
          Start learning
        </Link>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Vérifier et commiter**

```bash
npm run typecheck
git checkout -b feature/landing
git add app/page.tsx components/ui
git commit -m "ui: add landing page and shared AI feedback components"
```

---

### Task 11: Onboarding et génération du plan

**Files:**
- Create: `app/onboarding/page.tsx`, `app/onboarding/actions.ts`, `app/onboarding/form.tsx`
- Create: `components/onboarding/steps.tsx`

**Interfaces:**
- Consumes: `validateOnboardingInput` (Task 3), `createLearningPath` (Task 8), `AiThinking`, `AiError` (Task 10)
- Produces: parcours 4 étapes sur une page, indicateur `Step N of 4`, champs de formulaire nommés `skill`, `level`, `goal`, `dailyTime`, `duration`
- `app/onboarding/actions.ts` → `type OnboardingState = { error: string | null }`, `submitOnboarding(state, formData): Promise<OnboardingState>`
- `components/onboarding/steps.tsx` → `<Steps pending: boolean>` Client Component, contient le `<form>` et les inputs cachés

- [ ] **Step 1: Créer `app/onboarding/actions.ts`**

```typescript
"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { validateOnboardingInput } from "@/lib/validation/onboarding";
import { createLearningPath } from "@/services/learning-plan";

export type OnboardingState = { error: string | null };

export async function submitOnboarding(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const validation = validateOnboardingInput({
    skill: formData.get("skill"),
    level: formData.get("level"),
    goal: formData.get("goal"),
    dailyTime: Number(formData.get("dailyTime")),
    duration: Number(formData.get("duration")),
  });

  if (!validation.ok) return { error: validation.error };

  try {
    await createLearningPath(user.userId, validation.value);
  } catch (error) {
    console.error("onboarding failed", error);
    return {
      error: "We couldn't generate your learning path right now. Please try again.",
    };
  }

  redirect("/dashboard");
}
```

- [ ] **Step 2: Créer `components/onboarding/steps.tsx`**

```tsx
"use client";

import { useState } from "react";

const STEPS = [
  { key: "skill", title: "What do you want to learn?" },
  { key: "level", title: "What's your current level?" },
  { key: "goal", title: "What's your goal?" },
  { key: "time", title: "How much time can you dedicate?" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

export function Steps({ pending }: { pending: boolean }) {
  const [index, setIndex] = useState(0);
  const [skill, setSkill] = useState("Python");
  const [level, setLevel] = useState("beginner");
  const [goal, setGoal] = useState("Build Python applications");
  const [dailyTime, setDailyTime] = useState(60);
  const [duration, setDuration] = useState(30);

  const step: { key: StepKey; title: string } = STEPS[index];

  return (
    <div className="w-full max-w-lg">
      <p className="text-sm text-slate-400">
        Step {index + 1} of {STEPS.length}
      </p>
      <div className="mt-2 flex gap-1.5">
        {STEPS.map((s, i) => (
          <div
            key={s.key}
            className={`h-1 flex-1 rounded-full ${
              i <= index ? "bg-indigo-500" : "bg-slate-800"
            }`}
          />
        ))}
      </div>

      <h2 className="mt-8 text-2xl font-semibold text-white">{step.title}</h2>

      <input type="hidden" name="skill" value={skill} />
      <input type="hidden" name="level" value={level} />
      <input type="hidden" name="goal" value={goal} />
      <input type="hidden" name="dailyTime" value={dailyTime} />
      <input type="hidden" name="duration" value={duration} />

      {step.key === "skill" && (
        <input
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          className="mt-4 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white"
          placeholder="Python"
        />
      )}

      {step.key === "level" && (
        <div className="mt-4 space-y-2">
          {(["beginner", "intermediate", "advanced"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setLevel(option)}
              className={`w-full rounded-lg border px-4 py-3 text-left capitalize ${
                level === option
                  ? "border-indigo-500 bg-indigo-500/10 text-white"
                  : "border-slate-700 text-slate-300"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {step.key === "goal" && (
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          rows={3}
          className="mt-4 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white"
        />
      )}

      {step.key === "time" && (
        <div className="mt-4 space-y-6">
          <div>
            <label className="text-sm text-slate-300">
              Minutes per day: {dailyTime}
            </label>
            <input
              type="range"
              min={15}
              max={240}
              step={15}
              value={dailyTime}
              onChange={(e) => setDailyTime(Number(e.target.value))}
              className="mt-2 w-full"
            />
          </div>
          <div>
            <label className="text-sm text-slate-300">
              Duration: {duration} days
            </label>
            <input
              type="range"
              min={1}
              max={90}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="mt-2 w-full"
            />
          </div>
        </div>
      )}

      <div className="mt-8 flex gap-3">
        {index > 0 && (
          <button
            type="button"
            onClick={() => setIndex(index - 1)}
            disabled={pending}
            className="rounded-lg border border-slate-700 px-5 py-2.5 text-slate-300"
          >
            Back
          </button>
        )}
        {index < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setIndex(index + 1)}
            className="flex-1 rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-500"
          >
            Continue
          </button>
        ) : (
          <button
            type="submit"
            disabled={pending}
            className="flex-1 rounded-lg bg-indigo-600 py-2.5 font-medium text-white disabled:opacity-60"
          >
            Generate my path
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Créer `app/onboarding/form.tsx`**

```tsx
"use client";

import { useActionState } from "react";
import type { OnboardingState } from "./actions";
import { Steps } from "@/components/onboarding/steps";
import { AiThinking } from "@/components/ui/ai-thinking";
import { AiError } from "@/components/ui/ai-error";

type ServerAction = (
  state: OnboardingState,
  formData: FormData
) => Promise<OnboardingState>;

export function Form({
  action,
  initial,
}: {
  action: ServerAction;
  initial: OnboardingState;
}) {
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="flex w-full max-w-lg flex-col items-center">
      {pending ? (
        <AiThinking label="Generating your learning path..." />
      ) : (
        <Steps pending={pending} />
      )}
      {state.error && !pending && <AiError message={state.error} />}
    </form>
  );
}
```

- [ ] **Step 4: Créer `app/onboarding/page.tsx`**

```tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { submitOnboarding, type OnboardingState } from "./actions";
import { Form } from "./form";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const initial: OnboardingState = { error: null };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-16">
      <Form action={submitOnboarding} initial={initial} />
    </main>
  );
}
```

- [ ] **Step 5: Vérifier le parcours de bout en bout**

```bash
npm run typecheck
npm run dev
```

Puis dans le navigateur : `/` → `Start learning` → 4 étapes → `Generate my path`.

Expected: pendant l'appel, `Generating your learning path...` s'affiche. À la fin, redirection vers `/dashboard`. Sans clé IA, la génération passe par `demoProvider` et crée 3 leçons.

- [ ] **Step 6: Commit**

```bash
git checkout -b feature/onboarding
git add app/onboarding components/onboarding
git commit -m "ui: add 4-step onboarding with learning plan generation"
```

---

### Task 12: Dashboard et parcours d'apprentissage

**Files:**
- Create: `app/dashboard/page.tsx`, `app/dashboard/learning-path.tsx`

**Interfaces:**
- Consumes: `getCurrentUser`, `createClient` (Task 3), `getLessonsForUser` (Task 8), `getAdaptationFor` (Task 8), `ProgressBar` (Task 10)
- Produces: `/dashboard` affichant salutation, barre de progression, topic courant, prochaine activité, liste des jours, CTA vers `/learn/[lessonId]`. Redirige vers `/login` si non connecté, vers `/onboarding` si aucune leçon.

- [ ] **Step 1: Créer `app/dashboard/learning-path.tsx`**

```tsx
import Link from "next/link";
import type { LessonRow } from "@/types";

export function LearningPath({ lessons }: { lessons: LessonRow[] }) {
  return (
    <ol className="space-y-2">
      {lessons.map((lesson, index) => {
        const state = index === 0 ? "done" : index === 1 ? "current" : "locked";
        return (
          <li
            key={lesson.id}
            className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
              state === "current"
                ? "border-indigo-500 bg-indigo-500/10"
                : "border-slate-800"
            }`}
          >
            <span className={state === "locked" ? "text-slate-500" : "text-white"}>
              Day {lesson.day} — {lesson.title}
            </span>
            <span aria-hidden className="text-sm">
              {state === "done" ? "✓" : state === "current" ? "→" : "🔒"}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function LessonLink({ lessonId }: { lessonId: string }) {
  return (
    <Link
      href={`/learn/${lessonId}`}
      className="inline-block rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-500"
    >
      Continue learning
    </Link>
  );
}
```

- [ ] **Step 2: Créer `app/dashboard/page.tsx`**

```tsx
import { redirect } from "next/navigation";
import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { getLessonsForUser } from "@/services/lesson";
import { getAdaptationFor } from "@/services/adaptation";
import { ProgressBar } from "@/components/ui/progress-bar";
import { LearningPath, LessonLink } from "./learning-path";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.userId)
    .maybeSingle();

  const { data: progress } = await supabase
    .from("progress")
    .select("completed_lessons, total_lessons, mastery_score")
    .eq("user_id", user.userId)
    .maybeSingle();

  const lessons = await getLessonsForUser(user.userId);
  if (lessons.length === 0) redirect("/onboarding");

  const currentIndex = Math.min(
    progress?.completed_lessons ?? 0,
    lessons.length - 1
  );
  const currentLesson = lessons[currentIndex];
  const topic = currentLesson.title.toLowerCase().includes("condition")
    ? "if/else conditions"
    : currentLesson.title.toLowerCase();

  const decision = await getAdaptationFor(
    user.userId,
    topic,
    currentLesson.difficulty
  );

  const percent =
    progress && progress.total_lessons > 0
      ? (progress.completed_lessons / progress.total_lessons) * 100
      : 0;

  const firstName = profile?.name?.split(" ")[0] ?? "there";

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12">
      <div className="mx-auto max-w-2xl space-y-8">
        <header>
          <h1 className="text-3xl font-semibold text-white">
            Good morning, {firstName} 👋
          </h1>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-sm text-slate-400">Your learning progress</h2>
          <div className="mt-3 flex items-center gap-4">
            <ProgressBar value={percent} />
            <span className="text-sm text-indigo-300">{Math.round(percent)}%</span>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-sm text-slate-400">Current topic</h2>
            <p className="mt-2 text-lg text-white">{topic}</p>
          </div>
          <div className="rounded-2xl border border-indigo-500/40 bg-indigo-500/10 p-6">
            <h2 className="text-sm text-indigo-300">Next activity</h2>
            <p className="mt-2 text-lg text-white">{decision.nextActivity}</p>
            <p className="mt-1 text-sm text-slate-400">
              Difficulty: {decision.difficulty}
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm text-slate-400">Your learning path</h2>
          <LearningPath lessons={lessons} />
        </section>

        <LessonLink lessonId={currentLesson.id} />
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Vérifier et commiter**

```bash
npm run typecheck
npm run dev
```

Expected: `/dashboard` affiche la progression, le topic courant et une recommandation d'activité. Aucune erreur.

```bash
git checkout -b feature/dashboard
git add app/dashboard
git commit -m "ui: add dashboard with progress, current topic and next activity"
```

---

### Task 13: Leçon et exercice QCM

**Files:**
- Create: `app/learn/[lessonId]/page.tsx`
- Create: `components/lesson/lesson-view.tsx`, `components/exercise/exercise-panel.tsx`
- Create: `components/qcm/qcm-exercise.tsx`

**Interfaces:**
- Consumes: `getLessonById`, `ensureLessonContent`, `parseLessonContent` (Task 8), `AiThinking`, `AiError` (Task 10)
- Produces:
  - `/learn/[lessonId]` — leçon (titre, objectif, explication, exemple, points clés) puis exercice
  - `<QcmExercise question: string; options: string[]; onSubmit: (answer: string) => Promise<void>; pending: boolean>` — Client Component
  - `<ExercisePanel lessonId: string; topic: string; kind: "qcm" | "code"; difficulty: number; onSubmitted: (attemptId: string) => void>` — Client Component, appelle `/api/exercise` puis POST `/api/evaluate`

Paramètres d'URL supportés par `/learn/[lessonId]` : `?topic=`, `?kind=`, `?difficulty=`, `?regenerate=1`. Ce sont eux qui rendent possible l'exercice correctif.

- [ ] **Step 1: Créer `components/qcm/qcm-exercise.tsx`**

```tsx
"use client";

import { useState } from "react";

export function QcmExercise({
  question,
  options,
  onSubmit,
  pending,
}: {
  question: string;
  options: string[];
  onSubmit: (answer: string) => Promise<void>;
  pending: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <p className="whitespace-pre-line text-white">{question}</p>
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            disabled={pending}
            onClick={() => setSelected(option)}
            className={`w-full rounded-lg border px-4 py-3 text-left ${
              selected === option
                ? "border-indigo-500 bg-indigo-500/10 text-white"
                : "border-slate-700 text-slate-300"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={!selected || pending}
        onClick={() => selected && onSubmit(selected)}
        className="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white disabled:opacity-60"
      >
        Submit answer
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Créer `components/exercise/exercise-panel.tsx`**

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { QcmExercise } from "@/components/qcm/qcm-exercise";
import { CodeExercise } from "@/components/code-exercise/code-exercise";
import { AiThinking } from "@/components/ui/ai-thinking";
import { AiError } from "@/components/ui/ai-error";

type ExercisePayload = {
  id: string;
  kind: "qcm" | "code";
  question: string;
  options: string[] | null;
  starter_code: string | null;
  difficulty: number;
};

export function ExercisePanel({
  lessonId,
  topic,
  kind,
  difficulty,
  onSubmitted,
}: {
  lessonId: string;
  topic: string;
  kind: "qcm" | "code";
  difficulty: number;
  onSubmitted: (attemptId: string) => void;
}) {
  const [exercise, setExercise] = useState<ExercisePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        lessonId,
        topic,
        kind,
        String(difficulty),
      });
      const response = await fetch(`/api/exercise?${params.toString()}`);
      const data = (await response.json()) as {
        exercise?: ExercisePayload;
        error?: string;
      };
      if (!response.ok || !data.exercise) {
        setError(data.error ?? "We couldn't load the exercise right now.");
        return;
      }
      setExercise(data.exercise);
    } catch {
      setError("We couldn't load the exercise right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [lessonId, topic, kind, difficulty]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (answer: string) => {
    if (!exercise) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId: exercise.id, answer }),
      });
      const data = (await response.json()) as { attemptId?: string; error?: string };
      if (!response.ok || !data.attemptId) {
        setError(data.error ?? "We couldn't analyze your answer right now. Please try again.");
        return;
      }
      onSubmitted(data.attemptId);
    } catch {
      setError("We couldn't analyze your answer right now. Please try again.");
    } finally {
      setPending(false);
    }
  };

  if (loading) return <AiThinking label="Creating your exercise..." />;
  if (error && !exercise) return <AiError message={error} onRetry={() => void load()} />;
  if (!exercise) return null;

  return (
    <div className="space-y-4">
      {exercise.kind === "qcm" && exercise.options ? (
        <QcmExercise
          question={exercise.question}
          options={exercise.options}
          onSubmit={submit}
          pending={pending}
        />
      ) : (
        <CodeExercise
          question={exercise.question}
          starterCode={exercise.starter_code ?? ""}
          onSubmit={submit}
          pending={pending}
        />
      )}

      {pending && <AiThinking label="Analyzing your answer..." />}
      {error && <AiError message={error} />}
    </div>
  );
}
```

- [ ] **Step 3: Créer `app/learn/[lessonId]/page.tsx`**

Next.js 15 : `params` est une Promise.

```tsx
import { redirect } from "next/navigation";
import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { getLessonById, ensureLessonContent, parseLessonContent } from "@/services/lesson";
import { ExercisePanel } from "@/components/exercise/exercise-panel";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LearnPage({
  params,
  searchParams,
}: {
  params: Promise<{ lessonId: string }>;
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { lessonId } = await params;
  const query = await searchParams;

  const lesson = await getLessonById(user.userId, lessonId);
  if (!lesson) redirect("/dashboard");

  const supabase = await createClient();
  const { data: path } = await supabase
    .from("learning_paths")
    .select("skill, goal")
    .eq("id", lesson.path_id)
    .maybeSingle();

  const enriched = await ensureLessonContent(
    lesson,
    path?.skill ?? "Python",
    path?.goal ?? "Build Python applications"
  );
  const content = parseLessonContent(enriched);

  const topic =
    typeof query.topic === "string"
      ? query.topic
      : enriched.title.toLowerCase().includes("condition")
        ? "if/else conditions"
        : enriched.title.toLowerCase();
  const kind = query.kind === "code" ? "code" : "qcm";
  const difficulty = Number(query.difficulty ?? enriched.difficulty) || 1;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12">
      <div className="mx-auto max-w-2xl space-y-8">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-indigo-300">Day {enriched.day}</p>
          <h1 className="mt-1 text-3xl font-semibold text-white">{enriched.title}</h1>
          {content && (
            <>
              <p className="mt-4 text-indigo-200">{content.objective}</p>
              <p className="mt-4 whitespace-pre-line text-slate-300">
                {content.explanation}
              </p>
              <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm text-emerald-300">
                {content.example}
              </pre>
              <ul className="mt-4 space-y-1">
                {content.keyPoints.map((point) => (
                  <li key={point} className="text-sm text-slate-400">
                    • {point}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-4 text-lg font-medium text-white">Practice</h2>
          <ExercisePanelClient
            lessonId={enriched.id}
            topic={topic}
            kind={kind}
            difficulty={difficulty}
          />
        </section>
      </div>
    </main>
  );
}
```

Créer ensuite `app/learn/[lessonId]/exercise-client.tsx` pour encapsuler la redirection côté client :

```tsx
"use client";

import { useRouter } from "next/navigation";
import { ExercisePanel } from "@/components/exercise/exercise-panel";

export function ExercisePanelClient(props: {
  lessonId: string;
  topic: string;
  kind: "qcm" | "code";
  difficulty: number;
}) {
  const router = useRouter();
  return <ExercisePanel {...props} onSubmitted={(id) => router.push(`/correction/${id}`)} />;
}
```

Puis, dans `app/learn/[lessonId]/page.tsx`, remplacer l'import de `ExercisePanel` par l'import de `ExercisePanelClient` :

```tsx
import { ExercisePanelClient } from "./exercise-client";
```

Le composant s'utilise alors avec les mêmes props, `<ExercisePanelClient lessonId={enriched.id} topic={topic} kind={kind} difficulty={difficulty} />`.

- [ ] **Step 4: Créer `components/code-exercise/code-exercise.tsx`**

Nécessaire pour que `ExercisePanel` compile. La Task 14 l'enrichira d'un libellé `Question` et d'un libellé `Your code`.

```tsx
"use client";

import { useState } from "react";

export function CodeExercise({
  question,
  starterCode,
  onSubmit,
  pending,
}: {
  question: string;
  starterCode: string;
  onSubmit: (answer: string) => Promise<void>;
  pending: boolean;
}) {
  const [code, setCode] = useState(starterCode);

  return (
    <div className="space-y-4">
      <p className="whitespace-pre-line text-white">{question}</p>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={12}
        spellCheck={false}
        aria-label="Your code"
        className="w-full rounded-lg border border-slate-700 bg-slate-950 p-4 font-mono text-sm text-emerald-200"
      />
      <button
        type="button"
        disabled={!code.trim() || pending}
        onClick={() => onSubmit(code)}
        className="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white disabled:opacity-60"
      >
        Submit answer
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Vérifier et commiter**

```bash
npm run typecheck
npm run dev
```

Expected: `/learn/[id]` affiche la leçon puis un QCM. Soumettre une réponse fausse mène à `/correction/[attemptId]`, qui n'existe pas encore — c'est attendu à ce stade.

```bash
git checkout -b feature/lesson-qcm
git add app/learn components/lesson components/exercise components/qcm components/code-exercise
git commit -m "ui: add lesson view and QCM exercise panel"
```

---

### Task 14: Exercice de code

**Files:**
- Modify: `components/code-exercise/code-exercise.tsx`

**Interfaces:**
- Consumes: `ExercisePanel` (Task 13)
- Produces: `<CodeExercise question, starterCode, onSubmit, pending>` — textarea monospace, bouton `Submit answer` désactivé si le code est vide

- [ ] **Step 1: Remplacer le contenu de `components/code-exercise/code-exercise.tsx`**

```tsx
"use client";

import { useState } from "react";

export function CodeExercise({
  question,
  starterCode,
  onSubmit,
  pending,
}: {
  question: string;
  starterCode: string;
  onSubmit: (answer: string) => Promise<void>;
  pending: boolean;
}) {
  const [code, setCode] = useState(starterCode);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-slate-300">Question</h3>
        <p className="mt-1 whitespace-pre-line text-white">{question}</p>
      </div>

      <div>
        <h3 className="text-sm font-medium text-slate-300">Your code</h3>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={12}
          spellCheck={false}
          aria-label="Your code"
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-4 font-mono text-sm text-emerald-200"
        />
      </div>

      <button
        type="button"
        disabled={!code.trim() || pending}
        onClick={() => onSubmit(code)}
        className="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white disabled:opacity-60"
      >
        {pending ? "Analyzing your answer..." : "Submit answer"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Vérifier que le mode code est atteignable**

```bash
npm run dev
```

Puis ouvrir `/learn/<id-leçon-conditions>?kind=code&topic=if%2Felse%20conditions`.

Expected: textarea pré-remplie avec `age = 20`, bouton `Submit answer` actif.

- [ ] **Step 3: Commit**

```bash
git add components/code-exercise
git commit -m "ui: replace code exercise stub with full editor"
```

---

### Task 15: Correction et affichage adaptatif

**Files:**
- Create: `app/correction/[attemptId]/page.tsx`

**Interfaces:**
- Consumes: `getCurrentUser`, `createClient` (Task 3), `getAdaptationFor` (Task 8), `ProgressBar` (Task 10)
- Produces: `/correction/[attemptId]` — verdict, score, `mistake`/`explanation`/`hint`, encadré « 🎯 Difficulty detected » avec la faiblesse et l'action, et un bouton `Start recommended activity` qui navigue vers `/learn/[lessonId]?kind=code&topic=<topic>&difficulty=<difficulty>&regenerate=1`

La page lit l'`attempt` et les métadonnées de son exercice via un seul join Supabase (`attempts.select("..., exercises(lesson_id, topic, difficulty)")`). Il n'y a donc pas besoin d'une fonction `getExerciseFor` dans `services/lesson.ts` : rien d'autre ne la consommerait.

- [ ] **Step 1: Créer `app/correction/[attemptId]/page.tsx`**

```tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { getAdaptationFor } from "@/services/adaptation";
import { ProgressBar } from "@/components/ui/progress-bar";

type Feedback = {
  mistake: string;
  explanation: string;
  hint: string;
  weakness: string;
  masteryLevel: string;
};

type ExerciseMeta = {
  lesson_id: string;
  topic: string;
  difficulty: number;
};

type Attempt = {
  id: string;
  answer: string;
  is_correct: boolean;
  score: number;
  feedback: Feedback;
  exercises: ExerciseMeta | null;
};

export default async function CorrectionPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { attemptId } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("attempts")
    .select("id, answer, is_correct, score, feedback, exercises(lesson_id, topic, difficulty)")
    .eq("id", attemptId)
    .maybeSingle();

  const attempt = data as Attempt | null;
  if (!attempt) redirect("/dashboard");

  const exercise = attempt.exercises;
  if (!exercise) redirect("/dashboard");

  const decision = await getAdaptationFor(
    user.userId,
    exercise.topic,
    exercise.difficulty
  );

  const remediationQuery = new URLSearchParams({
    kind: "code",
    topic: decision.topic,
    difficulty: String(decision.difficulty),
    regenerate: "1",
  });

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12">
      <div className="mx-auto max-w-2xl space-y-6">
        <section
          className={`rounded-2xl border p-6 ${
            attempt.is_correct
              ? "border-emerald-500/40 bg-emerald-500/10"
              : "border-orange-500/40 bg-orange-500/10"
          }`}
        >
          <h1 className="text-2xl font-semibold text-white">
            {attempt.is_correct ? "✓ Great job!" : "Let's learn from this."}
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            {attempt.is_correct
              ? "Mastery increased."
              : "We will adjust your learning path before moving forward."}
          </p>
          <div className="mt-4 flex items-center gap-4">
            <ProgressBar value={attempt.score} />
            <span className="text-sm text-white">{attempt.score}%</span>
          </div>
        </section>

        {!attempt.is_correct && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <div>
              <h2 className="text-sm text-slate-400">Your answer</h2>
              <pre className="mt-1 overflow-x-auto rounded-lg bg-slate-950 p-3 font-mono text-sm text-slate-200">
                {attempt.answer}
              </pre>
            </div>
            {attempt.feedback?.mistake && (
              <div>
                <h2 className="text-sm text-slate-400">What went wrong</h2>
                <p className="mt-1 text-white">{attempt.feedback.mistake}</p>
              </div>
            )}
            {attempt.feedback?.explanation && (
              <div>
                <h2 className="text-sm text-slate-400">Why?</h2>
                <p className="mt-1 text-slate-200">{attempt.feedback.explanation}</p>
              </div>
            )}
            {attempt.feedback?.hint && (
              <div>
                <h2 className="text-sm text-slate-400">Hint</h2>
                <p className="mt-1 text-indigo-200">{attempt.feedback.hint}</p>
              </div>
            )}
          </section>
        )}

        <section className="rounded-2xl border border-indigo-500/40 bg-indigo-500/10 p-6">
          <h2 className="text-sm text-indigo-300">🎯 Difficulty detected</h2>
          <p className="mt-2 text-white">
            You seem to need more practice with{" "}
            <span className="font-medium">{decision.topic}</span>.
          </p>
          <p className="mt-1 text-sm text-slate-300">{decision.reason}</p>
          <div className="mt-4 rounded-lg border border-indigo-500/30 bg-slate-950/50 p-4">
            <h3 className="text-xs uppercase tracking-wide text-slate-400">
              Recommended next activity
            </h3>
            <p className="mt-1 text-white">{decision.nextActivity}</p>
            <p className="mt-1 text-sm text-slate-400">
              Difficulty: {decision.difficulty}
            </p>
          </div>
          <Link
            href={`/learn/${exercise.lesson_id}?${remediationQuery.toString()}`}
            className="mt-4 inline-block rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-500"
          >
            Start recommended activity
          </Link>
        </section>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Vérifier le scénario de démonstration complet**

```bash
npm run dev
npm run seed
```

Parcours : login `amadou@samacoach.dev` / `Demo1234!` → dashboard → leçon Conditions → answered le QCM en choisissant `It prints nothing` → correction.

Expected: score 35 %, « Let's learn from this. », encadré « 🎯 Difficulty detected » mentionnant `if/else conditions`, et un bouton `Start recommended activity`. Cliquer sur ce bouton doit charger **un exercice différent, plus facile, sur le même topic** — pas celui du QCM.

- [ ] **Step 3: Vérifier que l'adaptation survit à une clé IA morte**

```bash
# .env.local : AI_PROVIDER=nvidia, NVIDIA_API_KEY=clé_invalide
npm run dev
```

Répéter le parcours du Step 3.

Expected: parcours **identique**, aucun message d'erreur visible. C'est le test le plus important du plan.

- [ ] **Step 4: Commit**

```bash
npm run typecheck
git checkout -b feature/correction
git add app/correction
git commit -m "ui: add AI correction screen with adaptive recommendation"
```

---

### Task 16: Progression

**Files:**
- Create: `app/progress/page.tsx`

**Interfaces:**
- Consumes: `getCurrentUser`, `createClient` (Task 3), `loadAttemptRecords` (Task 8), `ProgressBar` (Task 10)
- Produces: `/progress` — mastery score, nombre de tentatives, répartition par topic, topics maîtrisés

- [ ] **Step 1: Créer `app/progress/page.tsx`**

```tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { loadAttemptRecords } from "@/services/adaptation";
import { computeMasteryScore } from "@/lib/adaptation/rules";
import { ProgressBar } from "@/components/ui/progress-bar";

export default async function ProgressPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const attempts = await loadAttemptRecords(user.userId);
  const mastery = computeMasteryScore(attempts);

  const byTopic = new Map<string, { total: number; count: number }>();
  for (const attempt of attempts) {
    const entry = byTopic.get(attempt.topic) ?? { total: 0, count: 0 };
    entry.total += attempt.score;
    entry.count += 1;
    byTopic.set(attempt.topic, entry);
  }

  const topics = [...byTopic.entries()]
    .map(([topic, { total, count }]) => ({
      topic,
      average: Math.round(total / count),
      count,
    }))
    .sort((a, b) => a.average - b.average);

  const mastered = topics.filter((t) => t.average >= 75);
  const needsWork = topics.filter((t) => t.average < 75);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12">
      <div className="mx-auto max-w-2xl space-y-8">
        <h1 className="text-3xl font-semibold text-white">Your progress</h1>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-sm text-slate-400">Mastery score</h2>
          <div className="mt-3 flex items-center gap-4">
            <ProgressBar value={mastery} />
            <span className="text-sm text-indigo-300">{mastery}%</span>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Based on your last {Math.min(attempts.length, 5)} attempts.
          </p>
        </section>

        {needsWork.length > 0 && (
          <section className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-6">
            <h2 className="text-sm text-orange-300">Needs more practice</h2>
            <ul className="mt-2 space-y-1">
              {needsWork.map((t) => (
                <li key={t.topic} className="text-white">
                  {t.topic} — {t.average}%
                </li>
              ))}
            </ul>
          </section>
        )}

        {mastered.length > 0 && (
          <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
            <h2 className="text-sm text-emerald-300">Mastered</h2>
            <ul className="mt-2 space-y-1">
              {mastered.map((t) => (
                <li key={t.topic} className="text-white">
                  {t.topic} — {t.average}%
                </li>
              ))}
            </ul>
          </section>
        )}

        {attempts.length === 0 && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-300">
            No attempts yet. Start your first exercise to see your progress.
          </section>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Ajouter un lien vers `/progress` sur le dashboard**

Dans `app/dashboard/page.tsx`, ajouter au-dessus de `<LearningPath ... />` :

```tsx
<Link
  href="/progress"
  className="text-sm text-indigo-300 hover:underline"
>
  View full progress
</Link>
```

Ajouter l'import manquant en tête du fichier :

```tsx
import Link from "next/link";
```

- [ ] **Step 3: Vérifier et commiter**

```bash
npm run typecheck
npm run dev
```

Expected: après une tentative ratée, `/progress` affiche `Needs more practice` avec `if/else conditions`. Avant toute tentative, il affiche le message d'état vide, pas une page cassée.

```bash
git checkout -b feature/progress
git add app/progress app/dashboard
git commit -m "ui: add progress page with mastery score and topic breakdown"
```

---

### Task 17: Déploiement, vérification finale et repli local

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: tout le plan
- Produces: build de production propre, checklist de vérification validée, procédure de repli documentée

- [ ] **Step 1: Vérifier la suite complète et le build**

```bash
npm run test
npm run typecheck
npm run build
```

Expected: tous les tests passent, `tsc` propre, build Next.js réussi sans erreur.

- [ ] **Step 2: Déployer sur Vercel**

```bash
npx vercel --prod
```

Puis, dans le dashboard Vercel, ajouter les variables d'environnement de production :

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
AI_PROVIDER            (laisser vide pour le mode démo)
NVIDIA_API_KEY         (seulement si la clé est disponible)
```

Expected: déploiement réussi.

- [ ] **Step 3: Ajouter les URLs de redirection Supabase**

Dans Supabase → Authentication → URL Configuration, ajouter l'URL Vercel dans **Site URL** et dans **Redirect URLs**.

Expected: `/login` fonctionne en production sans boucle de redirection.

- [ ] **Step 4: Exécuter la checklist de démonstration sur le déploiement**

Sur l'URL Vercel, exécuter le parcours du §28 intégralement et cocher chaque point :

- [ ] `/` affiche le tagline et `Start learning`
- [ ] `Start learning` mène à `/onboarding` (redirigé vers `/login` si non connecté)
- [ ] Inscription ou login avec `amadou@samacoach.dev` / `Demo1234!` fonctionne
- [ ] Onboarding : `Step 1 of 4` → `Step 4 of 4`, indicateur de progression visible
- [ ] `Generating your learning path...` apparaît puis redirection vers `/dashboard`
- [ ] Dashboard affiche nom, barre de progression, topic courant, prochaine activité
- [ ] Leçon affiche titre, objectif, explication, exemple, points clés
- [ ] Le QCM s'affiche, soumission acceptée
- [ ] `Analyzing your answer...` apparaît pendant l'appel
- [ ] Correction affiche score, verdict, et la faiblesse `if/else conditions`
- [ ] `Start recommended activity` charge un exercice **différent** sur le même topic
- [ ] `/progress` affiche `Needs more practice`
- [ ] Aucune erreur dans la console navigateur sur le parcours complet
- [ ] Parcours complet fonctionne avec `AI_PROVIDER` vide
- [ ] Parcours complet fonctionne avec une clé NVIDIA invalide, sans message d'erreur visible

- [ ] **Step 5: Vérifier le repli local**

```bash
npm run dev
```

Répéter la checklist du Step 4 en local, avec la même base Supabase.

Expected: parcours identique. C'est la procédure à utiliser si Vercel est indisponible pendant la présentation.

- [ ] **Step 6: Écrire `README.md`**

Le README contient lui-même des blocs de code, donc le fence externe utilise quatre backticks.

````markdown
# SamaCoach AI

Your learning path. Your pace. Your AI coach.

SamaCoach AI detects a learner's weakness and adapts the next exercise accordingly.

## Stack

Next.js 15 (App Router), TypeScript strict, Tailwind CSS, Supabase (PostgreSQL + Auth), Vitest.

## Setup

```bash
npm install
cp .env.example .env.local   # remplir les clés Supabase
```

Appliquer `supabase/schema.sql` dans le SQL Editor du projet Supabase, puis :

```bash
npm run seed
```

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run test` | Tests unitaires (validation IA, règles d'adaptation, fallback) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run seed` | Seed idempotent du persona de démonstration |

## Compte de démonstration

```text
amadou@samacoach.dev
Demo1234!
```

## Mode démonstration

Le parcours complet fonctionne **sans aucune clé IA**. `lib/ai/index.ts` résout la chaîne
`nvidia` → `gemini` → `demo`, et la bascule est silencieuse : une panne de provider
n'affiche jamais d'erreur à l'utilisateur.

Pour répéter la démo sans consommer de crédits : `AI_PROVIDER=demo`.

Pour activer un vrai modèle :

```text
AI_PROVIDER=nvidia
NVIDIA_API_KEY=<clé>
```

## Architecture de l'adaptation

`lib/adaptation/rules.ts` est l'autorité de la décision. L'IA propose, la règle dispose :
les seuils de mastery imposent l'action, la suggestion du modèle ne fournit que le texte
du conseil affiché. Voir `tests/adaptation-rules.test.ts`.

## Parcours de démonstration

1. Landing → `Start learning`
2. Login avec le compte de démonstration
3. Onboarding en 4 étapes
4. Dashboard
5. Leçon `Conditions`
6. QCM `if/else` → répondre **faux** volontairement
7. Correction IA : score 35 %, faiblesse `if/else conditions` détectée
8. `Start recommended activity` → exercice plus facile sur la même faiblesse
````

- [ ] **Step 7: Fusionner les 15 branches dans `main`**

Les tâches créent chacune une branche `feature/*` et n'y committent que leurs propres fichiers. On les fusionne donc dans un ordre qui respecte les dépendances — une étape ne peut pas être fusionnée si une tâche dont elle dépend ne l'est pas encore.

```bash
git checkout main

# Couche fondatrice : projet, données, auth, contrat IA
git merge --no-ff feature/scaffold
git merge --no-ff feature/db-schema
git merge --no-ff feature/auth
git merge --no-ff feature/ai-contract

# Services purs et couche IA
git merge --no-ff feature/ai-fallback
git merge --no-ff feature/adaptation-rules
git merge --no-ff feature/ai-providers

# Données de démo
git merge --no-ff feature/seed

# Écrans, par ordre de dépendance de données
git merge --no-ff feature/api
git merge --no-ff feature/landing
git merge --no-ff feature/onboarding
git merge --no-ff feature/dashboard
git merge --no-ff feature/lesson-qcm
git merge --no-ff feature/correction
git merge --no-ff feature/progress
```

Expected: 15 fusions `--no-ff`, sans conflit. En cas de conflit sur un même fichier, le bon état est celui de la tâche la plus tardive, puisque chaque étape n'édite que ses propres fichiers — sauf `services/learning-plan.ts` et `services/adaptation.ts`, réécrits successivement par les Tasks 8, 15 et 16 : c'est la version de la Task 16 qui fait foi.

```bash
git status
npm run typecheck
npm run test
```

Expected: arbre de travail propre, `tsc` sans erreur, suite complète au vert. Puis :

```bash
git push -u origin main
```

Expected: `main` contient l'ensemble des tâches. Voir l'amendement « une seule branche d'intégration » dans le tableau des amendements.

---

## Auto-revue du plan

Vérifications effectuées sur ce document après rédaction, et corrections appliquées :

1. **Couverture du spec** — chaque section du spec a une tâche : stack (§4) → Task 1 ; structure (§5) → Tasks 1-8 ; données et écarts (§6) → Tasks 2, 7 ; couche IA (§7) → Tasks 4, 5, 9 ; boucle adaptative (§8) → Tasks 6, 8 ; écrans et data flow (§9) → Tasks 10-16 ; loading (§10) → Tasks 10-15 ; erreurs (§11) → Tasks 10-15 ; sécurité (§12) → Tasks 1, 2, 3 ; tests (§13) → Tasks 3, 4, 5, 6, 8 ; DoD (§14) → Task 17 ; risques (§15) → Task 17 ; ordre (§16) → séquence des tâches. Aucun écart.
2. **Scan de placeholders** — aucun `TBD`, aucun `TODO`, aucun « similar to Task N », aucune étape sans contenu. Toutes les étapes de code contiennent le code complet.
3. **Cohérence des types** — `AIProvider`, `EvaluationInput`, `AdaptiveDecision`, `LessonRow`, `ExerciseRow` sont définis une seule fois en Task 4 et utilisés sans divergence ensuite. `runWithFallback` est défini en Task 5 avant d'être appelé, et son paramètre `chain` a une valeur par défaut calculée à l'appel, donc l'ordre des déclarations est valide.

### Défauts trouvés et corrigés pendant la rédaction

| Défaut | Correction |
|---|---|
| Step 8 de la Task 5 attendait « 40 tests passés … recalculer selon le nombre réel de `it` » — un placeholder | Décompte explicite : 44 tests (2 + 7 + 24 + 5 + 6) |
| La contrainte globale RLS contenait des caractères non latins glissés dans la phrase sur `auth.uid()` | Remplacée par « policy unique fondée sur `auth.uid()` » |
| Task 13 : le fichier `code-exercise.tsx` était présenté sans son `import { useState }`, avec une phrase correctrice séparée | L'import est intégré dans le code, la phrase supprimée |
| Task 15 : `getExerciseFor` était défini dans `services/lesson.ts` puis importé sans être appelé — du code mort et une erreur de lint | Étape supprimée ; la page lit l'exercice via le join sur `attempts` et l'import inutile disparaît |
| Task 15 : deux requêtes Supabase identiques vers `attempts` pour lire l'attempt et son exercice | Fusionnées en une seule requête avec `exercises(...)` |
| Task 15 : variable nommée `params2` | Renommée `remediationQuery` |
| Task 15 : les numéros d'étapes sautaient de 1 à 3 après la suppression d'étape | Renumérotés 1 à 4 |

### Défauts trouvés lors de la revue pré-vol, avant exécution

Ces trois points cassaient l'application à l'exécution. Corrigés dans le plan, pas au fil de l'eau.

| Défaut | Symptôme | Correction |
|---|---|---|
| `progress` n'avait qu'un index simple sur `user_id`, alors que le seed et `createLearningPath` font `.upsert({ onConflict: "user_id" })` | Postgres rejette : *there is no unique or exclusion constraint matching the ON CONFLICT specification* — le seed échoue | `progress_user_unique_idx` passe en `create unique index`, et la Task 2Step 4 vérifie que `indexdef` contient bien `UNIQUE` |
| `lessons` et `exercises` n'avaient qu'une policy `for select`, alors que `createLearningPath` insère des leçons, `ensureLessonContent` les met à jour et `generateExercise` insère un exercice — via le client authentifié de l'utilisateur | *new row violates row-level security policy* — l'onboarding est mort | Policies `insert` et `update` ajoutées sur les deux tables, avec `with check` sur la propriété via `learning_paths` |
| La Task 17 ne fusionnait que 3 des 15 branches `feature/*` créées par le plan | Scaffold, schéma, auth, contrat IA, fallback, règles, providers, seed, landing, onboarding, dashboard et leçon disparaissent du livrable | Les 15 branches sont fusionnées dans l'ordre des dépendances, avec `typecheck` et `test` rejoués après coup |
| Le fence du README en Task 17 Step 6 était en 3 backticks alors que son contenu contient des fences ` ```bash ` — le README était tronqué au rendu et toute la suite du document était décalée d'un niveau | Rendu markdown cassé à partir de la Task 17 | Fence externe passé à 4 backticks ; les 248 fences du document sont maintenant équilibrés et aucun n'est imbriqué |

### Défauts trouvés par la revue de la Task 1, après le début de l'exécution

| Défaut | Symptôme | Correction |
|---|---|---|
| `vitest.config.ts` resolvait l'alias `@` avec `__dirname`, dans un fichier en syntaxe ESM sans `"type": "module"` | `__dirname` n'existait que parce que Vite chargeait la config en CommonJS ; les deux remèdes naturels (`.mts`, `"type": "module"`) le font.throw `ReferenceError` et cassent toute la suite | `path.resolve(process.cwd(), ".")`, valable sous tout chargeur ; `tests/alias.test.ts` garde la cible de l'alias ; décompte de tests porté à 44 |

### Défauts trouvés par la revue de la Task 2, avant application du schéma

Le schéma n'était pas encore collé dans Supabase au moment de la revue : les trois
corrections ont donc été faites dans le plan avant qu'il devienne réel.

| Défaut | Symptôme | Correction |
|---|---|---|
| `progress` unique sur `user_id` seul, alors que la table porte aussi `path_id` et que `learning_paths` n'est pas unique | Un second `createLearningPath` insère un second chemin, puis l'upsert suivant — dont l'arbitre est `user_id` — réécrit `path_id` et renvoie `completed_lessons`, `mastery_score` et `current_level` à zéro. Perte silencieuse, aucune erreur. Toutes les lectures du plan filtrent par `user_id` seul, jamais par `path_id` | `create unique index learning_paths_user_unique_idx on public.learning_paths (user_id)` : un seul parcours par utilisateur, garanti par la base. `progress` reste unique sur `user_id`, ce qui devient cohérent |
| `progress.updated_at` déclaré mais jamais écrit | Ni trigger, ni `updated_at` dans les payloads d'upsert — et PostgREST n'écrit que les colonnes présentes dans le payload. La colonne reste figée à la date de création, et le nom promet une sémantique qu'elle n'a pas | Trigger `touch_updated_at()` + `before update on public.progress`, maintenu à la source plutôt qu'à chaque site d'appel |
| `own attempts` ne vérifiait que `attempts.user_id`, jamais `attempts.exercise_id` | `exercises.lesson_id` est une contrainte d'intégrité, pas d'autorisation : n'importe quel UUID d'exercice valide est accepté, y compris celui d'un autre utilisateur. Les lignes injectées sont invisibles pour la victime mais faussent tout agrégat inter-utilisateurs | La sous-requête de propriété à deux sauts est ajoutée au `with check`, dans le style des policies `lessons`/`exercises`. L'arête `attempts → exercises → lessons → learning_paths` garde le graphe acyclique |

### Précisions issues de l'application réelle du correctif de la Task 1

Deux affirmations se sont révélées fausses à l'exécution, et sont corrigées ci-dessus
dans la Task 1 :

- `process.cwd()` **ne supprime pas** l'avertissement `configLoader: 'native'`. Celui-ci
  vise `vitest.config.ts:1:1` — la façon dont Vite charge le fichier — pas l'alias. Il
  resterait identique avec `__dirname` restauré, ce qui a été vérifié. Le corriger
  exigerait `"type": "module"` ou `.mts`, tous deux interdits ici. L'avertissement est
  cosmétique et est assumé.
- `tests/alias.test.ts` **ne peut pas** épingler le mécanisme `__dirname` vs
  `process.cwd()` : les deux résolvent le même chemin, la config étant à la racine du
  dépôt. L'expérience de revert retourne 2 tests verts. Le test garde la cible de
  l'alias, pas sa formule.
