import {
  ADAPTATION_ACTIONS,
  type Adaptation,
  type AdaptationAction,
  type Evaluation,
  type Exercise,
  type LearningPlan,
  type Lesson,
  type Level,
  type Module,
} from "@/types";
import { LEVELS } from "@/lib/validation/onboarding";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStr(value: unknown): value is string {
  return typeof value === "string";
}

function isNonEmptyStr(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isIntInRange(value: unknown, min: number, max: number): value is number {
  return (
    typeof value === "number" && Number.isInteger(value) && value >= min && value <= max
  );
}

function isStrArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isStr);
}

function isLevel(value: unknown): value is Level {
  return isStr(value) && (LEVELS as readonly string[]).includes(value);
}

function parseModule(raw: unknown): Module | null {
  if (!isRecord(raw)) return null;
  if (!isNonEmptyStr(raw.title) || !isNonEmptyStr(raw.objective)) return null;
  if (!isIntInRange(raw.difficulty, 1, 5)) return null;
  return { title: raw.title, objective: raw.objective, difficulty: raw.difficulty };
}

export function parseLearningPlan(raw: unknown): LearningPlan | null {
  if (!isRecord(raw)) return null;
  if (!isNonEmptyStr(raw.skill) || !isLevel(raw.level) || !isNonEmptyStr(raw.goal)) {
    return null;
  }
  if (!Array.isArray(raw.modules) || raw.modules.length === 0) return null;

  const modules: Module[] = [];
  for (const item of raw.modules) {
    const parsed = parseModule(item);
    if (!parsed) return null;
    modules.push(parsed);
  }

  return { skill: raw.skill, level: raw.level, goal: raw.goal, modules };
}

export function parseLesson(raw: unknown): Lesson | null {
  if (!isRecord(raw)) return null;
  if (!isNonEmptyStr(raw.title) || !isNonEmptyStr(raw.objective)) return null;
  if (!isNonEmptyStr(raw.explanation) || !isNonEmptyStr(raw.example)) return null;
  if (!isStrArray(raw.keyPoints)) return null;
  return {
    title: raw.title,
    objective: raw.objective,
    explanation: raw.explanation,
    example: raw.example,
    keyPoints: raw.keyPoints,
  };
}

export function parseExercise(raw: unknown): Exercise | null {
  if (!isRecord(raw)) return null;

  const { kind } = raw;
  if (kind !== "qcm" && kind !== "code") return null;
  if (!isNonEmptyStr(raw.topic) || !isNonEmptyStr(raw.question)) return null;
  if (!isIntInRange(raw.difficulty, 1, 5)) return null;
  if (!isStr(raw.explanation)) return null;

  if (kind === "qcm") {
    if (!isStrArray(raw.options) || raw.options.length < 2) return null;
    if (!isNonEmptyStr(raw.correctAnswer)) return null;
    if (!raw.options.includes(raw.correctAnswer)) return null;
    return {
      kind: "qcm",
      topic: raw.topic,
      question: raw.question,
      difficulty: raw.difficulty,
      options: raw.options,
      correctAnswer: raw.correctAnswer,
      starterCode: null,
      referenceSolution: null,
      explanation: raw.explanation,
    };
  }

  if (!isNonEmptyStr(raw.starterCode)) return null;
  if (raw.referenceSolution !== null && !isStr(raw.referenceSolution)) return null;

  return {
    kind: "code",
    topic: raw.topic,
    question: raw.question,
    difficulty: raw.difficulty,
    options: null,
    correctAnswer: null,
    starterCode: raw.starterCode,
    referenceSolution: raw.referenceSolution ?? null,
    explanation: raw.explanation,
  };
}

export function parseEvaluation(raw: unknown): Evaluation | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.correct !== "boolean") return null;
  if (!isIntInRange(raw.score, 0, 100)) return null;
  if (!isStr(raw.mistake) || !isStr(raw.explanation) || !isStr(raw.hint)) return null;
  if (!isNonEmptyStr(raw.weakness)) return null;
  if (!isNonEmptyStr(raw.masteryLevel)) return null;
  return {
    correct: raw.correct,
    score: raw.score,
    mistake: raw.mistake,
    explanation: raw.explanation,
    hint: raw.hint,
    weakness: raw.weakness,
    masteryLevel: raw.masteryLevel,
  };
}

export function parseAdaptation(raw: unknown): Adaptation | null {
  if (!isRecord(raw)) return null;
  if (
    !isStr(raw.action) ||
    !(ADAPTATION_ACTIONS as readonly string[]).includes(raw.action)
  ) {
    return null;
  }
  if (!isNonEmptyStr(raw.topic)) return null;
  if (!isIntInRange(raw.difficulty, 1, 5)) return null;
  if (!isStr(raw.reason) || !isNonEmptyStr(raw.nextActivity)) return null;
  return {
    action: raw.action as AdaptationAction,
    topic: raw.topic,
    difficulty: raw.difficulty,
    reason: raw.reason,
    nextActivity: raw.nextActivity,
  };
}
