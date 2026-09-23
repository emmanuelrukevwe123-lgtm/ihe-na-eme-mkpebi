import { evDecide } from "../lib/ev.js";
import { jevDecide } from "../lib/jev.js";
import { groqDecide } from "../lib/groq.js";

const ENGINES = { jev: jevDecide, groq: groqDecide };

export function validate(body) {
  const { situation = "", options } = body ?? {};
  if (typeof situation !== "string" || situation.length > 4000)
    return "Situation must be text under 4000 characters.";
  if (!Array.isArray(options) || options.length < 2 || options.length > 6)
    return "Give between 2 and 6 options.";
  const seen = new Set();
  for (const o of options) {
    const name = typeof o?.name === "string" ? o.name.trim() : "";
    if (!name || name.length > 80) return "Every option needs a name under 80 characters.";
    if (seen.has(name.toLowerCase())) return `Option "${name}" appears twice.`;
    seen.add(name.toLowerCase());
    if (o.outcomes === undefined) continue;
    if (!Array.isArray(o.outcomes) || o.outcomes.length > 10)
      return `Option "${name}" can have at most 10 outcomes.`;
    for (const oc of o.outcomes) {
      const p = Number(oc?.p);
      const v = Number(oc?.value);
      if (!(p >= 0 && p <= 1) || !Number.isFinite(v))
        return `Outcomes for "${name}" need a chance between 0 and 1 and a numeric value.`;
    }
  }
  return null;
}

function clean(options) {
  return options.map((o) => ({
    name: o.name.trim(),
    ...(o.outcomes?.length && {
      outcomes: o.outcomes.map((oc) => ({ p: Number(oc.p), value: Number(oc.value) })),
    }),
  }));
}

function normalize(result, options) {
  const names = options.map((o) => o.name);
  const raw = names.map((n) => Math.max(0, Number(result.probabilities?.[n]) || 0));
  const total = raw.reduce((a, b) => a + b, 0);
  if (!names.includes(result.choice) || total === 0) throw new Error(`bad ${result.source} response`);
  const probabilities = Object.fromEntries(names.map((n, i) => [n, raw[i] / total]));
  const confidence = Math.min(1, Math.max(0, Number(result.confidence) || probabilities[result.choice]));
  return {
    choice: result.choice,
    probabilities,
    confidence,
    ...(typeof result.rationale === "string" && { rationale: result.rationale.slice(0, 600) }),
    source: result.source,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });

  const situation = (req.body.situation ?? "").trim();
  const options = clean(req.body.options);
  const engine = ENGINES[process.env.DECIDER];
  if (engine) {
    try {
      return res.status(200).json(normalize(await engine(situation, options), options));
    } catch (e) {
      console.error(`[decide] ${process.env.DECIDER} failed:`, e.message);
      return res.status(200).json(evDecide(options, "The AI engine was unavailable, so this uses expected value."));
    }
  }
  return res.status(200).json(evDecide(options));
}
