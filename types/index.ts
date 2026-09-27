import type { Level, OnboardingInput } from "@/lib/validation/onboarding";

export type { Level, OnboardingInput };

/* ---------- entrées ---------- */

export type PlanInput = {
  skill: string;
  level: Level;
  goal: string;
  dailyTime: number;
  duration: number;
};

export type LessonInput = {
  skill: string;
  level: Level;
  topic: string;
  goal: string;
  difficulty: number;
};

export type ExerciseInput = {
  topic: string;
  level: Level;
  difficulty: number;
  kind: "qcm" | "code";
};

export type EvaluationInput = {
  question: string;
  kind: "qcm" | "code";
  correctAnswer: string | null;
  referenceSolution: string | null;
  learnerAnswer: string;
  level: Level;
  topic: string;
};

export type AdaptationInput = {
  topic: string;
  level: Level;
  recentScores: number[];
  previousMistakes: string[];
  weaknesses: string[];
  masteryScore: number;
};

/* ---------- sorties ---------- */

export type Module = { title: string; objective: string; difficulty: number };

export type LearningPlan = {
  skill: string;
  level: Level;
  goal: string;
  modules: Module[];
};

export type Lesson = {
  title: string;
  objective: string;
  explanation: string;
  example: string;
  keyPoints: string[];
};

export type Exercise = {
  kind: "qcm" | "code";
  topic: string;
  question: string;
  difficulty: number;
  options: string[] | null;
  correctAnswer: string | null;
  starterCode: string | null;
  referenceSolution: string | null;
  explanation: string;
};

export type Evaluation = {
  correct: boolean;
  score: number;
  mistake: string;
  explanation: string;
  hint: string;
  weakness: string;
  masteryLevel: string;
};

export const ADAPTATION_ACTIONS = [
  "remediation",
  "same_level",
  "increase_difficulty",
  "next_topic",
] as const;

export type AdaptationAction = (typeof ADAPTATION_ACTIONS)[number];

export type Adaptation = {
  action: AdaptationAction;
  topic: string;
  difficulty: number;
  reason: string;
  nextActivity: string;
};

export type AdaptiveDecision = Adaptation & {
  source: "rules";
  masteryScore: number;
};

/* ---------- lignes base ---------- */

export type LessonRow = {
  id: string;
  path_id: string;
  day: number;
  title: string;
  content: string;
  difficulty: number;
};

export type ExerciseRow = {
  id: string;
  lesson_id: string;
  kind: "qcm" | "code";
  topic: string;
  question: string;
  options: string[] | null;
  correct_answer: string | null;
  explanation: string;
  difficulty: number;
  starter_code: string | null;
  reference_solution: string | null;
};

export type AttemptRow = {
  id: string;
  user_id: string;
  exercise_id: string;
  answer: string;
  is_correct: boolean;
  score: number;
  feedback: Record<string, unknown>;
  created_at: string;
};

/* ---------- contrat fournisseur ---------- */

export interface AIProvider {
  readonly name: string;
  generateLearningPlan(input: PlanInput): Promise<LearningPlan>;
  generateLesson(input: LessonInput): Promise<Lesson>;
  generateExercise(input: ExerciseInput): Promise<Exercise>;
  evaluateAnswer(input: EvaluationInput): Promise<Evaluation>;
  suggestAdaptation(input: AdaptationInput): Promise<Adaptation>;
}
