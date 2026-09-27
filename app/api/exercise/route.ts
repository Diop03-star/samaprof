import { NextResponse } from "next/server";
import { createServerClient, getCurrentUser } from "@/lib/supabase/server";
import { generateExercise } from "@/lib/ai";
import type { ExerciseRow } from "@/types";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const lessonId = url.searchParams.get("lessonId") ?? "";
  const topic = url.searchParams.get("topic");
  const kindParam = url.searchParams.get("kind");
  const kind = kindParam === "qcm" || kindParam === "code" ? kindParam : undefined;
  const difficultyParam = url.searchParams.get("difficulty");
  const difficulty = difficultyParam ? Number(difficultyParam) : undefined;
  const regenerate = url.searchParams.get("regenerate") === "1";

  if (!lessonId) {
    return NextResponse.json({ error: "lessonId is required" }, { status: 400 });
  }

  const supabase = await createServerClient();

  try {
    if (regenerate && topic) {
      const generated = await generateExercise({
        topic,
        level: "beginner",
        difficulty: difficulty ?? 1,
        kind: kind ?? "code",
      });

      const { data, error } = await supabase
        .from("exercises")
        .insert({
          lesson_id: lessonId,
          kind: generated.kind,
          topic: generated.topic,
          question: generated.question,
          options: generated.options,
          correct_answer: generated.correctAnswer,
          explanation: generated.explanation,
          difficulty: generated.difficulty,
          starter_code: generated.starterCode,
          reference_solution: generated.referenceSolution,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);

      return NextResponse.json({ exercise: sanitize(data as ExerciseRow) });
    }

    let query = supabase.from("exercises").select("*").eq("lesson_id", lessonId);
    if (topic) query = query.eq("topic", topic);
    if (kind) query = query.eq("kind", kind);
    if (difficulty !== undefined) query = query.eq("difficulty", difficulty);

    const { data, error } = await query.order("difficulty").limit(1).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) {
      return NextResponse.json({ error: "No exercise available." }, { status: 404 });
    }

    return NextResponse.json({ exercise: sanitize(data as ExerciseRow) });
  } catch (error) {
    console.error("exercise failed", error);
    return NextResponse.json(
      { error: "We couldn't load the exercise right now. Please try again." },
      { status: 500 }
    );
  }
}

function sanitize(exercise: ExerciseRow) {
  const { correct_answer: _a, reference_solution: _b, ...rest } = exercise;
  return rest;
}