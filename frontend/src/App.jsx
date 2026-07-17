import { useEffect, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import CuratedCarousel from './components/CuratedCarousel.jsx';
import IngredientForm from './components/IngredientForm.jsx';
import LoadingState from './components/LoadingState.jsx';
import ErrorState from './components/ErrorState.jsx';
import RecipeResult from './components/RecipeResult.jsx';
import curated from './data/curated.js';
import { fetchRecipe, refineRecipe } from './api.js';

export default function App() {
  const [ingredients, setIngredients] = useState('');
  const [dietary, setDietary] = useState('');
  const [servings, setServings] = useState(2);

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [refining, setRefining] = useState(false);
  const [refineError, setRefineError] = useState(null);

  const resultRef = useRef(null);
  const requestIdRef = useRef(0);
  const abortRef = useRef(null);

  const runGenerate = (ingredientsText) => {
    if (!ingredientsText.trim() || loading) return;

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    fetchRecipe({ ingredients: ingredientsText, dietary, servings }, controller.signal)
      .then((newRecipe) => {
        if (requestIdRef.current !== requestId) return; // a newer request has since started
        setRecipe(newRecipe);
        setServings(newRecipe.base_servings || servings);
      })
      .catch((e) => {
        if (e.name === 'AbortError') return;
        if (requestIdRef.current !== requestId) return;
        setError(e.message || 'Something went wrong.');
      })
      .finally(() => {
        if (requestIdRef.current === requestId) setLoading(false);
      });
  };

  const handleSubmit = () => runGenerate(ingredients);

  const handleTryCombo = (comboIngredients) => {
    setIngredients(comboIngredients);
    setDietary('');
    runGenerate(comboIngredients);
    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleRefine = (instruction) => {
    if (!recipe || refining) return;
    setRefining(true);
    setRefineError(null);
    refineRecipe({ recipe, instruction })
      .then((updated) => setRecipe(updated))
      .catch((e) => setRefineError(e.message || 'Could not update the recipe.'))
      .finally(() => setRefining(false));
  };

  useEffect(() => () => abortRef.current?.abort(), []);

  return (
    <div className="page">
      <Header />

      <CuratedCarousel items={curated} onTryCombo={handleTryCombo} />

      <main className="content" id="app">
        <IngredientForm
          ingredients={ingredients}
          setIngredients={setIngredients}
          dietary={dietary}
          setDietary={setDietary}
          servings={servings}
          setServings={setServings}
          onSubmit={handleSubmit}
          loading={loading}
        />

        <div className="result-area" ref={resultRef}>
          {loading && <LoadingState />}

          {!loading && error && (
            <ErrorState message={error} onRetry={() => runGenerate(ingredients)} />
          )}

          {!loading && !error && recipe && (
            <RecipeResult
              recipe={recipe}
              onRefine={handleRefine}
              refining={refining}
              refineError={refineError}
            />
          )}

          {!loading && !error && !recipe && (
            <div className="empty-state">
              <p className="empty-state__title">Nothing cooked up yet.</p>
              <p className="empty-state__body">
                List a few things from your fridge above, or tap a card in the carousel to try a ready-made combo.
              </p>
            </div>
          )}
        </div>
      </main>

      <footer className="site-footer">
        Built for the frontend internship assignment · not a real product, no data leaves this recipe request.
      </footer>
    </div>
  );
}
