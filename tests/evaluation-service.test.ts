import { describe, it, expect } from "vitest";
import { buildEvaluationInput } from "@/services/evaluation";
import type { ExerciseRow } from "@/types";

const codeExercise: ExerciseRow = {
  id: "e1",
  lesson_id: "l1",
  kind: "code",
  topic: "if/else conditions",
  question: "Write an if/else",
  options: null,
  correct_answer: null,
  explanation: "",
  difficulty: 1,
  starter_code: "age = 20",
  reference_solution: "if age >= 18:\n    print('adult')",
};

const qcmExercise: ExerciseRow = {
  ...codeExercise,
  id: "e2",
  kind: "qcm",
  options: ["a", "b"],
  correct_answer: "a",
  starter_code: null,
  reference_solution: null,
};

describe("buildEvaluationInput", () => {
  it("construit une entrée correcte pour un exercice de code", () => {
    const input = buildEvaluationInput(codeExercise, "if age = 18", "beginner");
    expect(input.kind).toBe("code");
    expect(input.correctAnswer).toBeNull();
    expect(input.referenceSolution).toBe("if age >= 18:\n    print('adult')");
    expect(input.learnerAnswer).toBe("if age = 18");
    expect(input.topic).toBe("if/else conditions");
  });

  it("construit une entrée correcte pour un QCM", () => {
    const input = buildEvaluationInput(qcmExercise, "a", "beginner");
    expect(input.kind).toBe("qcm");
    expect(input.correctAnswer).toBe("a");
    expect(input.referenceSolution).toBeNull();
  });

  it("refuse une réponse vide ou uniquement des espaces", () => {
    expect(() => buildEvaluationInput(codeExercise, "", "beginner")).toThrow();
    expect(() => buildEvaluationInput(codeExercise, "   ", "beginner")).toThrow();
  });
});