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
POST /api/decide {situation, options?:[{name, outcomes?:[{label?,p,value}]}]}  (options optional: 0 or 2–6)
-> {choice, probabilities, confidence, understood?, reasons?, whyNot?, changeIf?, rationale?, source: "jev"|"groq"|"openrouter"|"ev"}
Engine chosen by env DECIDER (jev | groq | openrouter | ev, default ev). Optional DECIDER_NEXT is tried if DECIDER fails; from DECIDER_SWITCH_AT (ISO time with offset) only DECIDER_NEXT is used. If every engine fails, lib/ev.js answers with a note in rationale, but only when outcomes were sent; with names only the API returns 503 {error} (EV would be a meaningless tie). OpenRouter tries each model in OPENROUTER_MODEL in turn (our own loop, not OpenRouter's `models` fallback, which ignores slowness): 7s per model, 18s total so it beats the page's 20s timeout; any error, HTTP-200 error body, junk or incomplete reply moves to the next model; a 401 stops at once. temperature 0 + seed so the same question gets the same pick.
Options are optional: with none (situation required), the chat engines work them out in the same call (prompt asks for "options"), the reply has foundOptions: true, and Jev is skipped (it can only choose between listed options). The form hides option boxes until "+ add option" (first tap opens two); the result offers "edit them and decide again" when options were found. Landing page is deliberately minimal (owner's request 2026-09-24): don't add feature explanations there.
The UI sends option names only (no outcomes): the AI does the weighing. The trust fields (understood = what matters to the user, reasons, whyNot per losing option, changeIf) come from OpenRouter/Groq via the shared prompt in lib/prompt.js; the card also labels confidence as clear winner / leaning / close call (≥70 / ≥55 / below). Jev's evaluate API returns only choice + probabilities, so Jev answers have none. outcomes stay in the API contract for direct callers and the EV fallback.

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
8. OpenRouter engine (lib/openrouter.js, DECIDER=openrouter, OPENROUTER_MODEL is a comma-separated fallback list, default nex-agi/nex-n2.5-mini:free,nvidia/nemotron-3-super-120b-a12b:free,openrouter/free; reasoning is disabled because thinking models ran past the timeout. Benchmark 2026-09-24 with the situation-only prompt: nex-n2.5-mini 1.8–2.9s and consistent; Nemotron Super ~2–4s but often 'overloaded'; nemotron-3.5-lightning 29s; nex-n2.5-pro timed out; qwen3.8/gemma-4 429 upstream; inkling-small 403). Free tier checked 2026-09-24: 20 req/min, 50 req/day (1000/day after $10 of credits). Fallback tested with a bogus key (401 → EV).
9. Scheduled switch: DECIDER=jev, DECIDER_NEXT=openrouter, DECIDER_SWITCH_AT=2026-09-24T23:00:00+01:00 (owner is UTC+1). Before then Jev is tried first with OpenRouter as backup; after, OpenRouter only. Set the same three vars on Vercel.
12. Past decisions live in a hand-drawn envelope (History.jsx, 2026-09-24): phases closed → measure → open → closing; slips fly to/from the envelope's mouth using measured --dx/--dy (offsets relative to .archive, so keep .slips/.history unpositioned). Reduced motion skips the animation.
11. Voice input (2026-09-24): MicButton.jsx uses the browser Web Speech API (no server, no quota) on the situation and each option; hidden where unsupported (Firefox); speech is appended to typed text; non-continuous on Android (continuous mode repeats words there).
10. Jev moved to the Vercel AI Gateway (lib/jev.js uses the `ai` package; @typesafe-ai/sdk removed).

## Next steps (not done yet)
- Groq has no free key for the owner, so it is dropped in favour of OpenRouter. The owner must do these (they need a browser): get an OpenRouter key (openrouter.ai, no card); install `vercel` (npm i -g) and `gh` (winget install GitHub.cli); run `gh auth login` and `vercel login`.
- Then: `gh repo create ihe-na-eme-mkpebi --private --source=. --push`, import the repo at vercel.com, set env DECIDER=jev + AI_GATEWAY_API_KEY until Jev's window ends, then DECIDER=openrouter + OPENROUTER_API_KEY, and smoke-test the live URL with each engine, including DECIDER=ev.
- If /api/decide 404s on Vercel, check Vercel's current Vite docs first (the plan flagged the root api/ folder as unverified).
- Jev's free window ends 2026-09-25; switch production to DECIDER=openrouter then. Jev via AI Gateway verified working locally 2026-09-24 (~2.8s); it is free on the gateway until 2026-09-25. OpenRouter key verified working locally (real decisions in ~2–4s).
