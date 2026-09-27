"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { validateOnboardingInput } from "@/lib/validation/onboarding";
// Note: createLearningPath will fail if Task 8 is not yet merged, but we write it according to plan
import { createLearningPath } from "@/services/learning-plan";

export type OnboardingState = { error: string | null };

export async function submitOnboarding(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const validation = validateOnboardingInput({
    skill: formData.get("skill"),
    level: formData.get("level"),
    goal: formData.get("goal"),
    dailyTime: Number(formData.get("dailyTime")),
    duration: Number(formData.get("duration")),
  });

  if (!validation.ok) return { error: validation.error };

  try {
    // If services/learning-plan.ts doesn't exist yet (blocked by Task 4/8), this will throw a build error or runtime error.
    // For now, we implement it as planned.
    await createLearningPath(user.userId, validation.value);
  } catch (error) {
    console.error("onboarding failed", error);
    return {
      error: "We couldn't generate your learning path right now. Please try again.",
    };
  }

  redirect("/dashboard");
}
