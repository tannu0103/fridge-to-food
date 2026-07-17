export default function LoadingState() {
  return (
    <div className="skeleton" role="status" aria-live="polite">
      <span className="sr-only">Generating your recipe…</span>
      <div className="skeleton__title" />
      <div className="skeleton__line" style={{ width: '70%' }} />
      <div className="skeleton__pills">
        <div className="skeleton__pill" />
        <div className="skeleton__pill" />
        <div className="skeleton__pill" />
      </div>
      <div className="skeleton__grid">
        <div>
          <div className="skeleton__line" style={{ width: '40%' }} />
          {Array.from({ length: 5 }).map((_, i) => (
            <div className="skeleton__line" key={i} />
          ))}
        </div>
        <div>
          <div className="skeleton__line" style={{ width: '40%' }} />
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="skeleton__line" key={i} style={{ height: '2.4rem' }} />
          ))}
        </div>
      </div>
    </div>
  );
}
