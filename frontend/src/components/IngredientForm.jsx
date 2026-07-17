const DIETARY_OPTIONS = [
  { value: '', label: 'No preference' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten-free', label: 'Gluten-free' },
  { value: 'dairy-free', label: 'Dairy-free' }
];

export default function IngredientForm({
  ingredients, setIngredients,
  dietary, setDietary,
  servings, setServings,
  onSubmit, loading
}) {
  const remaining = 1500 - ingredients.length;

  return (
    <form
      className="ingredient-form"
      onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
    >
      <label className="ingredient-form__label" htmlFor="ingredients">
        What's in your fridge?
      </label>
      <textarea
        id="ingredients"
        className="ingredient-form__textarea"
        placeholder="e.g. two zucchini, half a block of paneer, leftover rice, a wilting bunch of coriander…"
        value={ingredients}
        maxLength={1500}
        onChange={(e) => setIngredients(e.target.value)}
        rows={3}
      />
      <div className="ingredient-form__row">
        <div className="field">
          <label htmlFor="dietary">Dietary</label>
          <select id="dietary" value={dietary} onChange={(e) => setDietary(e.target.value)}>
            {DIETARY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="servings">Servings</label>
          <div className="stepper">
            <button type="button" aria-label="Fewer servings" onClick={() => setServings(Math.max(1, servings - 1))}>−</button>
            <span>{servings}</span>
            <button type="button" aria-label="More servings" onClick={() => setServings(Math.min(12, servings + 1))}>+</button>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn--primary ingredient-form__submit"
          disabled={loading || !ingredients.trim()}
        >
          {loading ? 'Cooking it up…' : 'Find my recipe'}
        </button>
      </div>
      <p className="ingredient-form__counter">{remaining} characters left</p>
    </form>
  );
}
