import { describe, it, expect } from "vitest";
import { validateOnboardingInput } from "@/lib/validation/onboarding";

const valid = {
  skill: "Python",
  level: "beginner",
  goal: "Build Python applications",
  dailyTime: 60,
  duration: 30,
};

describe("validateOnboardingInput", () => {
  it("accepte une entrée valide", () => {
    expect(validateOnboardingInput(valid).ok).toBe(true);
  });

  it("rejette un niveau hors liste fermée", () => {
    expect(validateOnboardingInput({ ...valid, level: "expert" }).ok).toBe(false);
  });

  it("rejette un dailyTime hors bornes", () => {
    expect(validateOnboardingInput({ ...valid, dailyTime: 5 }).ok).toBe(false);
    expect(validateOnboardingInput({ ...valid, dailyTime: 500 }).ok).toBe(false);
  });

  it("rejette un duration hors bornes", () => {
    expect(validateOnboardingInput({ ...valid, duration: 0 }).ok).toBe(false);
    expect(validateOnboardingInput({ ...valid, duration: 400 }).ok).toBe(false);
  });

  it("rejette un skill vide ou trop long", () => {
    expect(validateOnboardingInput({ ...valid, skill: "" }).ok).toBe(false);
    expect(validateOnboardingInput({ ...valid, skill: "a".repeat(101) }).ok).toBe(false);
  });

  it("rejette une goal vide", () => {
    expect(validateOnboardingInput({ ...valid, goal: "   " }).ok).toBe(false);
  });

  it("rejette un objet non conforme", () => {
    expect(validateOnboardingInput(null).ok).toBe(false);
    expect(validateOnboardingInput("python").ok).toBe(false);
  });
});