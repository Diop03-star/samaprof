"use client";

import { useCallback, useEffect, useState } from "react";
import { QcmExercise } from "@/components/qcm/qcm-exercise";
import { CodeExercise } from "@/components/code-exercise/code-exercise";
import { AiThinking } from "@/components/ui/ai-thinking";
import { AiError } from "@/components/ui/ai-error";

type ExercisePayload = {
  id: string;
  kind: "qcm" | "code";
  question: string;
  options: string[] | null;
  starter_code: string | null;
  difficulty: number;
};

export function ExercisePanel({
  lessonId,
  topic,
  kind,
  difficulty,
  onSubmitted,
}: {
  lessonId: string;
  topic: string;
  kind: "qcm" | "code";
  difficulty: number;
  onSubmitted: (attemptId: string) => void;
}) {
  const [exercise, setExercise] = useState<ExercisePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        lessonId,
        topic,
        kind,
        difficulty: String(difficulty),
      });
      // Mock since api doesn't exist yet (Task 15 API)
      // Simulate network
      await new Promise(r => setTimeout(r, 1000));
      
      setExercise({
         id: "mock-ex-1",
         kind: kind as "qcm" | "code",
         question: kind === "qcm" ? "Parmi ces affirmations concernant les boucles, laquelle est correcte ?" : "Écrivez une boucle for qui affiche les nombres de 0 à 4.",
         options: kind === "qcm" ? ["Une boucle while n'a pas besoin de condition", "Une boucle for itère sur une séquence", "break permet de recommencer la boucle", "On ne peut pas mettre de boucle dans une boucle"] : null,
         starter_code: kind === "code" ? "# Votre code ici\n" : null,
         difficulty
      });
    } catch {
      setError("We couldn't load the exercise right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [lessonId, topic, kind, difficulty]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (answer: string) => {
    if (!exercise) return;
    setPending(true);
    setError(null);
    try {
      // Simulate network
      await new Promise(r => setTimeout(r, 1000));
      onSubmitted("mock-attempt-123");
    } catch {
      setError("We couldn't analyze your answer right now. Please try again.");
    } finally {
      setPending(false);
    }
  };

  if (loading) return <div className="py-8"><AiThinking label="Génération de votre exercice sur mesure..." /></div>;
  if (error && !exercise) return <AiError message={error} onRetry={() => void load()} />;
  if (!exercise) return null;

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500">
      {exercise.kind === "qcm" && exercise.options ? (
        <QcmExercise
          question={exercise.question}
          options={exercise.options}
          onSubmit={submit}
          pending={pending}
        />
      ) : (
        <CodeExercise
          question={exercise.question}
          starterCode={exercise.starter_code ?? ""}
          onSubmit={submit}
          pending={pending}
        />
      )}

      {pending && (
         <div className="pt-6">
            <AiThinking label="Analyse IA en cours..." />
         </div>
      )}
      {error && <AiError message={error} />}
    </div>
  );
}
