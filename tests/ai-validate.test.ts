import { describe, it, expect } from "vitest";
import {
  parseLearningPlan,
  parseLesson,
  parseExercise,
  parseEvaluation,
  parseAdaptation,
} from "@/lib/ai/validate";

describe("parseLearningPlan", () => {
  const valid = {
    skill: "Python",
    level: "beginner",
    goal: "Build Python applications",
    modules: [{ title: "Variables", objective: "Store values", difficulty: 1 }],
  };

  it("accepte un plan valide", () => {
    expect(parseLearningPlan(valid)).not.toBeNull();
  });

  it("rejette du JSON tronqué", () => {
    expect(parseLearningPlan({ skill: "Python" })).toBeNull();
  });

  it("rejette un module sans difficulty", () => {
    expect(
      parseLearningPlan({ ...valid, modules: [{ title: "V", objective: "O" }] })
    ).toBeNull();
  });

  it("rejette modules qui n'est pas un tableau", () => {
    expect(parseLearningPlan({ ...valid, modules: "Variables" })).toBeNull();
  });

  it("rejette un niveau invalide", () => {
    expect(parseLearningPlan({ ...valid, level: "expert" })).toBeNull();
  });

  it("rejette null", () => {
    expect(parseLearningPlan(null)).toBeNull();
  });
});

describe("parseLesson", () => {
  const valid = {
    title: "Conditions",
    objective: "Use if/else",
    explanation: "An if runs code conditionally.",
    example: "if age >= 18: print('adult')",
    keyPoints: ["if", "else"],
  };

  it("accepte une leçon valide", () => {
    expect(parseLesson(valid)).not.toBeNull();
  });

  it("rejette keyPoints non tableau", () => {
    expect(parseLesson({ ...valid, keyPoints: "if" })).toBeNull();
  });

  it("rejette un champ string manquant", () => {
    expect(parseLesson({ ...valid, explanation: undefined })).toBeNull();
  });
});

describe("parseExercise", () => {
  const qcm = {
    kind: "qcm",
    topic: "if/else conditions",
    question: "What does this print?",
    difficulty: 1,
    options: ["a", "b"],
    correctAnswer: "a",
    starterCode: null,
    referenceSolution: null,
    explanation: "Because a is first.",
  };

  it("accepte un QCM valide", () => {
    expect(parseExercise(qcm)).not.toBeNull();
  });

  it("rejette un kind inconnu", () => {
    expect(parseExercise({ ...qcm, kind: "essay" })).toBeNull();
  });

  it("rejette un QCM sans options", () => {
    expect(parseExercise({ ...qcm, options: null })).toBeNull();
  });

  it("rejette un QCM sans correctAnswer", () => {
    expect(parseExercise({ ...qcm, correctAnswer: null })).toBeNull();
  });

  it("rejette un correctAnswer absent des options", () => {
    expect(parseExercise({ ...qcm, correctAnswer: "z" })).toBeNull();
  });

  it("accepte un exercice de code avec starterCode", () => {
    expect(
      parseExercise({
        ...qcm,
        kind: "code",
        options: null,
        correctAnswer: null,
        starterCode: "age = 20",
        referenceSolution: "if age >= 18: print('adult')",
      })
    ).not.toBeNull();
  });

  it("rejette un exercice de code sans starterCode", () => {
    expect(
      parseExercise({
        ...qcm,
        kind: "code",
        options: null,
        correctAnswer: null,
        starterCode: null,
        referenceSolution: "x",
      })
    ).toBeNull();
  });
});

describe("parseEvaluation", () => {
  const valid = {
    correct: false,
    score: 35,
    mistake: "Used = instead of ==",
    explanation: "= assigns, == compares.",
    hint: "Check the comparison operator.",
    weakness: "if/else conditions",
    masteryLevel: "beginner",
  };

  it("accepte une évaluation valide", () => {
    expect(parseEvaluation(valid)).not.toBeNull();
  });

  it("borne le score à 0-100", () => {
    expect(parseEvaluation({ ...valid, score: 150 })).toBeNull();
    expect(parseEvaluation({ ...valid, score: -5 })).toBeNull();
  });

  it("rejette un score non entier", () => {
    expect(parseEvaluation({ ...valid, score: 35.7 })).toBeNull();
  });

  it("rejette correct non booléen", () => {
    expect(parseEvaluation({ ...valid, correct: "true" })).toBeNull();
  });

  it("rejette weakness vide", () => {
    expect(parseEvaluation({ ...valid, weakness: "" })).toBeNull();
  });
});

describe("parseAdaptation", () => {
  const valid = {
    action: "remediation",
    topic: "if/else conditions",
    difficulty: 1,
    reason: "Repeated errors detected",
    nextActivity: "Practice basic if/else conditions",
  };

  it("accepte une adaptation valide", () => {
    expect(parseAdaptation(valid)).not.toBeNull();
  });

  it("rejette une action inconnue", () => {
    expect(parseAdaptation({ ...valid, action: "give_up" })).toBeNull();
  });

  it("rejette une difficulty hors bornes 1-5", () => {
    expect(parseAdaptation({ ...valid, difficulty: 0 })).toBeNull();
    expect(parseAdaptation({ ...valid, difficulty: 9 })).toBeNull();
  });
});
