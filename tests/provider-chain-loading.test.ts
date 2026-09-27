import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getProviderChain } from "@/lib/ai";
import { nvidiaProvider } from "@/lib/ai/nvidia";
import { geminiProvider } from "@/lib/ai/gemini";

// Ce fichier est le substitut testable de la Step 9 du plan, qui exigeait de
// lancer `npm run dev` et de suivre le parcours complet jusqu'à la correction.
// Le parcours n'existe pas encore (Tasks 11 a 15), donc cette vérification
// réelle reste à faire. Ce que l'on garde ici, c'est le maillon qui casse en
// premier : `lib/ai/index.ts` charge le provider distant par `require()` d'un
// nom de module construit dynamiquement, que le bundling ESM de Next pourrait
// ne pas supporter. Si ce chargement casse, la chaine retombe silencieusement
// sur le mode demo et plus personne ne s'en aperçoit avant la production.
describe("getProviderChain : chargement dynamique des providers distants", () => {
  beforeEach(() => {
    vi.stubEnv("AI_PROVIDER", "");
    vi.stubEnv("NVIDIA_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("n'est compose que du provider demo quand rien n'est configure", () => {
    const chain = getProviderChain();
    expect(chain).toHaveLength(1);
    expect(chain[0].name).toBe("demo");
  });

  it("charge nvidiaProvider quand AI_PROVIDER=nvidia et la cle est presente", () => {
    vi.stubEnv("AI_PROVIDER", "nvidia");
    vi.stubEnv("NVIDIA_API_KEY", "test-key-not-real");

    const chain = getProviderChain();
    expect(chain).toHaveLength(2);
    expect(chain[0].name).toBe("nvidia");
    expect(chain[0]).toBe(nvidiaProvider);
  });

  it("charge geminiProvider quand AI_PROVIDER=gemini et la cle est presente", () => {
    vi.stubEnv("AI_PROVIDER", "gemini");
    vi.stubEnv("GEMINI_API_KEY", "test-key-not-real");

    const chain = getProviderChain();
    expect(chain).toHaveLength(2);
    expect(chain[0].name).toBe("gemini");
    expect(chain[0]).toBe(geminiProvider);
  });

  it("laisse le demo seul si le provider demande n'a pas de cle", () => {
    vi.stubEnv("AI_PROVIDER", "nvidia");
    vi.stubEnv("NVIDIA_API_KEY", "");

    const chain = getProviderChain();
    expect(chain).toHaveLength(1);
    expect(chain[0].name).toBe("demo");
  });

  it("accepte un AI_PROVIDER en majuscules ou entoure d'espaces", () => {
    vi.stubEnv("AI_PROVIDER", "  NVIDIA  ");
    vi.stubEnv("NVIDIA_API_KEY", "test-key-not-real");

    expect(getProviderChain()[0].name).toBe("nvidia");
  });

  it("retombe sur le demo pour un AI_PROVIDER inconnu", () => {
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.stubEnv("NVIDIA_API_KEY", "test-key-not-real");

    const chain = getProviderChain();
    expect(chain).toHaveLength(1);
    expect(chain[0].name).toBe("demo");
  });

  it("garde le provider distant en premier et le demo en repli", () => {
    vi.stubEnv("AI_PROVIDER", "nvidia");
    vi.stubEnv("NVIDIA_API_KEY", "test-key-not-real");

    const chain = getProviderChain();
    expect(chain.map((p) => p.name)).toEqual(["nvidia", "demo"]);
  });
});
