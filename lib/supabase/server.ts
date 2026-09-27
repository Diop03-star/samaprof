// STUB pour lib/supabase/server.ts (Task 3 n'est pas encore sur main)
export type CurrentUser = { userId: string };

export async function getCurrentUser(): Promise<CurrentUser | null> {
  return { userId: "dummy-user-id" };
}

export async function createClient() {
  return {
    from: (table: string) => ({
      select: (fields: string) => ({
        eq: (col: string, val: string) => ({
          maybeSingle: async (): Promise<{ data: any; error: any }> => {
            if (table === "profiles") return { data: { name: "Amadou", avatar_url: null }, error: null };
            if (table === "progress") return { data: { completed_lessons: 2, total_lessons: 30, mastery_score: 84 }, error: null };
            if (table === "learning_paths") return { data: { skill: "Python", goal: "Devenir Data Scientist" }, error: null };
            if (table === "attempts") return { 
               data: { 
                  id: "mock-attempt-123", 
                  answer: "Une boucle while n'a pas besoin de condition", 
                  is_correct: false, 
                  score: 35, 
                  feedback: { 
                     mistake: "La condition est obligatoire", 
                     explanation: "Une boucle while évalue toujours une condition avant de s'exécuter. Si elle n'est pas précisée, c'est une erreur de syntaxe.", 
                     hint: "Revois la syntaxe exacte d'un while : while [condition]:", 
                     weakness: "while-condition", 
                     masteryLevel: "Novice" 
                  }, 
                  exercises: { lesson_id: "l1", topic: "if/else conditions", difficulty: 1 } 
               }, 
               error: null 
            };
            return { data: null, error: null };
          },
        }),
      }),
    }),
  };
}
