"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const [topic, setTopic] = useState("");
  const router = useRouter();

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      router.push(`/login?topic=${encodeURIComponent(topic)}`);
    }
  };

  return (
    <main className="min-h-screen bg-surface flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-tertiary/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="z-10 max-w-2xl w-full text-center flex flex-col items-center gap-8">
        
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-surface-dim shadow-sm">
           <span className="text-xl">✨</span>
           <span className="font-label-sm text-sm font-bold uppercase tracking-wider text-primary">SamaProf AI • Votre Coach Privé</span>
        </div>

        <h1 className="font-display text-5xl sm:text-7xl font-extrabold text-on-surface tracking-tight leading-tight">
          Apprenez tout, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary">
            à votre propre rythme.
          </span>
        </h1>
        
        <p className="font-body text-xl text-secondary max-w-xl">
          SamaProf identifie vos lacunes en temps réel et génère un parcours sur-mesure pour vous faire progresser.
        </p>

        <form onSubmit={handleStart} className="w-full max-w-md mt-4 relative group">
          <input 
            type="text" 
            placeholder="Que voulez-vous apprendre aujourd'hui ?" 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full h-16 rounded-[24px] border-2 border-surface-dim bg-white pl-6 pr-32 font-body text-lg text-on-surface shadow-sm focus:border-primary focus:outline-none transition-all"
            required
          />
          <button 
            type="submit"
            className="absolute right-2 top-2 bottom-2 rounded-[18px] bg-primary px-6 font-label-md text-white font-bold hover:bg-primary-hover hover:scale-[0.98] transition-all"
          >
            Go →
          </button>
        </form>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full text-left">
           <div className="bg-white p-6 rounded-[24px] shadow-sm border border-surface-dim">
              <span className="text-3xl mb-2 block">🎯</span>
              <h3 className="font-display font-bold text-on-surface">100% Adaptatif</h3>
              <p className="font-body text-secondary mt-1 text-sm">Le parcours s'ajuste à vos erreurs.</p>
           </div>
           <div className="bg-white p-6 rounded-[24px] shadow-sm border border-surface-dim">
              <span className="text-3xl mb-2 block">💡</span>
              <h3 className="font-display font-bold text-on-surface">Correction IA</h3>
              <p className="font-body text-secondary mt-1 text-sm">Explications détaillées en direct.</p>
           </div>
           <div className="bg-white p-6 rounded-[24px] shadow-sm border border-surface-dim">
              <span className="text-3xl mb-2 block">🚀</span>
              <h3 className="font-display font-bold text-on-surface">Pratique continue</h3>
              <p className="font-body text-secondary mt-1 text-sm">QCM & Éditeur de code intégrés.</p>
           </div>
        </div>
      </div>
    </main>
  );
}
