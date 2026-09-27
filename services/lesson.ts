// STUB pour services/lesson.ts (Task 8 manquante)
export async function getLessonsForUser(userId: string) {
  return [
    { id: "l1", title: "Introduction à Python", day: 1, difficulty: "1" },
    { id: "l2", title: "Variables et types", day: 2, difficulty: "1" },
    { id: "l3", title: "Comprendre les boucles (for & while)", day: 3, difficulty: "2" },
    { id: "l4", title: "Les fonctions", day: 4, difficulty: "2" },
  ];
}

export async function getLessonById(userId: string, lessonId: string) {
  return { id: lessonId, title: "Comprendre les boucles (for & while)", path_id: "p1", day: 3, difficulty: "2" };
}

export async function ensureLessonContent(lesson: any, skill: string, goal: string) {
  return { ...lesson, content_ref: "dummy_ref" };
}

// Remove async so we don't have to await it in page.tsx
export function parseLessonContent(enriched: any) {
  return {
    objective: "Maîtriser l'itération dynamique et les structures conditionnelles associées.",
    explanation: "Les boucles `for` permettent d'itérer sur des listes, et `while` de répéter sous condition.\nIl est important de faire attention aux boucles infinies avec `while` si la condition ne change jamais.",
    example: "for i in range(5):\n    print(f'Itération {i}')",
    keyPoints: [
      "Utiliser `for` quand on connaît le nombre d'itérations",
      "Utiliser `while` pour une boucle conditionnelle continue",
      "`break` pour sortir de la boucle de force"
    ],
  };
}
