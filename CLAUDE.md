# jev-decider ("Decide For Me")
Hand-drawn decision helper: situation + 2–6 options (optional outcomes) → pick, per-option probabilities, confidence.
Vite + React SPA (JavaScript, NOT TypeScript) + one Vercel function at api/decide.js. ES modules only. Node 20+.
Full write-up: PROJECT_SUMMARY.md. Original plan: `C:\Users\Manuel Ruky\Downloads\JEV decision app build plan.md`.
Owner's GitHub: https://github.com/emmanuelrukevwe123-lgtm (linked in Footer.jsx).

## Commands
- dev: `npm run dev` → http://localhost:5173 (vite.config.js serves api/*.js locally and reads .env.local; the Vercel CLI isn't needed)
- build: `npm run build` · lint: `npx oxlint`
- test API: `curl -s -X POST localhost:5173/api/decide -H 'content-type: application/json' -d @sample.json`
- Windows host: the PowerShell tool is primary. Headless UI checks used playwright-core with `channel: "msedge"`, installed in a scratch dir, not in this repo.

## Contract
POST /api/decide {situation, options:[{name, outcomes?:[{label?,p,value}]}]}
-> {choice, probabilities, confidence, rationale?, source: "jev"|"groq"|"ev"}
Engine chosen by env DECIDER (jev | groq | ev, default ev); any engine error falls back to lib/ev.js with a note in rationale.
The UI sends outcome chance as a percentage; Decider.jsx converts it to p = pct/100.

## Rules
- IMPORTANT: API keys (TYPESAFE_API_KEY, GROQ_API_KEY) are server-only, read via process.env in api/ or lib/. Never use a VITE_ prefix for secrets.
- Frontend must not know which engine answered except via `source`.
- UI is deliberately hand-drawn: sketchy borders go on `::before` with `filter:url(#rough)` (filters defined in index.html) so text stays crisp. Colors are tokens on :root with a dark-mode (chalkboard) override. Keep new UI in that style.
- Keep the winner text readable: nothing may be drawn over it (a red circle was removed for that reason).
- Must stay responsive: check 320/390/768/1280 px with no horizontal scroll. Touch targets ≥44px on coarse pointers.
- Views: `/` is Landing.jsx, `/#decide` is Decider.jsx, switched on location.hash in App.jsx. No router, so no vercel.json rewrites needed.
- localStorage keys: `decide-history-v1` (last 20 decisions) and `decide-draft-v1` (form + last result). Wrap every access in try/catch.
- Jev SDK client uses timeout 6000 and retry maxRetries 1 (the SDK default is ~27s worst case, too slow for fallback).
- Out of scope: auth, database, React Router, TypeScript.
- Run `npm run build` before every commit; commit after each verified change.

## Progress (as of 2026-09-23)
Done and committed (git, branch main, local only):
1. Engines + API: ev/groq/jev, validation, response normalization, EV fallback. Tested fallback with bogus keys (401 → EV in ~1s).
2. Hand-drawn UI: notebook paper, Caveat/Patrick Hand fonts, wobbly borders, hatched probability bars, highlighter + underline on the winner.
3. Outcomes have a "what could happen?" label plus chance % and good/bad (±).
4. Form, result and history persist across refresh; "start over" button clears the form.
5. Landing page (how it works, "Just for fun!" sticky note, GitHub footer link); mobile layout polish.
6. Decorative desk pencil (Pencil.jsx; bottom-right fixed on desktop, below the footer on ≤760px) and a 24px pencil mouse cursor (`--pencil-cursor` in index.css, hotspot at the tip).
7. PROJECT_SUMMARY.md written.

## Next steps (not done yet)
- The owner must do these (they need a browser): get a Groq key (console.groq.com); install `vercel` (npm i -g) and `gh` (winget install GitHub.cli); run `gh auth login` and `vercel login`.
- Then: `gh repo create jev-decider --private --source=. --push`, import the repo at vercel.com, set env DECIDER=groq and GROQ_API_KEY (plus TYPESAFE_API_KEY if Jev access is granted), and smoke-test the live URL with each engine, including DECIDER=ev.
- If /api/decide 404s on Vercel, check Vercel's current Vite docs first (the plan flagged the root api/ folder as unverified).
- Jev's free window ends 2026-09-25. Keep DECIDER=groq in production unless Jev's cost is wanted.
