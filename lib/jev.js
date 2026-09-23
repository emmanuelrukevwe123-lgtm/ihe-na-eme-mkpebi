import { experimental_evaluate as evaluate } from "ai";

// Jev via the Vercel AI Gateway. The AI SDK reads AI_GATEWAY_API_KEY (a vck_ key);
// deployed on Vercel it can also authenticate through the project's OIDC token.
export async function jevDecide(situation, options) {
  const criteria = Object.fromEntries(
    options.map((o) => [o.name, o.outcomes?.length ? { outcomes: o.outcomes } : null]),
  );
  const { answers } = await evaluate({
    model: "typesafe-ai/jev",
    state: { situation, options },
    questions: {
      best: {
        type: "choice",
        instructions: "Which option is the best decision for the person in this situation?",
        criteria,
      },
    },
    maxRetries: 1,
    abortSignal: AbortSignal.timeout(6000),
  });
  const a = answers.best;
  // Jev returns no separate confidence; normalize() uses the winner's probability.
  return { choice: a.choice, probabilities: a.probabilities, source: "jev" };
}
