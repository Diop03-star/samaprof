import type {
  AIProvider,
  LearningPlan,
  Lesson,
  Exercise,
  Evaluation,
  Adaptation,
} from "@/types";
import { fetchJson } from "./http";
import * as planPrompt from "@/prompts/learning-plan";
import * as lessonPrompt from "@/prompts/lesson";
import * as exercisePrompt from "@/prompts/exercise";
import * as evaluationPrompt from "@/prompts/evaluation";
import * as adaptationPrompt from "@/prompts/adaptation";

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// L'API Gemini authentifie par paramètre de requête, pas par en-tête Bearer.
// On passe donc un placeholder à `fetchJson` et la vraie clé voyage dans l'URL.
async function call<T>(system: string, user: string): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const response = await fetchJson(
    `${BASE_URL}/${encodeURIComponent(model())}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { temperature: 0.3, responseMimeType: "application/json" },
    },
    "unused"
  );

  const text = (
    response as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
  )?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini");

  return JSON.parse(text) as T;
}

function model(): string {
  return process.env.GEMINI_MODEL || "gemini-2.0-flash";
}

export const geminiProvider: AIProvider = {
  name: "gemini",
  generateLearningPlan: (input) =>
    call<LearningPlan>(planPrompt.SYSTEM, planPrompt.buildUser(input)),
  generateLesson: (input) =>
    call<Lesson>(lessonPrompt.SYSTEM, lessonPrompt.buildUser(input)),
  generateExercise: (input) =>
    call<Exercise>(exercisePrompt.SYSTEM, exercisePrompt.buildUser(input)),
  evaluateAnswer: (input) =>
    call<Evaluation>(evaluationPrompt.SYSTEM, evaluationPrompt.buildUser(input)),
  suggestAdaptation: (input) =>
    call<Adaptation>(adaptationPrompt.SYSTEM, adaptationPrompt.buildUser(input)),
};
