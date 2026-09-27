"use client";

import { useState } from "react";

export function QcmExercise({
  question,
  options,
  onSubmit,
  pending,
}: {
  question: string;
  options: string[];
  onSubmit: (answer: string) => Promise<void>;
  pending: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <p className="font-body text-lg text-on-surface leading-relaxed">
        {question}
      </p>
      
      <div className="flex flex-col gap-3">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            disabled={pending}
            onClick={() => setSelected(option)}
            className={`w-full flex items-center justify-between rounded-[16px] border-2 px-5 py-4 text-left transition-all ${
              selected === option
                ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                : "border-surface-dim bg-white text-secondary hover:bg-surface-dim/30 hover:border-surface-dim"
            }`}
          >
            <span className="font-body text-base">{option}</span>
            {selected === option && (
              <span className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-white text-xs shadow-sm">
                ✓
              </span>
            )}
          </button>
        ))}
      </div>
      
      <button
        type="button"
        disabled={!selected || pending}
        onClick={() => selected && onSubmit(selected)}
        className="mt-2 w-full rounded-full bg-primary py-3.5 font-label-md text-lg font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-hover hover:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
      >
        Valider ma réponse
      </button>
    </div>
  );
}
