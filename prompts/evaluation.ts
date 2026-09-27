import type { EvaluationInput } from "@/types";
import { SYSTEM } from "./learning-plan";

export { SYSTEM };

export function buildUser(input: EvaluationInput): string {
  return [
    "Evaluate a learner answer as a JSON object with this exact shape:",
    '{"correct":boolean,"score":number,"mistake":string,"explanation":string,"hint":string,"weakness":string,"masteryLevel":string}',
    "",
    `Topic: ${input.topic}`,
    `Learner level: ${input.level}`,
    `Question: ${input.question}`,
    input.kind === "qcm"
      ? `Correct answer: ${input.correctAnswer ?? "unknown"}`
      : `Reference solution:\n${input.referenceSolution ?? "none"}`,
    `Learner answer:\n${input.learnerAnswer}`,
    "",
    "Rules:",
    "- score is an integer from 0 to 100.",
    "- weakness is the single specific concept the learner is missing, lowercase, at most 6 words.",
    "- mistake names the exact token or operator involved in the error.",
    "- hint is a nudge, never the full answer.",
    "- mistake and hint are empty strings when correct is true.",
    "- Return the JSON object only, with no markdown fence.",
  ].join("\n");
}
