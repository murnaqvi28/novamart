import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer" data-testid="footer">
      <div className="container footer__grid">
        <div>
          <div className="logo logo--light">Nova<span>Mart</span></div>
          <p className="muted">Everyday essentials and thoughtful finds, delivered across Pakistan.</p>
        </div>
        <div>
          <h4>Shop</h4>
          <Link to="/shop?category=electronics">Electronics</Link>
          <Link to="/shop?category=fashion">Fashion</Link>
          <Link to="/shop?category=home">Home &amp; Living</Link>
          <Link to="/shop?category=beauty">Beauty</Link>
        </div>
        <div>
          <h4>Help</h4>
          <span>Cash on delivery available</span>
          <span>7-day easy returns</span>
          <span>support@novamart.pk</span>
        </div>
        <div>
          <h4>Developers</h4>
          <a href="/api-docs" target="_blank" rel="noreferrer" data-testid="api-docs-link">API documentation</a>
          <a href="/api/health" target="_blank" rel="noreferrer">System status</a>
        </div>
      </div>
      <div className="container footer__bottom">© {new Date().getFullYear()} NovaMart. All rights reserved.</div>
    </footer>
  );
}
