export default function Spinner({ label = 'Loading…' }) {
  return <div className="spinner" role="status" data-testid="loading"><span className="spinner__dot" />{label}</div>;
}
