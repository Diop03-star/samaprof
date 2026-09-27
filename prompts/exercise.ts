import type { ExerciseInput } from "@/types";
import { SYSTEM } from "./learning-plan";

export { SYSTEM };

export function buildUser(input: ExerciseInput): string {
  const shape =
    input.kind === "qcm"
      ? '{"kind":"qcm","topic":string,"question":string,"difficulty":number,"options":string[],"correctAnswer":string,"explanation":string}'
      : '{"kind":"code","topic":string,"question":string,"difficulty":number,"starterCode":string,"referenceSolution":string,"explanation":string}';

  return [
    `Write one ${input.kind} exercise as a JSON object with this exact shape:`,
    shape,
    "",
    `Topic: ${input.topic}`,
    `Level: ${input.level}`,
    `Difficulty: ${input.difficulty}`,
    "",
    "Rules:",
    input.kind === "qcm"
      ? "- options must contain 4 strings, exactly one of which equals correctAnswer."
      : "- starterCode is the code the learner starts from. referenceSolution is a working answer.",
    "- Return the JSON object only, with no markdown fence.",
  ].join("\n");
}
