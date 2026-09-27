"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const topic = searchParams.get("topic");
  const router = useRouter();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulation d'authentification ou création de compte
    setTimeout(() => {
      // Pour le MVP mock, on redirige directement au dashboard
      router.push("/dashboard");
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-surface flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-tertiary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="z-10 w-full max-w-md bg-white rounded-[32px] shadow-xl border border-surface-dim p-8 flex flex-col gap-8">
        
        <div className="text-center flex flex-col items-center gap-2">
           <Link href="/" className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl mb-2">
             🎓
           </Link>
           <h1 className="font-display text-3xl font-extrabold text-on-surface">
             {isLogin ? "Bon retour !" : "Créer un compte"}
           </h1>
           {topic ? (
             <p className="font-body text-secondary mt-1">
               Prêt à apprendre <span className="font-bold text-primary">« {topic} »</span> ?
             </p>
           ) : (
             <p className="font-body text-secondary mt-1">
               Connectez-vous pour reprendre votre parcours.
             </p>
           )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-xs font-bold uppercase tracking-wider text-secondary">
              Email
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="amadou@samacoach.dev" 
              className="w-full h-14 rounded-[16px] border border-surface-dim bg-surface-dim/30 px-4 font-body text-on-surface focus:border-primary focus:bg-white focus:outline-none transition-all"
              required
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-xs font-bold uppercase tracking-wider text-secondary">
              Mot de passe
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full h-14 rounded-[16px] border border-surface-dim bg-surface-dim/30 px-4 font-body text-on-surface focus:border-primary focus:bg-white focus:outline-none transition-all"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="mt-4 w-full h-14 rounded-[16px] bg-primary font-label-md text-white font-bold flex items-center justify-center gap-2 hover:bg-primary-hover transition-colors disabled:opacity-70"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              isLogin ? "Se connecter" : "S'inscrire"
            )}
          </button>
        </form>

        <div className="text-center font-body text-sm text-secondary">
           {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
           <button 
             onClick={() => setIsLogin(!isLogin)}
             className="ml-2 font-bold text-primary hover:underline"
           >
             {isLogin ? "S'inscrire" : "Se connecter"}
           </button>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
