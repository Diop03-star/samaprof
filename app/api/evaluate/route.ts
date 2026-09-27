import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { submitAttempt } from "@/services/evaluation";
import { getAdaptationFor } from "@/services/adaptation";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>).exerciseId !== "string" ||
    typeof (body as Record<string, unknown>).answer !== "string"
  ) {
    return NextResponse.json(
      { error: "exerciseId and answer are required" },
      { status: 400 }
    );
  }

  const { exerciseId, answer } = body as { exerciseId: string; answer: string };

  try {
    const result = await submitAttempt(user.userId, exerciseId, answer);
    return NextResponse.json(result);
  } catch (error) {
    console.error("evaluate failed", error);
    return NextResponse.json(
      { error: "We couldn't analyze your answer right now. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const topic = url.searchParams.get("topic") ?? "";
  const difficulty = Number(url.searchParams.get("difficulty") ?? "1");

  try {
    const decision = await getAdaptationFor(user.userId, topic, difficulty);
    return NextResponse.json({ decision });
  } catch (error) {
    console.error("adapt failed", error);
    return NextResponse.json(
      { error: "We couldn't adapt your path right now. Please try again." },
      { status: 500 }
    );
  }
}