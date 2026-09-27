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
            return { data: null, error: null };
          },
        }),
      }),
    }),
  };
}
