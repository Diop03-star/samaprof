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

- `npm run dev` : Lancer en développement
- `npm run build` : Compiler pour la production
- `npm run typecheck` : Vérifier les types TypeScript
- `npm test` : Lancer les tests unitaires (Vitest)
