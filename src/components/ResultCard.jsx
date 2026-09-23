const SOURCE_LABEL = { jev: "decided by Jev", groq: "decided by Groq AI", ev: "decided by expected value" };

const pct = (x) => `${Math.round(x * 100)}%`;

export default function ResultCard({ result }) {
  const entries = Object.entries(result.probabilities).sort((a, b) => b[1] - a[1]);

  return (
    <section className="sketch tilt-r" aria-live="polite">
      <div className="row spread">
        <h2 className="label" style={{ margin: 0 }}>Go with…</h2>
        <span className="stamp">{SOURCE_LABEL[result.source] ?? result.source}</span>
      </div>

      <div className="winner draw" key={result.choice + result.confidence}>
        {result.choice}
        <svg viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true">
          <path d="M18 34 C 10 10, 70 2, 110 4 C 160 6, 196 14, 192 32 C 188 52, 130 58, 90 57 C 40 56, 4 48, 8 30 C 11 18, 40 10, 70 8" />
        </svg>
      </div>

      {entries.map(([name, p]) => (
        <div className={`bar-row ${name === result.choice ? "top" : ""}`} key={name}>
          <div className="bar-label">
            <b>{name}</b>
            <span>{pct(p)}</span>
          </div>
          <div className="bar-track" role="img" aria-label={`${name}: ${pct(p)}`}>
            <div className="bar-fill" style={{ width: `calc(${Math.max(p * 100, 1.5)}% - 6px)` }} />
          </div>
        </div>
      ))}

      <p className="confidence">
        confidence: <mark>{pct(result.confidence)}</mark>
      </p>
      {result.rationale && <p className="rationale">{result.rationale}</p>}
      <p className="disclaimer">This is advice, not an order. Sleep on the big ones.</p>
    </section>
  );
}
