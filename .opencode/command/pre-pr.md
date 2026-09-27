---
description: Vérifie que la branche est prête pour une pull request et rédige le titre et le corps. Utiliser avant chaque push, quand typecheck et tests doivent être verts.
agent: build
---

Prépare la pull request de la branche courante vers `main`. Ne pousse rien, ne fusionne rien : tu vérifies et tu rédiges.

## 1. Le nom de la branche

```bash
git rev-parse --abbrev-ref HEAD
```

Elle doit suivre `feature/<membre>-task-<N>-<slug>`. Si elle ne suit pas ce motif, signale-le comme bloquant : la convention d'`AGENTS.md` est ce qui permet à chacun de savoir à qui appartient quoi.

## 2. La base de comparaison

```bash
git merge-base HEAD origin/main
```

Si le remote est injoignable, compare sur `main` en local et signale que la vérification porte sur un `main` éventuellement en retard.

## 3. Les vérifications obligatoires

```bash
npm run typecheck
npm test
```

Les deux doivent sortir verts. Une commande en échec est bloquant : affiche la sortie, n'essaie pas de corriger à la place de l'utilisateur, et demande quoi faire.

## 4. Les commits

```bash
git log --oneline <base>..HEAD
```

Chaque message doit commencer par `feat:`, `fix:`, `ui:`, `ai:`, `db:`, `test:`, `refactor:`, `docs:` ou `chore:`. Signale tout préfixe hors liste.

## 5. La portée

```bash
git diff --stat <base>...HEAD
```

Compare la liste de fichiers à la section « Files: » de la tâche dans le plan. Tout fichier hors de la liste de la tâche est à signaler : il sera mergé en même temps et créera des conflits avec la branche du membre qui travaille sur ce fichier.

## 6. Le compte rendu

Rends exactement :

```
## Vérifications
| check | résultat |
|---|---|
| nom de branche | ok / <problème> |
| npm run typecheck | ok / <sortie> |
| npm test | ok / <sortie> |
| préfixes de commit | ok / <problème> |
| portée vs tâche | ok / <fichier hors tâche> |

## Titre
<type>: <description à l'impératif, 70 caractères maximum>

## Corps
Task <N> du plan MVP — <titre exact de la tâche>
Fichier(s) : <liste>

Vérifié localement :
- npm run typecheck
- npm test

Dépendances : <tâches dont celle-ci dépend, ou "aucune">

<Ligne de revue à l'attention du propriétaire si un point mérite un arbitrage.>
```

Si une vérification est en échec, rends le tableau avec le problème et n'écris pas le titre de PR : une PR rouge ne sera pas relue.
