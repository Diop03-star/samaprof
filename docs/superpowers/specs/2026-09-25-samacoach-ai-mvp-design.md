# SamaCoach AI — Design de la tranche verticale MVP

Date : 2026-09-25
Échéance : hackathon GOMYCODE × NVIDIA, 2026-09-27
Équipe : 3 développeurs
Statut : approuvé

---

## 1. Contexte et contraintes

Projet greenfield. Le répertoire est vide : pas de code existant, pas de dépôt git, pas de `.env.local`.

Contraintes arrêtées lors du brainstorming :

| Contrainte | Valeur retenue |
|---|---|
| Base de données | Supabase prêt (projet + clés existants) |
| IA | NVIDIA / Brev en principal — **aucune clé disponible à ce jour** |
| Périmètre | Tranche verticale fine : 5 écrans, parcours complet de bout en bout |
| Format d'exercice | Hybride : 1 QCM déterministe + 1 exercice de code corrigé par l'IA |
| Auth | Supabase Auth minimal, profil auto-provisionné, pas de confirmation email |
| Déploiement | Vercel, avec repli local sur laptop |
| Temps | ~2 jours |

La contrainte dominante est l'absence de clé IA. Elle impose que la démonstration ne dépende d'aucun service externe non maîtrisé.

## 2. Objectifs

- Démontrer la chaîne du §28 de bout en bout : onboarding → plan → leçon → exercice → évaluation IA → faiblesse détectée → exercice correctif → progression.
- Prouver la valeur de l'IA par l'exercice de code (correction et analyse de faiblesse par le modèle), pas par du texte décoratif.
- Fonctionner intégralement en mode démo déterministe, sans clé IA.
- Pouvoir être déployé sur Vercel et rejoué sur laptop le jour J.

## 3. Hors périmètre

Auth avancée, profil avancé, gamification, badges, notifications, messagerie, marketplace, paiement, classement, forum, application mobile, entraînement de modèle, docker, Prisma, firebase, route `/api/adapt` séparée.

## 4. Stack

Next.js 15 (App Router), TypeScript strict, React, Tailwind CSS, shadcn/ui, Supabase (PostgreSQL + Auth), Route Handlers pour le backend, Vercel pour le déploiement.

Dépendances au-delà du squelette : `@supabase/ssr` (client isomorphic pour les cookies de session). Pas de zod, pas de validation par schéma : le contrôle est manuel, ce qui évite une dépendance et ~1 h de setup.

## 5. Structure

```
samacoach-ai/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                        # Landing
│   ├── login/page.tsx                  # Auth Supabase minimal
│   ├── onboarding/page.tsx             # 4 étapes sur une page
│   ├── dashboard/page.tsx              # Progression + topic courant
│   ├── learn/[lessonId]/page.tsx       # Leçon + exercice (QCM ou code)
│   ├── correction/[attemptId]/page.tsx # Correction IA + décision adaptative
│   ├── progress/page.tsx
│   └── api/
│       ├── learning-plan/route.ts
│       ├── lesson/route.ts
│       ├── exercise/route.ts
│       └── evaluate/route.ts
├── components/
│   ├── ui/                             # shadcn
│   ├── layout/
│   ├── onboarding/
│   ├── lesson/
│   ├── exercise/
│   ├── qcm/
│   ├── code-exercise/
│   ├── correction/
│   └── ai/                             # AiThinking, AiError
├── lib/
│   ├── ai/
│   │   ├── provider.ts                 # contrat AIProvider
│   │   ├── index.ts                    # résolution + chaîne de fallback
│   │   ├── nvidia.ts
│   │   ├── gemini.ts
│   │   ├── demo.ts                     # scénario déterministe
│   │   ├── validate.ts                 # validation manuelle des sorties
│   │   └── http.ts                     # fetch + timeout 15 s commun
│   ├── adaptation/rules.ts             # autorité de la décision
│   └── supabase/
│       ├── client.ts
│       └── server.ts
├── services/
│   ├── learning-plan.ts
│   ├── lesson.ts
│   ├── evaluation.ts
│   └── adaptation.ts
├── prompts/
│   ├── learning-plan.ts
│   ├── lesson.ts
│   ├── exercise.ts
│   ├── evaluation.ts
│   └── adaptation.ts
├── types/index.ts
└── supabase/
    ├── schema.sql
    └── seed.sql
```

### Répartition (§23)

| Membre | Périmètre | Fichiers |
|---|---|---|
| Member 1 — Full Stack | Architecture, Supabase, backend, API, déploiement | `lib/supabase/`, `services/`, `app/api/`, `supabase/` |
| Member 2 — IA / NVIDIA | Models, prompts, AI services, évaluation, adaptation | `lib/ai/`, `prompts/`, `lib/adaptation/` |
| Member 3 — Frontend / UX / QA | UI, onboarding, dashboard, leçons, exercices, correction, responsive | `components/`, `app/*/page.tsx` |

Frontières nettes : un service ne parle qu'à `lib/ai` et `lib/supabase`, jamais directement à un provider.

## 6. Modèle de données

Six tables, exactement celles du §8 du master prompt : `profiles`, `learning_paths`, `lessons`, `exercises`, `attempts`, `progress`. Aucune table supplémentaire.

Le §8 ne prévoit pas de table de faiblesses. Elle n'est pas ajoutée : les faiblesses, les scores récents et les erreurs passées sont dérivés de `attempts` (`user_id`, `exercise_id`, `is_correct`, `score`, `feedback`).

Conséquence : la décision adaptative est **recalculée à la demande** à partir de l'historique, jamais stockée. Aucun état dupliqué, donc l'affichage ne peut pas contredire la base.

### Écarts additifs au §8

| Table | Ajout | Type | Justification |
|---|---|---|---|
| `exercises` | `kind` | `text` — `'qcm'` \| `'code'` | Le §16 montre une saisie libre `[ answer ]`, le §8 montre `options`. Le format hybride exige les deux. |
| `exercises` | `topic` | `text` | Sans regroupement par thème, impossible d'agréger les erreurs sur `if/else` pour la détection de faiblesse. |
| `exercises` | `starter_code` | `text` | Code fourni au débutant dans l'éditeur. |
| `exercises` | `reference_solution` | `text` | Solution de référence donnée à l'IA comme ancrage de correction. |

Tous nullable. Un QCM utilise `question` / `options` / `correct_answer` ; un exercice de code utilise `question` / `starter_code` / `reference_solution`.

### RLS

RLS activée sur les 6 tables. Politique unique : `user_id = auth.uid()`. Aucune policy accordant l'accès aux données d'un autre utilisateur.

### Seed

`supabase/seed.sql` idempotent (`on conflict do nothing`). Crée le profil démo **Amadou** — Python, débutant, « Build Python applications », 1 h/jour, 30 jours — avec un learning path, 3 leçons (Variables, Conditions, Loops) et leurs exercices, dont un QCM `if/else` et un exercice de code `if/else`.

Objectif : `npm run seed` sur une base vide produit immédiatement un parcours jouable, et la démo survit à un `supabase db reset`.

Le seed ne pré-remplit **aucun historique d'échec**. L'échec sur `if/else` doit se produire en direct pendant la démonstration, sinon la boucle adaptative n'est pas démontrée.

## 7. Couche IA

### Contrat

`lib/ai/provider.ts` définit l'interface, sans aucune dépendance à un fournisseur :

```typescript
interface AIProvider {
  generateLearningPlan(input: PlanInput): Promise<LearningPlan>
  generateLesson(input: LessonInput): Promise<Lesson>
  generateExercise(input: ExerciseInput): Promise<Exercise>
  evaluateAnswer(input: EvaluationInput): Promise<Evaluation>
  suggestAdaptation(input: AdaptationInput): Promise<Adaptation>
}
```

### Chaîne de résolution

`lib/ai/index.ts` : `nvidia` → `gemini` → `demo`.

Bascule sur n'importe laquelle de ces erreurs : réseau, timeout 15 s, HTTP non-200, JSON invalide, schéma de sortie invalide. Chaque tentative est isolée dans un `try/catch` : un provider en panne ne fait jamais échouer la requête.

`AI_PROVIDER=demo` force le mode démo, pour répéter la présentation sans consommer de crédits.

### `demo.ts`

Ce n'est pas un bouchon générique, c'est un scénario déterministe. Il renvoie :

- un plan Python débutant à 3 modules ;
- une leçon `if/else` à deux niveaux de difficulté ;
- une évaluation dont la faiblesse est `if/else conditions`, avec `masteryLevel: beginner` et un score de 35 %.

C'est le §19 rendu exécutable, et c'est ce qui rend la démonstration jouable aujourd'hui sans clé IA.

### Modèle NVIDIA

`qwen/qwen2.5-coder-32b-instruct` en principal : c'est la compétence utile ici, corriger du code Python de débutant. `nvidia/llama-3.1-nemotron-70b-instruct` en secours si le quota pose problème.

Appels avec `response_format: { type: "json_object" }` pour forcer du JSON valide.

### Validation

`lib/ai/validate.ts` : parsing et contrôle de la forme des 5 sorties, écrits à la main, sans dépendance. La sortie du modèle n'est jamais acceptée telle quelle (§12). Un champ manquant ou un type incorrect déclenche la bascule vers le provider suivant au lieu de laisser remonter une valeur `undefined` en base.

## 8. Boucle adaptative

L'IA propose, la règle dispose. La sortie de `suggestAdaptation` n'est **jamais appliquée telle quelle**.

`lib/adaptation/rules.ts` la reçoit et la valide :

1. Le modèle propose une action.
2. `rules.ts` recalcule le `masteryScore` : moyenne des `score` des 5 derniers `attempts` de l'utilisateur, du plus récent au plus ancien. En dessous de 5 attempts, la moyenne porte sur les attempts existants ; à 0 attempt, l'action est `next_topic`.
3. Le score tranche :
   - `score < 40` → `remediation` (l'IA ne peut pas voter « avancer »)
   - `40 ≤ score < 75` → `same_level`
   - `score ≥ 75` → `increase_difficulty`
4. Deux échecs consécutifs sur le même `topic` → retour au prérequis, difficulté réduite de 1.
5. La suggestion de l'IA ne sert qu'à fournir le texte `reason.nextActivity` affiché.

Conséquence : le scénario du §3 se produit même si l'IA est entièrement coupée, parce que `demo.ts` renvoie des évaluations cohérentes et que la décision vient des règles. L'IA améliore le texte de la correction et la pertinence du conseil ; elle ne tient pas la boucle.

## 9. Écrans et data flow

Chaque écran est un Server Component qui appelle un service. Aucun écran n'appelle un provider IA directement.

```
Landing  app/page.tsx
   └─ CTA "Start learning"
        ↓
Login  app/login/page.tsx          email + mot de passe
   └─ profil créé automatiquement au premier login
        ↓
Onboarding  app/onboarding/page.tsx   4 étapes sur une page
   │  skill / level / goal / dailyTime
   │  POST /api/learning-plan  →  generateLearningPlan()
   │  état de chargement : "Generating your learning path..."
        ↓
Dashboard  app/dashboard/page.tsx
   │  barre de progression, topic courant, prochaine activité
   │  appelle adaptation.ts en lecture seule pour afficher la recommandation
        ↓
Leçon + Exercice  app/learn/[lessonId]/page.tsx
   │  Leçon : titre, objectif, explication, exemple, points clés
   │  puis selon kind → <QcmExercise/> ou <CodeExercise/>
   │  POST /api/exercise   → generateExercise()
   │  POST /api/evaluate   → evaluateAnswer() puis rules.ts
   │  état de chargement : "Analyzing your answer..."
        ↓
Correction  app/correction/[attemptId]/page.tsx
      "✓ Great job!" ou "Let's learn from this."
      score, mistake, explanation, hint
      encadré "🎯 Difficulty detected" → faiblesse + action
      bouton "Start recommended activity"
        ↓
Progress  app/progress/page.tsx   masteryScore, attempts, topics maîtrisés
```

### Routes API

Quatre routes. Il n'y a pas de `/api/adapt` séparé : la décision adaptative est produite par `/api/evaluate` en même temps que l'évaluation, dans la même logique. Une route de moins à maintenir, un aller-retour réseau de moins pendant la démonstration.

### Mode de génération d'exercice

`/api/exercise` accepte un paramètre `mode` (`standard` | `remediation`) et un `topic`. C'est ce qui matérialise le « SamaCoach adapts » : le bouton de la correction déclenche un exercice différent, plus facile, sur la même faiblesse. L'écran annonce « Practice: Basic if/else, Difficulty: Beginner » et l'exercice affiché n'est pas celui précédent.

`app/learn/[lessonId]` sert aussi les exercices correctifs, qui appartiennent à la même leçon avec une difficulté inférieure. Pas de nouvelle route, pas de cas particulier dans le code.

## 10. États de chargement

Aucune opération IA ne laisse l'interface vide. Un composant `<AiThinking label="...">` avec indicateur animé couvre les cinq opérations :

- `Generating your learning path...`
- `Creating your lesson...`
- `Analyzing your answer...`
- `Adapting your learning path...`

Les boutons passent en `disabled` pendant l'appel, pour empêcher le double-clic qui polluerait l'historique `attempts`.

## 11. Erreurs

| Cas | Ce que voit l'utilisateur |
|---|---|
| Clé IA absente ou provider en panne | Bascule silencieuse vers `demo.ts`. Aucun message d'erreur : la démonstration continue. |
| Timeout ou réseau coupé, tous providers échoués | `We couldn't analyze your answer right now. Please try again.` + bouton Retry |
| Sortie IA invalide | Bascule de provider avant d'atteindre l'utilisateur. Identique à la ligne ci-dessus si tous échouent. |
| Erreur Supabase | `Something went wrong while saving your progress.` |
| Aucun fallback possible | Écran d'erreur dédié, jamais d'écran cassé |

L'utilisateur ne voit jamais la panne d'un provider interne. Il voit soit la démonstration qui fonctionne, soit un message propre. Aucune stack trace n'est exposée.

## 12. Sécurité

- `.env.local` non commité, `.gitignore` renforcé, `.env.example` documenté.
- `SUPABASE_SERVICE_ROLE_KEY` et `NVIDIA_API_KEY` exclusivement côté serveur. `lib/ai/*` n'est jamais importé par un Client Component.
- La `service_role` ne sort jamais des Route Handlers.
- Validation manuelle des 4 champs d'onboarding : longueur maximale, `level` dans une liste fermée, `dailyTime` borné à 15–240, `duration` borné à 1–365.
- RLS active, testée : la policy `user_id = auth.uid()` rend l'accès au seed d'un autre utilisateur impossible.

## 13. Tests

Trois points de contrôle, choisis pour couvrir la logique critique sans consortium de tests impossible à tenir en 2 jours.

1. **`lib/ai/validate.ts`** — JSON valide, JSON tronqué, types erronés, champ manquant. Composant le plus critique et le plus testable sans réseau.
2. **`lib/adaptation/rules.ts`** — les trois seuils (39 → remediation, 40 → same_level, 74 → same_level, 75 → increase_difficulty) ; deux échecs consécutifs sur le même topic ; et le cas où l'IA propose `next_topic` alors que le mastery est à 30, la règle devant trancher en `remediation`. Ce dernier test **prouve** le §14.
3. **Vérifications** — `npx tsc --noEmit` et `npm run build` propres avant chaque commit.

## 14. Definition of Done pour la tranche verticale

- `✓` Code implémenté
- `✓` Aucune erreur TypeScript
- `✓` UI fonctionnelle
- `✓` API fonctionnelle
- `✓` État d'erreur présent
- `✓` État de chargement présent
- `✓` Responsive
- `✓` Testé (points 1 et 2 de la section 13)
- `✓` Intégré : le parcours du §28 tourne de bout en bout

## 15. Risques et parades

| Risque | Parade |
|---|---|
| Aucune clé NVIDIA avant dimanche | `demo.ts` est le chemin par défaut, pas une afterthought. La démonstration fonctionne sans clé. |
| Sortie IA non conforme au JSON attendu | Validation stricte + bascule silencieuse vers le provider suivant. |
| Panne réseau pendant la présentation | Les données du parcours sont déjà en base ; la correction affichée est servie depuis `attempts`. |
| Vercel indisponible le jour J | Repli sur `npm run dev` local avec la même base Supabase. |
| `create-next-app` échoue à cause de l'espace dans le chemin | Scaffolder dans un dossier temporaire sans espace, puis déplacer le contenu. |
| Démo trop longue devant le jury | Le parcours tient en 2 minutes si le seed est utilisé. Préparer un script de démonstration. |

## 16. Ordre d'implémentation

1. Setup du projet, TypeScript strict, `.gitignore`, `.env.example`
2. `supabase/schema.sql` + RLS
3. `lib/supabase/` + Auth minimal
4. `types/index.ts` + `lib/ai/provider.ts` + `validate.ts` + `http.ts`
5. `lib/ai/demo.ts` (débloque la démo sans clé)
6. `lib/adaptation/rules.ts` + tests
7. `supabase/seed.sql` + `npm run seed`
8. `services/` + `app/api/`
9. `prompts/` + `lib/ai/nvidia.ts` + `gemini.ts`
10. Landing, Login, Onboarding
11. Dashboard, Leçon, Exercices (QCM + code)
12. Correction + affichage adaptatif
13. Progress
14. Déploiement Vercel + vérification du repli local

L'étape 5 arrive avant l'étape 9 : la démonstration est jouable dès cette étape, et tout ce qui suit est une amélioration.
