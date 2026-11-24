export default function Stars({ value = 0, count, small = false }) {
  const full = Math.round(value);
  return (
    <div className={`stars ${small ? 'stars--sm' : ''}`} aria-label={`Rated ${value} out of 5`} data-testid="rating">
      <span className="stars__icons">{'★'.repeat(full)}<span className="stars__empty">{'★'.repeat(5 - full)}</span></span>
      {count !== undefined && <span className="stars__count">{value.toFixed(1)} ({count})</span>}
    </div>
  );
}
