// Curated picks shown in the landing carousel. These are illustrative only —
// clicking "Cook this combo" drops the ingredients into the real input and
// calls the live API, same as typing them in yourself.
const curated = [
  {
    id: 'buddha-bowl',
    eyebrow: 'Todays pick · 01',
    title: 'Rainbow Veggie Buddha Bowl',
    tagline: 'A crunchy, colour-blocked bowl that uses up whatever vegetables are wilting in the crisper drawer.',
    cuisine: 'Mediterranean',
    tags: ['Vegan', 'Gluten-free'],
    time: '25 min',
    kcal: '480 kcal',
    ingredients: 'quinoa, chickpeas, avocado, cherry tomatoes, cucumber, red cabbage, lemon, tahini',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1400&q=80',
    alt: 'Overhead shot of a colourful vegan salad bowl with chickpeas, avocado and vegetables'
  },
  {
    id: 'smoothie-bowl',
    eyebrow: 'Todays pick · 02',
    title: 'Sunrise Smoothie Bowl',
    tagline: 'Frozen fruit and a splash of oat milk, blended thick and piled high with crunchy toppings.',
    cuisine: 'Breakfast',
    tags: ['Vegan', 'No-cook'],
    time: '10 min',
    kcal: '340 kcal',
    ingredients: 'frozen banana, frozen mixed berries, oat milk, granola, chia seeds, honey',
    image: 'https://images.unsplash.com/photo-1645839449203-506aa9c82f8b?auto=format&fit=crop&w=1400&q=80',
    alt: 'Overhead shot of a smoothie bowl topped with fruit and granola on a wooden table'
  },
  {
    id: 'pasta-primavera',
    eyebrow: 'Todays pick · 03',
    title: 'Garden Herb Pasta Primavera',
    tagline: 'A light, herby toss-together for the odd handful of vegetables sitting at the back of the fridge.',
    cuisine: 'Italian',
    tags: ['Vegetarian'],
    time: '30 min',
    kcal: '520 kcal',
    ingredients: 'pasta, zucchini, cherry tomatoes, garlic, parmesan, basil, olive oil, chilli flakes',
    image: 'https://images.unsplash.com/photo-1576402738587-4f748fff5ba1?auto=format&fit=crop&w=1400&q=80',
    alt: 'Plate of pasta with fresh vegetables and herbs'
  },
  {
    id: 'margherita-pizza',
    eyebrow: 'Todays pick · 04',
    title: 'Heirloom Margherita Pizza',
    tagline: 'A weeknight dough, good tomatoes, and a fistful of basil — the fridge does most of the work.',
    cuisine: 'Italian',
    tags: ['Vegetarian'],
    time: '45 min',
    kcal: '610 kcal',
    ingredients: 'pizza dough, mozzarella, tomatoes, fresh basil, olive oil, garlic',
    image: 'https://images.unsplash.com/photo-1607811253515-57ef7723099d?auto=format&fit=crop&w=1400&q=80',
    alt: 'Margherita pizza topped with fresh basil and mozzarella'
  },
  {
    id: 'dosa-stack',
    eyebrow: 'Todays pick · 05',
    title: 'Coconut Chutney Dosa Stack',
    tagline: 'A crisp, fermented-batter classic — built for leftover rice and a spoon of coconut chutney.',
    cuisine: 'South Indian',
    tags: ['Vegan', 'Gluten-free'],
    time: '40 min',
    kcal: '390 kcal',
    ingredients: 'rice, urad dal, fenugreek seeds, coconut, green chilli, curry leaves, ginger',
    image: 'https://images.unsplash.com/photo-1741376509680-9517d487689f?auto=format&fit=crop&w=1400&q=80',
    alt: 'South Indian dosa served with chutney and sambar'
  }
];

export default curated;
