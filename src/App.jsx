import { useState } from "react";
import DecisionForm from "./components/DecisionForm.jsx";
import ResultCard from "./components/ResultCard.jsx";
import History from "./components/History.jsx";

const STORE_KEY = "decide-history-v1";
const MAX_HISTORY = 20;

function loadHistory() {
  try {
    const items = JSON.parse(localStorage.getItem(STORE_KEY));
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function saveHistory(items) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(items));
  } catch {
    // storage unavailable (private mode); history just won't persist
  }
}

function toPayload(situation, options) {
  const named = options.filter((o) => o.name.trim());
  for (const o of named) {
    for (const oc of o.outcomes) {
      if (oc.pct === "" && oc.value === "" && !oc.label?.trim()) continue;
      const p = Number(oc.pct);
      if (oc.pct === "" || oc.value === "" || !(p >= 0 && p <= 100))
        return { error: `For each outcome of "${o.name.trim()}", fill in a chance (0–100) and how good or bad it is.` };
    }
  }
  const names = named.map((o) => o.name.trim().toLowerCase());
  if (new Set(names).size !== names.length) return { error: "Two options have the same name." };
  return {
    body: {
      situation: situation.trim(),
      options: named.map((o) => {
        const outcomes = o.outcomes
          .filter((oc) => oc.pct !== "" && oc.value !== "")
          .map((oc) => ({
            ...(oc.label?.trim() && { label: oc.label.trim() }),
            p: Number(oc.pct) / 100,
            value: Number(oc.value),
          }));
        return outcomes.length ? { name: o.name.trim(), outcomes } : { name: o.name.trim() };
      }),
    },
  };
}

export default function App() {
  const [situation, setSituation] = useState("");
  const [options, setOptions] = useState([
    { name: "", outcomes: [] },
    { name: "", outcomes: [] },
  ]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(loadHistory);

  async function decide() {
    setError("");
    const { body, error: formError } = toPayload(situation, options);
    if (formError) return setError(formError);
    setLoading(true);
    try {
      const res = await fetch("/api/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `The server said no (${res.status}). Try again in a moment.`);
      setResult(data);
      const entry = { id: crypto.randomUUID(), at: Date.now(), situation: body.situation, options, result: data };
      const next = [entry, ...history].slice(0, MAX_HISTORY);
      setHistory(next);
      saveHistory(next);
    } catch (e) {
      setError(e.name === "TimeoutError" ? "That took too long. Check your connection and try again." : e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <h1 className="title">Decide For Me</h1>
      <p className="subtitle">Scribble down the dilemma. Get a pick, the odds, and how sure it is.</p>

      <DecisionForm
        situation={situation}
        setSituation={setSituation}
        options={options}
        setOptions={setOptions}
        onSubmit={decide}
        loading={loading}
      />

      {error && <p className="error" role="alert">{error}</p>}
      {loading && (
        <p className="loading" aria-live="polite">
          thinking<span>.</span><span>.</span><span>.</span>
        </p>
      )}
      {result && !loading && <ResultCard result={result} />}

      <History
        items={history}
        onPick={(h) => {
          setSituation(h.situation);
          setOptions(h.options);
          setResult(h.result);
          setError("");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onClear={() => {
          setHistory([]);
          saveHistory([]);
        }}
      />

      <p className="footer">History stays in this browser only.</p>
    </main>
  );
}
