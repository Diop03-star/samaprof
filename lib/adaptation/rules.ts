import type { Adaptation, AdaptationAction, AdaptiveDecision } from "@/types";

export type AttemptRecord = {
  score: number;
  isCorrect: boolean;
  topic: string;
};

export type DecideInput = {
  attempts: AttemptRecord[];
  aiSuggestion: Adaptation | null;
  currentTopic: string;
  currentDifficulty: number;
};

const WINDOW = 5;
const REMEDIATION_BELOW = 40;
const ADVANCE_AT = 75;
const MAX_DIFFICULTY = 5;

export function computeMasteryScore(attempts: AttemptRecord[]): number {
  const recent = attempts.slice(0, WINDOW);
  if (recent.length === 0) return 0;

  const total = recent.reduce((sum, item) => sum + item.score, 0);
  return Math.round(total / recent.length);
}

// `attempts` est ordonné du plus récent au plus ancien. On cherche deux échecs
// consécutifs sur le même topic à l'intérieur de la fenêtre, pas seulement la
// paire la plus récente : au-delà de 2 tentatives, l'implémentation précédente
// s'arrêtait sur la première occurrence correcte et n'examinait plus la paire.
function hasConsecutiveFailures(attempts: AttemptRecord[], topic: string): boolean {
  let previousFailed = false;

  for (const item of attempts) {
    if (item.topic !== topic) continue;
    if (item.isCorrect) {
      previousFailed = false;
      continue;
    }
    if (previousFailed) return true;
    previousFailed = true;
  }

  return false;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function thresholdAction(score: number): AdaptationAction {
  if (score < REMEDIATION_BELOW) return "remediation";
  if (score < ADVANCE_AT) return "same_level";
  return "increase_difficulty";
}

function defaultNextActivity(action: AdaptationAction, topic: string): string {
  switch (action) {
    case "remediation":
      return `Practice: Basic ${topic}`;
    case "increase_difficulty":
      return `Practice: Advanced ${topic}`;
    case "next_topic":
      return "Continue to the next topic";
    case "same_level":
      return `Practice: ${topic}`;
  }
}

export function decide(input: DecideInput): AdaptiveDecision {
  const { attempts, aiSuggestion, currentTopic, currentDifficulty } = input;
  const masteryScore = computeMasteryScore(attempts);

  let action: AdaptationAction;
  if (attempts.length === 0) {
    action = "next_topic";
  } else {
    action = thresholdAction(masteryScore);
    if (action !== "remediation" && hasConsecutiveFailures(attempts, currentTopic)) {
      action = "remediation";
    }
  }

  const difficulty = clamp(
    action === "remediation"
      ? currentDifficulty - 1
      : action === "increase_difficulty"
        ? currentDifficulty + 1
        : currentDifficulty,
    1,
    MAX_DIFFICULTY
  );

  const topic =
    action === "remediation" ? currentTopic : (aiSuggestion?.topic ?? currentTopic);

  return {
    action,
    topic,
    difficulty,
    reason: aiSuggestion?.reason ?? "Based on your recent performance",
    nextActivity: aiSuggestion?.nextActivity ?? defaultNextActivity(action, topic),
    source: "rules",
    masteryScore,
  };
}