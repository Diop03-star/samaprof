"use client";

import { useState } from "react";

const STEPS = [
  { key: "skill", title: "Que souhaitez-vous apprendre ?" },
  { key: "level", title: "Quel est votre niveau actuel ?" },
  { key: "goal", title: "Quel est votre objectif principal ?" },
  { key: "time", title: "Quel temps pouvez-vous y consacrer ?" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

export function Steps({ pending }: { pending: boolean }) {
  const [index, setIndex] = useState(0);
  const [skill, setSkill] = useState("Python");
  const [level, setLevel] = useState("beginner");
  const [goal, setGoal] = useState("Construire des applications web");
  const [dailyTime, setDailyTime] = useState(60);
  const [duration, setDuration] = useState(30);

  const step: { key: StepKey; title: string } = STEPS[index];

  return (
    <div className="w-full max-w-lg bg-white p-8 rounded-[24px] shadow-[0_4px_12px_rgba(99,102,241,0.05),0_1px_3px_rgba(15,23,42,0.04)] border border-surface-dim">
      <div className="flex items-center justify-between mb-8">
        <p className="text-sm font-semibold text-tertiary uppercase tracking-wide">
          Étape {index + 1} sur {STEPS.length}
        </p>
        <div className="flex gap-1.5 w-32">
          {STEPS.map((s, i) => (
            <div
              key={s.key}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                i <= index ? "bg-primary" : "bg-surface-dim"
              }`}
            />
          ))}
        </div>
      </div>

      <h2 className="mb-6 text-3xl font-display font-bold text-on-surface">{step.title}</h2>

      <input type="hidden" name="skill" value={skill} />
      <input type="hidden" name="level" value={level} />
      <input type="hidden" name="goal" value={goal} />
      <input type="hidden" name="dailyTime" value={dailyTime} />
      <input type="hidden" name="duration" value={duration} />

      {step.key === "skill" && (
        <input
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          className="w-full h-12 rounded-full border border-surface-dim bg-surface px-6 text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
          placeholder="Ex: Python, React, Data Science..."
        />
      )}

      {step.key === "level" && (
        <div className="space-y-3">
          {(["beginner", "intermediate", "advanced"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setLevel(option)}
              className={`w-full flex items-center justify-between rounded-[16px] border-2 px-5 py-4 text-left capitalize transition-all ${
                level === option
                  ? "border-primary bg-primary/5 text-primary font-bold shadow-sm"
                  : "border-surface-dim text-secondary hover:bg-surface"
              }`}
            >
              <span>{option}</span>
              {level === option && <div className="h-4 w-4 rounded-full bg-primary" />}
            </button>
          ))}
        </div>
      )}

      {step.key === "goal" && (
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          rows={4}
          className="w-full rounded-[16px] border border-surface-dim bg-surface p-5 text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none"
          placeholder="Ex: Je veux automatiser des tâches répétitives..."
        />
      )}

      {step.key === "time" && (
        <div className="space-y-8">
          <div>
            <label className="flex justify-between text-sm font-semibold text-secondary mb-3">
              <span>Minutes par jour</span>
              <span className="text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">{dailyTime} min</span>
            </label>
            <input
              type="range"
              min={15}
              max={240}
              step={15}
              value={dailyTime}
              onChange={(e) => setDailyTime(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
          <div>
            <label className="flex justify-between text-sm font-semibold text-secondary mb-3">
              <span>Durée du programme</span>
              <span className="text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">{duration} jours</span>
            </label>
            <input
              type="range"
              min={1}
              max={90}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        </div>
      )}

      <div className="mt-10 flex gap-4">
        {index > 0 && (
          <button
            type="button"
            onClick={() => setIndex(index - 1)}
            disabled={pending}
            className="rounded-full border-2 border-surface-dim bg-white px-8 py-3.5 font-bold text-secondary hover:bg-surface transition-colors disabled:opacity-50"
          >
            Retour
          </button>
        )}
        {index < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setIndex(index + 1)}
            className="flex-1 rounded-full bg-primary py-3.5 font-bold text-white shadow-md shadow-primary/20 hover:bg-primary-hover transition-all hover:-translate-y-[1px]"
          >
            Continuer
          </button>
        ) : (
          <button
            type="submit"
            disabled={pending}
            className="flex-1 relative overflow-hidden group rounded-full bg-gradient-to-r from-primary to-tertiary py-3.5 font-bold text-white shadow-lg shadow-tertiary/20 disabled:opacity-60 transition-all hover:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            Générer mon parcours
          </button>
        )}
      </div>
    </div>
  );
}
