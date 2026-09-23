import { TypeSafeClient, choice } from "@typesafe-ai/sdk";

export async function jevDecide(situation, options) {
  const client = new TypeSafeClient({ timeout: 6000, retry: { maxRetries: 1 } });
  const criteria = Object.fromEntries(
    options.map((o) => [o.name, o.outcomes?.length ? { outcomes: o.outcomes } : null]),
  );
  const { answers } = await client.systemOne({
    state: { situation, options },
    questions: { best: choice("Which option is the best decision for the person in this situation?", criteria) },
  });
  const a = answers.best;
  return { choice: a.choice, probabilities: a.probabilities, confidence: a.confidence, source: "jev" };
}
