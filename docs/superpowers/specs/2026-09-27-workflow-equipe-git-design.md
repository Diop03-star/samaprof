# Workflow équipe — dépôt GitHub et espaces opencode distribués

**Date** : 2026-09-27
**Statut** : validé
**Portée** : comment les trois membres travaillent sur ce dépôt, et comment chacun obtient un espace opencode équivalent.

## Problème

Le projet est avancé (11 commits, Tasks 1 et 2 codées et revues) mais il vit sur une seule machine, sans remote. Le plan d'implémentation prévoit 17 tâches réparties entre trois membres. Sans dépôt partagé, chaque membre travaille sur une copie divergente du plan et la coordination passe par des messages.

## Contraintes observées dans le dépôt avant conception

| Observation | Conséquence sur la conception |
|---|---|
| Aucun remote git configuré | Le dépôt GitHub est à créer et à alimenter par un premier push |
| `gh` absent, `github.com:443` bloqué en TCP depuis la machine du propriétaire | Le push et les réglages d'UI ne peuvent pas être automatisés ; une checklist manuelle est nécessaire |
| La branche d'intégration ne contenait que `docs/` et `.gitignore` | Tasks 1 et 2 n'étaient pas mergées : la branche d'intégration était vide de code |
| Topologie linéaire de la branche d'intégration → `feature/scaffold` → `feature/db-schema` | Les deux branches sont intégrables sans conflit, dans cet ordre |
| `.superpowers/` est gitignoré | Le ledger SDD est local ; il ne peut pas servir de surface de coordination |
| `git config user.name` = `elhadji`, sans lien vérifié avec le compte GitHub | Les commits ne seront pas attribués tant que l'identité n'est pas alignée |

## Décisions

### 1. Un dépôt privé sur le compte personnel du propriétaire

Choisi plutôt qu'une organisation pour ne pas bloquer sur un compte à créer. Conséquence assumée : le dépôt reste rattaché à une personne, le transfert de propriété n'est pas un sujet neutre. Les deux autres membres sont invités comme collaborateurs en écriture.

### 2. Clone + branche `feature/*` + pull request, pas de fork

Le plan imposait déjà la convention `feature/<nom>` et une branche d'intégration. Les trois options étaient :

- **fork** — isolation maximale, mais 15 pull requests à faire transiter par le dépôt principal, qui se désynchronise dès qu'un fork traîne ;
- **clone + branche + PR** — une seule source de vérité, convention déjà écrite, revue centralisée sur un dépôt ;
- **push direct sur la branche d'intégration** — rapide, mais supprime la revue par tâche que le workflow SDD fait déjà et rend les conflits silencieux.

La deuxième option est retenue.

### 3. `main` est la seule branche, et elle porte la protection

Le dépôt n'avait au départ qu'une branche d'intégration, `develop`, et pas de `main`. Le 2026-09-27, `develop` a été renommée `main`, et `main` est devenue la branche par défaut du dépôt.

Cette décision contredit deux choses écrites plus tôt : la contrainte globale du plan (« on ne travaille jamais sur `main` ») et son Step de déploiement, qui réservait `main` à la ligne de release. Le design retient la contraction de la branche, et amend le plan en conséquence.

Ce qui protège le travail n'est pas le nom de la branche, c'est la règle : pull request obligatoire, `typecheck` et `test` verts, une approbation, branche supprimée au merge. Ces quatre règles sont intactes, donc la contrainte du plan est respectée en substance. Le garde-fou n'est pas dans le nom, il est dans la configuration de la branche protégée.

Ce que la contraction coûte : la ligne de release n'a plus de branche propre. Sur dix-sept tâches et un déploiement unique, ce n'est pas une perte. Si le projetgrossit, une branche `release` s'introduira à ce moment-là, et l'amendement du plan sera plus facile à écrire qu'à faire.

### 4. Le ledger SDD reste local

C'est un choix explicite. Il a une contrepartie : les comptes-rendus de revue ne sont plus partagés. La surface de revue devient la pull request elle-même — ce qui était déjà le cas pour la décision de merge, et ce qui est plus robuste qu'un fichier markdown qu'il faut aller chercher. L'agent `task-reviewer` committé dans `.opencode/` fournit le même rigor que le script PowerShell local, à l'identique pour les trois membres.

### 5. `AGENTS.md` et `.opencode/` sont committés

C'est ce qui rend les trois espaces opencode équivalents : mêmes règles, mêmes commandes, même agent de revue. La configuration personnelle — modèle, fournisseur, MCP — reste dans `~/.config/opencode/` et n'est jamais committée.

### 6. Un projet Supabase dev partagé

Le schéma est appliqué une seule fois, le persona Amadou est identique pour tout le monde, la démo est reproductible. Le seed est idempotent, donc les exécutions concurrentes sont sûres. Le prix est un point de rupture commun : si quelqu'un réinitialise la base, les deux autres le remarquent immédiatement.

### 7. La Task 4 est un jalon, pas une tâche ordinaire

Le plan affirme que les Tasks 4, 5, 6, 9 ne dépendent de rien. C'est vrai pour Member 2, mais faux pour les deux autres : la Task 8 (services) consomme `lib/ai`, et les Tasks 11–12 consomment la Task 8. Sans priorisation, deux membres sur trois sont inactifs pendant que Member 2 travaille. Member 2 livre donc la Task 4 en premier, et son merge débloque Member 1 puis Member 3. Member 3 travaille la Task 10 pendant ce temps.

## CI

Deux jobs parallèles et indépendants : `typecheck` et `test`. Ce sont exactement les deux commandes de `AGENTS.md`, donc la CI ne peut pas diverger des règles que les membres lisent.

`npm run build` est volontairement exclu. Le build Next instancie les clients Supabase au chargement des modules qui les importent ; sans secrets en CI il deviendrait un point d'échec rouge sans valeur de garde-fou. Le build est vérifié en local par la Task 17, avant déploiement. `npm run lint` est exclu pour la même raison de fond : `next lint` est déprécié sur Next 15 et son remplacement est prévu.

## Sécurité

`.gitignore` ignorait `.env` et `.env*.local`, ce qui laissait passer `.env.production` et `.env.staging`. Avec trois machines qui clonent le dépôt, un fichier de ce type finit un jour dans un commit. La règle devient `.env*` avec `!.env.example`.

## Hors périmètre

Ces points sont réels mais traités dans leur propre tâche, pas ici :

- ~~appliquer `supabase/schema.sql` au projet dev partagé~~ (Task 2, Steps 2 à 4) — **fait le 2026-09-27**, schéma vérifié ;
- aligner l'identité git sur le compte GitHub pour l'attribution des commits ;
- remplacer `README.md`, encore le texte de `create-next-app` (Task 17, Step 6) ;
- supprimer `next lint` du `package.json`.
