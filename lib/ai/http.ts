export const DEFAULT_TIMEOUT_MS = 15_000;

export class AIError extends Error {
  readonly code: string;

  constructor(message: string, code = "AI_ERROR") {
    super(message);
    this.name = "AIError";
    this.code = code;
  }
}

export async function fetchJson(
  url: string,
  body: unknown,
  apiKey: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new AIError(`HTTP ${response.status} from provider`, "HTTP_ERROR");
    }

    return await response.json();
  } catch (error) {
    if (error instanceof AIError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new AIError("Provider timeout", "TIMEOUT");
    }
    throw new AIError("Network error", "NETWORK_ERROR");
  } finally {
    clearTimeout(timer);
  }
}