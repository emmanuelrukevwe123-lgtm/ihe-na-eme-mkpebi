import { useEffect, useRef, useState } from "react";

// Browser speech-to-text (Chrome, Edge, Safari). Firefox has none, so the
// button is simply not shown there.
const Recognition =
  typeof window !== "undefined" &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);
// Android's continuous mode repeats words, so there it stops after each pause.
const continuous =
  typeof navigator !== "undefined" && !/Android/i.test(navigator.userAgent);
// Only one mic listens at a time.
let active = null;

export default function MicButton({ value, onChange, label, maxLength }) {
  const [listening, setListening] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const rec = useRef(null);

  useEffect(() => () => rec.current?.abort(), []);

  if (!Recognition) return null;

  function start() {
    active?.stop();
    const r = new Recognition();
    r.lang = navigator.language || "en-US";
    r.interimResults = true;
    r.continuous = continuous;
    // Speech is added after whatever is already typed.
    const base = value.trim() ? `${value.trimEnd()} ` : "";
    r.onresult = (e) => {
      const said = [...e.results]
        .map((res) => res[0].transcript)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      onChange((base + said).slice(0, maxLength));
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed")
        setBlocked(true);
    };
    r.onend = () => {
      setListening(false);
      if (active === r) active = null;
    };
    rec.current = r;
    active = r;
    try {
      r.start();
      setListening(true);
    } catch {
      // start() throws if this recognizer is already running; nothing to do.
    }
  }

  return (
    <button
      type="button"
      className={`btn small mic ${listening ? "listening" : ""}`}
      aria-label={
        blocked
          ? "Microphone blocked. Allow it in your browser settings."
          : listening
            ? "Stop listening"
            : label
      }
      title={blocked ? "Microphone blocked" : listening ? "Stop" : label}
      aria-pressed={listening}
      disabled={blocked}
      onClick={() => (listening ? rec.current?.stop() : start())}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="9" y="2.5" width="6" height="12" rx="3" />
        <path d="M5.5 11.5c0 3.8 2.9 6.6 6.5 6.6s6.5-2.8 6.5-6.6M12 18.1v3.4M8.5 21.6h7" />
      </svg>
    </button>
  );
}
