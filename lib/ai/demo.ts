import type { AIProvider } from "@/types";

const IF_ELSE_TOPIC = "if/else conditions";

export const demoProvider: AIProvider = {
  name: "demo",

  async generateLearningPlan(input) {
    return {
      skill: input.skill,
      level: input.level,
      goal: input.goal,
      modules: [
        { title: "Variables", objective: "Store and reuse values", difficulty: 1 },
        { title: "Conditions", objective: "Use if/else to make decisions", difficulty: 1 },
        { title: "Loops", objective: "Repeat work with for and while", difficulty: 1 },
      ],
    };
  },

  async generateLesson(input) {
    if (input.topic === IF_ELSE_TOPIC) {
      return {
        title: "if/else conditions",
        objective: "Choose between two branches of code",
        explanation:
          "An if statement runs a block of code only when a condition is true. " +
          "An else block runs it when the condition is false. Conditions are " +
          "comparisons such as age >= 18, and each one is either true or false.",
        example:
          'age = 20\n\nif age >= 18:\n    print("You are an adult")\nelse:\n    print("You are a minor")',
        keyPoints: [
          "if runs code when the condition is true",
          "else runs code when the condition is false",
          "use == to compare, = to assign",
          "indent the code inside the block",
        ],
      };
    }

    return {
      title: input.topic,
      objective: `Understand ${input.topic}`,
      explanation:
        `This lesson introduces ${input.topic} step by step, with plain ` +
        `explanations written for a ${input.level} learner.`,
      example: `# ${input.topic}\nprint("hello")`,
      keyPoints: [
        `What ${input.topic} is for`,
        "A worked example",
        "Common mistakes",
      ],
    };
  },

  async generateExercise(input) {
    if (input.kind === "qcm") {
      const options = [
        "It prints 'You are an adult'",
        "It prints 'You are a minor'",
        "It prints nothing",
        "It raises an error",
      ];
      return {
        kind: "qcm",
        topic: input.topic,
        question:
          'What does this code print?\n\nage = 20\nif age >= 18:\n    print("You are an adult")',
        difficulty: input.difficulty,
        options,
        correctAnswer: options[0],
        starterCode: null,
        referenceSolution: null,
        explanation: "age is 20, so age >= 18 is true, and the if branch runs.",
      };
    }

    return {
      kind: "code",
      topic: input.topic,
      question:
        "Write an if/else that prints 'You are an adult' when age is 18 or more, and 'You are a minor' otherwise.",
      difficulty: input.difficulty,
      options: null,
      correctAnswer: null,
      starterCode: "age = 20\n\n# write your if/else here\n",
      referenceSolution:
        'age = 20\n\nif age >= 18:\n    print("You are an adult")\nelse:\n    print("You are a minor")',
      explanation:
        "The condition age >= 18 is true, so the if branch prints. The else branch is skipped.",
    };
  },

  async evaluateAnswer(input) {
    const answer = input.learnerAnswer.toLowerCase();
    const hasIfBranch = /if\s+[^:\n]+:/.test(answer);
    const hasElseBranch = /else\s*:/.test(answer);
    const hasComparison = /=>/.test(answer) || />=/.test(answer) || /==/.test(answer);

    if (input.kind === "qcm") {
      const correct = input.correctAnswer
        ? answer === input.correctAnswer.toLowerCase()
        : false;

      return correct
        ? {
            correct: true,
            score: 100,
            mistake: "",
            explanation: input.correctAnswer
              ? `Correct. ${input.correctAnswer}`
              : "Correct.",
            hint: "",
            weakness: input.topic,
            masteryLevel: "intermediate",
          }
        : {
            correct: false,
            score: 35,
            mistake: "You selected the wrong outcome of the condition.",
            explanation:
              "age is 20, so the condition age >= 18 is true and the if branch runs. " +
              "The else branch only runs when the condition is false.",
            hint: "Read the condition from left to right, then ask what happens if it is true.",
            weakness: IF_ELSE_TOPIC,
            masteryLevel: "beginner",
          };
    }

    const correct = hasIfBranch && hasElseBranch && hasComparison;

    if (correct) {
      return {
        correct: true,
        score: 100,
        mistake: "",
        explanation: "Your if/else is correct and prints the right message.",
        hint: "",
        weakness: input.topic,
        masteryLevel: "intermediate",
      };
    }

    return {
      correct: false,
      score: 35,
      mistake: !hasIfBranch || !hasElseBranch
        ? "Your code is missing the if/else structure."
        : "Your comparison operator is wrong: you used = where >= or == is needed.",
      explanation:
        "A comparison such as age >= 18 must use >= to compare values. " +
        "A single = assigns a value instead, which is why the condition never behaves as expected.",
      hint: "Write if age >= 18: with two characters before the equals sign.",
      weakness: IF_ELSE_TOPIC,
      masteryLevel: "beginner",
    };
  },

  async suggestAdaptation(input) {
    const weak = input.masteryScore < 40;
    return {
      action: weak ? "remediation" : "same_level",
      topic: input.weaknesses[0] ?? input.topic,
      difficulty: weak ? 1 : 2,
      reason: weak ? "Repeated errors detected" : "Progressing at a steady pace",
      nextActivity: weak
        ? "Practice: Basic if/else conditions"
        : "Practice: if/else with several conditions",
    };
  },
};