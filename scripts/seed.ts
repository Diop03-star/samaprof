import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function createServiceClient(): SupabaseClient {
  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY manquant : impossible de créer le client admin.");
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function main() {
  console.log("🔧 Vérification des variables d'environnement...");
  console.log("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30) + "...");
  console.log("SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20) + "...");

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project")) {
    throw new Error("❌ NEXT_PUBLIC_SUPABASE_URL manquant ou invalide dans .env.local");
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY.includes("your-service")) {
    throw new Error("❌ SUPABASE_SERVICE_ROLE_KEY manquant ou invalide dans .env.local");
  }

  const supabase = createServiceClient();
  console.log("✅ Client Supabase admin créé");
  console.log("   supabase.auth:", typeof supabase.auth);
  console.log("   supabase.auth.admin:", typeof supabase.auth?.admin);

  console.log("\n🌱 Début du seed de démonstration...\n");

  // 1. Vérifier si l'utilisateur Amadou existe déjà
  const email = "amadou.demo@example.com";
  const password = "demo-password-123";
  const fullName = "Amadou";

  console.log(`1. Recherche de l'utilisateur : ${email}`);

  const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;

  const existingUser = listData.users.find((u) => u.email === email);

  let userId: string;

  if (existingUser) {
    userId = existingUser.id;
    console.log(`   ✓ Utilisateur déjà existant : ${userId}`);
  } else {
    console.log(`   Utilisateur non trouvé, création...`);
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (authError) throw authError;
    userId = authData.user.id;
    console.log(`   ✓ Utilisateur créé : ${userId}`);
  }

  // 2. Seed pour cet utilisateur (idempotent)
  await seedForUser(supabase, userId, fullName);
}

async function seedForUser(supabase: SupabaseClient, userId: string, name: string) {
  // 2. Mettre à jour le profil (idempotent)
  console.log(`\n2. Mise à jour du profil pour ${name} (${userId})`);
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ name })
    .eq("id", userId);
  if (profileError) throw profileError;
  console.log("   ✓ Profil mis à jour");

  // 3. Upsert learning_path (idempotent grâce à l'index unique sur user_id)
  console.log("\n3. Upsert du learning_path (Python, beginner, 1h/jour, 30 jours)");
  const { data: pathData, error: pathError } = await supabase
    .from("learning_paths")
    .upsert({
      user_id: userId,
      skill: "Python",
      level: "beginner",
      goal: "construire des applications",
      daily_time: 60,
      duration: 30,
    }, { onConflict: "user_id" })
    .select("id")
    .single();

  if (pathError) throw pathError;
  const pathId = pathData.id;
  console.log(`   ✓ Learning path : ${pathId}`);

  // 4. Leçon jour 1 - select puis insert ou update (pas de contrainte unique)
  console.log("\n4. Leçon (jour 1) : Les conditions en Python");
  const lessonContent = `
# Les conditions en Python

## Objectif
Apprendre à contrôler le flux d'exécution de vos programmes avec des conditions.

## Explication
En Python, l'instruction **if** permet d'exécuter un bloc de code seulement si une condition est vraie.
On peut ajouter **elif** (else if) pour tester plusieurs conditions, et **else** pour le cas par défaut.

## Syntaxe de base
\`\`\`python
if condition:
    # code exécuté si condition est True
elif autre_condition:
    # code exécuté si la première est False et cette condition est True
else:
    # code exécuté si toutes les conditions précédentes sont False
\`\`\`

## Points clés
- L'indentation (4 espaces) définit les blocs de code — pas d'accolades {}
- Les opérateurs de comparaison : \`==\` (égal), \`!=\` (différent), \`<\`, \`>\`, \`<=\`, \`>=\`
- \`=\` est l'affectation, \`==\` est la comparaison — **ne les confondez pas !**
- Les opérateurs logiques : \`and\`, \`or\`, \`not\`

## Exemple
\`\`\`python
age = 20
if age >= 18:
    print("Majeur")
elif age >= 13:
    print("Adolescent")
else:
    print("Enfant")
\`\`\`
      `.trim();

  const { data: existingLesson } = await supabase
    .from("lessons")
    .select("id")
    .eq("path_id", pathId)
    .eq("day", 1)
    .maybeSingle();

  let lessonId: string;

  if (existingLesson) {
    const { data: lessonData, error: lessonError } = await supabase
      .from("lessons")
      .update({
        title: "Les conditions en Python : if, elif, else",
        content: lessonContent,
        difficulty: 1,
      })
      .eq("id", existingLesson.id)
      .select("id")
      .single();
    if (lessonError) throw lessonError;
    lessonId = lessonData.id;
    console.log(`   ✓ Leçon mise à jour : ${lessonId}`);
  } else {
    const { data: lessonData, error: lessonError } = await supabase
      .from("lessons")
      .insert({
        path_id: pathId,
        day: 1,
        title: "Les conditions en Python : if, elif, else",
        content: lessonContent,
        difficulty: 1,
      })
      .select("id")
      .single();
    if (lessonError) throw lessonError;
    lessonId = lessonData.id;
    console.log(`   ✓ Leçon créée : ${lessonId}`);
  }

  // 5. Exercices - select puis insert ou update pour chacun
  console.log("\n5. Exercices pour cette leçon");

  const exercises = [
    {
      lesson_id: lessonId,
      kind: "qcm" as const,
      topic: "Syntaxe if/else",
      question: "Quel est le résultat de ce code ?\n\n```python\nx = 10\nif x > 5:\n    print('A')\nelse:\n    print('B')\n```",
      options: ["A", "B", "Erreur", "Rien"],
      correct_answer: "A",
      explanation: "La condition x > 5 est vraie (10 > 5), donc le bloc if s'exécute et affiche 'A'.",
      difficulty: 1,
    },
    {
      lesson_id: lessonId,
      kind: "qcm" as const,
      topic: "Confusion entre = et ==",
      question: "Que se passe-t-il avec ce code ?\n\n```python\nage = 18\nif age = 18:\n    print('Majeur')\n```",
      options: ["Affiche 'Majeur'", "Erreur de syntaxe", "Ne fait rien", "Boucle infinie"],
      correct_answer: "Erreur de syntaxe",
      explanation: "En Python, \`=\` est l'opérateur d'affectation, pas de comparaison. La comparaison d'égalité s'écrit \`==\`. Ce code lève une SyntaxError car on ne peut pas affecter dans une condition if.",
      difficulty: 2,
    },
    {
      lesson_id: lessonId,
      kind: "qcm" as const,
      topic: "Écrire une condition complète",
      question: "Quel code affiche correctement 'Mineur', 'Majeur' ou 'Senior' selon l'âge ?",
      options: [
        "if age < 18: print('Mineur')\nelif age < 65: print('Majeur')\nelse: print('Senior')",
        "if age < 18: print('Mineur')\nif age < 65: print('Majeur')\nif age >= 65: print('Senior')",
        "if age < 18: print('Mineur')\nelif age >= 18 and age < 65: print('Majeur')\nelse: print('Senior')",
        "if age < 18: print('Mineur')\nelif age < 65: print('Majeur')\nelse: print('Senior')"
      ],
      correct_answer: "if age < 18: print('Mineur')\nelif age < 65: print('Majeur')\nelse: print('Senior')",
      explanation: "La bonne structure utilise if/elif/else pour chaîner les conditions mutuellement exclusives. L'ordre compte : on teste d'abord < 18, puis < 65 (ce qui implique ≥ 18), et le else capture ≥ 65. Les options 1, 3 et 4 sont syntaxiquement correctes mais l'option 4 est la plus idiomatique.",
      difficulty: 2,
    },
  ];

  const exerciseIds: string[] = [];
  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    const { data: existingEx } = await supabase
      .from("exercises")
      .select("id")
      .eq("lesson_id", lessonId)
      .eq("topic", ex.topic)
      .maybeSingle();

    let exId: string;
    if (existingEx) {
      const { data: exData, error: exError } = await supabase
        .from("exercises")
        .update(ex)
        .eq("id", existingEx.id)
        .select("id")
        .single();
      if (exError) throw exError;
      exId = exData.id;
      console.log(`   ✓ Exercice ${i + 1} mis à jour : ${exId} (${ex.topic})`);
    } else {
      const { data: exData, error: exError } = await supabase
        .from("exercises")
        .insert(ex)
        .select("id")
        .single();
      if (exError) throw exError;
      exId = exData.id;
      console.log(`   ✓ Exercice ${i + 1} créé : ${exId} (${ex.topic})`);
    }
    exerciseIds.push(exId);
  }

  // 6. Upsert progression (idempotent grâce à l'index unique sur user_id)
  console.log("\n6. Upsert de la progression");
  const { error: progressError } = await supabase
    .from("progress")
    .upsert({
      user_id: userId,
      path_id: pathId,
      completed_lessons: 0,
      total_lessons: 1,
      mastery_score: 0,
      current_level: 1,
    }, { onConflict: "user_id" });

  if (progressError) throw progressError;
  console.log("   ✓ Progression initialisée/mise à jour");

  // Résumé
  console.log("\n" + "=".repeat(50));
  console.log("🎉 SEED TERMINÉ AVEC SUCCÈS");
  console.log("=".repeat(50));
  console.log(`User ID        : ${userId}`);
  console.log(`Email          : amadou.demo@example.com`);
  console.log(`Password       : demo-password-123`);
  console.log(`Profile name   : ${name}`);
  console.log(`Learning Path  : ${pathId}`);
  console.log(`Lesson (day 1) : ${lessonId}`);
  console.log(`Exercises      : ${exerciseIds.join(", ")}`);
  console.log("=".repeat(50));
}

main().catch((err) => {
  console.error("\n❌ Erreur lors du seed :", err);
  process.exit(1);
});