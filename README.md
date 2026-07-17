# FridgeFeast — fridge to recipe

List what's sitting in your fridge, get back one real, cookable recipe: a
scalable ingredient checklist, numbered steps you can check off, and swaps for
anything you don't have. Built for the Flam frontend internship assignment
("Fridge-to-recipe" track).

Live carousel at the top is a static, hand-picked showcase (real Unsplash
photography of vegetarian/vegan dishes) — tapping **"Cook this combo"** feeds
those ingredients into the real form and calls the live API, exactly like
typing them in yourself. It's not a separate demo mode.

## Setup

Requires Node 18+ (for native `fetch`) and an Anthropic API key.

```bash
git clone <this repo>
cd fridge-to-recipe
cp backend/.env.example backend/.env
# edit backend/.env and paste your ANTHROPIC_API_KEY

npm install
npm start
```

`npm start` runs the Express backend (port 8787) and the Vite dev server
(port 5173) together via npm workspaces + `concurrently`. Open
**http://localhost:5173**.

If you'd rather use a different provider (Gemini, Groq, OpenRouter, a local
Ollama model), swap the `callAnthropic` function in `backend/server.js` for
that provider's SDK — the rest of the app (validation, retry, routes) doesn't
care where the JSON came from.

## How it works

**The model never talks directly to the browser.** The React app posts free
text to `POST /api/recipe` on the Express backend; the backend holds the API
key and calls Anthropic.

**Structured output, not a chatbot.** The backend calls Claude with a `tools`
definition (`return_recipe`) and `tool_choice` forced to that tool, so the
model *cannot* reply with prose — it has to fill in a fixed JSON shape
(title, ingredients with amounts/units, numbered steps with timers, dietary
tags, swaps). The frontend never parses free text out of a chat message.

**Handling bad output** (the part most of the grading weight is on):
- The backend validates the tool-call result against the required shape
  (non-empty title, ingredients, steps, numeric amounts) before it ever
  reaches the frontend. If validation fails, it retries once with a sharper
  reminder prompt; if that also fails, it returns a typed error (`malformed_output`)
  instead of guessing.
- Timeouts (`AbortController`, 30s), unreachable upstream, rate limits, and a
  missing/invalid API key all map to distinct error codes and distinct,
  specific messages — nothing generic like "an error occurred."
- On the frontend, every submit increments a request id and aborts the
  previous in-flight fetch. If a slow response comes back after a newer
  request has started, it's silently discarded — a stale response can never
  overwrite a fresher one on screen.
- Loading (skeleton), error (with retry button), and empty states are all
  distinct components, not conditional text in one blob.

**Stretch features implemented:**
- Refinement loop — the "Want to change something?" box at the bottom of a
  recipe sends the *existing* recipe JSON plus your instruction back to
  `POST /api/recipe/refine`, and the model returns the full updated recipe
  rather than starting over.
- Scalable servings — the ingredient list re-scales every amount live as you
  step servings up or down (client-side math, no re-call to the model).
- Polish — carousel autoplay with pause-on-hover/focus, keyboard arrow
  navigation, checklist progress bar, mobile layout down to ~360px.

**Not implemented (would do next with more time):** streaming the response
token-by-token, saving/reloading past sessions, dark mode, and letting the AI
choose between different block *types* (card/chart/checklist) rather than
always returning one recipe shape.

## AI-usage note

I used Claude (via this chat interface) to scaffold the project end to end:
drafting the Express route structure, the tool-schema approach for forced
JSON output, and the CSS design system, then iterated by hand on the retry
logic, the stale-response guard in `App.jsx`, and the servings-scaling math,
which I rewrote after the first AI draft rounded amounts oddly. I also used it
to source real, license-free Unsplash photo URLs for the carousel (verified
each one resolves before using it) rather than inventing ones from memory.
I can walk through and modify any part of this in the interview.

## Known limitations

- No auth, no persistence — refresh and the recipe is gone (by design, per
  the assignment's "no auth needed" note).
- The retry-once strategy means a genuinely flaky connection can still fail
  after two tries; there's no exponential backoff.
- Ingredient parsing is entirely up to the model's judgement — very unusual
  phrasing (e.g. ingredients in a language other than English) hasn't been
  tested.
- No automated tests yet — verification here was manual (esbuild syntax/
  bundle checks on every component, no runtime browser available in this
  environment) plus careful code review.

## Time spent

~7.5 hours: project structure & backend (2h), structured-output/retry design
(1.5h), frontend components & state (2h), design system + carousel (1.5h),
README + polish (0.5h).
