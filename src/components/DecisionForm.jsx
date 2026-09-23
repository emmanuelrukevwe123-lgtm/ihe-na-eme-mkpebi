const MAX_OPTIONS = 6;
const MAX_OUTCOMES = 10;

export default function DecisionForm({ situation, setSituation, options, setOptions, onSubmit, loading }) {
  const update = (i, patch) => setOptions(options.map((o, j) => (j === i ? { ...o, ...patch } : o)));
  const updateOutcome = (i, k, patch) =>
    update(i, { outcomes: options[i].outcomes.map((oc, j) => (j === k ? { ...oc, ...patch } : oc)) });

  const filled = options.filter((o) => o.name.trim()).length;

  return (
    <form
      className="sketch tilt-l"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <label className="label" htmlFor="situation">What's the situation?</label>
      <textarea
        id="situation"
        className="field"
        maxLength={4000}
        placeholder="e.g. I got two job offers and need to answer by Friday…"
        value={situation}
        onChange={(e) => setSituation(e.target.value)}
      />

      <h2 className="label" style={{ marginTop: 22 }}>Your options</h2>
      <p className="hint" style={{ margin: 0 }}>
        Two to six. Outcomes are optional: add a chance and a value (say +8 good, −3 bad) for a sharper answer.
      </p>

      {options.map((o, i) => (
        <div className="option" key={i}>
          <div className="option-head">
            <span className="option-num">{i + 1}.</span>
            <input
              className="field"
              aria-label={`Option ${i + 1} name`}
              maxLength={80}
              placeholder={i === 0 ? "Take the startup job" : i === 1 ? "Stay where I am" : "Another option"}
              value={o.name}
              onChange={(e) => update(i, { name: e.target.value })}
            />
            {options.length > 2 && (
              <button
                type="button"
                className="btn small"
                aria-label={`Remove option ${i + 1}`}
                onClick={() => setOptions(options.filter((_, j) => j !== i))}
              >
                ✗
              </button>
            )}
          </div>

          {o.outcomes.map((oc, k) => (
            <div className="outcome" key={k}>
              <label>
                <small>chance %</small>
                <input
                  className="field"
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  inputMode="decimal"
                  value={oc.pct}
                  onChange={(e) => updateOutcome(i, k, { pct: e.target.value })}
                />
              </label>
              <label>
                <small>value (+/−)</small>
                <input
                  className="field"
                  type="number"
                  step="any"
                  inputMode="decimal"
                  value={oc.value}
                  onChange={(e) => updateOutcome(i, k, { value: e.target.value })}
                />
              </label>
              <button
                type="button"
                className="btn small"
                aria-label="Remove outcome"
                onClick={() => update(i, { outcomes: o.outcomes.filter((_, j) => j !== k) })}
              >
                ✗
              </button>
            </div>
          ))}

          {o.outcomes.length < MAX_OUTCOMES && (
            <div style={{ marginLeft: 36, marginTop: 4 }}>
              <button
                type="button"
                className="btn link"
                onClick={() => update(i, { outcomes: [...o.outcomes, { pct: "", value: "" }] })}
              >
                + outcome
              </button>
            </div>
          )}
        </div>
      ))}

      <div className="row spread" style={{ marginTop: 18 }}>
        <button
          type="button"
          className="btn"
          disabled={options.length >= MAX_OPTIONS}
          onClick={() => setOptions([...options, { name: "", outcomes: [] }])}
        >
          + add option
        </button>
        <button type="submit" className="btn primary" disabled={loading || filled < 2}>
          {loading ? "thinking…" : "Decide!"}
        </button>
      </div>
    </form>
  );
}
