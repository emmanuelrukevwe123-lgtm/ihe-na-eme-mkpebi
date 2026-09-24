import Footer from "./components/Footer.jsx";

const STEPS = [
  { title: "Describe it", body: "Type or say what you're stuck on." },
  { title: "Decide", body: "The AI weighs it up for you." },
  { title: "Get a pick", body: "See what to go with, and why." },
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

      <aside className="sticky-note">
        <h3>Just for fun!</h3>
        <p>A nudge, not professional advice.</p>
        <p>
          What you type or say is sent to the AI. Past decisions stay in your
          browser.
        </p>
      </aside>

      <Footer />
    </main>
  );
}
