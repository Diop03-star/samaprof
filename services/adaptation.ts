// STUB pour services/adaptation.ts (Task 8 manquante)
export async function getAdaptationFor(userId: string, topic: string, difficulty: string | number) {
  return {
    nextActivity: "Micro-défi : Table de multiplication",
    difficulty: "Intermédiaire",
    insight: `L'IA a remarqué que vous maîtrisez bien les bases de ${topic}, mais nous allons consolider cela avec une pratique guidée.`,
  };
}

export async function loadAttemptRecords(userId: string) {
  return [
    { topic: "if/else conditions", score: 40 },
    { topic: "for loops", score: 85 }
  ];
}
