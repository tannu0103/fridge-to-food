# FridgeAI

Tell it what's in your fridge, get recipes back. Also ships a full 7-day
meal-prep plan laid out as a circular "meal wheel" you click through,
day by day.

## Project layout

```
fridge-ai/
├── .gitignore          # covers backend/.env and backend/node_modules
├── README.md
├── backend/
│   ├── server.js       # Express server + Gemini proxy
│   ├── package.json
│   ├── .env            # your real key goes here (git-ignored)
│   └── .env.example    # same shape, safe to commit
└── frontend/
    ├── index.html
    ├── style.css
    └── script.js
```

The backend serves the frontend as static files, so the whole thing
runs from one server on one port — no separate frontend dev server
needed.

## Setup

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Get a free Gemini API key: https://aistudio.google.com/app/apikey
3. Open `backend/.env` and replace the placeholder:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
4. Run it (from inside `backend/`):
   ```bash
   npm start
   ```
5. Open http://localhost:3000

Without a key, the site still runs — the ingredient generator will show
a friendly error, and the meal wheel falls back to a built-in sample
week so you can see the layout working end to end.

## Notes

- `.gitignore` (at the project root) excludes `backend/.env` and
  `backend/node_modules/` wherever they sit, so secrets and installed
  packages never get committed.
- The meal-wheel plate illustrations are generated inline as SVG
  (no external images), so there's nothing to download or hotlink.
- Endpoints (served by `backend/server.js`):
  - `POST /api/generate-recipes` — body `{ ingredients: string[], count?: number }`
  - `POST /api/meal-plan` — body `{ diet?: string, people?: number }`
