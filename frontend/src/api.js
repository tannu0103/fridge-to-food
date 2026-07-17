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
    res = await fetch(path, {
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
