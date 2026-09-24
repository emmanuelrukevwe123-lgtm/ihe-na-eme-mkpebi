import { useEffect, useRef, useState } from "react";

// Browser speech-to-text (Chrome, Edge, Safari). Firefox has none, so the
// button is simply not shown there.
const Recognition =
  typeof window !== "undefined" &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);
// Android's continuous mode repeats words, so there it stops after each pause.
const continuous =
  typeof navigator !== "undefined" && !/Android/i.test(navigator.userAgent);
// Stop listening after this much silence (the browser may keep going forever).
const SILENCE_MS = 4000;
// Only one mic listens at a time: this stops whichever one is on.
let stopActive = null;

// onDone(text) runs once when listening stops, if anything was heard.
export default function MicButton({
  value,
  onChange,
  onDone,
  label,
  maxLength,
}) {
  const [listening, setListening] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const stopRef = useRef(null);
  // Listening outlives the render that started it, so read the latest onDone.
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => () => stopRef.current?.(), []);

  if (!Recognition) return null;

  function start() {
    stopActive?.();
    const r = new Recognition();
    r.lang = navigator.language || "en-US";
    r.interimResults = true;
    r.continuous = continuous;
    // Speech is added after whatever is already typed.
    const base = value.trim() ? `${value.trimEnd()} ` : "";
    let timer;
    let heard = "";
    let stopped = false;
    // The button turns off right away; the browser can take a while to
    // report that it has finished, and sometimes never does.
    const stop = () => {
      clearTimeout(timer);
      if (stopped) return;
      stopped = true;
      setListening(false);
      if (stopActive === stop) stopActive = null;
      if (stopRef.current === stop) stopRef.current = null;
      try {
        r.stop();
      } catch {
        // already stopped
      }
      if (heard) onDoneRef.current?.(heard);
    };
    const waitForSilence = () => {
      clearTimeout(timer);
      timer = setTimeout(stop, SILENCE_MS);
    };
    r.onresult = (e) => {
      if (stopped) return;
      waitForSilence();
      const said = [...e.results]
        .map((res) => res[0].transcript)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      heard = (base + said).slice(0, maxLength);
      onChange(heard);
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed")
        setBlocked(true);
      stop();
    };
    r.onend = stop;
    try {
      r.start();
    } catch {
      return; // start() throws if this recognizer is already running
    }
    stopActive = stop;
    stopRef.current = stop;
    setListening(true);
    waitForSilence();
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
      onClick={() => (listening ? stopRef.current?.() : start())}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="9" y="2.5" width="6" height="12" rx="3" />
        <path d="M5.5 11.5c0 3.8 2.9 6.6 6.5 6.6s6.5-2.8 6.5-6.6M12 18.1v3.4M8.5 21.6h7" />
      </svg>
    </button>
  );
}
