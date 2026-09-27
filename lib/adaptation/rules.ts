export function computeMasteryScore(attempts: { score: number }[]) {
  if (attempts.length === 0) return 0;
  const recent = attempts.slice(0, 5);
  return Math.round(
    recent.reduce((acc, curr) => acc + curr.score, 0) / recent.length
  );
}

export function decide(params: { attempts: any[]; currentDifficulty: number; currentTopic: string; aiSuggestion?: any }) {
  const score = computeMasteryScore(params.attempts);
  let action = "same_level";
  let difficulty = params.currentDifficulty;
  let topic = params.currentTopic;

  if (params.attempts.length === 0) {
    action = "next_topic";
    if (params.aiSuggestion) {
      topic = params.aiSuggestion.topic;
    }
  } else if (score < 40) {
    action = "remediation";
    difficulty = Math.max(1, difficulty - 1);
  } else if (score >= 75) {
    action = "increase_difficulty";
    difficulty = Math.min(5, difficulty + 1);
  }

  return {
    action,
    topic,
    difficulty,
    reason: params.aiSuggestion?.reason || "Rules engine decision",
    nextActivity: params.aiSuggestion?.nextActivity || "Continue practice",
    source: "rules",
    masteryScore: score,
  };
}