import { describe, it, expect } from "vitest";
import type { AIProvider, PlanInput } from "@/types";
import { runWithFallback, AIError } from "@/lib/ai";

const input: PlanInput = {
  skill: "Python",
  level: "beginner",
  goal: "Build Python applications",
  dailyTime: 60,
  duration: 30,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function acceptOk(raw: unknown): { ok: boolean } | null {
  return isRecord(raw) && raw.ok === true ? { ok: true } : null;
}

function stub(name: string, behaviour: () => Promise<unknown>): AIProvider {
  return {
    name,
    generateLearningPlan: behaviour as never,
    generateLesson: behaviour as never,
    generateExercise: behaviour as never,
    evaluateAnswer: behaviour as never,
    suggestAdaptation: behaviour as never,
  };
}

function runRaw(provider: AIProvider, planInput: PlanInput): Promise<unknown> {
  return provider.generateLearningPlan(planInput);
}

describe("runWithFallback", () => {
  it("renvoie le résultat du premier provider qui réussit", async () => {
    const chain = [stub("p1", async () => ({ ok: true })), stub("p2", async () => ({ ok: false }))];
    const result = await runWithFallback(
      (p) => runRaw(p, input),
      acceptOk,
      chain
    );
    expect(result).toEqual({ ok: true });
  });

  it("bascule si le premier provider lève", async () => {
    const chain = [
      stub("p1", async () => {
        throw new AIError("boom", "NETWORK_ERROR");
      }),
      stub("p2", async () => ({ ok: true })),
    ];
    const result = await runWithFallback(
      (p) => runRaw(p, input),
      acceptOk,
      chain
    );
    expect(result).toEqual({ ok: true });
  });

  it("bascule si la sortie ne passe pas la validation", async () => {
    const chain = [stub("p1", async () => ({ unexpected: true })), stub("p2", async () => ({ ok: true }))];
    const result = await runWithFallback(
      (p) => runRaw(p, input),
      acceptOk,
      chain
    );
    expect(result).toEqual({ ok: true });
  });

  it("lève une AIError si tous les providers échouent", async () => {
    const chain = [
      stub("p1", async () => {
        throw new AIError("boom", "TIMEOUT");
      }),
      stub("p2", async () => ({ invalid: true })),
    ];
    await expect(
      runWithFallback((p) => runRaw(p, input), acceptOk, chain)
    ).rejects.toBeInstanceOf(AIError);
  });

  it("ne tente pas le provider suivant après un succès", async () => {
    let secondCalled = false;
    const chain = [
      stub("p1", async () => ({ ok: true })),
      stub("p2", async () => {
        secondCalled = true;
        return { ok: true };
      }),
    ];
    await runWithFallback((p) => runRaw(p, input), acceptOk, chain);
    expect(secondCalled).toBe(false);
  });
});