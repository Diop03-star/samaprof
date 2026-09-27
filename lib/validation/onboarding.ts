export const LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type Level = (typeof LEVELS)[number];

export type OnboardingInput = {
  skill: string;
  level: Level;
  goal: string;
  dailyTime: number;
  duration: number;
};

export type ValidationResult =
  | { ok: true; value: OnboardingInput }
  | { ok: false; error: string };

const MAX_SKILL = 100;
const MAX_GOAL = 200;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateOnboardingInput(raw: unknown): ValidationResult {
  if (!isRecord(raw)) return { ok: false, error: "Invalid input." };

  const skill = typeof raw.skill === "string" ? raw.skill.trim() : "";
  const goal = typeof raw.goal === "string" ? raw.goal.trim() : "";
  const { level, dailyTime, duration } = raw;

  if (skill.length === 0 || skill.length > MAX_SKILL) {
    return { ok: false, error: "Skill is required." };
  }
  if (goal.length === 0 || goal.length > MAX_GOAL) {
    return { ok: false, error: "Goal is required." };
  }
  if (typeof level !== "string" || !LEVELS.includes(level as Level)) {
    return { ok: false, error: "Invalid level." };
  }
  if (
    typeof dailyTime !== "number" ||
    !Number.isInteger(dailyTime) ||
    dailyTime < 15 ||
    dailyTime > 240
  ) {
    return { ok: false, error: "Invalid daily time." };
  }
  if (
    typeof duration !== "number" ||
    !Number.isInteger(duration) ||
    duration < 1 ||
    duration > 365
  ) {
    return { ok: false, error: "Invalid duration." };
  }

  return {
    ok: true,
    value: { skill, goal, level: level as Level, dailyTime, duration },
  };
}
