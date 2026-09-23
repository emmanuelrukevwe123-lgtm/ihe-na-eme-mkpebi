# Decide For Me — Project Summary

A hand-drawn, mobile-friendly web app that helps you make up your mind. You describe a situation, list 2–6 options, and get a pick with odds for every option and a confidence figure. It's a fun side project, not professional advice.

- **Location:** `C:\Users\Manuel Ruky\Documents\funproJX\jev-decider`
- **Author:** [emmanuelrukevwe123-lgtm on GitHub](https://github.com/emmanuelrukevwe123-lgtm)
- **Based on:** `Downloads\JEV decision app build plan.md`
- **Status:** built, tested locally and committed to git. Not yet pushed to GitHub or deployed to Vercel.

---

## 1. What the app does

1. **Landing page** (`/`) explains the app in three steps, has a "Just for fun!" sticky note and links to the GitHub profile.
2. **Decider** (`/#decide`):
   - **Situation:** a free-text description of the dilemma (up to 4000 characters).
   - **Options:** 2–6 of them.
   - **Outcomes (optional), under each option:**
     - *What could happen?* A short description, e.g. "it goes well and I grow fast".
     - *Chance %:* how likely it is (0–100).
     - *Good/bad (±):* how good or bad it would be, e.g. +8 or −3.
   - **Decide!** shows:
     - The winning option, with a yellow highlighter band and a red hand-drawn underline.
     - A hatched, pencil-style probability bar for every option.
     - A confidence percentage and a short rationale.
     - A stamp saying which engine answered.
3. **Past decisions:** the last 20 are listed. Click one to reload it into the form.
4. **Persistence:** the form, the latest result and the history are saved in the browser (`localStorage`), so a refresh loses nothing. **Start over** clears the form but keeps the history.

---

## 2. Architecture

```
Browser (React SPA, localStorage)
      │  POST /api/decide
      ▼
Vercel Function: api/decide.js ── validates input, picks engine via DECIDER env var
      ├── DECIDER=jev  → lib/jev.js   (TypeSafe Jev via @typesafe-ai/sdk)
      ├── DECIDER=groq → lib/groq.js  (Groq free tier, openai/gpt-oss-20b, plain fetch)
      └── DECIDER=ev / unset / any error → lib/ev.js (pure-JS expected value, always works)
```

**Why three engines:** Jev's free access is uncertain and ends on 25 September 2026. Groq is free up to about 1,000 requests a day. The expected-value (EV) engine needs no key or network, so the app **never shows a blank screen**. If Jev or Groq fails (bad key, rate limit, timeout or malformed reply), the API quietly falls back to EV and says so in the rationale.

### API contract

```
POST /api/decide
{ situation: string, options: [{ name, outcomes?: [{ label?, p, value }] }] }

→ 200 { choice, probabilities: { [name]: 0–1 }, confidence: 0–1, rationale?, source: "jev"|"groq"|"ev" }
→ 400 { error }   invalid input (fewer than 2 or more than 6 options, duplicate names, p outside 0–1, over-long text)
→ 405 { error }   anything other than POST
```

### Engines

- **Expected value (`lib/ev.js`):** EV = Σ p × value for each option. The EVs go through a softmax to make pseudo-probabilities, and the highest EV wins. With no outcomes, every option ties.
- **Groq (`lib/groq.js`):** JSON-mode chat completion. The prompt treats user text as data, not instructions. Timeout is 10 s.
- **Jev (`lib/jev.js`):** a single `choice` question whose options are the user's options. Timeout is 6 s with 1 retry, instead of the SDK's default of about 27 s.
- **Safety net:** `api/decide.js` normalizes every AI reply. It checks that the choice is a real option, rescales the probabilities to sum to 1, clamps confidence to 0–1 and caps the rationale's length.

### Security

- `TYPESAFE_API_KEY`, `GROQ_API_KEY` and `DECIDER` are **server-only**, read through `process.env`. They must never have a `VITE_` prefix.
- The output is advice only. Nothing in the app acts on it.

---

## 3. Design: hand-drawn style

| Element | How it's done |
|---|---|
| Paper | Lined-notebook background with a red margin line; chalkboard version in dark mode |
| Fonts | Caveat (headings) and Patrick Hand (body), from Google Fonts |
| Wobbly borders | `border-radius` tricks plus an SVG `feTurbulence` filter (`#rough`) on `::before`, so only the lines wobble and text stays sharp |
| Probability bars | Diagonal hatching like pencil shading; red for the winner, blue for the rest |
| Winner | Highlighter band behind the text and a red double underline below (replaced a circle that covered the text) |
| Sticky note | Yellow note with a strip of tape on the landing page |
| Desk pencil | Inline SVG pencil in the bottom-right corner, behind the content (below the footer on phones) |
| Mouse pointer | 24 px pencil cursor with its hotspot at the tip; text boxes keep the I-beam |
| Motion | Bars grow and the underline draws itself; turned off when the system asks for reduced motion |

**Responsive:** tested at 320, 390, 768 and 1280 px, with no sideways scrolling.
- Below 760 px, the landing cards stack.
- Below 560 px:
  - the card tilt is removed;
  - the Decide button becomes full width;
  - long names wrap.
- Touch targets are at least 44 px on touchscreens.

---

## 4. Files

```
jev-decider/
├── api/decide.js              Router: validation, engine choice, normalization, EV fallback
├── lib/ev.js                  Expected-value scorer
├── lib/groq.js                Groq engine
├── lib/jev.js                 Jev engine (@typesafe-ai/sdk)
├── src/
│   ├── main.jsx               React entry point
│   ├── App.jsx                Switches Landing ⇄ Decider on location.hash; renders the desk pencil
│   ├── Landing.jsx            Landing page
│   ├── Decider.jsx            Decision screen: state, API call, localStorage draft and history
│   ├── index.css              All styles and theme tokens (light and dark)
│   └── components/
│       ├── DecisionForm.jsx   Situation, options, outcomes
│       ├── ResultCard.jsx     Winner, bars, confidence, rationale, engine stamp
│       ├── History.jsx        Past decisions
│       ├── Footer.jsx         GitHub link
│       └── Pencil.jsx         Decorative desk pencil
├── index.html                 Fonts, SVG roughness filters, page title
├── vite.config.js             React plugin + local /api middleware (no Vercel CLI needed for dev)
├── sample.json                Example request for curl testing
├── .env.example               DECIDER, GROQ_API_KEY, TYPESAFE_API_KEY
├── CLAUDE.md                  Rules and commands for Claude Code
└── README.md                  Short public readme
```

---

## 5. Running it

```bash
cd "C:\Users\Manuel Ruky\Documents\funproJX\jev-decider"
npm install
copy .env.example .env.local     # add keys; DECIDER=groq to use the AI
npm run dev                      # http://localhost:5173 (API included)
npm run build                    # production build check
npx oxlint                       # lint
```

Test the API directly:

```bash
curl -s -X POST localhost:5173/api/decide -H "content-type: application/json" -d @sample.json
```

---

## 6. Deploying (remaining steps)

1. Get a free Groq API key at console.groq.com.
2. Install the tools: `npm i -g vercel` and `winget install GitHub.cli`.
3. Log in yourself, because these open a browser: `gh auth login` and `vercel login`.
4. Push: `gh repo create jev-decider --private --source=. --push`.
5. Import the repo at vercel.com → Add New Project.
6. Set environment variables for Production, Preview and Development:
   - `DECIDER=groq`
   - `GROQ_API_KEY`
   - `TYPESAFE_API_KEY`, only if you have Jev access.
7. Smoke-test the live URL. Then set `DECIDER=ev` and check that it still answers.

If `/api/decide` returns 404 on Vercel, check Vercel's current Vite docs. The plan flagged that the root `api/` folder wasn't re-verified. Vercel Hobby is for non-commercial use only.

---

## 7. Test decisions

**Clear winner: "How should I get to work?"**

| Option | What could happen? | Chance % | Good/bad |
|---|---|---|---|
| Buy a used car | Runs well, saves time | 70 | 6 |
| | Keeps breaking down | 30 | −5 |
| Keep using ride-hailing | Fares stay the same | 80 | 2 |
| | Fares jump again | 20 | −3 |
| Keep saving the money | Savings keep growing | 100 | 1.5 |

Expected result with EV: **Buy a used car**, about 67%.

**Close call: "Wedding or exam prep?"**

| Option | What could happen? | Chance % | Good/bad |
|---|---|---|---|
| Go to the wedding | Great time and still pass | 50 | 5 |
| | Fall behind, exam goes badly | 50 | −4 |
| Stay home and study | Exam goes well | 60 | 3 |
| | Friend feels hurt | 40 | −2 |

Expected result with EV: **Stay home and study**, about 62% to 38% (low confidence).

---

## 8. What was verified

- The build passes and lint is clean.
- EV results are correct, and every validation error (400) and wrong method (405) behaves as expected.
- Fallback: with bogus keys, both Groq and Jev return 401, and the app still answers through EV in about 1 second.
- In a real browser (headless Edge), in both light and dark mode:
  - the full form-to-result-to-history flow works;
  - refresh keeps the draft, and **start over** clears it;
  - the Back button and hash navigation work;
  - there are no console errors.
- The pencil cursor image renders correctly. Its movement can't be seen in automated tests, so check it by hand.

## 9. Known limitations

- History is per browser. There's no account or cross-device sync; Supabase could add that later.
- Groq's free tier allows about 1,000 decisions a day; after that the app falls back to EV.
- Jev's free window ends on 25 September 2026. After that, calls cost about $0.001 per decision.
- AI answers are non-deterministic and can be swayed by the text in the situation, so treat them as a nudge.

## 10. Build history

| Commit | Change |
|---|---|
| `d1312b2` | Hand-drawn decision app with jev/groq/ev engines |
| `e819ec1` | "What could happen?" description for each outcome |
| `247325b` | Readable winner highlight; form persists across refresh; start-over button |
| `e6bcbe7` | Landing page, GitHub link, mobile layout polish |
| `c002e26` | Desk pencil illustration and pencil mouse cursor |
