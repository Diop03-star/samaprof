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
          maybeSingle: async () => {
            if (table === "profiles") return { data: { name: "Amadou" } };
            if (table === "progress")
              return { data: { completed_lessons: 2, total_lessons: 30, mastery_score: 84 } };
            return { data: null };
          },
        }),
      }),
    }),
  };
}
