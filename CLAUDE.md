# ihe-na-eme-mkpebi ("Decide For Me")
Project, GitHub repo and Vercel project name: ihe-na-eme-mkpebi (Igbo, roughly "the thing that makes decisions"). The local folder is funproJX\ihe-na-eme-mkpebi (renamed from jev-decider on 2026-09-24).
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
-> {choice, probabilities, confidence, reasons?, rationale?, source: "jev"|"groq"|"openrouter"|"ev"}
Engine chosen by env DECIDER (jev | groq | openrouter | ev, default ev). Optional DECIDER_NEXT is tried if DECIDER fails; from DECIDER_SWITCH_AT (ISO time with offset) only DECIDER_NEXT is used. If every engine fails, lib/ev.js answers with a note in rationale, but only when outcomes were sent; with names only the API returns 503 {error} (EV would be a meaningless tie). OpenRouter retries once on a network error, 429, 5xx or unreadable reply (not on timeout or other 4xx), so EV is used only when OpenRouter really does not work.
The UI sends option names only (no outcomes): the AI does the weighing. reasons (2–4 short strings, shown as "Why go with it") come from OpenRouter/Groq; Jev's evaluate API returns only choice + probabilities, so Jev answers have none. outcomes stay in the API contract for direct callers and the EV fallback.

## Rules
- IMPORTANT: API keys (AI_GATEWAY_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY) are server-only, read via process.env in api/ or lib/. Never use a VITE_ prefix for secrets.
- Frontend must not know which engine answered except via `source`.
- UI is deliberately hand-drawn: sketchy borders go on `::before` with `filter:url(#rough)` (filters defined in index.html) so text stays crisp. Colors are tokens on :root with a dark-mode (chalkboard) override. Keep new UI in that style.
- Keep the winner text readable: nothing may be drawn over it (a red circle was removed for that reason).
- Must stay responsive: check 320/390/768/1280 px with no horizontal scroll. Touch targets ≥44px on coarse pointers.
- Views: `/` is Landing.jsx, `/#decide` is Decider.jsx, switched on location.hash in App.jsx. No router, so no vercel.json rewrites needed.
- localStorage keys: `decide-history-v1` (last 20 decisions) and `decide-draft-v1` (form + last result). Wrap every access in try/catch.
- Jev is called through the Vercel AI Gateway with the AI SDK (`experimental_evaluate`, model `typesafe-ai/jev`, key AI_GATEWAY_API_KEY = vck_...). Timeout 6000 and maxRetries 1 so fallback stays fast. The old @typesafe-ai/sdk was removed: vck_ keys get 401 from api.typesafe.ai.
- Out of scope: auth, database, React Router, TypeScript.
- Run `npm run build` before every commit; commit after each verified change.

## Progress (as of 2026-09-23)
Done and committed (git, branch main, local only):
1. Engines + API: ev/groq/jev, validation, response normalization, EV fallback. Tested fallback with bogus keys (401 → EV in ~1s).
2. Hand-drawn UI: notebook paper, Caveat/Patrick Hand fonts, wobbly borders, hatched probability bars, highlighter + underline on the winner.
3. Outcomes (label, chance %, good/bad) were in the form but removed 2026-09-24: users only name options.
4. Form, result and history persist across refresh; "start over" button clears the form.
5. Landing page (how it works, "Just for fun!" sticky note, GitHub footer link); mobile layout polish.
6. Decorative desk pencil (Pencil.jsx; bottom-right fixed on desktop, below the footer on ≤760px) and a 24px pencil mouse cursor (`--pencil-cursor` in index.css, hotspot at the tip).
7. PROJECT_SUMMARY.md written.
8. OpenRouter engine (lib/openrouter.js, DECIDER=openrouter, OPENROUTER_MODEL is a comma-separated fallback list, default nvidia/nemotron-3-super-120b-a12b:free,openrouter/free; reasoning is disabled because thinking models ran past the 15s timeout; gemma-4 free models were 429 upstream on 2026-09-24). Free tier checked 2026-09-24: 20 req/min, 50 req/day (1000/day after $10 of credits). Fallback tested with a bogus key (401 → EV).
9. Scheduled switch: DECIDER=jev, DECIDER_NEXT=openrouter, DECIDER_SWITCH_AT=2026-09-24T23:00:00+01:00 (owner is UTC+1). Before then Jev is tried first with OpenRouter as backup; after, OpenRouter only. Set the same three vars on Vercel.
10. Jev moved to the Vercel AI Gateway (lib/jev.js uses the `ai` package; @typesafe-ai/sdk removed).

## Next steps (not done yet)
- Groq has no free key for the owner, so it is dropped in favour of OpenRouter. The owner must do these (they need a browser): get an OpenRouter key (openrouter.ai, no card); install `vercel` (npm i -g) and `gh` (winget install GitHub.cli); run `gh auth login` and `vercel login`.
- Then: `gh repo create ihe-na-eme-mkpebi --private --source=. --push`, import the repo at vercel.com, set env DECIDER=jev + AI_GATEWAY_API_KEY until Jev's window ends, then DECIDER=openrouter + OPENROUTER_API_KEY, and smoke-test the live URL with each engine, including DECIDER=ev.
- If /api/decide 404s on Vercel, check Vercel's current Vite docs first (the plan flagged the root api/ folder as unverified).
- Jev's free window ends 2026-09-25; switch production to DECIDER=openrouter then. Jev via AI Gateway verified working locally 2026-09-24 (~2.8s); it is free on the gateway until 2026-09-25. OpenRouter key verified working locally (real decisions in ~2–4s).
