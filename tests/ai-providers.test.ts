import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { PlanInput } from "@/types";
import { nvidiaProvider } from "@/lib/ai/nvidia";
import { geminiProvider } from "@/lib/ai/gemini";
import { AIError } from "@/lib/ai/http";

const plan: PlanInput = {
  skill: "Python",
  level: "beginner",
  goal: "Build Python applications",
  dailyTime: 60,
  duration: 30,
};

const FAKE_KEY = "test-key-not-real";

const NVIDIA_DEFAULT_MODEL = "qwen/qwen2.5-coder-32b-instruct";
const GEMINI_DEFAULT_MODEL = "gemini-2.0-flash";

function okResponse(payload: unknown): Response {
  return { ok: true, status: 200, json: async () => payload } as Response;
}

function httpErrorResponse(status: number): Response {
  return { ok: false, status, json: async () => ({}) } as Response;
}

function nvidiaPayload(content: string): unknown {
  return { choices: [{ message: { content } }] };
}

function geminiPayload(text: string): unknown {
  return { candidates: [{ content: { parts: [{ text }] } }] };
}

let fetchMock: ReturnType<typeof vi.fn>;

function lastCall(): { url: string; init: RequestInit } {
  const call = fetchMock.mock.calls[fetchMock.mock.calls.length - 1] as [string, RequestInit];
  return { url: call[0], init: call[1] };
}

function lastBody(): Record<string, unknown> {
  return JSON.parse(String(lastCall().init.body)) as Record<string, unknown>;
}

function lastUserContent(): string {
  const messages = lastBody().messages as { role: string; content: string }[];
  return messages[1].content;
}

beforeEach(() => {
  vi.stubEnv("NVIDIA_API_KEY", FAKE_KEY);
  vi.stubEnv("GEMINI_API_KEY", FAKE_KEY);
  vi.stubEnv("NVIDIA_MODEL", "");
  vi.stubEnv("GEMINI_MODEL", "");
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("providers : identite", () => {
  it("nvidiaProvider est nomme nvidia", () => {
    expect(nvidiaProvider.name).toBe("nvidia");
  });

  it("geminiProvider est nomme gemini", () => {
    expect(geminiProvider.name).toBe("gemini");
  });

  it("les deux exposent les cinq methodes du contrat", () => {
    for (const provider of [nvidiaProvider, geminiProvider]) {
      for (const method of [
        "generateLearningPlan",
        "generateLesson",
        "generateExercise",
        "evaluateAnswer",
        "suggestAdaptation",
      ]) {
        expect(typeof provider[method as keyof typeof provider]).toBe("function");
      }
    }
  });
});

describe("nvidiaProvider : reponse nominale", () => {
  it("extrait et parse le JSON contenu dans choices[0].message.content", async () => {
    fetchMock.mockResolvedValue(okResponse(nvidiaPayload('{"skill":"Python"}')));
    await expect(nvidiaProvider.generateLearningPlan(plan)).resolves.toEqual({
      skill: "Python",
    });
  });

  it("envoie le SYSTEM puis le buildUser, avec temperature et json_object", async () => {
    fetchMock.mockResolvedValue(okResponse(nvidiaPayload("{}")));
    await nvidiaProvider.generateLearningPlan(plan);

    const { url, init } = lastCall();
    expect(url).toBe("https://integrate.api.nvidia.com/v1/chat/completions");
    expect(init.method).toBe("POST");

    const body = lastBody();
    expect(body.temperature).toBe(0.3);
    expect(body.response_format).toEqual({ type: "json_object" });

    const messages = body.messages as { role: string; content: string }[];
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe("system");
    expect(messages[0].content).toMatch(/valid JSON/i);
    expect(messages[1].role).toBe("user");
    expect(messages[1].content).toContain("Skill: Python");
  });

  it("porte la cle dans l'en-tete Authorization", async () => {
    fetchMock.mockResolvedValue(okResponse(nvidiaPayload("{}")));
    await nvidiaProvider.generateLearningPlan(plan);

    const headers = lastCall().init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Bearer ${FAKE_KEY}`);
  });
});

describe("geminiProvider : reponse nominale", () => {
  it("extrait et parse le JSON contenu dans candidates[0].content.parts[0].text", async () => {
    fetchMock.mockResolvedValue(okResponse(geminiPayload('{"skill":"Python"}')));
    await expect(geminiProvider.generateLearningPlan(plan)).resolves.toEqual({
      skill: "Python",
    });
  });

  it("appelle generateContent avec le modele et la cle en parametre", async () => {
    fetchMock.mockResolvedValue(okResponse(geminiPayload("{}")));
    await geminiProvider.generateLearningPlan(plan);

    const { url } = lastCall();
    expect(url).toBe(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_DEFAULT_MODEL}:generateContent?key=${FAKE_KEY}`
    );
  });

  it("utilise systemInstruction, contents et responseMimeType", async () => {
    fetchMock.mockResolvedValue(okResponse(geminiPayload("{}")));
    await geminiProvider.generateLearningPlan(plan);

    const body = lastBody();
    expect(body.generationConfig).toEqual({
      temperature: 0.3,
      responseMimeType: "application/json",
    });

    const system = body.systemInstruction as { parts: { text: string }[] };
    expect(system.parts[0].text).toMatch(/valid JSON/i);

    const contents = body.contents as { role: string; parts: { text: string }[] }[];
    expect(contents).toHaveLength(1);
    expect(contents[0].role).toBe("user");
    expect(contents[0].parts[0].text).toContain("Skill: Python");
  });
});

describe("providers : selection du modele", () => {
  it("NVIDIA_MODEL est respecte quand il est defini", async () => {
    vi.stubEnv("NVIDIA_MODEL", "meta/llama-3.3-70b-instruct");
    fetchMock.mockResolvedValue(okResponse(nvidiaPayload("{}")));
    await nvidiaProvider.generateLearningPlan(plan);
    expect(lastBody().model).toBe("meta/llama-3.3-70b-instruct");
  });

  it("NVIDIA retombe sur le modele par defaut du plan", async () => {
    vi.stubEnv("NVIDIA_MODEL", "");
    fetchMock.mockResolvedValue(okResponse(nvidiaPayload("{}")));
    await nvidiaProvider.generateLearningPlan(plan);
    expect(lastBody().model).toBe(NVIDIA_DEFAULT_MODEL);
  });

  it("GEMINI_MODEL est respecte quand il est defini", async () => {
    vi.stubEnv("GEMINI_MODEL", "gemini-2.5-flash");
    fetchMock.mockResolvedValue(okResponse(geminiPayload("{}")));
    await geminiProvider.generateLearningPlan(plan);
    expect(lastCall().url).toContain("gemini-2.5-flash:generateContent");
  });

  it("Gemini retombe sur le modele par defaut du plan", async () => {
    vi.stubEnv("GEMINI_MODEL", "");
    fetchMock.mockResolvedValue(okResponse(geminiPayload("{}")));
    await geminiProvider.generateLearningPlan(plan);
    expect(lastCall().url).toContain(`${GEMINI_DEFAULT_MODEL}:generateContent`);
  });
});

describe("providers : pannes et erreurs", () => {
  it("nvidia leve quand la reponse n'a pas de content", async () => {
    fetchMock.mockResolvedValue(okResponse({ choices: [] }));
    await expect(nvidiaProvider.generateLearningPlan(plan)).rejects.toThrow();
  });

  it("gemini leve quand la reponse n'a pas de text", async () => {
    fetchMock.mockResolvedValue(okResponse({ candidates: [] }));
    await expect(geminiProvider.generateLearningPlan(plan)).rejects.toThrow();
  });

  it("nvidia leve quand le content n'est pas du JSON", async () => {
    fetchMock.mockResolvedValue(okResponse(nvidiaPayload("pas du json")));
    await expect(nvidiaProvider.generateLearningPlan(plan)).rejects.toThrow();
  });

  it("gemini leve quand le text n'est pas du JSON", async () => {
    fetchMock.mockResolvedValue(okResponse(geminiPayload("pas du json")));
    await expect(geminiProvider.generateLearningPlan(plan)).rejects.toThrow();
  });

  it("nvidia transforme une erreur HTTP en AIError HTTP_ERROR", async () => {
    fetchMock.mockResolvedValue(httpErrorResponse(401));
    const error = await nvidiaProvider.generateLearningPlan(plan).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AIError);
    expect((error as AIError).code).toBe("HTTP_ERROR");
  });

  it("gemini transforme une erreur HTTP en AIError HTTP_ERROR", async () => {
    fetchMock.mockResolvedValue(httpErrorResponse(403));
    const error = await geminiProvider.generateLearningPlan(plan).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AIError);
    expect((error as AIError).code).toBe("HTTP_ERROR");
  });

  it("nvidia transforme un rejet reseau en AIError NETWORK_ERROR", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    const error = await nvidiaProvider.generateLearningPlan(plan).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AIError);
    expect((error as AIError).code).toBe("NETWORK_ERROR");
  });

  it("gemini transforme un rejet reseau en AIError NETWORK_ERROR", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    const error = await geminiProvider.generateLearningPlan(plan).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AIError);
    expect((error as AIError).code).toBe("NETWORK_ERROR");
  });
});

describe("providers : cle absente", () => {
  it("nvidia refuse d'appeler l'API sans NVIDIA_API_KEY", async () => {
    vi.stubEnv("NVIDIA_API_KEY", "");
    await expect(nvidiaProvider.generateLearningPlan(plan)).rejects.toThrow(
      /NVIDIA_API_KEY/
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("gemini refuse d'appeler l'API sans GEMINI_API_KEY", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    await expect(geminiProvider.generateLearningPlan(plan)).rejects.toThrow(
      /GEMINI_API_KEY/
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("providers : les cinq generations passent par le meme transport", () => {
  it("nvidia utilise le bon prompt pour chaque generation", async () => {
    fetchMock.mockResolvedValue(okResponse(nvidiaPayload("{}")));

    await nvidiaProvider.generateLearningPlan(plan);
    expect(lastUserContent()).toContain("Design a learning plan");

    await nvidiaProvider.generateLesson({
      skill: "Python",
      level: "beginner",
      topic: "Loops",
      goal: "Build Python applications",
      difficulty: 2,
    });
    expect(lastUserContent()).toContain("Write a lesson");

    await nvidiaProvider.generateExercise({
      topic: "Loops",
      level: "beginner",
      difficulty: 2,
      kind: "qcm",
    });
    expect(lastUserContent()).toContain("Write one qcm exercise");

    await nvidiaProvider.evaluateAnswer({
      question: "q",
      kind: "qcm",
      correctAnswer: "a",
      referenceSolution: null,
      learnerAnswer: "a",
      level: "beginner",
      topic: "Loops",
    });
    expect(lastUserContent()).toContain("Evaluate a learner answer");

    await nvidiaProvider.suggestAdaptation({
      topic: "Loops",
      level: "beginner",
      recentScores: [50],
      previousMistakes: [],
      weaknesses: ["loops"],
      masteryScore: 0.5,
    });
    expect(lastUserContent()).toContain("Suggest the next learning activity");
  });
});
