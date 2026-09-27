import { createClient } from "@/lib/supabase/server";
import { evaluateAnswer, suggestAdaptation } from "@/lib/ai";
import { decide } from "@/lib/adaptation/rules";
import { loadAttemptRecords } from "./adaptation";
import type {
  AdaptiveDecision,
  Evaluation,
  EvaluationInput,
  ExerciseRow,
  Level,
} from "@/types";

export function buildEvaluationInput(
  exercise: ExerciseRow,
  learnerAnswer: string,
  level: Level
): EvaluationInput {
  if (!learnerAnswer || learnerAnswer.trim().length === 0) {
    throw new Error("Answer is required.");
  }

  return {
    question: exercise.question,
    kind: exercise.kind,
    correctAnswer: exercise.correct_answer,
    referenceSolution: exercise.reference_solution,
    learnerAnswer,
    level,
    topic: exercise.topic,
  };
}

export type SubmitAttemptResult = {
  attemptId: string;
  evaluation: Evaluation;
  decision: AdaptiveDecision;
};

export async function submitAttempt(
  userId: string,
  exerciseId: string,
  learnerAnswer: string,
  level: Level = "beginner"
): Promise<SubmitAttemptResult> {
  const supabase = await createClient();

  const { data: exerciseData, error: exerciseError } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", exerciseId)
    .maybeSingle();

  if (exerciseError) throw new Error(`Failed to load exercise: ${exerciseError.message}`);
  if (!exerciseData) throw new Error("Exercise not found.");

  const exercise = exerciseData as ExerciseRow;
  const input = buildEvaluationInput(exercise, learnerAnswer, level);
  const evaluation = await evaluateAnswer(input);

  const { data: attempt, error: attemptError } = await supabase
    .from("attempts")
    .insert({
      user_id: userId,
      exercise_id: exercise.id,
      answer: learnerAnswer,
      is_correct: evaluation.correct,
      score: evaluation.score,
      feedback: {
        mistake: evaluation.mistake,
        explanation: evaluation.explanation,
        hint: evaluation.hint,
        weakness: evaluation.weakness,
        masteryLevel: evaluation.masteryLevel,
      },
    })
    .select()
    .single();
  if (attemptError) throw new Error(`Failed to save attempt: ${attemptError.message}`);

  const attempts = await loadAttemptRecords(userId);
  const weaknesses = [
    ...new Set(attempts.filter((a) => !a.isCorrect).map((a) => a.topic)),
  ];

  let aiSuggestion = null;
  try {
    aiSuggestion = await suggestAdaptation({
      topic: exercise.topic,
      level,
      recentScores: attempts.map((a) => a.score),
      previousMistakes: [],
      weaknesses,
      masteryScore: 0,
    });
  } catch {
    aiSuggestion = null;
  }

  const decision = decide({
    attempts,
    aiSuggestion,
    currentTopic: exercise.topic,
    currentDifficulty: exercise.difficulty,
  });

  return { attemptId: attempt.id, evaluation, decision };
}