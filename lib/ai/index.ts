import type {
  AIProvider,
  Adaptation,
  AdaptationInput,
  Evaluation,
  EvaluationInput,
  Exercise,
  ExerciseInput,
  LearningPlan,
  Lesson,
  LessonInput,
  PlanInput,
} from "@/types";
import { demoProvider } from "./demo";
import { nvidiaProvider } from "./nvidia";
import { geminiProvider } from "./gemini";
import { AIError } from "./http";
import {
  parseAdaptation,
  parseEvaluation,
  parseExercise,
  parseLearningPlan,
  parseLesson,
} from "./validate";

type ProviderName = "nvidia" | "gemini" | "demo";

function envProviderName(): ProviderName {
  const raw = process.env.AI_PROVIDER?.toLowerCase().trim();
  if (raw === "nvidia" || raw === "gemini" || raw === "demo") return raw;
  return "demo";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isProvider(value: unknown): value is AIProvider {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    typeof value.generateLearningPlan === "function"
  );
}

// Les deux modules distants sont importes statiquement. Une resolution
// dynamique par `require` echouait silencieusement : le `catch` transformait
// l'erreur de resolution en simple downgrade vers le mode demo, donc un
// provider mort ne se voyait nulle part. La Task 9 livre ces deux fichiers,
// l'import statique est donc resolvable par `tsc` et par le bundler.
function loadRemoteProvider(name: "nvidia" | "gemini"): AIProvider | null {
  const remote: Record<"nvidia" | "gemini", unknown> = {
    nvidia: nvidiaProvider,
    gemini: geminiProvider,
  };
  const exported = remote[name];
  return isProvider(exported) ? exported : null;
}

function remoteProviders(): AIProvider[] {
  const chain: AIProvider[] = [];

  if (envProviderName() === "nvidia" && process.env.NVIDIA_API_KEY) {
    const provider = loadRemoteProvider("nvidia");
    if (provider) chain.push(provider);
  }

  if (envProviderName() === "gemini" && process.env.GEMINI_API_KEY) {
    const provider = loadRemoteProvider("gemini");
    if (provider) chain.push(provider);
  }

  return chain;
}

export function getProviderChain(): AIProvider[] {
  return [...remoteProviders(), demoProvider];
}

export async function runWithFallback<T>(
  run: (provider: AIProvider) => Promise<T>,
  parse: (raw: unknown) => T | null,
  chain: AIProvider[] = getProviderChain()
): Promise<T> {
  let lastError = "no provider available";

  for (const provider of chain) {
    try {
      const parsed = parse(await run(provider));
      if (parsed !== null) return parsed;
      lastError = `invalid response from ${provider.name}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  throw new AIError(`All AI providers failed: ${lastError}`, "ALL_PROVIDERS_FAILED");
}

export function generateLearningPlan(input: PlanInput): Promise<LearningPlan> {
  return runWithFallback((p) => p.generateLearningPlan(input), parseLearningPlan);
}

export function generateLesson(input: LessonInput): Promise<Lesson> {
  return runWithFallback((p) => p.generateLesson(input), parseLesson);
}

export function generateExercise(input: ExerciseInput): Promise<Exercise> {
  return runWithFallback((p) => p.generateExercise(input), parseExercise);
}

export function evaluateAnswer(input: EvaluationInput): Promise<Evaluation> {
  return runWithFallback((p) => p.evaluateAnswer(input), parseEvaluation);
}

export function suggestAdaptation(input: AdaptationInput): Promise<Adaptation> {
  return runWithFallback((p) => p.suggestAdaptation(input), parseAdaptation);
}

export { AIError } from "./http";
export { demoProvider } from "./demo";