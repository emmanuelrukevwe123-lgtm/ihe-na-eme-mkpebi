const SOURCE_LABEL = { jev: "decided by Jev", groq: "decided by Groq AI", openrouter: "decided by OpenRouter AI", ev: "decided by expected value" };

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
        <span className="winner-text">{result.choice}</span>
        <svg viewBox="0 0 200 16" preserveAspectRatio="none" aria-hidden="true">
          <path d="M3 10 C 40 4, 80 13, 120 7 S 175 5, 197 9" />
          <path d="M12 14 C 60 9, 120 15, 186 11" />
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
      {result.reasons?.length > 0 && (
        <>
          <h3 className="label reasons-head">Why go with it</h3>
          <ul className="reasons">
            {result.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </>
      )}
      {result.rationale && <p className="rationale">{result.rationale}</p>}
      <p className="disclaimer">This is advice, not an order. Sleep on the big ones.</p>
    </section>
  );
}
