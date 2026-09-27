import { describe, it, expect } from "vitest";
import { computeMasteryScore, decide } from "@/lib/adaptation/rules";

const a = (score: number, topic = "if/else conditions") => ({
  score,
  isCorrect: score >= 60,
  topic,
});

describe("computeMasteryScore", () => {
  it("retourne 0 sans attempt", () => {
    expect(computeMasteryScore([])).toBe(0);
  });

  it("moyenne les 5 plus récents seulement", () => {
    expect(computeMasteryScore([a(0), a(0), a(100), a(100), a(100), a(100), a(100)])).toBe(60);
  });

  it("moyenne les attempts existants si moins de 5", () => {
    expect(computeMasteryScore([a(80), a(60)])).toBe(70);
  });

  it("arrondit à l'entier", () => {
    expect(computeMasteryScore([a(33), a(34), a(50)])).toBe(39);
  });
});

describe("decide — les seuils sont l'autorité", () => {
  it("mastery 39 => remediation", () => {
    const decision = decide({
      attempts: [a(39)],
      aiSuggestion: null,
      currentTopic: "if/else conditions",
      currentDifficulty: 2,
    });
    expect(decision.action).toBe("remediation");
  });

  it("mastery 40 => same_level", () => {
    const decision = decide({
      attempts: [a(40)],
      aiSuggestion: null,
      currentTopic: "if/else conditions",
      currentDifficulty: 2,
    });
    expect(decision.action).toBe("same_level");
  });

  it("mastery 74 => same_level", () => {
    const decision = decide({
      attempts: [a(74)],
      aiSuggestion: null,
      currentTopic: "if/else conditions",
      currentDifficulty: 2,
    });
    expect(decision.action).toBe("same_level");
  });

  it("mastery 75 => increase_difficulty", () => {
    const decision = decide({
      attempts: [a(75)],
      aiSuggestion: null,
      currentTopic: "if/else conditions",
      currentDifficulty: 2,
    });
    expect(decision.action).toBe("increase_difficulty");
  });
});

describe("decide — l'IA ne peut pas voter contre les règles", () => {
  it("IA propose next_topic mais mastery 30 => remediation sur le topic courant", () => {
    const decision = decide({
      attempts: [a(30)],
      aiSuggestion: {
        action: "next_topic",
        topic: "loops",
        difficulty: 2,
        reason: "Learner looks ready",
        nextActivity: "Move to loops",
      },
      currentTopic: "if/else conditions",
      currentDifficulty: 2,
    });
    expect(decision.action).toBe("remediation");
    expect(decision.topic).toBe("if/else conditions");
  });

  it("IA propose remediation mais mastery 90 => increase_difficulty", () => {
    const decision = decide({
      attempts: [a(90)],
      aiSuggestion: {
        action: "remediation",
        topic: "if/else conditions",
        difficulty: 1,
        reason: "Looks shaky",
        nextActivity: "Practice basics again",
      },
      currentTopic: "if/else conditions",
      currentDifficulty: 2,
    });
    expect(decision.action).toBe("increase_difficulty");
  });

  it("IA fournit le texte du conseil, la source reste rules", () => {
    const decision = decide({
      attempts: [a(30)],
      aiSuggestion: {
        action: "next_topic",
        topic: "loops",
        difficulty: 3,
        reason: "Repeated errors detected",
        nextActivity: "Practice: Basic if/else conditions",
      },
      currentTopic: "if/else conditions",
      currentDifficulty: 2,
    });
    expect(decision.nextActivity).toBe("Practice: Basic if/else conditions");
    expect(decision.reason).toBe("Repeated errors detected");
    expect(decision.source).toBe("rules");
    expect(decision.masteryScore).toBe(30);
  });
});

describe("decide — échecs consécutifs sur le même topic", () => {
  it("2 échecs consécutifs sur le même topic => retour au prérequis", () => {
    const decision = decide({
      attempts: [a(90, "loops"), a(20, "loops"), a(20, "loops")],
      aiSuggestion: null,
      currentTopic: "loops",
      currentDifficulty: 3,
    });
    expect(decision.action).toBe("remediation");
    expect(decision.difficulty).toBe(2);
  });

  it("2 échecs sur des topics différents n'abaissent pas la difficulté", () => {
    const decision = decide({
      attempts: [a(20, "loops"), a(20, "functions")],
      aiSuggestion: null,
      currentTopic: "functions",
      currentDifficulty: 3,
    });
    expect(decision.action).toBe("remediation");
    expect(decision.difficulty).toBe(2);
  });
});

describe("decide — cas limites", () => {
  it("sans attempt => next_topic, difficulté conservée", () => {
    const decision = decide({
      attempts: [],
      aiSuggestion: null,
      currentTopic: "Variables",
      currentDifficulty: 1,
    });
    expect(decision.action).toBe("next_topic");
    expect(decision.difficulty).toBe(1);
  });

  it("remediation ne descend jamais sous difficulté 1", () => {
    const decision = decide({
      attempts: [a(10)],
      aiSuggestion: null,
      currentTopic: "if/else conditions",
      currentDifficulty: 1,
    });
    expect(decision.difficulty).toBe(1);
  });

  it("increase_difficulty ne monte jamais au-dessus de 5", () => {
    const decision = decide({
      attempts: [a(95)],
      aiSuggestion: null,
      currentTopic: "loops",
      currentDifficulty: 5,
    });
    expect(decision.action).toBe("increase_difficulty");
    expect(decision.difficulty).toBe(5);
  });
});

describe("decide — l'IA ne choisit le topic que pour next_topic", () => {
  const suggestion = {
    action: "next_topic" as const,
    topic: "loops",
    difficulty: 3,
    reason: "Repeated errors detected",
    nextActivity: "Practice: Basic if/else conditions",
  };

  it("next_topic => le topic nommé par l'IA est retenu", () => {
    const decision = decide({
      attempts: [],
      aiSuggestion: suggestion,
      currentTopic: "if/else conditions",
      currentDifficulty: 2,
    });
    expect(decision.action).toBe("next_topic");
    expect(decision.topic).toBe("loops");
  });

  it("next_topic sans suggestion => le topic courant est conservé", () => {
    const decision = decide({
      attempts: [],
      aiSuggestion: null,
      currentTopic: "if/else conditions",
      currentDifficulty: 2,
    });
    expect(decision.action).toBe("next_topic");
    expect(decision.topic).toBe("if/else conditions");
  });

  it("increase_difficulty => l'IA ne peut pas déplacer le learner", () => {
    const decision = decide({
      attempts: [a(95)],
      aiSuggestion: suggestion,
      currentTopic: "if/else conditions",
      currentDifficulty: 2,
    });
    expect(decision.action).toBe("increase_difficulty");
    expect(decision.topic).toBe("if/else conditions");
  });

  it("same_level => l'IA ne peut pas déplacer le learner", () => {
    const decision = decide({
      attempts: [a(60)],
      aiSuggestion: suggestion,
      currentTopic: "if/else conditions",
      currentDifficulty: 2,
    });
    expect(decision.action).toBe("same_level");
    expect(decision.topic).toBe("if/else conditions");
  });

  it("remediation => l'IA ne peut pas déplacer le learner", () => {
    const decision = decide({
      attempts: [a(20)],
      aiSuggestion: suggestion,
      currentTopic: "if/else conditions",
      currentDifficulty: 2,
    });
    expect(decision.action).toBe("remediation");
    expect(decision.topic).toBe("if/else conditions");
  });

  it("la suggestion ne change ni la raison ni l'activité en next_topic", () => {
    const decision = decide({
      attempts: [],
      aiSuggestion: suggestion,
      currentTopic: "if/else conditions",
      currentDifficulty: 2,
    });
    expect(decision.reason).toBe("Repeated errors detected");
    expect(decision.nextActivity).toBe("Practice: Basic if/else conditions");
    expect(decision.source).toBe("rules");
  });
});