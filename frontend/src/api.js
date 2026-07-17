// In dev, requests to /api are proxied to localhost:8787 by vite.config.js.
// In production, set VITE_API_BASE_URL at build time to your deployed
// backend's URL (e.g. https://fridge-to-recipe-backend.onrender.com) — Vite
// bakes this in when the static site is built, it isn't read at runtime.
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

class ApiError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function post(path, body, signal) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal
    });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new ApiError('Could not reach the server. Is the backend running?', 'network_error', 0);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // fall through with data = null
  }

  if (!res.ok) {
    throw new ApiError(
      data?.message || 'Something went wrong.',
      data?.error || 'unknown',
      res.status
    );
  }
  return data;
}

export function fetchRecipe({ ingredients, dietary, servings }, signal) {
  return post('/api/recipe', { ingredients, dietary, servings }, signal).then((d) => d.recipe);
}

export function refineRecipe({ recipe, instruction }, signal) {
  return post('/api/recipe/refine', { recipe, instruction }, signal).then((d) => d.recipe);
}

export { ApiError };
