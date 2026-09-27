import { createServerClient } from "@/lib/supabase/server";
import { generateLearningPlan } from "@/lib/ai";
import type { LearningPlan, OnboardingInput } from "@/types";

export async function createLearningPath(
  userId: string,
  input: OnboardingInput
): Promise<LearningPlan> {
  const supabase = await createServerClient();

  const { data: existing } = await supabase
    .from("learning_paths")
    .select("id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { data: lessons } = await supabase
      .from("lessons")
      .select("title, difficulty")
      .eq("path_id", existing.id)
      .order("day");

    return {
      skill: input.skill,
      level: input.level,
      goal: input.goal,
      modules: (lessons ?? []).map((lesson) => ({
        title: lesson.title,
        objective: `Learn ${lesson.title}`,
        difficulty: lesson.difficulty,
      })),
    };
  }

  const plan = await generateLearningPlan({
    skill: input.skill,
    level: input.level,
    goal: input.goal,
    dailyTime: input.dailyTime,
    duration: input.duration,
  });

  const { data: path, error: pathError } = await supabase
    .from("learning_paths")
    .insert({
      user_id: userId,
      skill: plan.skill,
      level: plan.level,
      goal: plan.goal,
      daily_time: input.dailyTime,
      duration: input.duration,
    })
    .select()
    .single();
  if (pathError) throw new Error(`Failed to create learning path: ${pathError.message}`);

  const { error: lessonsError } = await supabase.from("lessons").insert(
    plan.modules.map((module, index) => ({
      path_id: path.id,
      day: index + 1,
      title: module.title,
      content: module.objective,
      difficulty: module.difficulty,
    }))
  );
  if (lessonsError) throw new Error(`Failed to create lessons: ${lessonsError.message}`);

  const { count } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("path_id", path.id);

  const { error: progressError } = await supabase.from("progress").upsert(
    {
      user_id: userId,
      path_id: path.id,
      completed_lessons: 0,
      total_lessons: count ?? plan.modules.length,
      mastery_score: 0,
      current_level: 1,
    },
    { onConflict: "user_id" }
  );
  if (progressError) throw new Error(`Failed to create progress: ${progressError.message}`);

  return plan;
}