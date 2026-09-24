import { useEffect, useLayoutEffect, useRef, useState } from "react";

// Past decisions live in an envelope. Opening it draws the slips out one by
// one; closing flies them back in before the flap shuts.
const CLOSE_MS = 700; // slip-in (350ms) + the longest stagger (8 × 40ms)

const reduceMotion = () => {
  try {
    return matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
};

export default function History({ items, onPick, onClear }) {
  // closed → measure (slips laid out but hidden) → open → closing → closed
  const [phase, setPhase] = useState("closed");
  const box = useRef(null);
  const env = useRef(null);
  const timer = useRef(null);

  // Measure before the first paint so the slips start inside the envelope.
  useLayoutEffect(() => {
    if (phase !== "measure") return;
    aimAtEnvelope();
    // Deliberate: measuring needs a laid-out render before the animated one.
    // oxlint-disable-next-line react/set-state-in-effect
    setPhase("open");
  }, [phase]);

  useEffect(() => () => clearTimeout(timer.current), []);

  if (!items.length) return null;

  // Each slip flies from/to the envelope's mouth: store how far away it is.
  function aimAtEnvelope() {
    const art = env.current?.querySelector(".env-art");
    if (!art || !box.current) return;
    const e = env.current;
    // SVG has no offsetLeft, so place the art within the (untransformed) button.
    const a = art.getBoundingClientRect();
    const b = e.getBoundingClientRect();
    const mouthX = e.offsetLeft + a.left - b.left + a.width / 2;
    const mouthY = e.offsetTop + a.top - b.top + a.height * 0.55;
    for (const li of box.current.querySelectorAll(".slip")) {
      li.style.setProperty(
        "--dx",
        `${mouthX - (li.offsetLeft + li.offsetWidth / 2)}px`,
      );
      li.style.setProperty(
        "--dy",
        `${mouthY - (li.offsetTop + li.offsetHeight / 2)}px`,
      );
    }
  }

  function open() {
    clearTimeout(timer.current);
    setPhase("measure");
  }

  function close() {
    aimAtEnvelope();
    setPhase("closing");
    clearTimeout(timer.current);
    timer.current = setTimeout(
      () => setPhase("closed"),
      reduceMotion() ? 0 : CLOSE_MS,
    );
  }

  const isOpen = phase === "open" || phase === "measure";
  const last = Math.min(items.length - 1, 8);

  return (
    <section className={`archive ${phase}`} ref={box}>
      <button
        ref={env}
        type="button"
        className="envelope"
        aria-expanded={isOpen}
        aria-controls="past-decisions"
        onClick={isOpen ? close : open}
      >
        <EnvelopeArt />
        <span className="env-label">
          <span className="label">Past decisions</span>
          <span className="hint">
            {items.length} kept ·{" "}
            {isOpen ? "tap to put them back" : "tap to take them out"}
          </span>
        </span>
      </button>

      {phase !== "closed" && (
        <div id="past-decisions" className="slips">
          <ul className="history">
            {items.map((h, i) => (
              <li
                className="slip"
                key={h.id}
                style={{ "--i": Math.min(i, 8), "--back": last - Math.min(i, 8) }}
              >
                <button
                  type="button"
                  onClick={() => {
                    onPick(h);
                    close();
                  }}
                >
                  <span className="h-sit">
                    → <b>{h.result.choice}</b>
                    {h.situation
                      ? ` — ${h.situation.slice(0, 80)}${h.situation.length > 80 ? "…" : ""}`
                      : ""}
                  </span>
                  <span className="h-meta">
                    {new Date(h.at).toLocaleString()} · {h.result.source} ·{" "}
                    {Math.round(h.result.confidence * 100)}%
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="row spread slips-foot">
            <button type="button" className="btn link" onClick={close}>
              put them back
            </button>
            <button
              type="button"
              className="btn link"
              onClick={() => {
                setPhase("closed");
                onClear();
              }}
            >
              empty the envelope
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

// Drawn back to front: back, open flap (behind the paper), paper, front
// pocket, closed flap with its wax seal on top.
function EnvelopeArt() {
  return (
    <svg className="env-art" viewBox="0 0 160 120" aria-hidden="true">
      <rect className="env-back" x="5" y="45" width="150" height="70" rx="3" />
      <path className="env-flap-open" d="M5 45 L80 6 L155 45 Z" />
      <g className="env-paper">
        <rect x="22" y="37" width="116" height="66" rx="2" />
        <path d="M36 52h70M36 62h84M36 72h58" />
      </g>
      <path className="env-front" d="M5 45 L80 85 L155 45 V115 H5 Z" />
      <path className="env-fold" d="M7 113 L64 76 M153 113 L96 76" />
      <g className="env-flap-closed">
        <path d="M5 45 L80 88 L155 45 Z" />
        <circle className="env-seal" cx="80" cy="82" r="8" />
      </g>
    </svg>
  );
}
