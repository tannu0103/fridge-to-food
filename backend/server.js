import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '200kb' }));

const PORT = process.env.PORT || 8787;
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';
const API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const REQUEST_TIMEOUT_MS = 30000;

// ---------- The schema we force the model to fill in ----------
// Using tool_choice to force a single tool call is far more reliable than
// asking for "JSON only" in a prompt: the model literally cannot reply with
// prose, so there's no fence-stripping or brace-hunting on our side.
const recipeTool = {
  name: 'return_recipe',
  description: 'Return a single recipe built from the ingredients the person has available.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      title: { type: 'string', description: 'Appetising recipe name, under 60 chars.' },
      description: { type: 'string', description: 'One or two sentence description.' },
      cuisine: { type: 'string' },
      dietary_tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'e.g. ["vegetarian","vegan","gluten-free","dairy-free"]'
      },
      base_servings: { type: 'integer', minimum: 1, maximum: 12 },
      prep_time_minutes: { type: 'integer', minimum: 0 },
      cook_time_minutes: { type: 'integer', minimum: 0 },
      difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
      calories_per_serving: { type: 'integer', minimum: 0 },
      ingredients: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            name: { type: 'string' },
            amount: { type: 'number' },
            unit: { type: 'string', description: 'g, kg, ml, l, tsp, tbsp, cup, pcs, pinch, or "" for whole items' },
            have_it: { type: 'boolean', description: 'true if this was in the ingredients the person listed' }
          },
          required: ['name', 'amount', 'unit', 'have_it']
        }
      },
      swaps: {
        type: 'array',
        description: 'Ingredient swap suggestions for common allergens or missing items.',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            ingredient: { type: 'string' },
            alternatives: { type: 'array', items: { type: 'string' }, minItems: 1 }
          },
          required: ['ingredient', 'alternatives']
        }
      },
      steps: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            title: { type: 'string', description: 'Short 2-4 word step label' },
            instruction: { type: 'string' },
            timer_minutes: { type: 'integer', minimum: 0, description: '0 if no waiting/cooking involved' }
          },
          required: ['title', 'instruction', 'timer_minutes']
        }
      }
    },
    required: [
      'title', 'description', 'cuisine', 'dietary_tags', 'base_servings',
      'prep_time_minutes', 'cook_time_minutes', 'difficulty',
      'calories_per_serving', 'ingredients', 'swaps', 'steps'
    ]
  }
};

const SYSTEM_PROMPT = `You are a recipe generator for a "fridge to recipe" app. The person will list
ingredients they have (and possibly dietary needs). You must call the return_recipe tool exactly
once with a single realistic, cookable recipe that primarily uses what they listed. You may add a
small number of pantry staples (oil, salt, pepper, water) not in their list, marked have_it: false.
Prefer vegetarian/vegan results unless the person's ingredients or words clearly indicate meat or
fish. Keep steps concrete and sequenced so they can be checked off one at a time. Always include at
least one useful ingredient swap. Never reply in prose, only call the tool.`;

function withTimeout(promise, ms) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return { promise: promise(controller.signal), cancel: () => clearTimeout(timeout) };
}

async function callAnthropic(userText, { retryHint } = {}) {
  if (!API_KEY) {
    const err = new Error('missing_api_key');
    err.code = 'missing_api_key';
    throw err;
  }

  const messages = [
    { role: 'user', content: retryHint ? `${userText}\n\n${retryHint}` : userText }
  ];

  const { promise, cancel } = withTimeout((signal) => fetch(ANTHROPIC_URL, {
    method: 'POST',
    signal,
    headers: {
      'content-type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages,
      tools: [recipeTool],
      tool_choice: { type: 'tool', name: 'return_recipe' }
    })
  }), REQUEST_TIMEOUT_MS);

  let res;
  try {
    res = await promise;
  } catch (e) {
    cancel();
    if (e.name === 'AbortError') {
      const err = new Error('upstream_timeout');
      err.code = 'upstream_timeout';
      throw err;
    }
    const err = new Error('upstream_unreachable');
    err.code = 'upstream_unreachable';
    throw err;
  }
  cancel();

  if (!res.ok) {
    const bodyText = await res.text().catch(() => '');
    const err = new Error(`anthropic_${res.status}`);
    err.code = res.status === 401 ? 'bad_api_key' : res.status === 429 ? 'rate_limited' : 'upstream_error';
    err.detail = bodyText.slice(0, 500);
    throw err;
  }

  const data = await res.json();
  const toolUse = (data.content || []).find((b) => b.type === 'tool_use' && b.name === 'return_recipe');
  if (!toolUse || typeof toolUse.input !== 'object') {
    const err = new Error('malformed_output');
    err.code = 'malformed_output';
    throw err;
  }
  return toolUse.input;
}

function validateRecipeShape(recipe) {
  if (!recipe || typeof recipe !== 'object') return 'Recipe is not an object.';
  if (typeof recipe.title !== 'string' || !recipe.title.trim()) return 'Missing title.';
  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) return 'Missing ingredients.';
  if (!Array.isArray(recipe.steps) || recipe.steps.length === 0) return 'Missing steps.';
  if (!Number.isFinite(recipe.base_servings) || recipe.base_servings < 1) return 'Invalid base_servings.';
  for (const ing of recipe.ingredients) {
    if (typeof ing.name !== 'string' || !ing.name.trim()) return 'Ingredient missing a name.';
    if (typeof ing.amount !== 'number' || Number.isNaN(ing.amount)) return 'Ingredient missing a numeric amount.';
  }
  for (const step of recipe.steps) {
    if (typeof step.instruction !== 'string' || !step.instruction.trim()) return 'Step missing instruction text.';
  }
  return null;
}

async function generateRecipeWithRetry(userText) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const hint = attempt === 0
        ? undefined
        : 'Reminder: call return_recipe with every required field filled in correctly. Do not omit any field.';
      const recipe = await callAnthropic(userText, { retryHint: hint });
      const problem = validateRecipeShape(recipe);
      if (!problem) return recipe;
      lastError = Object.assign(new Error(problem), { code: 'malformed_output' });
    } catch (e) {
      lastError = e;
      // Only retry on malformed output or a generic upstream hiccup; a bad key
      // or timeout won't be fixed by trying again with the same request.
      if (!['malformed_output', 'upstream_unreachable'].includes(e.code)) throw e;
    }
  }
  throw lastError;
}

function httpStatusFor(code) {
  switch (code) {
    case 'missing_api_key':
    case 'bad_api_key': return 500;
    case 'rate_limited': return 429;
    case 'upstream_timeout': return 504;
    case 'malformed_output': return 502;
    default: return 502;
  }
}

function userMessageFor(code) {
  switch (code) {
    case 'missing_api_key': return 'The server is missing its Anthropic API key. Add ANTHROPIC_API_KEY to backend/.env and restart.';
    case 'bad_api_key': return 'The Anthropic API key was rejected. Double-check backend/.env.';
    case 'rate_limited': return 'The AI provider is rate-limiting requests right now. Wait a moment and try again.';
    case 'upstream_timeout': return 'The AI took too long to respond. Try again.';
    case 'malformed_output': return 'The AI returned a recipe that didn\'t match the expected shape, even after a retry. Try rephrasing your ingredients.';
    default: return 'Something went wrong talking to the AI. Try again.';
  }
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, configured: Boolean(API_KEY), model: MODEL });
});

app.post('/api/recipe', async (req, res) => {
  const { ingredients, dietary, servings } = req.body || {};
  if (typeof ingredients !== 'string' || !ingredients.trim()) {
    return res.status(400).json({ error: 'empty_input', message: 'Tell me what\'s in your fridge first.' });
  }
  if (ingredients.length > 1500) {
    return res.status(400).json({ error: 'input_too_long', message: 'That\'s a lot of ingredients — trim it to under 1500 characters.' });
  }

  const parts = [`Ingredients available: ${ingredients.trim()}`];
  if (dietary && typeof dietary === 'string' && dietary.trim()) {
    parts.push(`Dietary requirement: ${dietary.trim()}`);
  }
  if (servings && Number.isFinite(Number(servings))) {
    parts.push(`Preferred base servings: ${Number(servings)}`);
  }
  const userText = parts.join('\n');

  try {
    const recipe = await generateRecipeWithRetry(userText);
    res.json({ recipe });
  } catch (e) {
    const code = e.code || 'unknown';
    console.error('[recipe error]', code, e.detail || e.message);
    res.status(httpStatusFor(code)).json({ error: code, message: userMessageFor(code) });
  }
});

// Stretch: refine an existing recipe with a follow-up instruction instead of
// regenerating from scratch (e.g. "make it spicier", "swap the paneer for tofu").
app.post('/api/recipe/refine', async (req, res) => {
  const { recipe, instruction } = req.body || {};
  if (!recipe || typeof recipe !== 'object') {
    return res.status(400).json({ error: 'empty_input', message: 'No recipe to refine.' });
  }
  if (typeof instruction !== 'string' || !instruction.trim()) {
    return res.status(400).json({ error: 'empty_input', message: 'Say what you\'d like to change.' });
  }

  const userText = `Here is the current recipe as JSON:\n${JSON.stringify(recipe)}\n\nApply this change and return the FULL updated recipe (not a diff): ${instruction.trim()}`;

  try {
    const updated = await generateRecipeWithRetry(userText);
    res.json({ recipe: updated });
  } catch (e) {
    const code = e.code || 'unknown';
    console.error('[refine error]', code, e.detail || e.message);
    res.status(httpStatusFor(code)).json({ error: code, message: userMessageFor(code) });
  }
});

app.listen(PORT, () => {
  if (!API_KEY) {
    console.warn(`\n⚠️  ANTHROPIC_API_KEY is not set. Copy backend/.env.example to backend/.env and add a key.\n`);
  }
  console.log(`fridge-to-recipe backend listening on http://localhost:${PORT}`);
});
