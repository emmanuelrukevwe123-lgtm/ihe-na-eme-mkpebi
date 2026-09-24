import Footer from "./components/Footer.jsx";

const STEPS = [
  {
    title: "Describe it",
    body: "Write down the situation you're stuck on — a job, a trip, a purchase, anything.",
  },
  {
    title: "List your options",
    body: "Two to six choices. If you like, add what could happen with each, how likely it is, and how good or bad it'd be.",
  },
  {
    title: "Get a pick",
    body: "See which option wins, the odds for every option, and how confident the app is.",
  },
];

export default function Landing() {
  return (
    <main className="page landing">
      <h1 className="title">Decide For Me</h1>
      <p className="lead">
        A tiny, hand-drawn app that helps you make up your mind when you can't.
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
        An AI decision model weighs your situation and options. If the AI is
        busy or unavailable, the app falls back to good old expected-value maths
        (chance × how good it is), so you always get an answer.
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
          is sent to the AI to get an answer.
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
