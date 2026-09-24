import { systemPrompt } from "./prompt.js";

// Free models (IDs ending in ":free") come and go or get rate-limited upstream,
// so OPENROUTER_MODEL takes a comma-separated list that OpenRouter tries in order.
// openrouter/free picks any available free model.
const DEFAULT_MODELS = "nvidia/nemotron-3-super-120b-a12b:free,openrouter/free";

// Only give up (and let the API fall back) when OpenRouter really does not
// work: a network blip, 429, 5xx or unreadable reply gets one more try.
// A timeout or a 4xx such as a bad key does not.
export async function openrouterJSON(system, user) {
  try {
    return await callOnce(system, user);
  } catch (e) {
    if (!e.transient) throw e;
    console.error("[openrouter] retrying after:", e.message);
    return await callOnce(system, user);
  }
}

export async function openrouterDecide(situation, options) {
  const names = options.map((o) => o.name);
  const out = await openrouterJSON(systemPrompt(names), { situation, options });
  return { ...out, source: "openrouter" };
}

const transient = (message) => Object.assign(new Error(message), { transient: true });

async function callOnce(system, user) {
  const models = (process.env.OPENROUTER_MODEL || DEFAULT_MODELS).split(",").map((m) => m.trim()).filter(Boolean);
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    signal: AbortSignal.timeout(15000),
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "X-Title": "Decide For Me",
    },
    body: JSON.stringify({
      models,
      // Thinking models (e.g. Nemotron) otherwise reason past the timeout.
      reasoning: { enabled: false },
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(user) },
      ],
    }),
  }).catch((e) => {
    throw e.name === "TimeoutError" ? e : transient(`openrouter network error: ${e.message}`);
  });
  if (res.status === 429 || res.status >= 500) throw transient(`openrouter ${res.status}`);
  if (!res.ok) throw new Error(`openrouter ${res.status}`);
  const j = await res.json();
  // Some free models wrap the JSON in ```fences or add text around it.
  const text = j.choices?.[0]?.message?.content ?? "";
  const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  try {
    return JSON.parse(json);
  } catch {
    throw transient("openrouter returned no JSON");
  }
}
