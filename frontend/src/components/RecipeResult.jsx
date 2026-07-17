import { useMemo, useState } from 'react';

function scaleAmount(amount, factor) {
  const scaled = amount * factor;
  if (scaled === 0) return '0';
  if (scaled < 1) return scaled.toFixed(2).replace(/\.?0+$/, '');
  if (Number.isInteger(scaled)) return String(scaled);
  return scaled.toFixed(1).replace(/\.0$/, '');
}

export default function RecipeResult({ recipe, onRefine, refining, refineError }) {
  const [servings, setServings] = useState(recipe.base_servings || 2);
  const [checkedIngredients, setCheckedIngredients] = useState(() => new Set());
  const [checkedSteps, setCheckedSteps] = useState(() => new Set());
  const [instruction, setInstruction] = useState('');

  const factor = servings / (recipe.base_servings || servings || 1);

  const doneSteps = checkedSteps.size;
  const totalSteps = recipe.steps.length;
  const progressPct = totalSteps ? Math.round((doneSteps / totalSteps) * 100) : 0;

  const toggle = (setFn) => (key) => {
    setFn((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };
  const toggleIngredient = toggle(setCheckedIngredients);
  const toggleStep = toggle(setCheckedSteps);

  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

  const submitRefine = (e) => {
    e.preventDefault();
    if (!instruction.trim() || refining) return;
    onRefine(instruction.trim());
    setInstruction('');
  };

  const tags = useMemo(() => recipe.dietary_tags || [], [recipe.dietary_tags]);

  return (
    <article className="recipe">
      <header className="recipe__header">
        <p className="recipe__cuisine">{recipe.cuisine}</p>
        <h2 className="recipe__title">{recipe.title}</h2>
        <p className="recipe__description">{recipe.description}</p>

        <div className="recipe__meta">
          {tags.map((t) => <span className="pill" key={t}>{t}</span>)}
          <span className="pill pill--muted">{recipe.difficulty}</span>
          <span className="recipe__meta-fact">⏱ {totalTime} min</span>
          <span className="recipe__meta-fact">🔥 {recipe.calories_per_serving} kcal / serving</span>
        </div>
      </header>

      <div className="recipe__body">
        <section className="recipe__ingredients" aria-labelledby="ingredients-heading">
          <div className="recipe__panel-head">
            <h3 id="ingredients-heading">Ingredients</h3>
            <div className="stepper stepper--compact">
              <button type="button" aria-label="Fewer servings" onClick={() => setServings((s) => Math.max(1, s - 1))}>−</button>
              <span>{servings} serv{servings === 1 ? '' : 'ings'}</span>
              <button type="button" aria-label="More servings" onClick={() => setServings((s) => Math.min(24, s + 1))}>+</button>
            </div>
          </div>

          <ul className="checklist">
            {recipe.ingredients.map((ing, i) => {
              const key = `${ing.name}-${i}`;
              const checked = checkedIngredients.has(key);
              return (
                <li key={key} className={checked ? 'is-checked' : ''}>
                  <label>
                    <input type="checkbox" checked={checked} onChange={() => toggleIngredient(key)} />
                    <span className="checklist__mark" aria-hidden="true" />
                    <span className="checklist__text">
                      <strong>{scaleAmount(ing.amount, factor)}{ing.unit ? ` ${ing.unit}` : ''}</strong> {ing.name}
                      {ing.have_it === false && <em className="checklist__note"> · pantry item</em>}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          {recipe.swaps && recipe.swaps.length > 0 && (
            <div className="swaps">
              <h4>Don't have one of these?</h4>
              {recipe.swaps.map((s) => (
                <p key={s.ingredient} className="swaps__row">
                  <span className="swaps__from">{s.ingredient}</span>
                  <span aria-hidden="true">→</span>
                  {s.alternatives.map((alt) => (
                    <span className="pill pill--ghost pill--small" key={alt}>{alt}</span>
                  ))}
                </p>
              ))}
            </div>
          )}
        </section>

        <section className="recipe__steps" aria-labelledby="steps-heading">
          <div className="recipe__panel-head">
            <h3 id="steps-heading">Steps</h3>
            <span className="recipe__progress-label">{doneSteps}/{totalSteps} done</span>
          </div>
          <div className="progress-track" aria-hidden="true">
            <div className="progress-track__fill" style={{ width: `${progressPct}%` }} />
          </div>

          <ol className="steps">
            {recipe.steps.map((step, i) => {
              const checked = checkedSteps.has(i);
              return (
                <li key={i} className={checked ? 'is-checked' : ''}>
                  <label>
                    <input type="checkbox" checked={checked} onChange={() => toggleStep(i)} />
                    <span className="steps__index">{i + 1}</span>
                    <span className="steps__body">
                      <span className="steps__title">
                        {step.title}
                        {step.timer_minutes > 0 && <span className="pill pill--small pill--muted">⏱ {step.timer_minutes}m</span>}
                      </span>
                      <span className="steps__instruction">{step.instruction}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      <form className="refine" onSubmit={submitRefine}>
        <label htmlFor="refine-input">Want to change something?</label>
        <div className="refine__row">
          <input
            id="refine-input"
            type="text"
            placeholder="e.g. make it spicier, swap the paneer for tofu…"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            disabled={refining}
          />
          <button type="submit" className="btn btn--ghost" disabled={refining || !instruction.trim()}>
            {refining ? 'Updating…' : 'Update recipe'}
          </button>
        </div>
        {refineError && <p className="refine__error">{refineError}</p>}
      </form>
    </article>
  );
}
