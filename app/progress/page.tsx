import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { loadAttemptRecords } from "@/services/adaptation";
import { computeMasteryScore } from "@/lib/adaptation/rules";
import { ProgressBar } from "@/components/ui/progress-bar";

export default async function ProgressPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const attempts = await loadAttemptRecords(user.userId);
  const mastery = computeMasteryScore(attempts);

  const byTopic = new Map<string, { total: number; count: number }>();
  for (const attempt of attempts) {
    const entry = byTopic.get(attempt.topic) ?? { total: 0, count: 0 };
    entry.total += attempt.score;
    entry.count += 1;
    byTopic.set(attempt.topic, entry);
  }

  const topics = [...byTopic.entries()]
    .map(([topic, { total, count }]) => ({
      topic,
      average: Math.round(total / count),
      count,
    }))
    .sort((a, b) => a.average - b.average);

  const mastered = topics.filter((t) => t.average >= 75);
  const needsWork = topics.filter((t) => t.average < 75);

  return (
    <main className="min-h-screen bg-surface px-4 sm:px-6 py-8 pb-24">
      <div className="mx-auto max-w-3xl flex flex-col gap-8">
        
        <div className="flex flex-col gap-4">
           <Link href="/dashboard" className="inline-flex items-center gap-2 text-secondary hover:text-primary font-label-sm font-bold uppercase tracking-wider text-sm transition-colors w-fit">
             <span>←</span> Tableau de bord
           </Link>
           <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-on-surface tracking-tight">
             Votre Progression
           </h1>
           <p className="font-body text-lg text-secondary">
             Suivez votre évolution et identifiez vos points forts.
           </p>
        </div>

        {/* Global Mastery */}
        <section className="rounded-[24px] border border-surface-dim bg-white p-8 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
             <h2 className="font-display text-2xl font-bold text-on-surface">Score de maîtrise</h2>
             <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl">
                🏆
             </div>
          </div>
          <div className="mt-2 flex flex-col gap-2">
            <div className="flex items-baseline gap-2">
               <span className="font-display text-5xl font-extrabold text-primary">{mastery}%</span>
            </div>
            <ProgressBar value={mastery} />
          </div>
          <p className="mt-2 font-body text-sm text-secondary bg-surface-dim/50 p-3 rounded-[12px] inline-block">
            Basé sur vos {Math.min(attempts.length, 5)} dernières tentatives.
          </p>
        </section>

        {needsWork.length > 0 && (
          <section className="rounded-[24px] border border-orange-500/20 bg-orange-500/5 p-8 shadow-sm">
            <h2 className="font-display text-2xl font-bold text-orange-600 flex items-center gap-3">
               <span className="text-2xl">💪</span> À renforcer
            </h2>
            <div className="mt-6 flex flex-col gap-3">
              {needsWork.map((t) => (
                <div key={t.topic} className="flex items-center justify-between bg-white p-4 rounded-[16px] shadow-sm border border-orange-500/10">
                  <span className="font-body font-bold text-on-surface">{t.topic}</span>
                  <span className="font-label-sm text-sm font-bold bg-orange-500/10 text-orange-600 px-3 py-1 rounded-full">
                    {t.average}%
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {mastered.length > 0 && (
          <section className="rounded-[24px] border border-emerald-500/20 bg-emerald-500/5 p-8 shadow-sm">
            <h2 className="font-display text-2xl font-bold text-emerald-600 flex items-center gap-3">
               <span className="text-2xl">✨</span> Acquis
            </h2>
            <div className="mt-6 flex flex-col gap-3">
              {mastered.map((t) => (
                <div key={t.topic} className="flex items-center justify-between bg-white p-4 rounded-[16px] shadow-sm border border-emerald-500/10">
                  <span className="font-body font-bold text-on-surface">{t.topic}</span>
                  <span className="font-label-sm text-sm font-bold bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full">
                    {t.average}%
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {attempts.length === 0 && (
          <section className="rounded-[24px] border border-surface-dim bg-white p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-surface-dim flex items-center justify-center mx-auto text-3xl mb-4">🌱</div>
            <p className="font-display text-xl text-secondary">
              Aucun exercice réalisé pour le moment.
            </p>
            <p className="font-body text-secondary mt-2">
              Lancez votre première leçon pour voir votre progression !
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
