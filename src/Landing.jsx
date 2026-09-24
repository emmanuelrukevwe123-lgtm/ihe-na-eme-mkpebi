import Footer from "./components/Footer.jsx";

const STEPS = [
  {
    title: "Describe it",
    body: "Write down the situation you're stuck on (a job, a trip, a purchase, anything) and what matters to you.",
  },
  {
    title: "Name your options",
    body: "List the two to six choices you're torn between.",
  },
  {
    title: "Get a pick",
    body: "The AI weighs everything for you and tells you which option to go with, why, the odds for each, and how sure it is.",
  },
];

export default function Landing() {
  return (
    <main className="page landing">
      <h1 className="title">Decide For Me</h1>
      <p className="lead">
        An app that makes up your mind for you when you can't.
      </p>

      <a className="btn primary cta" href="#decide">
        Start deciding →
      </a>

      <h2 className="label section-head">How it works</h2>
      <ol className="steps">
        {STEPS.map((s, i) => (
          <li className={`sketch ${i % 2 ? "tilt-r" : "tilt-l"}`} key={s.title}>
            <span className="step-num">{i + 1}</span>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </li>
        ))}
      </ol>

      <h2 className="label section-head">Under the hood</h2>
      <p>
        An AI decision model reads your situation, works out what could happen
        with each option and how much it matters to you, then gives every option
        a chance of being the right call. The one with the best odds is your
        pick.
      </p>

      <aside className="sticky-note">
        <h3>Just for fun!</h3>
        <p>
          This is a little side project, not professional advice. Treat the
          answer as a nudge, and give the big life decisions more thought than
          an app can.
        </p>
        <p>
          Your past decisions are saved only in your own browser. What you type
          is sent to the AI to get an answer. If you use the 🎤 button, your
          browser may send your voice to Google, Apple or Microsoft to turn it
          into text.
        </p>
      </aside>

      <div className="row cta-bottom">
        <a className="btn primary" href="#decide">
          Try it now →
        </a>
      </div>

      <Footer />
    </main>
  );
}
