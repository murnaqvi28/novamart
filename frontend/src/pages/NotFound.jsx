import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container empty" data-testid="not-found-page">
      <div className="big-404">404</div>
      <h2>Page not found</h2>
      <p className="muted">The page you’re looking for doesn’t exist or has moved.</p>
      <Link to="/" className="btn btn--primary">Go home</Link>
    </div>
  );
}
