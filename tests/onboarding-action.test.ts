import { describe, it, expect, beforeEach, vi } from "vitest";

const h = vi.hoisted(() => ({
  redirect: vi.fn(),
  getCurrentUser: vi.fn(),
  createLearningPath: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: h.redirect }));
vi.mock("@/lib/supabase/server", () => ({ getCurrentUser: h.getCurrentUser }));
vi.mock("@/services/learning-plan", () => ({ createLearningPath: h.createLearningPath }));

import { submitOnboarding } from "@/app/onboarding/actions";

const FRIENDLY_ERROR =
  "We couldn't generate your learning path right now. Please try again.";

function form(overrides: Record<string, string> = {}): FormData {
  const base: Record<string, string> = {
    skill: "Python",
    level: "beginner",
    goal: "Build Python applications",
    dailyTime: "60",
    duration: "30",
  };
  const fd = new FormData();
  for (const [key, value] of Object.entries({ ...base, ...overrides })) {
    if (value !== "") fd.set(key, value);
  }
  return fd;
}

async function run(fd: FormData): Promise<{ error: string | null }> {
  return submitOnboarding({ error: null }, fd);
}

async function redirectTarget(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    const match = /^NEXT_REDIRECT:(.+)$/.exec((error as Error).message);
    if (match) return match[1];
    throw error;
  }
  throw new Error("la promesse aurait du rediriger");
}

beforeEach(() => {
  // `redirect` de Next leve une erreur speciale pour interrompre le rendu ;
  // sans cela l'action continuerait d'executer apres une redirection.
  h.redirect.mockImplementation((to: string) => {
    throw new Error(`NEXT_REDIRECT:${to}`);
  });
  h.getCurrentUser.mockReset();
  h.createLearningPath.mockReset();
  h.getCurrentUser.mockResolvedValue({ userId: "user-1" });
  h.createLearningPath.mockResolvedValue({});
});

describe("submitOnboarding : garde d'authentification", () => {
  it("redirige vers /login quand aucun utilisateur n'est connecte", async () => {
    h.getCurrentUser.mockResolvedValue(null);
    expect(await redirectTarget(run(form()))).toBe("/login");
    expect(h.createLearningPath).not.toHaveBeenCalled();
  });

  it("ne tente aucune creation de chemin pour un visiteur non connecte", async () => {
    h.getCurrentUser.mockResolvedValue(null);
    await run(form()).catch(() => undefined);
    expect(h.createLearningPath).not.toHaveBeenCalled();
  });
});

describe("submitOnboarding : entree valide", () => {
  it("redirige vers /dashboard apres avoir cree le chemin", async () => {
    expect(await redirectTarget(run(form()))).toBe("/dashboard");
  });

  it("passe le userId et l'entree validee et non pas le FormData brut", async () => {
    await run(form()).catch(() => undefined);
    expect(h.createLearningPath).toHaveBeenCalledTimes(1);
    expect(h.createLearningPath).toHaveBeenCalledWith("user-1", {
      skill: "Python",
      level: "beginner",
      goal: "Build Python applications",
      dailyTime: 60,
      duration: 30,
    });
  });

  it("convertit les champs numeriques en nombres, pas en chaines", async () => {
    await run(form({ dailyTime: "120", duration: "45" })).catch(() => undefined);
    const [, input] = h.createLearningPath.mock.calls[0] as [string, Record<string, unknown>];
    expect(input.dailyTime).toBe(120);
    expect(input.duration).toBe(45);
    expect(typeof input.dailyTime).toBe("number");
  });

  it("rogne les espaces autour du skill et du goal", async () => {
    await run(form({ skill: "  Python  ", goal: "  Build apps  " })).catch(() => undefined);
    const [, input] = h.createLearningPath.mock.calls[0] as [string, Record<string, unknown>];
    expect(input.skill).toBe("Python");
    expect(input.goal).toBe("Build apps");
  });

  it("accepte chacun des trois niveaux", async () => {
    for (const level of ["beginner", "intermediate", "advanced"]) {
      h.createLearningPath.mockClear();
      await run(form({ level })).catch(() => undefined);
      const [, input] = h.createLearningPath.mock.calls[0] as [string, Record<string, unknown>];
      expect(input.level).toBe(level);
    }
  });
});

describe("submitOnboarding : entree refusee", () => {
  it("refuse un skill vide", async () => {
    const state = await run(form({ skill: "" }));
    expect(state.error).toBe("Skill is required.");
    expect(h.createLearningPath).not.toHaveBeenCalled();
  });

  it("refuse un goal vide", async () => {
    const state = await run(form({ goal: "" }));
    expect(state.error).toBe("Goal is required.");
    expect(h.createLearningPath).not.toHaveBeenCalled();
  });

  it("refuse un niveau inconnu", async () => {
    const state = await run(form({ level: "expert" }));
    expect(state.error).toBe("Invalid level.");
    expect(h.createLearningPath).not.toHaveBeenCalled();
  });

  it("refuse un dailyTime absent, qui devient 0", async () => {
    const state = await run(form({ dailyTime: "" }));
    expect(state.error).toBe("Invalid daily time.");
    expect(h.createLearningPath).not.toHaveBeenCalled();
  });

  it("refuse un dailyTime hors bornes", async () => {
    expect((await run(form({ dailyTime: "5" }))).error).toBe("Invalid daily time.");
    expect((await run(form({ dailyTime: "300" }))).error).toBe("Invalid daily time.");
  });

  it("refuse un duration hors bornes", async () => {
    expect((await run(form({ duration: "0" }))).error).toBe("Invalid duration.");
    expect((await run(form({ duration: "400" }))).error).toBe("Invalid duration.");
  });

  it("ne redirige pas quand la validation echoue", async () => {
    await run(form({ skill: "" }));
    expect(h.redirect).not.toHaveBeenCalled();
  });

  it("accepte les bornes exactes des curseurs", async () => {
    for (const [dailyTime, duration] of [
      ["15", "1"],
      ["240", "90"],
    ]) {
      h.createLearningPath.mockClear();
      await run(form({ dailyTime, duration })).catch(() => undefined);
      expect(h.createLearningPath).toHaveBeenCalledTimes(1);
    }
  });
});

describe("submitOnboarding : panne de la creation du chemin", () => {
  it("retourne un message utilisable et ne redirige pas", async () => {
    h.createLearningPath.mockRejectedValue(new Error("supabase exploded"));
    const state = await run(form());
    expect(state.error).toBe(FRIENDLY_ERROR);
    expect(h.redirect).not.toHaveBeenCalled();
  });

  it("ne divulgue pas le detail de l'erreur serveur au client", async () => {
    h.createLearningPath.mockRejectedValue(
      new Error("POST https://xxx.supabase.co failed: invalid API key")
    );
    const state = await run(form());
    expect(state.error).not.toContain("supabase");
    expect(state.error).not.toContain("API key");
    expect(state.error).not.toContain("http");
  });
});
