---
description: Prépare une tâche du plan MVP. Utiliser avec le numéro de la tâche, par exemple /tache 4, pour extraire la consigne, créer la branche et afficher les étapes.
agent: build
---

Tâche demandée : **$ARGUMENTS**

Si `$ARGUMENTS` n'est pas un numéro de task entre 1 et 17, demande confirmation et arrête-toi.

## 1. Synchroniser

```bash
git checkout develop
git pull
```

Si `git pull` échoue (réseau, remote absent), prévient et demande s'il faut continuer en local. Ne bascule pas sur `develop` avec des modifications non commitées en cours : signale-le.

## 2. Identifier le membre

Déduis le membre depuis la table de répartition d'`AGENTS.md` :

- Tasks 1, 2, 3, 7, 8 → `m1`
- Tasks 4, 5, 6, 9 → `m2`
- Tasks 10 à 17 → `m3`

## 3. Vérifier le déblocage

Lis la section « Travail en équipe » d'`AGENTS.md`. Si la tâche dépend d'une tâche qui n'est pas encore mergée dans `develop` (`git branch -r --merged origin/develop`, ou `git log develop --oneline` en local), signale le blocage et propose d'attendre. N'écris pas le code d'une tâche bloquée.

## 4. Créer la branche

```bash
git checkout -b feature/<membre>-task-<N>-<slug>
```

`slug` : trois mots maximum, minuscules, tirets, décrivant la tâche. Exemples : `m2-task-4-ai-contract`, `m3-task-10-landing`.

## 5. Afficher la consigne

Extrais de `docs/superpowers/plans/2026-09-25-samacoach-ai-mvp.md` le bloc `### Task <N> :` jusqu'au `### Task` suivant, puis rends exactement :

```
## Task <N> — <titre>
Branche : feature/<membre>-task-<N>-<slug>   (créée)

### Fichiers
- <chemin> : <create|modify>

### Étapes
1. … (une ligne par Step, avec la commande de vérification attendue)

### Vérification avant PR
npm run typecheck
npm test
```

N'implémente rien à cette étape. Implémente uniquement quand l'utilisateur le demande, en suivant les étapes ci-dessus à la lettre.
