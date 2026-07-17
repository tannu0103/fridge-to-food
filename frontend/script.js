/* ---------------- Ingredient chips + recipe generator ---------------- */

const ingredients = [];
const chipField = document.getElementById('chip-field');
const ingredientInput = document.getElementById('ingredient-input');
const form = document.getElementById('ingredient-form');
const resultsEl = document.getElementById('recipe-results');
const formHint = document.getElementById('form-hint');

function renderChips() {
  chipField.querySelectorAll('.chip').forEach(c => c.remove());
  ingredients.forEach((ing, i) => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.innerHTML = `${ing} <button type="button" aria-label="Remove ${ing}">×</button>`;
    chip.querySelector('button').addEventListener('click', () => {
      ingredients.splice(i, 1);
      renderChips();
    });
    chipField.insertBefore(chip, ingredientInput);
  });
}

ingredientInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    const val = ingredientInput.value.trim().replace(/,$/, '');
    if (val) {
      ingredients.push(val);
      ingredientInput.value = '';
      renderChips();
    }
  } else if (e.key === 'Backspace' && !ingredientInput.value && ingredients.length) {
    ingredients.pop();
    renderChips();
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const pending = ingredientInput.value.trim();
  if (pending) { ingredients.push(pending); ingredientInput.value = ''; renderChips(); }

  if (!ingredients.length) {
    formHint.textContent = 'Add at least one ingredient first.';
    return;
  }

  resultsEl.innerHTML = `<p class="state-msg">Reading the shelf…</p>`;

  try {
    const res = await fetch('/api/generate-recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients, count: 3 })
    });
    const data = await res.json();

    if (!res.ok) {
      resultsEl.innerHTML = `<p class="state-msg error">${data.error || 'Something went wrong.'}</p>`;
      return;
    }

    resultsEl.innerHTML = '';
    (data.recipes || []).forEach(r => {
      const card = document.createElement('div');
      card.className = 'recipe-card';
      card.innerHTML = `
        <h4>${r.title}</h4>
        <div class="meta">${r.cuisine || ''} · ${r.time_minutes || '—'} min · ${r.calories || '—'} kcal · ${r.match_score || '—'}% match</div>
        <p>${r.description || ''}</p>
        ${Array.isArray(r.steps) && r.steps.length ? `<ol>${r.steps.map(s => `<li>${s}</li>`).join('')}</ol>` : ''}
      `;
      resultsEl.appendChild(card);
    });
  } catch (err) {
    resultsEl.innerHTML = `<p class="state-msg error">Couldn't reach the server. Is it running?</p>`;
  }
});

/* ---------------- The Meal Wheel ---------------- */

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Fallback sample plan so the wheel works before a Gemini key is added
const FALLBACK_PLAN = [
  { day: 'Monday', dish: 'Lemon herb chicken & farro', cuisine: 'Mediterranean', time_minutes: 30, calories: 520, description: 'Bright, grassy olive oil and a hard squeeze of lemon over a nutty grain base.' },
  { day: 'Tuesday', dish: 'Ginger beef stir-fry', cuisine: 'Sichuan', time_minutes: 20, calories: 560, description: 'High heat, thin slices, a sauce that clings instead of pooling.' },
  { day: 'Wednesday', dish: 'Roast veg &amp; halloumi bowl', cuisine: 'Levantine', time_minutes: 35, calories: 480, description: 'Caramelised edges everywhere, a spoon of tahini to pull it together.' },
  { day: 'Thursday', dish: 'Black bean tacos', cuisine: 'Mexican', time_minutes: 20, calories: 500, description: 'Charred tortillas, a quick pickled onion, lime doing most of the work.' },
  { day: 'Friday', dish: 'Miso salmon & rice', cuisine: 'Japanese', time_minutes: 25, calories: 540, description: 'A glaze that goes from pan to broiler in one dish, no extra bowls.' },
  { day: 'Saturday', dish: 'Weekend paella', cuisine: 'Spanish', time_minutes: 50, calories: 610, description: 'The socarrat on the bottom is the whole point — leave it alone longer than feels right.' },
  { day: 'Sunday', dish: 'Slow lentil dal', cuisine: 'Indian', time_minutes: 40, calories: 430, description: 'A pot that mostly cooks itself while the rest of Sunday happens around it.' }
];

let plan = FALLBACK_PLAN;
let activeIndex = 0;

const svgNS = 'http://www.w3.org/2000/svg';
const wheelSvg = document.getElementById('wheel-svg');
const marker = document.getElementById('wheel-marker');
const arcPath = document.getElementById('arc-path');
const dayTitle = document.getElementById('wheel-day-title');
const dayDesc = document.getElementById('wheel-day-desc');
const timeEl = document.getElementById('wheel-time');
const kcalEl = document.getElementById('wheel-kcal');
const cuisineEl = document.getElementById('wheel-cuisine');
const plateSvg = document.getElementById('plate-svg');
const wheelHint = document.getElementById('wheel-hint');

// Distinct offsets along the arc for each of the 7 day labels
const OFFSETS = [10, 22, 34.5, 47, 59.5, 72, 84];

// A small deterministic per-day illustration: three overlapping mounds
// (protein / veg / carb) in a palette that varies day to day.
const PALETTES = [
  ['#C1502E', '#4B5A34', '#E7C46C'],
  ['#8B3A2B', '#6E7A46', '#D9A441'],
  ['#B0512B', '#3F4A2A', '#F0D28C'],
  ['#9A4A2E', '#57633C', '#E3B764'],
  ['#A8431F', '#4B5A34', '#EAC98A'],
  ['#7E3016', '#5A6640', '#F2D69A'],
  ['#B25634', '#495731', '#DCC07A']
];

function buildLabels() {
  DAYS.forEach((day, i) => {
    const textEl = document.createElementNS(svgNS, 'text');
    textEl.setAttribute('id', `wheel-label-${i}`);
    const tp = document.createElementNS(svgNS, 'textPath');
    tp.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#arc-path');
    tp.setAttribute('startOffset', OFFSETS[i] + '%');
    tp.textContent = day;
    textEl.appendChild(tp);
    wheelSvg.appendChild(textEl);
  });
}

function updateLabelStyles() {
  DAYS.forEach((_, i) => {
    const el = document.getElementById(`wheel-label-${i}`);
    if (!el) return;
    el.style.opacity = i === activeIndex ? '1' : '0.45';
    el.style.fontWeight = i === activeIndex ? '700' : '400';
  });
}

function moveMarker() {
  const len = arcPath.getTotalLength();
  const point = arcPath.getPointAtLength(len * (OFFSETS[activeIndex] / 100));
  marker.setAttribute('cx', point.x);
  marker.setAttribute('cy', point.y);
}

function buildPlate(index) {
  const [c1, c2, c3] = PALETTES[index % PALETTES.length];
  plateSvg.innerHTML = `
    <circle cx="200" cy="200" r="196" fill="none" />
    <path d="M120,230 C90,190 130,120 200,130 C260,120 300,180 270,225 C250,265 150,270 120,230 Z" fill="${c3}" opacity="0.9"/>
    <path d="M150,260 C110,240 100,190 150,175 C190,160 250,175 245,215 C240,255 190,280 150,260 Z" fill="${c1}"/>
    <path d="M220,150 C260,140 300,165 285,200 C275,225 235,220 220,195 C210,175 200,158 220,150 Z" fill="${c2}"/>
    <circle cx="200" cy="200" r="196" fill="none" stroke="rgba(36,27,20,0.08)" stroke-width="3"/>
  `;
}

function renderDay() {
  const entry = plan[activeIndex];
  dayTitle.textContent = entry.day || DAYS[activeIndex];
  dayDesc.textContent = entry.description || '';
  timeEl.textContent = `${entry.time_minutes ?? '—'} min`;
  kcalEl.textContent = `${entry.calories ?? '—'} kcal`;
  cuisineEl.textContent = entry.dish ? entry.dish : (entry.cuisine || '');
  buildPlate(activeIndex);
  updateLabelStyles();
  moveMarker();
}

document.getElementById('wheel-prev').addEventListener('click', () => {
  activeIndex = (activeIndex - 1 + plan.length) % plan.length;
  renderDay();
});
document.getElementById('wheel-next').addEventListener('click', () => {
  activeIndex = (activeIndex + 1) % plan.length;
  renderDay();
});

document.getElementById('plan-btn').addEventListener('click', async () => {
  const diet = document.getElementById('diet-select').value;
  const people = document.getElementById('people-select').value;
  wheelHint.textContent = 'Spinning up a fresh week…';

  try {
    const res = await fetch('/api/meal-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diet, people })
    });
    const data = await res.json();

    if (!res.ok) {
      wheelHint.textContent = data.error || 'Could not generate a plan — showing a sample week instead.';
      plan = FALLBACK_PLAN;
    } else if (Array.isArray(data.days) && data.days.length === 7) {
      plan = data.days;
      wheelHint.textContent = `A fresh ${diet} week for ${people} — click through the days.`;
    } else {
      wheelHint.textContent = 'Unexpected response — showing a sample week instead.';
      plan = FALLBACK_PLAN;
    }
  } catch (err) {
    wheelHint.textContent = 'Could not reach the server — showing a sample week instead.';
    plan = FALLBACK_PLAN;
  }

  activeIndex = 0;
  renderDay();
});

buildLabels();
renderDay();
