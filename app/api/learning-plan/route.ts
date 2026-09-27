import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { validateOnboardingInput } from "@/lib/validation/onboarding";
import { createLearningPath } from "@/services/learning-plan";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validation = validateOnboardingInput(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const plan = await createLearningPath(user.userId, validation.value);
    return NextResponse.json(plan);
  } catch (error) {
    console.error("learning-plan failed", error);
    return NextResponse.json(
      { error: "We couldn't generate your learning path right now. Please try again." },
      { status: 500 }
    );
  }
}