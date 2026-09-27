import type { AdaptationInput } from "@/types";
import { SYSTEM } from "./learning-plan";

export { SYSTEM };

export function buildUser(input: AdaptationInput): string {
  return [
    "Suggest the next learning activity as a JSON object with this exact shape:",
    '{"action":string,"topic":string,"difficulty":number,"reason":string,"nextActivity":string}',
    "",
    `Current topic: ${input.topic}`,
    `Learner level: ${input.level}`,
    `Recent scores: ${input.recentScores.join(", ") || "none"}`,
    `Previous mistakes: ${input.previousMistakes.join("; ") || "none"}`,
    `Known weaknesses: ${input.weaknesses.join("; ") || "none"}`,
    `Mastery score: ${input.masteryScore}`,
    "",
    "Rules:",
    "- action is one of: remediation, same_level, increase_difficulty, next_topic.",
    "- difficulty is an integer from 1 to 5.",
    "- nextActivity is a short imperative sentence shown to the learner.",
    "- Return the JSON object only, with no markdown fence.",
  ].join("\n");
}
