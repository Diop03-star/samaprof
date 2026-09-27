import type { PlanInput } from "@/types";

export const SYSTEM =
  "You are a senior curriculum designer. You always answer with valid JSON and nothing else.";

export function buildUser(input: PlanInput): string {
  return [
    "Design a learning plan as a JSON object with this exact shape:",
    '{"skill":string,"level":string,"goal":string,"modules":[{"title":string,"objective":string,"difficulty":number}]}',
    "",
    `Skill: ${input.skill}`,
    `Level: ${input.level}`,
    `Goal: ${input.goal}`,
    `Minutes available per day: ${input.dailyTime}`,
    `Days: ${input.duration}`,
    "",
    "Rules:",
    "- 3 to 5 modules, ordered from simplest to most complex.",
    "- difficulty is an integer from 1 to 5.",
    "- objectives must be concrete, written simply when level is beginner.",
    "- Return the JSON object only, with no markdown fence and no commentary.",
  ].join("\n");
}
