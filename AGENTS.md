# AGENTS.md — SamaCoach AI

Ce fichier est la source des règles pour tout agent opencode travaillant sur ce dépôt, sur n'importe quelle machine de l'équipe. Il est committé : les trois espaces opencode le chargent automatiquement.

## Projet

Tranche verticale MVP : Onboarding → Plan → Leçon → Exercice → Évaluation IA → Faiblesse détectée → Exercice correctif → Progression.

Stack : Next.js 15 (App Router), TypeScript `strict`, Tailwind, Supabase (PostgreSQL + Auth), Vitest.

**Source de vérité du travail** : `docs/superpowers/plans/2026-09-25-samacoach-ai-mvp.md`. Les 17 tâches y sont décrites étape par étape, avec les commandes de vérification attendues. Ne jamais inventer une étape : lire la tâche, la suivre, la vérifier.

## Contraintes non négociables

- Aucune erreur `tsc --noEmit` tolérée.
- Aucune clé API dans un Client Component. Aucun secret committé. `.env.local` est gitignoré, `.env.example` est la référence.
- Le parcours complet doit fonctionner avec `AI_PROVIDER` **absent** (mode demo). C'est le critère de non-régression principal.
- La décision adaptative n'est jamais déléguée au modèle : `lib/adaptation/rules.ts` recalcule le mastery et tranche. L'IA ne fournit que le texte du conseil.
- 6 tables exactement : `profiles`, `learning_paths`, `lessons`, `exercises`, `attempts`, `progress`.
- Chaque tâche ne modifie que ses propres fichiers. Ne pas opportunement refactorer du code d'une autre tâche — cela crée des conflits de merge entre membres.

## Travail en équipe

Répartition des tâches :

| Membre | Rôle | Tâches |
|---|---|---|
| Member 1 | Full Stack | 1, 2, 3, 7, 8 |
| Member 2 | IA / NVIDIA | 4, 5, 6, 9 |
| Member 3 | Frontend / UX / QA | 10, 11, 12, 13, 14, 15, 16, 17 |

Tasks 1 et 2 sont mergées dans `main`. Le reste est à faire.

**Séquence de déblocage** : la Task 4 (contrat `AIProvider` + validation des sorties) est le **jalon**. Tant qu'elle n'est pas mergée dans `main`, la Task 8 (services) est bloquée pour Member 1, et les Tasks 11–12 le sont pour Member 3. Member 3 travaille la Task 10 en attendant. Ne pas commencer une tâche dont la dépendance n'est pas mergée dans `main` : le code s'écrit mais la revue devient illisible.

**Ordre de merge** : une tâche ne peut être mergée que si toutes celles dont elle dépend sont déjà dans `main`.

## Workflow git

- `main` est la branche d'intégration et la branche par défaut du dépôt. Elle porte la protection.
- On ne pousse **jamais** directement sur `main`. Toute passe par une pull request.
- Branche de travail : `feature/<membre>-task-<N>-<slug>`, ex. `feature/m2-task-4-ai-contract`. Une branche par tâche.
- Avant de commencer une tâche : `git checkout main && git pull && git checkout -b feature/<membre>-task-<N>-<slug>`.
- Préfixes de commit : `feat:`, `fix:`, `ui:`, `ai:`, `db:`, `test:`, `refactor:`, `docs:`, `chore:`. Un commit = une unité logique cohérente. `chore:` est réservé à l'outillage sans effet sur le produit (CI, configuration, outillage).
- La pull request cible `main`. Elle part au vert (`typecheck` + `test`) et attend **une approbation** du propriétaire du dépôt avant merge.
- La branche est supprimée au merge (règle GitHub activée sur `main`).
- Une branche d'intégration ne remplace pas la discipline de merge : ce qui compte est qu'aucune PR ne soit mergée sans ses dépendances et sans ses deux checks verts.

## Vérification avant push

```bash
npm run typecheck   # doit sortir 0 erreur
npm test            # doit être vert
```

Ce sont exactement les deux checks que la CI GitHub exécute. Une PR rouge ne sera pas relue.

## Environnement

- Node 22 (`.nvmrc`).
- Un **projet Supabase dev partagé** par toute l'équipe. Les trois `.env.local` pointent vers le même projet.
- `.superpowers/` est gitignoré : le ledger SDD est local à chaque machine. Ne pas supposer qu'un fichier y existe pour les autres, et ne pas tenter de le committer.
- La coordination entre membres passe par le plan committé et les pull requests, pas par le ledger.

## Outils opencode de ce dépôt

- `/tache <N>` — extrait la tâche N du plan, crée la branche, affiche les étapes et les commandes de vérification.
- `/pre-pr` — vérifie typecheck + tests, contrôle le nom de la branche et les préfixes de commit, rédige le titre et le corps de la pull request.
- Agent `task-reviewer` — relit une branche contre la section de la tâche du plan et contre les contraintes ci-dessus. Lecture seule, ne modifie rien.
