import { systemPrompt } from "./prompt.js";

// Free models (IDs ending in ":free") come and go, get overloaded or answer
// slowly, so OPENROUTER_MODEL is a comma-separated list tried in order.
// Benchmarked 2026-09-24: nex-n2.5-mini answered in ~2-3s and gave the same
// pick twice; Nemotron Super is similar when Nvidia isn't overloaded;
// openrouter/free picks any available free model as a last resort.
const DEFAULT_MODELS =
  "nex-agi/nex-n2.5-mini:free,nvidia/nemotron-3-super-120b-a12b:free,openrouter/free";
// OpenRouter's own fallback only moves on when a model errors, not when it is
// slow, so each model gets its own time limit and the next one takes over.
const PER_MODEL_MS = 7000;
// The whole call must finish before the page gives up waiting (20s).
const TOTAL_MS = 18000;

export async function openrouterJSON(system, user, valid = () => true) {
  const models = (process.env.OPENROUTER_MODEL || DEFAULT_MODELS)
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  const deadline = Date.now() + TOTAL_MS;
  let lastError;
  for (const model of models) {
    const left = deadline - Date.now();
    if (left < 1000) break;
    try {
      const out = await callModel(model, system, user, Math.min(PER_MODEL_MS, left));
      if (valid(out)) return out;
      lastError = new Error(`${model} gave an incomplete answer`);
    } catch (e) {
      // A bad key fails the same way for every model, so stop right away.
      if (e.status === 401) throw e;
      lastError = e;
    }
    console.error(`[openrouter] ${model} failed:`, lastError.message);
  }
  throw lastError ?? new Error("openrouter: no time left");
}

export async function openrouterDecide(situation, options) {
  const names = options.map((o) => o.name);
  const out = await openrouterJSON(
    systemPrompt(names),
    { situation, options },
    (o) => typeof o.choice === "string" && o.probabilities && typeof o.probabilities === "object",
  );
  return { ...out, source: "openrouter" };
}

async function callModel(model, system, user, timeout) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    signal: AbortSignal.timeout(timeout),
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "X-Title": "Decide For Me",
    },
    body: JSON.stringify({
      model,
      // Thinking models (e.g. Nemotron) otherwise reason past the time limit.
      reasoning: { enabled: false },
      // No randomness, so the same question gets the same pick.
      temperature: 0,
      seed: 7,
      max_tokens: 800,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(user) },
      ],
    }),
  });
  if (!res.ok)
    throw Object.assign(new Error(`${model}: HTTP ${res.status}`), { status: res.status });
  const j = await res.json();
  // Upstream failures (e.g. "Service temporarily overloaded") arrive as HTTP 200.
  if (j.error) throw new Error(`${model}: ${j.error.message}`);
  // Some free models wrap the JSON in ```fences or add text around it.
  const text = j.choices?.[0]?.message?.content ?? "";
  try {
    return JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
  } catch {
    throw new Error(`${model} returned no JSON`);
  }
}
