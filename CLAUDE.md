# jev-decider
Vite + React SPA (JavaScript, NOT TypeScript) + one Vercel function at api/decide.js.
ES modules only. Node 20+.

## Commands
- dev: `npm run dev` (vite.config.js serves api/*.js locally, reads .env.local); `vercel dev` also works
- build: `npm run build`
- test API: `curl -s -X POST localhost:5173/api/decide -H 'content-type: application/json' -d @sample.json`

## Contract
POST /api/decide {situation, options:[{name, outcomes?:[{label?,p,value}]}]}
-> {choice, probabilities, confidence, rationale?, source: "jev"|"groq"|"ev"}
Engine chosen by env DECIDER; any error falls back to lib/ev.js.

## Rules
- IMPORTANT: API keys (TYPESAFE_API_KEY, GROQ_API_KEY) are server-only, read via process.env in api/ or lib/. Never use a VITE_ prefix for secrets.
- Frontend must not know which engine answered except via `source`.
- UI is deliberately hand-drawn: sketchy borders go on `::before` with `filter:url(#rough)` (filters defined in index.html) so text stays crisp. Keep new UI in that style.
- Views: `/` is Landing.jsx, `/#decide` is Decider.jsx, switched on location.hash in App.jsx. No router, so no vercel.json rewrites needed.
- Out of scope: auth, database, React Router, TypeScript.
- Run `npm run build` before every commit; commit after each phase.
