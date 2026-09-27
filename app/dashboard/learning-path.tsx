import Link from "next/link";
import type { LessonRow } from "@/types";

// Note: If LessonRow doesn't match exactly because types/index.ts is still in flux,
// we'll adapt it. Here we expect id, title, day at minimum.
export function LearningPath({ lessons }: { lessons: any[] }) {
  return (
    <div className="flex flex-col gap-3">
      {lessons.map((lesson, index) => {
        const state = index === 0 ? "done" : index === 1 ? "current" : "locked";
        return (
          <div
            key={lesson.id}
            className={`flex items-center justify-between rounded-[16px] p-4 transition-all ${
              state === "current"
                ? "bg-primary-fixed/30 border-2 border-primary shadow-sm"
                : state === "done"
                ? "bg-surface-container-lowest border border-surface-dim"
                : "bg-surface-container border border-surface-dim opacity-60"
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  state === "current"
                    ? "bg-primary text-white"
                    : state === "done"
                    ? "bg-tertiary-fixed text-tertiary"
                    : "bg-surface-dim text-secondary"
                }`}
              >
                {state === "done" ? (
                  <span className="font-bold">✓</span>
                ) : state === "current" ? (
                  <span className="font-bold">→</span>
                ) : (
                  <span className="text-sm">🔒</span>
                )}
              </div>
              <div className="flex flex-col">
                <span
                  className={`font-label-sm text-xs font-bold uppercase tracking-wider ${
                    state === "locked" ? "text-secondary" : "text-primary"
                  }`}
                >
                  Jour {lesson.day}
                </span>
                <span
                  className={`font-label-md text-base ${
                    state === "locked" ? "text-secondary" : "text-on-surface font-semibold"
                  }`}
                >
                  {lesson.title}
                </span>
              </div>
            </div>
            {state === "current" && (
              <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold animate-pulse">
                En cours
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function LessonLink({ lessonId }: { lessonId: string }) {
  return (
    <Link
      href={`/learn/${lessonId}`}
      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-primary text-white font-label-md text-lg font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover hover:scale-[0.98] transition-all"
    >
      <span>Reprendre la leçon</span>
      <span className="text-xl">→</span>
    </Link>
  );
}
