# Répartition des tâches par membre

**Vue dérivée.** La source de vérité reste `docs/superpowers/plans/2026-09-25-samacoach-ai-mvp.md` : ce fichier donne la répartition et l'ordre, le plan donne les étapes au pas-à-pas. En cas de divergence, le plan gagne.

Dernière vérification de la répartition : 2026-09-27.

## Où en est l'équipe

| Tâche | État |
|---|---|
| 1 — Scaffolding | mergée dans `main` |
| 2 — Schéma Supabase | code mergé dans `main`, **application au projet partagé en attente** |
| 3 à 17 | à faire |

## Le jalon : la Task 4

Le plan affirme que les Tasks 4, 5, 6 et 9 ne dépendent d'aucune tâche de Member 1. C'est vrai **pour Member 2**. Pour les deux autres membres, l'inverse vaut.

Vérification faite sur les imports du plan :

- la **Task 8** importe `lib/ai` et `lib/adaptation`, donc elle attend les Tasks 4, 5 et 6 ;
- les **Tasks 11, 12, 13, 15 et 16** importent `services/*` ou les routes API, donc elles attendent la Task 8 ;
- seule la **Task 10** n'importe rien de tout cela.

Conséquence : tant que la Task 4 n'est pas mergée dans `main`, Member 1 ne peut pas faire la Task 8 et Member 3 ne peut faire que la Task 10. Member 2 doit donc livrer la Task 4 en premier. C'est le seul levier de parallélisme de ce plan.

## Member 1 — Full Stack

3 tâches, 29 étapes.

| # | Tâche | Étapes | Fichiers | Dépend de |
|---|---|---|---|---|
| 3 | Clients Supabase et authentification minimale | 11 | `lib/supabase/client.ts`, `lib/supabase/server.ts`, `middleware.ts`, `lib/validation/onboarding.ts`, `app/login/page.tsx`, `app/login/actions.ts` | libre |
| 7 | Seed du persona Amadou | 5 | `scripts/seed.ts` | Task 3, et le schéma appliqué |
| 8 | Services métier et Route Handlers | 13 | `services/{adaptation,learning-plan,lesson,evaluation}.ts`, `app/api/{learning-plan,lesson,exercise,evaluate}/route.ts` | Tasks 4, 5, 6 |

Ordre : 3, puis 7, puis 8 quand le jalon tombe.

## Member 2 — IA / NVIDIA

4 tâches, 31 étapes.

| # | Tâche | Étapes | Fichiers | Dépend de |
|---|---|---|---|---|
| **4** | **Types, contrat `AIProvider`, validation des sorties IA** | 7 | `types/index.ts`, `lib/ai/provider.ts`, `lib/ai/validate.ts` | libre — **livrer en premier** |
| 5 | Provider démo, transport HTTP, chaîne de fallback | 9 | `lib/ai/http.ts`, `lib/ai/demo.ts`, `lib/ai/index.ts` | Task 4 |
| 6 | Règles d'adaptation — l'autorité de la décision | 5 | `lib/adaptation/rules.ts` | Task 4 |
| 9 | Providers NVIDIA et Gemini, prompts | 10 | `lib/ai/nvidia.ts`, `lib/ai/gemini.ts`, `prompts/{learning-plan,lesson,exercise,evaluation,adaptation}.ts` | Tasks 4, 5 |

Ordre : 4, puis 5 et 6, puis 9.

## Member 3 — Frontend / UX / QA

8 tâches, 36 étapes.

| # | Tâche | Étapes | Fichiers | Dépend de |
|---|---|---|---|---|
| 10 | Landing et composants partagés | 5 | `app/page.tsx` (modifié), `components/ui/{ai-thinking,ai-error,progress-bar}.tsx` | libre |
| 11 | Onboarding et génération du plan | 6 | `app/onboarding/{page,actions,form}.tsx`, `components/onboarding/steps.tsx` | Task 8, Task 3 |
| 12 | Dashboard et parcours d'apprentissage | 3 | `app/dashboard/{page,learning-path}.tsx` | Task 8 |
| 13 | Leçon et exercice QCM | 5 | `app/learn/[lessonId]/page.tsx`, `components/lesson/`, `components/exercise/`, `components/qcm/`, `components/code-exercise/code-exercise.tsx` | Task 8 |
| 14 | Exercice de code | 3 | `components/code-exercise/code-exercise.tsx` (modifié) | Task 13 |
| 15 | Correction et affichage adaptatif | 4 | `app/correction/[attemptId]/page.tsx` | Task 8, Task 13, Task 14 |
| 16 | Progression | 3 | `app/progress/page.tsx` | Task 8, Task 6 |
| 17 | Déploiement, vérification finale et repli local | 7 | `README.md`, déploiement Vercel | toutes les autres |

Ordre : 10 tout de suite, puis 11 à 17 dans l'ordre, chaque fois que la Task 8 est disponible.

`components/code-exercise/code-exercise.tsx` est créé par la Task 13 (son Step 4) et seulement ensuite modifié par la Task 14. Ce n'est pas une contradiction.

## Démarrer une tâche

Ouvrir opencode dans le dossier du projet, puis :

```
/tache 4
```

La commande synchronise `main`, vérifie que la tâche n'est pas bloquée, crée la branche `feature/m2-task-4-ai-contract` et affiche les étapes. Elle n'implémente rien.

Avant de pousser :

```
/pre-pr
```

Typecheck, tests, préfixes de commit, comparaison des fichiers avec la liste de la tâche, puis rédaction du titre et du corps de la pull request.

## Blocages communs

- **`supabase/schema.sql` n'est pas appliqué** au projet Supabase partagé (Task 2, Steps 2 à 4). Personne ne peut lancer les Tasks 7, 8 ou au-delà tant que ce n'est pas fait. C'est le premier geste à faire.
- **L'identité git n'est pas alignée** sur le compte GitHub : les commits existants ne seront pas attribués.

## Charge par membre

| Membre | Tâches | Étapes | Tâches libres tout de suite |
|---|---|---|---|
| Member 1 | 3 | 29 | 1 (la Task 3) |
| Member 2 | 4 | 31 | 4 |
| Member 3 | 8 | 36 | 1 (la Task 10) |

Member 3 porte le plus de travail et c'est le plus bloqué. Si le jalon Task 4 glisse, Member 3 n'a que la Task 10 à avancer. À surveiller, pas à corriger en amont : la répartition vient du plan et les membres la connaissent.
