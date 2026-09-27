import { describe, it, expect } from "vitest";
import type {
  PlanInput,
  LessonInput,
  ExerciseInput,
  EvaluationInput,
  AdaptationInput,
} from "@/types";
import * as planPrompt from "@/prompts/learning-plan";
import * as lessonPrompt from "@/prompts/lesson";
import * as exercisePrompt from "@/prompts/exercise";
import * as evaluationPrompt from "@/prompts/evaluation";
import * as adaptationPrompt from "@/prompts/adaptation";

const plan: PlanInput = {
  skill: "Python",
  level: "beginner",
  goal: "Build Python applications",
  dailyTime: 60,
  duration: 30,
};

const lesson: LessonInput = {
  skill: "Python",
  level: "beginner",
  topic: "List comprehensions",
  goal: "Build Python applications",
  difficulty: 2,
};

const qcm: ExerciseInput = {
  topic: "List comprehensions",
  level: "beginner",
  difficulty: 2,
  kind: "qcm",
};

const code: ExerciseInput = { ...qcm, kind: "code" };

const evaluation: EvaluationInput = {
  question: "What does [x*2 for x in xs] return?",
  kind: "qcm",
  correctAnswer: "A list of doubled values",
  referenceSolution: null,
  learnerAnswer: "A generator",
  level: "beginner",
  topic: "List comprehensions",
};

const adaptation: AdaptationInput = {
  topic: "List comprehensions",
  level: "beginner",
  recentScores: [40, 55],
  previousMistakes: ["== vs is"],
  weaknesses: ["comparison operators"],
  masteryScore: 0.42,
};

describe("prompts : SYSTEM", () => {
  it("learning-plan expose un SYSTEM qui impose du JSON valide", () => {
    expect(planPrompt.SYSTEM).toBeTypeOf("string");
    expect(planPrompt.SYSTEM.length).toBeGreaterThan(0);
    expect(planPrompt.SYSTEM).toMatch(/json/i);
  });

  it("les quatre autres modules reexportent le meme SYSTEM que learning-plan", () => {
    expect(lessonPrompt.SYSTEM).toBe(planPrompt.SYSTEM);
    expect(exercisePrompt.SYSTEM).toBe(planPrompt.SYSTEM);
    expect(evaluationPrompt.SYSTEM).toBe(planPrompt.SYSTEM);
    expect(adaptationPrompt.SYSTEM).toBe(planPrompt.SYSTEM);
  });
});

describe("prompts : buildUser impose la sortie JSON seule", () => {
  const cases: [string, string][] = [
    ["learning-plan", planPrompt.buildUser(plan)],
    ["lesson", lessonPrompt.buildUser(lesson)],
    ["exercise qcm", exercisePrompt.buildUser(qcm)],
    ["exercise code", exercisePrompt.buildUser(code)],
    ["evaluation", evaluationPrompt.buildUser(evaluation)],
    ["adaptation", adaptationPrompt.buildUser(adaptation)],
  ];

  it.each(cases)("%s interdit explicitement toute sortie hors JSON", (_name, out) => {
    expect(out).toMatch(/JSON object only/);
    expect(out).toMatch(/no markdown fence/);
  });

  it.each(cases)("%s renvoie une chaine non vide", (_name, out) => {
    expect(out).toBeTypeOf("string");
    expect(out.trim().length).toBeGreaterThan(0);
  });
});

describe("prompts/learning-plan", () => {
  const out = planPrompt.buildUser(plan);

  it("reprend les cinq champs du brief", () => {
    expect(out).toContain("Skill: Python");
    expect(out).toContain("Level: beginner");
    expect(out).toContain("Goal: Build Python applications");
    expect(out).toContain("Minutes available per day: 60");
    expect(out).toContain("Days: 30");
  });

  it("annonce la forme JSON attendue avec modules", () => {
    expect(out).toContain('"modules"');
    expect(out).toContain('"difficulty"');
  });

  it("contient les regles de bornes", () => {
    expect(out).toContain("3 to 5 modules");
    expect(out).toContain("integer from 1 to 5");
  });
});

describe("prompts/lesson", () => {
  const out = lessonPrompt.buildUser(lesson);

  it("reprend skill, level, topic, goal et difficulty", () => {
    expect(out).toContain("Skill: Python");
    expect(out).toContain("Level: beginner");
    expect(out).toContain("Topic: List comprehensions");
    expect(out).toContain("Goal: Build Python applications");
    expect(out).toContain("Difficulty: 2");
  });

  it("demande la forme Lesson et borne explanation et keyPoints", () => {
    expect(out).toContain('"explanation"');
    expect(out).toContain('"keyPoints"');
    expect(out).toContain("under 150 words");
    expect(out).toContain("3 to 5 short strings");
  });
});

describe("prompts/exercise", () => {
  it("kind qcm : utilise la forme QCM et la regle sur correctAnswer", () => {
    const out = exercisePrompt.buildUser(qcm);
    expect(out).toContain('"options"');
    expect(out).toContain('"correctAnswer"');
    expect(out).not.toContain('"starterCode"');
    expect(out).toContain("options must contain 4 strings");
    expect(out).toContain("equals correctAnswer");
  });

  it("kind code : utilise la forme CODE et la regle starterCode/referenceSolution", () => {
    const out = exercisePrompt.buildUser(code);
    expect(out).toContain('"starterCode"');
    expect(out).toContain('"referenceSolution"');
    expect(out).not.toContain('"correctAnswer"');
    expect(out).toContain("starterCode is the code the learner starts from");
    expect(out).toContain("referenceSolution is a working answer");
  });

  it("reprend topic, level et difficulty pour les deux formes", () => {
    for (const out of [exercisePrompt.buildUser(qcm), exercisePrompt.buildUser(code)]) {
      expect(out).toContain("Topic: List comprehensions");
      expect(out).toContain("Level: beginner");
      expect(out).toContain("Difficulty: 2");
    }
  });
});

describe("prompts/evaluation", () => {
  it("reprend topic, level, question et reponse du learner", () => {
    const out = evaluationPrompt.buildUser(evaluation);
    expect(out).toContain("Topic: List comprehensions");
    expect(out).toContain("Learner level: beginner");
    expect(out).toContain("Question: What does [x*2 for x in xs] return?");
    expect(out).toContain("Learner answer:");
    expect(out).toContain("A generator");
  });

  it("kind qcm : affiche correctAnswer et pas de solution de reference", () => {
    const out = evaluationPrompt.buildUser(evaluation);
    expect(out).toContain("Correct answer: A list of doubled values");
    expect(out).not.toContain("Reference solution");
  });

  it("kind code : affiche la solution de reference a la place", () => {
    const out = evaluationPrompt.buildUser({
      ...evaluation,
      kind: "code",
      correctAnswer: null,
      referenceSolution: "xs = [1, 2]\n[x * 2 for x in xs]",
    });
    expect(out).toContain("Reference solution:");
    expect(out).toContain("xs = [1, 2]");
    expect(out).not.toContain("Correct answer:");
  });

  it("documente les bornes de score et la longueur de weakness", () => {
    const out = evaluationPrompt.buildUser(evaluation);
    expect(out).toContain('"score"');
    expect(out).toContain("integer from 0 to 100");
    expect(out).toContain("at most 6 words");
    expect(out).toContain("never the full answer");
    expect(out).toContain("empty strings when correct is true");
  });

  it("degrade proprement quand la reponse de reference est absente", () => {
    const out = evaluationPrompt.buildUser({
      ...evaluation,
      correctAnswer: null,
      referenceSolution: null,
    });
    expect(out).toContain("Correct answer: unknown");
  });
});

describe("prompts/adaptation", () => {
  it("reprend topic, level et masteryScore", () => {
    const out = adaptationPrompt.buildUser(adaptation);
    expect(out).toContain("Current topic: List comprehensions");
    expect(out).toContain("Learner level: beginner");
    expect(out).toContain("Mastery score: 0.42");
  });

  it("serialise les trois tableaux", () => {
    const out = adaptationPrompt.buildUser(adaptation);
    expect(out).toContain("Recent scores: 40, 55");
    expect(out).toContain("Previous mistakes: == vs is");
    expect(out).toContain("Known weaknesses: comparison operators");
  });

  it("retombe sur none quand un tableau est vide", () => {
    const out = adaptationPrompt.buildUser({
      ...adaptation,
      recentScores: [],
      previousMistakes: [],
      weaknesses: [],
    });
    expect(out).toContain("Recent scores: none");
    expect(out).toContain("Previous mistakes: none");
    expect(out).toContain("Known weaknesses: none");
  });

  it("borne action et difficulty, et exige une consigne imperative", () => {
    const out = adaptationPrompt.buildUser(adaptation);
    expect(out).toContain("remediation, same_level, increase_difficulty, next_topic");
    expect(out).toContain("integer from 1 to 5");
    expect(out).toContain("nextActivity is a short imperative sentence");
    expect(out).toContain('"nextActivity"');
  });
});
