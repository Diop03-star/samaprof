"use client";

import { useRouter } from "next/navigation";
import { ExercisePanel } from "@/components/exercise/exercise-panel";

export function ExercisePanelClient(props: {
  lessonId: string;
  topic: string;
  kind: "qcm" | "code";
  difficulty: number;
}) {
  const router = useRouter();
  // Call onSubmitted to redirect to the correction page (Task 16)
  return <ExercisePanel {...props} onSubmitted={(id) => router.push(`/correction/${id}`)} />;
}
