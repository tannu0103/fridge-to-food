require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

async function callGemini(prompt) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
    throw new Error('MISSING_KEY');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.9,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini request failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned an empty response');
  return JSON.parse(text);
}

// Generate recipes from a list of ingredients
app.post('/api/generate-recipes', async (req, res) => {
  const { ingredients = [], count = 3 } = req.body;
  if (!ingredients.length) {
    return res.status(400).json({ error: 'Add at least one ingredient.' });
  }

  const prompt = `You are a chef assistant. A user has these ingredients on hand: ${ingredients.join(', ')}.
Suggest ${count} distinct recipes that use as many of these ingredients as possible.
Respond ONLY with strict JSON, no markdown fences, matching this shape:
{"recipes":[{"title":"","cuisine":"","time_minutes":0,"calories":0,"match_score":0,"description":"","ingredients_used":[""],"steps":[""]}]}`;

  try {
    const json = await callGemini(prompt);
    res.json(json);
  } catch (err) {
    if (err.message === 'MISSING_KEY') {
      return res.status(500).json({
        error: 'No Gemini API key configured. Add GEMINI_API_KEY to your .env file and restart the server.'
      });
    }
    console.error(err);
    res.status(500).json({ error: 'Could not reach Gemini. Check your API key and try again.' });
  }
});

// Generate a 7-day meal prep plan
app.post('/api/meal-plan', async (req, res) => {
  const { diet = 'balanced', people = 2 } = req.body;

  const prompt = `Create a 7-day meal prep plan for ${people} people following a "${diet}" diet.
Respond ONLY with strict JSON, no markdown fences, matching this shape:
{"days":[{"day":"Monday","dish":"","cuisine":"","time_minutes":0,"calories":0,"description":""}]}
The "days" array must have exactly 7 entries, Monday through Sunday, each a different dish.`;

  try {
    const json = await callGemini(prompt);
    res.json(json);
  } catch (err) {
    if (err.message === 'MISSING_KEY') {
      return res.status(500).json({
        error: 'No Gemini API key configured. Add GEMINI_API_KEY to your .env file and restart the server.'
      });
    }
    console.error(err);
    res.status(500).json({ error: 'Could not reach Gemini. Check your API key and try again.' });
  }
});

app.listen(PORT, () => {
  console.log(`FridgeAI running at http://localhost:${PORT}`);
});
