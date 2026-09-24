import { evDecide } from "../lib/ev.js";
import { jevDecide } from "../lib/jev.js";
import { groqDecide } from "../lib/groq.js";
import { openrouterDecide } from "../lib/openrouter.js";

const ENGINES = {
  jev: jevDecide,
  groq: groqDecide,
  openrouter: openrouterDecide,
};

export function validate(body) {
  const { situation = "", options } = body ?? {};
  if (typeof situation !== "string" || situation.length > 4000)
    return "Situation must be text under 4000 characters.";
  if (!Array.isArray(options) || options.length < 2 || options.length > 6)
    return "Give between 2 and 6 options.";
  const seen = new Set();
  for (const o of options) {
    const name = typeof o?.name === "string" ? o.name.trim() : "";
    if (!name || name.length > 80)
      return "Every option needs a name under 80 characters.";
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
      if (
        oc.label !== undefined &&
        (typeof oc.label !== "string" || oc.label.length > 120)
      )
        return `Outcome descriptions for "${name}" must be text under 120 characters.`;
    }
  }
  return null;
}

function clean(options) {
  return options.map((o) => ({
    name: o.name.trim(),
    ...(o.outcomes?.length && {
      outcomes: o.outcomes.map((oc) => ({
        ...(oc.label?.trim() && { label: oc.label.trim() }),
        p: Number(oc.p),
        value: Number(oc.value),
      })),
    }),
  }));
}

// Non-empty strings from a model reply, trimmed and capped.
function texts(list, max, len) {
  return (Array.isArray(list) ? list : [])
    .filter((t) => typeof t === "string" && t.trim())
    .slice(0, max)
    .map((t) => t.trim().slice(0, len));
}

function normalize(result, options) {
  const names = options.map((o) => o.name);
  const raw = names.map((n) =>
    Math.max(0, Number(result.probabilities?.[n]) || 0),
  );
  const total = raw.reduce((a, b) => a + b, 0);
  if (!names.includes(result.choice) || total === 0)
    throw new Error(`bad ${result.source} response`);
  const probabilities = Object.fromEntries(
    names.map((n, i) => [n, raw[i] / total]),
  );
  const confidence = Math.min(
    1,
    Math.max(0, Number(result.confidence) || probabilities[result.choice]),
  );
  const reasons = texts(result.reasons, 4, 200);
  const understood = texts(result.understood, 4, 80);
  // Only keep "why not" lines for real options that lost.
  const whyNot = Object.fromEntries(
    names
      .filter((n) => n !== result.choice)
      .map((n) => [n, texts([result.whyNot?.[n]], 1, 200)[0]])
      .filter(([, why]) => why),
  );
  const changeIf = texts([result.changeIf], 1, 250)[0];
  return {
    choice: result.choice,
    probabilities,
    confidence,
    ...(understood.length && { understood }),
    ...(reasons.length && { reasons }),
    ...(Object.keys(whyNot).length && { whyNot }),
    ...(changeIf && { changeIf }),
    ...(typeof result.rationale === "string" && {
      rationale: result.rationale.slice(0, 600),
    }),
    source: result.source,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Use POST." });
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });

  const situation = (req.body.situation ?? "").trim();
  const options = clean(req.body.options);
  const names = engineOrder();
  for (const name of names) {
    try {
      return res
        .status(200)
        .json(normalize(await ENGINES[name](situation, options), options));
    } catch (e) {
      console.error(`[decide] ${name} failed:`, e.message);
    }
  }
  // Without outcomes, expected value is a tie and would just pick option 1.
  const hasOutcomes = options.some((o) => o.outcomes?.length);
  if (names.length && !hasOutcomes)
    return res
      .status(503)
      .json({ error: "Couldn't make a pick right now. Try again in a moment." });
  const note = names.length
    ? "The AI engine was unavailable, so this uses expected value."
    : undefined;
  return res.status(200).json(evDecide(options, note));
}

// DECIDER is tried first and DECIDER_NEXT if it fails. From DECIDER_SWITCH_AT
// (an ISO time with offset) onwards, only DECIDER_NEXT is used.
export function engineOrder(now = Date.now()) {
  const { DECIDER, DECIDER_NEXT, DECIDER_SWITCH_AT } = process.env;
  const switched = DECIDER_NEXT && Date.parse(DECIDER_SWITCH_AT) <= now;
  const order = switched ? [DECIDER_NEXT] : [DECIDER, DECIDER_NEXT];
  return [...new Set(order)].filter((n) => ENGINES[n]);
}
