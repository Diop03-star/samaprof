"use client";

import { useState } from "react";

export function CodeExercise({
  question,
  starterCode,
  onSubmit,
  pending,
}: {
  question: string;
  starterCode: string;
  onSubmit: (answer: string) => Promise<void>;
  pending: boolean;
}) {
  const [code, setCode] = useState(starterCode);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3 p-4 rounded-[16px] bg-tertiary/10 border border-tertiary/20">
         <span className="text-xl">💡</span>
         <p className="font-body text-secondary text-base leading-relaxed">
           {question}
         </p>
      </div>
      
      <div className="flex flex-col gap-2">
         <div className="flex items-center justify-between px-2">
            <span className="font-label-sm text-xs font-bold text-secondary uppercase tracking-widest">
               Éditeur de code
            </span>
         </div>
         <textarea
           value={code}
           onChange={(e) => setCode(e.target.value)}
           rows={10}
           spellCheck={false}
           aria-label="Your code"
           className="w-full rounded-[16px] border border-secondary/20 bg-[#0F172A] p-5 font-mono text-sm text-emerald-300 focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all shadow-inner"
         />
      </div>

      <button
        type="button"
        disabled={!code.trim() || pending}
        onClick={() => onSubmit(code)}
        className="mt-2 w-full rounded-full bg-primary py-3.5 font-label-md text-lg font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-hover hover:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
      >
        Soumettre mon code
      </button>
    </div>
  );
}
