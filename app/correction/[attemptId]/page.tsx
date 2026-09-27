import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { getAdaptationFor } from "@/services/adaptation";
import { ProgressBar } from "@/components/ui/progress-bar";

type Feedback = {
  mistake: string;
  explanation: string;
  hint: string;
  weakness: string;
  masteryLevel: string;
};

type ExerciseMeta = {
  lesson_id: string;
  topic: string;
  difficulty: number;
};

type Attempt = {
  id: string;
  answer: string;
  is_correct: boolean;
  score: number;
  feedback: Feedback;
  exercises: ExerciseMeta | null;
};

export default async function CorrectionPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { attemptId } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("attempts")
    .select("id, answer, is_correct, score, feedback, exercises(lesson_id, topic, difficulty)")
    .eq("id", attemptId)
    .maybeSingle();

  const attempt = data as Attempt | null;
  if (!attempt) redirect("/dashboard");

  const exercise = attempt.exercises;
  if (!exercise) redirect("/dashboard");

  const decision = await getAdaptationFor(
    user.userId,
    exercise.topic,
    exercise.difficulty
  );

  const remediationQuery = new URLSearchParams({
    kind: "code",
    topic: (decision as any).topic || exercise.topic,
    difficulty: String(decision.difficulty),
    regenerate: "1",
  });

  return (
    <main className="min-h-screen bg-surface px-4 sm:px-6 py-8 pb-24">
      <div className="mx-auto max-w-2xl flex flex-col gap-8">
        
        {/* Verdict Card */}
        <section
          className={`rounded-[24px] border p-8 shadow-sm flex flex-col gap-4 ${
            attempt.is_correct
              ? "border-emerald-500/20 bg-emerald-500/10"
              : "border-orange-500/20 bg-orange-500/10"
          }`}
        >
          <div className="flex items-center gap-3">
             <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                attempt.is_correct ? "bg-emerald-500 text-white" : "bg-orange-500 text-white"
             }`}>
                {attempt.is_correct ? "✓" : "💡"}
             </div>
             <div className="flex flex-col">
                <h1 className="font-display text-3xl font-bold text-on-surface">
                  {attempt.is_correct ? "Excellent travail !" : "Analysons votre réponse."}
                </h1>
                <p className="font-body text-secondary mt-1">
                  {attempt.is_correct
                    ? "Votre maîtrise de ce sujet a augmenté."
                    : "Votre parcours va s'adapter automatiquement."}
                </p>
             </div>
          </div>
          
          <div className="mt-2 flex items-center gap-4 bg-white p-4 rounded-[16px] shadow-sm">
            <div className="flex-1"><ProgressBar value={attempt.score} /></div>
            <span className="font-display font-bold text-lg text-primary">{attempt.score}%</span>
          </div>
        </section>

        {/* Feedback IA */}
        {!attempt.is_correct && (
          <section className="rounded-[24px] border border-surface-dim bg-white p-8 shadow-sm flex flex-col gap-6">
            <h2 className="font-display text-2xl font-bold text-on-surface border-b border-surface-dim pb-4">
               Retour de votre coach IA
            </h2>
            
            <div className="flex flex-col gap-2">
              <h3 className="font-label-sm text-sm font-bold uppercase tracking-wider text-secondary">Votre réponse</h3>
              <div className="rounded-[16px] bg-[#0F172A] p-4 font-mono text-sm text-emerald-300 shadow-inner">
                {attempt.answer}
              </div>
            </div>

            {attempt.feedback?.mistake && (
              <div className="flex flex-col gap-2">
                <h3 className="font-label-sm text-sm font-bold uppercase tracking-wider text-orange-600">L'erreur</h3>
                <p className="font-body text-on-surface text-lg">{attempt.feedback.mistake}</p>
              </div>
            )}
            
            {attempt.feedback?.explanation && (
              <div className="flex flex-col gap-2">
                <h3 className="font-label-sm text-sm font-bold uppercase tracking-wider text-primary">Pourquoi ?</h3>
                <p className="font-body text-secondary text-lg leading-relaxed">{attempt.feedback.explanation}</p>
              </div>
            )}
            
            {attempt.feedback?.hint && (
              <div className="flex items-start gap-3 rounded-[16px] bg-tertiary/10 p-5 mt-2">
                <span className="text-xl">✨</span>
                <div className="flex flex-col">
                   <h3 className="font-label-sm text-sm font-bold uppercase tracking-wider text-tertiary">Indice pour la suite</h3>
                   <p className="font-body text-secondary font-medium">{attempt.feedback.hint}</p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Adaptation du parcours */}
        <section className="relative overflow-hidden rounded-[24px] border border-primary/20 bg-primary/5 p-8 shadow-sm">
          <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          
          <div className="relative flex flex-col gap-4">
             <div className="flex items-center gap-2">
               <span className="font-label-sm text-xs font-bold uppercase tracking-wider text-primary">
                  Adaptation IA
               </span>
               <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
             </div>
             
             <h2 className="font-display text-2xl font-bold text-on-surface">
                Votre parcours a été ajusté
             </h2>
             
             <p className="font-body text-secondary text-lg">
                Vous avez besoin d'un peu plus de pratique sur le sujet <span className="font-bold text-primary">{exercise.topic}</span>.
                Nous avons généré un nouvel exercice sur mesure.
             </p>
             
             <div className="mt-2 flex flex-col gap-1 rounded-[16px] bg-white p-5 shadow-sm border border-surface-dim">
                <span className="font-label-sm text-xs text-secondary uppercase tracking-wider">Activité recommandée</span>
                <span className="font-display text-lg font-bold text-on-surface mt-1">{decision.nextActivity}</span>
                <span className="font-body text-sm text-secondary">Difficulté ajustée : {decision.difficulty}</span>
             </div>
             
             <Link
               href={`/learn/${exercise.lesson_id}?${remediationQuery.toString()}`}
               className="mt-4 flex items-center justify-center gap-2 w-full sm:w-auto rounded-full bg-primary px-8 py-4 font-label-md text-lg font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-hover hover:scale-[0.98] transition-all"
             >
               <span>Lancer l'activité recommandée</span>
               <span className="text-xl">→</span>
             </Link>

             <div className="mt-2 text-center sm:text-left">
               <Link href="/dashboard" className="font-label-sm text-sm font-bold text-secondary hover:text-primary hover:underline transition-colors uppercase tracking-wider">
                 ← Retour au tableau de bord
               </Link>
             </div>
          </div>
        </section>
      </div>
    </main>
  );
}
