import { useEffect, useState } from "react";
import DecisionForm from "./components/DecisionForm.jsx";
import ResultCard from "./components/ResultCard.jsx";
import History from "./components/History.jsx";
import Footer from "./components/Footer.jsx";

const STORE_KEY = "decide-history-v1";
const DRAFT_KEY = "decide-draft-v1";
const MAX_HISTORY = 20;
// Options are optional: none means the AI works them out from the situation.
const EMPTY_OPTIONS = [];

function load(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable (private mode); data just won't persist
  }
}

function loadHistory() {
  const items = load(STORE_KEY);
  return Array.isArray(items) ? items : [];
}

// Older drafts and history entries also carry outcomes and empty boxes;
// keep only the filled-in names.
const namesOnly = (options) =>
  Array.isArray(options)
    ? options.filter((o) => typeof o?.name === "string" && o.name.trim()).map((o) => ({ name: o.name }))
    : null;

function loadDraft() {
  const d = load(DRAFT_KEY);
  return {
    situation: typeof d?.situation === "string" ? d.situation : "",
    options: namesOnly(d?.options) ?? EMPTY_OPTIONS,
    result: d?.result?.probabilities ? d.result : null,
  };
}

const saveHistory = (items) => save(STORE_KEY, items);

function toPayload(situation, options) {
  const names = options.map((o) => o.name.trim()).filter(Boolean);
  if (names.length === 1)
    return { error: "Add at least one more option, or remove it and let the AI find them." };
  if (!names.length && !situation.trim()) return { error: "Describe the situation first." };
  if (new Set(names.map((n) => n.toLowerCase())).size !== names.length)
    return { error: "Two options have the same name." };
  return {
    body: {
      situation: situation.trim(),
      ...(names.length && { options: names.map((name) => ({ name })) }),
    },
  };
}

export default function Decider() {
  const [draft] = useState(loadDraft);
  const [situation, setSituation] = useState(draft.situation);
  const [options, setOptions] = useState(draft.options);
  const [result, setResult] = useState(draft.result);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(loadHistory);

  useEffect(() => save(DRAFT_KEY, { situation, options, result }), [situation, options, result]);

  function startOver() {
    setSituation("");
    setOptions(EMPTY_OPTIONS);
    setResult(null);
    setError("");
  }

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
      <a className="back" href="#">← what is this?</a>
      <h1 className="title">Decide For Me</h1>
      <div className="row spread subtitle">
        <span>Scribble down the dilemma. Get a pick, the odds, and how sure it is.</span>
        <button type="button" className="btn small" onClick={startOver}>
          start over
        </button>
      </div>

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
      {result && !loading && (
        <ResultCard
          result={result}
          onEditOptions={(names) => {
            setOptions(names.map((name) => ({ name })));
            document.getElementById("situation")?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
        />
      )}

      <History
        items={history}
        onPick={(h) => {
          setSituation(h.situation);
          setOptions(namesOnly(h.options) ?? EMPTY_OPTIONS);
          setResult(h.result);
          setError("");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onClear={() => {
          setHistory([]);
          saveHistory([]);
        }}
      />

      <Footer note="History stays in this browser only." />
    </main>
  );
}
