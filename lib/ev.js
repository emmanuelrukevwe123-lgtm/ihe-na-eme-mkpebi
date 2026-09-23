export function expectedValue(outcomes = []) {
  return outcomes.reduce((sum, o) => sum + Number(o.p) * Number(o.value), 0);
}

export function evDecide(options, note) {
  const evs = options.map((o) => expectedValue(o.outcomes));
  const max = Math.max(...evs);
  const exps = evs.map((ev) => Math.exp(ev - max));
  const total = exps.reduce((a, b) => a + b, 0);
  const probabilities = Object.fromEntries(options.map((o, i) => [o.name, exps[i] / total]));
  const best = options[evs.indexOf(max)].name;
  const hasOutcomes = options.some((o) => o.outcomes?.length);
  const summary = hasOutcomes
    ? options.map((o, i) => `${o.name}: EV ${evs[i].toFixed(2)}`).join(" · ")
    : "No outcomes given, so every option scores the same. Add outcomes for a real comparison.";
  return {
    choice: best,
    probabilities,
    confidence: probabilities[best],
    rationale: note ? `${note} ${summary}` : summary,
    source: "ev",
  };
}
