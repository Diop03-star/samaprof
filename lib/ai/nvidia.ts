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

const BASE_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

// Le JSON décodé n'est pas encore typé : c'est `runWithFallback` qui le fait
// passer par le parseur correspondant avant d'accepter la réponse. On déclare
// donc le type de sortie attendu ici, et une sortie mal formée est rejetée plus
// bas, ce qui bascule sur le provider suivant au lieu de remonter à l'écran.
async function call<T>(system: string, user: string): Promise<T> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error("NVIDIA_API_KEY is not set");

  const response = await fetchJson(
    BASE_URL,
    {
      model: model(),
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    },
    apiKey
  );

  const content = (response as { choices?: { message?: { content?: string } }[] })
    ?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from NVIDIA");

  return JSON.parse(content) as T;
}

function model(): string {
  return process.env.NVIDIA_MODEL || "qwen/qwen2.5-coder-32b-instruct";
}

export const nvidiaProvider: AIProvider = {
  name: "nvidia",
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
