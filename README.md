# Decide For Me

A hand-drawn decision helper. Describe a situation, list 2–6 options (optionally with chance/value outcomes), and get a pick with per-option probabilities and a confidence figure.

One `/api/decide` endpoint, three interchangeable engines picked by the `DECIDER` env var:

| `DECIDER` | Engine | Needs |
|---|---|---|
| `jev` | TypeSafe Jev via `@typesafe-ai/sdk` | `TYPESAFE_API_KEY` |
| `groq` | Groq free tier, `openai/gpt-oss-20b` | `GROQ_API_KEY` |
| `openrouter` | OpenRouter free models (default `nvidia/nemotron-3-super-120b-a12b:free`, then `openrouter/free`; override with a comma-separated `OPENROUTER_MODEL`); free tier is 50 requests/day | `OPENROUTER_API_KEY` |
| `ev` (default) | Pure-JS expected value (`lib/ev.js`) | nothing |

If the chosen AI engine fails or is rate-limited, the API tries `DECIDER_NEXT` (if set) and then falls back to expected value, so the app always answers. Set `DECIDER_SWITCH_AT` (ISO time with offset, e.g. `2026-09-24T23:00:00+01:00`) to use only `DECIDER_NEXT` from that time on.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in keys, set DECIDER
npm run dev                  # http://localhost:5173, API included
```

## Deploy (Vercel Hobby)

Import the repo at vercel.com, then set `DECIDER`, `GROQ_API_KEY` and (optionally) `TYPESAFE_API_KEY` under Settings → Environment Variables. Every push to `main` redeploys.

Output is advice, not an instruction; nothing in the app acts on it.
