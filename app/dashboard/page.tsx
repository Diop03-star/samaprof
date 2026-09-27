import { redirect } from "next/navigation";
import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { getLessonsForUser } from "@/services/lesson";
import { getAdaptationFor } from "@/services/adaptation";
import { LearningPath, LessonLink } from "./learning-path";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.userId)
    .maybeSingle();

  const { data: progress } = await supabase
    .from("progress")
    .select("completed_lessons, total_lessons, mastery_score")
    .eq("user_id", user.userId)
    .maybeSingle();

  const lessons = await getLessonsForUser(user.userId);
  if (lessons.length === 0) redirect("/onboarding");

  const currentIndex = Math.min(
    progress?.completed_lessons ?? 0,
    lessons.length - 1
  );
  const currentLesson = lessons[currentIndex];
  const topic = currentLesson.title.toLowerCase().includes("condition")
    ? "if/else conditions"
    : currentLesson.title;

  const decision = await getAdaptationFor(
    user.userId,
    topic,
    currentLesson.difficulty
  );

  const percent =
    progress && progress.total_lessons && progress.total_lessons > 0
      ? ((progress.completed_lessons ?? 0) / progress.total_lessons) * 100
      : 0;

  const firstName = profile?.name?.split(" ")[0] ?? "there";
  const masteryScore = progress?.mastery_score ?? 0;

  return (
    <main className="min-h-screen bg-surface px-4 sm:px-6 py-8 pb-24">
      <div className="mx-auto max-w-3xl flex flex-col gap-8">
        
        {/* En-tête personnalisé */}
        <section className="flex flex-col gap-2 pt-4">
          <div className="inline-flex items-center gap-2 w-fit px-3 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed shadow-sm">
            <span className="text-sm">🎓</span>
            <span className="font-label-sm text-xs font-bold uppercase tracking-wider">Parcours Personnalisé</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-on-surface tracking-tight mt-2">
            Bonjour, {firstName} 👋
          </h1>
          <p className="font-body text-lg text-secondary">
            Prêt pour votre leçon du jour ? Votre régularité porte ses fruits !
          </p>
        </section>

        {/* Hero Card : Reprendre la session */}
        <section className="relative overflow-hidden rounded-[24px] bg-white p-6 shadow-[0_4px_20px_rgba(99,102,241,0.08)] border border-surface-dim">
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          
          <div className="relative flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <span className="font-label-sm text-sm text-primary font-bold tracking-widest uppercase">
                Continuer la session
              </span>
              <h2 className="font-display text-3xl font-bold text-on-surface leading-tight">
                {currentLesson.title}
              </h2>
            </div>

            {/* Barre de progression */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-secondary">Avancement du module</span>
                <span className="text-primary">{Math.round(percent)}%</span>
              </div>
              {/* Le composant de la task 10 (ProgressBar) ou bien un custom en ligne si besoin */}
              <div className="w-full h-3 rounded-full bg-surface-dim overflow-hidden shadow-inner">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-primary to-tertiary transition-all duration-1000 shadow-[0_0_8px_rgba(99,102,241,0.5)]" 
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            {/* Action */}
            <div className="pt-2">
              <LessonLink lessonId={currentLesson.id} />
            </div>
          </div>
        </section>

        {/* Grille de statistiques */}
        <section className="grid grid-cols-2 gap-4">
          <div className="flex flex-col p-5 rounded-[20px] bg-white shadow-sm border border-surface-dim gap-2">
             <div className="flex items-center justify-between text-secondary">
               <span className="font-label-sm text-sm font-bold uppercase">Progression</span>
               <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                 📊
               </div>
             </div>
             <div className="flex items-baseline gap-1 mt-1">
               <span className="font-display text-3xl font-bold text-on-surface">{Math.round(percent)}%</span>
             </div>
             <div className="w-full bg-surface-dim rounded-full h-1.5 mt-2 overflow-hidden">
               <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${percent}%` }} />
             </div>
          </div>

          <div className="flex flex-col p-5 rounded-[20px] bg-white shadow-sm border border-surface-dim gap-2">
             <div className="flex items-center justify-between text-secondary">
               <span className="font-label-sm text-sm font-bold uppercase">Niveau IA</span>
               <div className="w-8 h-8 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
                 ✨
               </div>
             </div>
             <div className="flex items-baseline gap-1 mt-1">
               <span className="font-display text-3xl font-bold text-on-surface">{masteryScore}%</span>
             </div>
             <span className="font-label-sm text-sm text-tertiary font-bold">Maîtrise solide</span>
          </div>
        </section>

        {/* Insight IA Contextuelle */}
        <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-tertiary/10 via-white to-white p-6 shadow-sm border border-surface-dim">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-tertiary flex items-center justify-center text-white shrink-0 shadow-md">
               🤖
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="font-label-sm text-xs text-tertiary font-bold tracking-widest uppercase">Analyse SamaProf</span>
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
              </div>
              <h4 className="font-display text-xl font-bold text-on-surface leading-tight">
                Activité recommandée
              </h4>
              <p className="font-body text-secondary mt-1 text-base">
                {(decision as any).insight || `L'IA a généré un exercice adapté à vos points de friction sur ${topic}.`}
              </p>
              
              <div className="mt-4 p-4 rounded-[16px] bg-surface-dim/50 border border-surface-dim flex justify-between items-center">
                 <div className="flex flex-col">
                    <span className="font-bold text-on-surface">{decision.nextActivity}</span>
                    <span className="text-sm text-secondary">Difficulté: {decision.difficulty}</span>
                 </div>
                 <button className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-primary font-bold hover:bg-primary hover:text-white transition-colors">
                    →
                 </button>
              </div>
            </div>
          </div>
        </section>

        {/* Learning Path (Timeline) */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl font-bold text-on-surface">Votre parcours</h3>
            <span className="font-label-sm text-sm text-primary font-bold">{progress?.completed_lessons ?? 0} / {lessons.length}</span>
          </div>
          <LearningPath lessons={lessons} />
        </section>

      </div>
    </main>
  );
}
