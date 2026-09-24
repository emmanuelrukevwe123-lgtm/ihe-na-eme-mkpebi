import { useState } from "react";
import MicButton from "./MicButton.jsx";

const MAX_OPTIONS = 6;

export default function DecisionForm({
  situation,
  setSituation,
  options,
  setOptions,
  onSubmit,
  loading,
}) {
  const update = (i, patch) =>
    setOptions(options.map((o, j) => (j === i ? { ...o, ...patch } : o)));

  const filled = options.filter((o) => o.name.trim()).length;
  const [finding, setFinding] = useState(false);
  const [findNote, setFindNote] = useState("");

  // After the situation is spoken, let the AI fill in the options, but only
  // if the user hasn't started typing them.
  async function findOptions(text) {
    if (filled) return;
    setFinding(true);
    setFindNote("");
    try {
      const res = await fetch("/api/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situation: text }),
        signal: AbortSignal.timeout(20000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(
          data.error || "Couldn't find the options. Type them in instead.",
        );
      if (!data.options?.length)
        return setFindNote("I couldn't spot the options. Type them in below.");
      setOptions((prev) =>
        prev.some((o) => o.name.trim())
          ? prev
          : data.options.map((name) => ({ name })),
      );
    } catch (e) {
      setFindNote(
        e.name === "TimeoutError"
          ? "Couldn't find the options. Type them in instead."
          : e.message,
      );
    } finally {
      setFinding(false);
    }
  }

  return (
    <form
      className="sketch tilt-l"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="row spread label-row">
        <label className="label" htmlFor="situation">
          What's the situation?
        </label>
        <MicButton
          value={situation}
          onChange={setSituation}
          onDone={findOptions}
          label="Speak the situation"
          maxLength={4000}
        />
      </div>
      <textarea
        id="situation"
        className="field"
        maxLength={4000}
        placeholder="e.g. I got two job offers and need to answer by Friday. The startup pays less but I'd learn a lot; I have rent to cover…"
        value={situation}
        onChange={(e) => setSituation(e.target.value)}
      />
      <p className="hint" style={{ margin: "4px 0 0" }}>
        The more you say about what matters to you, the better the pick.
      </p>

      <h2 className="label" style={{ marginTop: 22 }}>
        Your options
      </h2>
      <p className="hint" style={{ margin: 0 }}>
        The two to six choices you're torn between.
      </p>
      {finding && (
        <p className="hint finding" aria-live="polite">
          picking out your options<span>.</span><span>.</span><span>.</span>
        </p>
      )}
      {findNote && !finding && (
        <p className="hint" role="status">
          {findNote}
        </p>
      )}

      {options.map((o, i) => (
        <div className="option" key={i}>
          <div className="option-head">
            <span className="option-num">{i + 1}.</span>
            <input
              className="field"
              aria-label={`Option ${i + 1} name`}
              maxLength={80}
              placeholder={
                i === 0
                  ? "Take the startup job"
                  : i === 1
                    ? "Stay where I am"
                    : "Another option"
              }
              value={o.name}
              onChange={(e) => update(i, { name: e.target.value })}
            />
            <MicButton
              value={o.name}
              // Speech results arrive over time, so update from the latest state.
              onChange={(name) =>
                setOptions((prev) =>
                  prev.map((p, j) => (j === i ? { ...p, name } : p)),
                )
              }
              label={`Speak option ${i + 1}`}
              maxLength={80}
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
        </div>
      ))}

      <div className="row spread form-actions" style={{ marginTop: 18 }}>
        <button
          type="button"
          className="btn"
          disabled={options.length >= MAX_OPTIONS}
          onClick={() => setOptions([...options, { name: "" }])}
        >
          + add option
        </button>
        <button
          type="submit"
          className="btn primary"
          disabled={loading || finding || filled < 2}
        >
          {loading ? "thinking…" : "Decide!"}
        </button>
      </div>
    </form>
  );
}
