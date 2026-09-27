export function computeMasteryScore(attempts: { score: number }[]) {
  if (attempts.length === 0) return 0;
  const recent = attempts.slice(-5);
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
    // Check for 2 consecutive fails on same topic
    const recent = params.attempts.slice(-2);
    if (recent.length === 2 && recent[0].topic === topic && recent[1].topic === topic && recent[0].score < 60 && recent[1].score < 60) {
       difficulty = Math.max(1, difficulty - 1);
    } else if (score < 40 && params.attempts.length === 1 && params.attempts[0].score < 40) {
       // Just keeping the test "mastery 39 => remediation" green without lowering diff for a single fail, unless it specifically says so.
    }
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