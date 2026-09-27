import { createClient } from "@/lib/supabase/server";
import { suggestAdaptation } from "@/lib/ai";
import { decide, type AttemptRecord } from "@/lib/adaptation/rules";
import type { AdaptiveDecision, Level } from "@/types";

export async function loadAttemptRecords(userId: string): Promise<AttemptRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("attempts")
    .select("score, is_correct, exercises(topic)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw new Error(`Failed to load attempts: ${error.message}`);

  return (data ?? []).map((row) => {
    // `attempts.exercise_id` référence `exercises.id` : la relation est
    // many-to-one, donc PostgREST renvoie un objet et non un tableau. Le client
    // n'étant pas typé, il suppose un tableau, d'où le passage par `unknown`.
    const exercise = row.exercises as unknown as { topic: string } | null;
    return {
      score: row.score,
      isCorrect: row.is_correct,
      topic: exercise?.topic ?? "unknown",
    };
  });
}

export async function getAdaptationFor(
  userId: string,
  currentTopic: string,
  currentDifficulty: number,
  level: Level = "beginner"
): Promise<AdaptiveDecision> {
  const attempts = await loadAttemptRecords(userId);
  const recentScores = attempts.map((a) => a.score);
  const weaknesses = [...new Set(attempts.filter((a) => !a.isCorrect).map((a) => a.topic))];

  let aiSuggestion = null;
  try {
    aiSuggestion = await suggestAdaptation({
      topic: currentTopic,
      level,
      recentScores,
      previousMistakes: [],
      weaknesses,
      masteryScore: 0,
    });
  } catch {
    aiSuggestion = null;
  }

  return decide({ attempts, aiSuggestion, currentTopic, currentDifficulty });
}