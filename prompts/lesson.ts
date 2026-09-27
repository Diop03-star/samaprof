import type { LessonInput } from "@/types";
import { SYSTEM } from "./learning-plan";

export { SYSTEM };

export function buildUser(input: LessonInput): string {
  return [
    "Write a lesson as a JSON object with this exact shape:",
    '{"title":string,"objective":string,"explanation":string,"example":string,"keyPoints":string[]}',
    "",
    `Skill: ${input.skill}`,
    `Level: ${input.level}`,
    `Topic: ${input.topic}`,
    `Goal: ${input.goal}`,
    `Difficulty: ${input.difficulty}`,
    "",
    "Rules:",
    "- explanation must be plain language, under 150 words.",
    "- example must be runnable code for the topic.",
    "- keyPoints must contain 3 to 5 short strings.",
    "- Return the JSON object only, with no markdown fence.",
  ].join("\n");
}
