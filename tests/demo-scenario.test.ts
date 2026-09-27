import { describe, it, expect } from "vitest";
import { demoProvider, generateLearningPlan, getProviderChain } from "@/lib/ai";

describe("scénario démo Amadou", () => {
  it("plan: 3 modules", async () => {
    const plan = await demoProvider.generateLearningPlan({
      skill: "Python",
      level: "beginner",
      goal: "Build Python applications",
      dailyTime: 60,
      duration: 30,
    });
    expect(plan.modules).toHaveLength(3);
  });

  it("leçon: titre et keyPoints non vides", async () => {
    const lesson = await demoProvider.generateLesson({
      skill: "Python",
      level: "beginner",
      topic: "if/else conditions",
      goal: "Build Python applications",
      difficulty: 1,
    });
    expect(lesson.title).toBe("if/else conditions");
    expect(lesson.keyPoints.length).toBeGreaterThan(0);
  });

  it("code faux: 35 et faiblesse if/else", async () => {
    const evaluation = await demoProvider.evaluateAnswer({
      question: "Write an if/else",
      kind: "code",
      correctAnswer: null,
      referenceSolution: "if age >= 18:\n    print('adult')",
      learnerAnswer: "if age = 18\nprint('adult')",
      level: "beginner",
      topic: "if/else conditions",
    });
    expect(evaluation.correct).toBe(false);
    expect(evaluation.score).toBe(35);
    expect(evaluation.weakness).toBe("if/else conditions");
    expect(evaluation.masteryLevel).toBe("beginner");
  });

  it("code correct: 100", async () => {
    const evaluation = await demoProvider.evaluateAnswer({
      question: "Write an if/else",
      kind: "code",
      correctAnswer: null,
      referenceSolution: null,
      learnerAnswer:
        'age = 20\nif age >= 18:\n    print("adult")\nelse:\n    print("minor")',
      level: "beginner",
      topic: "if/else conditions",
    });
    expect(evaluation.correct).toBe(true);
    expect(evaluation.score).toBe(100);
  });

  it("QCM faux: 35 et faiblesse if/else", async () => {
    const evaluation = await demoProvider.evaluateAnswer({
      question: "What does this print?",
      kind: "qcm",
      correctAnswer: "It prints 'You are an adult'",
      referenceSolution: null,
      learnerAnswer: "It prints nothing",
      level: "beginner",
      topic: "if/else conditions",
    });
    expect(evaluation.correct).toBe(false);
    expect(evaluation.score).toBe(35);
  });

  it("adaptation: mastery 30 propose remediation", async () => {
    const adaptation = await demoProvider.suggestAdaptation({
      topic: "if/else conditions",
      level: "beginner",
      recentScores: [35, 40, 30],
      previousMistakes: ["= instead of >="],
      weaknesses: ["if/else conditions"],
      masteryScore: 30,
    });
    expect(adaptation.action).toBe("remediation");
  });
});

describe("chaîne par défaut sans AI_PROVIDER", () => {
  it("ne contient que le provider démo", () => {
    expect(getProviderChain()).toEqual([demoProvider]);
  });

  it("génère un plan de bout en bout via la chaîne par défaut", async () => {
    const plan = await generateLearningPlan({
      skill: "Python",
      level: "beginner",
      goal: "Build Python applications",
      dailyTime: 60,
      duration: 30,
    });
    expect(plan.modules).toHaveLength(3);
  });
});