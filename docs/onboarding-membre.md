# Onboarding d'un membre

Ce guide suppose que tu as été invité comme collaborateur en écriture sur le dépôt `Diop03-star/samaprof`. Si tu n'arrives pas à cloner, c'est que l'invitation n'a pas été faite ou n'a pas été acceptée.

## 1. Prérequis

- Node 22 (le fichier `.nvmrc` du dépôt indique la version attendue).
- Git.
- Un compte GitHub avec lequel tu as accepté l'invitation.
- L'accès aux identifiants du **projet Supabase dev partagé** — demande-les au propriétaire du dépôt. Chaque membre a son propre `.env.local`, les valeurs sont les mêmes pour tout le monde.

## 2. Premier clone

```bash
git clone https://github.com/Diop03-star/samaprof.git
cd samaprof
npm install
```

## 3. Variables d'environnement

```bash
cp .env.example .env.local
```

Remplis `.env.local` avec les valeurs du projet Supabase partagé. `.env.local` est gitignoré : ne le commite jamais, ne le colle jamais dans une pull request.

`AI_PROVIDER` peut être laissé vide. C'est le comportement attendu : le mode démo est le critère de non-régression du projet.

## 4. Vérifier que tout va bien

```bash
npm run typecheck
npm test
```

Les deux doivent être verts. Ce sont les deux mêmes commandes que la CI exécute.

## 5. Ton espace opencode

Rien à installer : `AGENTS.md`, `opencode.json` et `.opencode/` sont dans le dépôt, donc opencode les charge automatiquement à l'ouverture du projet. Tu obtiens les mêmes règles et les mêmes commandes que les deux autres membres.

Ta configuration personnelle — modèle, fournisseur, serveur MCP — reste dans `~/.config/opencode/opencode.json` et n'est pas versionnée. Ne la mets pas dans le dépôt.

## 6. Prendre une tâche

Ouvre opencode dans le dossier du projet et demande :

```
/tache 4
```

La commande synchronise `develop`, vérifie que la tâche n'est pas bloquée, crée la branche `feature/m2-task-4-ai-contract` et affiche les étapes. Elle n'implémente rien : elle prépare.

Qui fait quoi :

| Membre | Tâches |
|---|---|
| Member 1 — Full Stack | 1, 2, 3, 7, 8 |
| Member 2 — IA / NVIDIA | 4, 5, 6, 9 |
| Member 3 — Frontend / UX / QA | 10 à 17 |

Tasks 1 et 2 sont déjà mergées dans `develop`.

**Si tu es Member 3** : commence par la Task 10. Les Tasks 11 et 12 dépendent de la Task 8, qui dépend du contrat IA (Task 4). Ne les commence pas avant.

**Si tu es Member 1** : la Task 3 est libre. La Task 8 attend la Task 4.

**Si tu es Member 2** : tes quatre tâches sont libres, mais livre la Task 4 en premier — c'est ce qui débloque les deux autres.

## 7. Avant la pull request

```bash
/pre-pr
```

La commande vérifie le nom de la branche, lance `typecheck` et `test`, contrôle les préfixes de commit, compare les fichiers modifiés à la liste de la tâche, puis rédige le titre et le corps de la PR.

Puis :

```bash
git push -u origin feature/<ta>-task-<N>-<slug>
```

Ouvre la pull request sur GitHub en ciblant `develop`. Le propriétaire du dépôt approuve. La branche est supprimée au merge.

## 8. Ce qu'il ne faut pas faire

- Pousser directement sur `develop`. La branche est protégée, la tentative échouera.
- Toucher aux fichiers d'une tâche qui n'est pas la tienne. Ça crée des conflits avec la branche du membre qui travaille dessus.
- Commiter `.env.local`, une clé API, ou un `NEXT_PUBLIC_*` contenant un secret.
- Merger sans que `typecheck` et `test` soient verts en CI.
- Compter sur `.superpowers/` pour voir l'avancement des autres : ce dossier est gitignoré, il est local à chaque machine.

## En cas de blocage

Un `git pull` qui échoue vient presque toujours d'une divergence avec `develop`. Avant de forcer quoi que ce soit :

```bash
git fetch origin
git log --oneline HEAD..origin/develop
```

Si `develop` a avancé, rebase ta branche dessus, relance `npm run typecheck` et `npm test`, puis pousse avec `--force-with-lease`. Si tu es bloqué sur un conflit de merge dans un fichier que tu n'as pas touché, ne tranche pas seul : demande.
