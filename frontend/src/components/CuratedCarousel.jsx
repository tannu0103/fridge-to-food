import { useCallback, useEffect, useRef, useState } from 'react';

export default function CuratedCarousel({ items, onTryCombo }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  const go = useCallback((next) => {
    setIndex((current) => (next + items.length) % items.length);
  }, [items.length]);

  useEffect(() => {
    if (paused) return undefined;
    timerRef.current = setTimeout(() => go(index + 1), 6000);
    return () => clearTimeout(timerRef.current);
  }, [index, paused, go]);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') go(index + 1);
    if (e.key === 'ArrowLeft') go(index - 1);
  };

  const active = items[index];

  return (
    <section
      className="carousel"
      aria-roledescription="carousel"
      aria-label="Today's curated picks"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={onKeyDown}
    >
      <div className="carousel__frame">
        <div className="carousel__copy">
          <p className="carousel__eyebrow">{active.eyebrow}</p>
          <h2 className="carousel__title">{active.title}</h2>
          <p className="carousel__tagline">{active.tagline}</p>

          <div className="carousel__meta">
            <span className="pill pill--ghost">{active.cuisine}</span>
            {active.tags.map((t) => (
              <span className="pill pill--ghost" key={t}>{t}</span>
            ))}
            <span className="carousel__meta-fact">{active.time}</span>
            <span className="carousel__meta-fact">{active.kcal}</span>
          </div>

          <button
            type="button"
            className="btn btn--primary"
            onClick={() => onTryCombo(active.ingredients)}
          >
            Cook this combo
          </button>
        </div>

        <div className="carousel__stage">
          {items.map((item, i) => {
            const offset = i - index;
            const half = Math.floor(items.length / 2);
            const wrapped = ((offset + items.length + half) % items.length) - half;
            const isActive = i === index;
            const magnitude = Math.min(1, Math.abs(wrapped));
            const style = {
              transform: `translateX(${wrapped * 26}px) scale(${1 - magnitude * 0.12})`,
              opacity: 1 - magnitude * 0.75,
              zIndex: 20 - Math.abs(wrapped),
              visibility: Math.abs(wrapped) > 2 ? 'hidden' : 'visible'
            };
            return (
              <figure
                key={item.id}
                className={`carousel__card${isActive ? ' is-active' : ''}`}
                style={style}
                aria-hidden={!isActive}
              >
                <img src={item.image} alt={isActive ? item.alt : ''} loading={isActive ? 'eager' : 'lazy'} />
              </figure>
            );
          })}
        </div>
      </div>

      <div className="carousel__controls">
        <button type="button" className="carousel__arrow" onClick={() => go(index - 1)} aria-label="Previous pick">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>

        <div className="carousel__dots" role="tablist" aria-label="Select a pick">
          {items.map((item, i) => (
            <button
              key={item.id}
              role="tab"
              aria-selected={i === index}
              aria-label={item.title}
              className={`carousel__dot${i === index ? ' is-active' : ''}`}
              onClick={() => go(i)}
            />
          ))}
        </div>

        <button type="button" className="carousel__arrow" onClick={() => go(index + 1)} aria-label="Next pick">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </section>
  );
}
