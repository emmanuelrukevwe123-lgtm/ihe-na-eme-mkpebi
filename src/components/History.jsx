export default function History({ items, onPick, onClear }) {
  if (!items.length) return null;
  return (
    <section className="sketch">
      <div className="row spread">
        <h2 className="label" style={{ margin: 0 }}>Past decisions</h2>
        <button type="button" className="btn link" onClick={onClear}>
          clear
        </button>
      </div>
      <ul className="history">
        {items.map((h) => (
          <li key={h.id}>
            <button type="button" onClick={() => onPick(h)}>
              <span className="h-sit">
                → <b>{h.result.choice}</b>
                {h.situation ? ` — ${h.situation.slice(0, 80)}${h.situation.length > 80 ? "…" : ""}` : ""}
              </span>
              <span className="h-meta">
                {new Date(h.at).toLocaleString()} · {h.result.source} · {Math.round(h.result.confidence * 100)}%
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
