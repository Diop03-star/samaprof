import { createServerClient } from "@/lib/supabase/server";
import { generateLesson } from "@/lib/ai";
import type { Level, LessonRow } from "@/types";

export type LessonContent = {
  objective: string;
  explanation: string;
  example: string;
  keyPoints: string[];
};

export async function getLessonsForUser(userId: string): Promise<LessonRow[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("lessons")
    .select("id, path_id, day, title, content, difficulty")
    .order("day");

  if (error) throw new Error(`Failed to load lessons: ${error.message}`);

  // RLS garantit déjà le filtrage ; on ne retourne que les lignes lisibles.
  return (data ?? []) as LessonRow[];
}

export function parseLessonContent(lesson: LessonRow): LessonContent | null {
  if (!lesson.content || lesson.content.length < 10) return null;
  try {
    const parsed = JSON.parse(lesson.content) as Partial<LessonContent>;
    if (
      typeof parsed.objective !== "string" ||
      typeof parsed.explanation !== "string" ||
      typeof parsed.example !== "string" ||
      !Array.isArray(parsed.keyPoints)
    ) {
      return null;
    }
    return {
      objective: parsed.objective,
      explanation: parsed.explanation,
      example: parsed.example,
      keyPoints: parsed.keyPoints,
    };
  } catch {
    return null;
  }
}

export async function ensureLessonContent(
  lesson: LessonRow,
  skill: string,
  goal: string,
  level: Level = "beginner"
): Promise<LessonRow> {
  if (parseLessonContent(lesson)) return lesson;

  const generated = await generateLesson({
    skill,
    level,
    topic: lesson.title,
    goal,
    difficulty: lesson.difficulty,
  });

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("lessons")
    .update({
      title: generated.title,
      content: JSON.stringify({
        objective: generated.objective,
        explanation: generated.explanation,
        example: generated.example,
        keyPoints: generated.keyPoints,
      }),
    })
    .eq("id", lesson.id)
    .select()
    .single();

  if (error) throw new Error(`Failed to save lesson content: ${error.message}`);
  return data as LessonRow;
}

export async function getLessonById(
  userId: string,
  lessonId: string
): Promise<LessonRow | null> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("lessons")
    .select("id, path_id, day, title, content, difficulty")
    .eq("id", lessonId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load lesson: ${error.message}`);
  if (!data) return null;

  const { data: path } = await supabase
    .from("learning_paths")
    .select("user_id")
    .eq("id", (data as LessonRow).path_id)
    .maybeSingle();

  if (!path || path.user_id !== userId) return null;
  return data as LessonRow;
}