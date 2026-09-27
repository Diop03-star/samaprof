import { redirect } from "next/navigation";
import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { getLessonById, ensureLessonContent, parseLessonContent } from "@/services/lesson";
import { ExercisePanelClient } from "./exercise-client";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LearnPage({
  params,
  searchParams,
}: {
  params: Promise<{ lessonId: string }>;
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { lessonId } = await params;
  const query = await searchParams;

  const lesson = await getLessonById(user.userId, lessonId);
  if (!lesson) redirect("/dashboard");

  const supabase = await createClient();
  const { data: path } = await supabase
    .from("learning_paths")
    .select("skill, goal")
    .eq("id", lesson.path_id)
    .maybeSingle();

  const enriched = await ensureLessonContent(
    lesson,
    path?.skill ?? "Python",
    path?.goal ?? "Build Python applications"
  );
  const content = parseLessonContent(enriched);

  const topic =
    typeof query.topic === "string"
      ? query.topic
      : enriched.title.toLowerCase().includes("condition")
        ? "if/else conditions"
        : enriched.title;
  const kind = query.kind === "code" ? "code" : "qcm";
  const difficulty = Number(query.difficulty ?? enriched.difficulty) || 1;

  return (
    <main className="min-h-screen bg-surface px-4 sm:px-6 py-8 pb-24">
      <div className="mx-auto max-w-3xl flex flex-col gap-8">
        
        {/* Leçon / Théorie */}
        <section className="relative overflow-hidden rounded-[24px] bg-white p-8 shadow-sm border border-surface-dim">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col gap-6">
             
             <div className="flex flex-col gap-2">
                <span className="inline-flex w-fit px-3 py-1 rounded-full bg-surface-dim text-secondary font-label-sm text-xs font-bold uppercase tracking-wider">
                   Jour {enriched.day}
                </span>
                <h1 className="font-display text-4xl font-extrabold text-on-surface leading-tight">
                  {enriched.title}
                </h1>
             </div>

             {content && (
               <div className="flex flex-col gap-8 mt-2">
                 
                 {/* Objectif */}
                 <div className="flex flex-col gap-2">
                    <h2 className="font-title-md text-xl font-bold text-on-surface">Objectif</h2>
                    <p className="font-body text-secondary text-lg leading-relaxed">
                      {content.objective}
                    </p>
                 </div>

                 {/* Explication */}
                 <div className="flex flex-col gap-2">
                    <h2 className="font-title-md text-xl font-bold text-on-surface">Leçon</h2>
                    <p className="font-body text-on-surface text-lg leading-relaxed whitespace-pre-line">
                      {content.explanation}
                    </p>
                 </div>

                 {/* Code Example */}
                 <div className="rounded-[16px] bg-[#0F172A] p-5 shadow-inner border border-secondary/20">
                    <pre className="overflow-x-auto font-mono text-sm text-emerald-300 leading-relaxed">
                      {content.example}
                    </pre>
                 </div>

                 {/* Key Points */}
                 <div className="rounded-[16px] bg-tertiary/10 border border-tertiary/20 p-6 flex flex-col gap-3">
                    <h3 className="font-title-md font-bold text-tertiary flex items-center gap-2">
                       <span className="text-xl">✨</span> Points à retenir
                    </h3>
                    <ul className="flex flex-col gap-2 mt-1">
                      {content.keyPoints.map((point: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-tertiary mt-1">•</span>
                          <span className="font-body text-secondary">{point}</span>
                        </li>
                      ))}
                    </ul>
                 </div>
               </div>
             )}
          </div>
        </section>

        {/* Exercice Pratique */}
        <section className="relative overflow-hidden rounded-[24px] bg-white p-8 shadow-sm border border-surface-dim">
           <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-2xl font-bold text-on-surface flex items-center gap-3">
                 <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl">
                    💪
                 </span>
                 Pratique
              </h2>
              <span className="font-label-sm text-xs font-bold bg-surface-dim px-3 py-1 rounded-full uppercase tracking-wider text-secondary">
                 Exercice généré
              </span>
           </div>
           
           <ExercisePanelClient
             lessonId={enriched.id}
             topic={topic}
             kind={kind}
             difficulty={difficulty}
           />
        </section>
        
      </div>
    </main>
  );
}
