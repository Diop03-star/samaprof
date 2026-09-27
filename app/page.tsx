import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-surface flex flex-col items-center justify-center relative overflow-hidden px-6 py-20">
      {/* Éclairages ambiants (Gradients d'arrière-plan) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-tertiary/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="mx-auto max-w-4xl text-center relative z-10 flex flex-col items-center">
        
        {/* Badge IA */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-tertiary/10 border border-tertiary/20 mb-8 shadow-sm">
          <span className="animate-pulse h-2 w-2 rounded-full bg-tertiary"></span>
          <span className="text-xs md:text-sm font-semibold text-tertiary tracking-wide uppercase">
            Diagnostic IA en temps réel
          </span>
        </div>

        {/* Titre Principal */}
        <h1 className="text-6xl md:text-8xl font-display font-extrabold tracking-tight text-on-surface leading-none">
          SamaProf
        </h1>
        
        <p className="mt-8 text-3xl md:text-5xl font-display font-bold leading-tight text-secondary/90">
          Votre parcours. <br className="md:hidden" />
          Votre rythme. <br className="md:hidden" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary">
            Votre coach IA.
          </span>
        </p>

        {/* Paragraphe descriptif */}
        <p className="mx-auto mt-8 max-w-2xl text-lg md:text-xl text-on-surface/70 leading-relaxed">
          SamaProf détecte vos faiblesses et génère des exercices sur mesure pour consolider vos acquis. L'apprentissage adaptatif repensé pour l'excellence.
        </p>

        {/* Call to Actions */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4 items-center justify-center w-full max-w-md mx-auto">
          <Link
            href="/onboarding"
            className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full bg-primary px-8 py-4 font-bold text-white shadow-[0_10px_20px_-2px_rgba(99,102,241,0.25)] transition-all hover:scale-[0.98] hover:bg-primary-hover focus:outline-none w-full sm:w-auto"
          >
            <span>Démarrer</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
          <a
            href="#features"
            className="inline-flex items-center justify-center rounded-full bg-surface-bright border-2 border-surface-dim px-8 py-4 font-bold text-secondary transition-all hover:bg-surface-dim w-full sm:w-auto"
          >
            Découvrir
          </a>
        </div>
        
        {/* Mockup Preview Card */}
        <div className="mt-20 w-full max-w-3xl rounded-[24px] bg-white p-3 border border-surface-dim shadow-[0_4px_12px_rgba(99,102,241,0.05),0_1px_3px_rgba(15,23,42,0.04)] relative z-20">
            <div className="bg-surface rounded-[16px] aspect-video w-full flex flex-col items-center justify-center overflow-hidden relative border border-surface-dim/50">
              <div className="absolute inset-0 bg-gradient-to-br from-surface to-surface-dim opacity-30" />
              
              {/* Composants abstraits simulant l'UI SamaProf */}
              <div className="relative flex w-full max-w-sm flex-col gap-4 p-6 bg-white rounded-2xl shadow-sm border border-surface-dim">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
                    ✨
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="h-2 w-24 bg-surface-dim rounded-full" />
                    <div className="h-2 w-16 bg-surface-dim/50 rounded-full" />
                  </div>
                </div>
                
                <div className="h-3 w-full bg-surface-dim rounded-full overflow-hidden">
                  <div className="h-full w-2/3 bg-gradient-to-r from-primary to-tertiary rounded-full" />
                </div>
                
                <div className="flex justify-between items-center mt-2">
                  <div className="h-6 w-20 bg-primary/10 rounded-full" />
                  <div className="h-8 w-24 bg-primary rounded-full" />
                </div>
              </div>
            </div>
        </div>

      </div>
    </main>
  );
}
