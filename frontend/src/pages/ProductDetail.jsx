import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api, formatDate, formatPrice } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import ProductCard from '../components/ProductCard.jsx';
import QtyStepper from '../components/QtyStepper.jsx';
import Spinner from '../components/Spinner.jsx';
import Stars from '../components/Stars.jsx';

export default function ProductDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { addItem } = useCart();
  const notify = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [reviewError, setReviewError] = useState('');

  const load = () => {
    setData(null); setError(''); setQty(1);
    api(`/products/${slug}`, { auth: false }).then(setData).catch((e) => setError(e.status === 404 ? 'notfound' : e.message));
    api(`/products/${slug}/reviews`, { auth: false }).then((d) => setReviews(d.data)).catch(() => {});
  };
  useEffect(load, [slug]);

  if (error === 'notfound') {
    return (
      <div className="container empty" data-testid="product-not-found">
        <h2>Product not found</h2>
        <p className="muted">This product may have been removed.</p>
        <Link to="/shop" className="btn btn--primary">Back to shop</Link>
      </div>
    );
  }
  if (error) return <div className="container"><div className="alert alert--error">{error}</div></div>;
  if (!data) return <Spinner />;

  const p = data.data;
  const onSale = p.compareAtPrice && p.compareAtPrice > p.price;

  const onAdd = async () => {
    if (!user) { navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`); return; }
    setAdding(true);
    try {
      await addItem(p.id, qty);
      notify(`${p.name} added to cart`);
    } catch (e) {
      notify(e.message, 'error');
    } finally { setAdding(false); }
  };

  const onReview = async (e) => {
    e.preventDefault(); setReviewError('');
    try {
      const r = await api(`/products/${p.id}/reviews`, { method: 'POST', body: { rating: Number(review.rating), comment: review.comment } });
      setReviews((rs) => [r.data, ...rs]);
      setReview({ rating: 5, comment: '' });
      notify('Thanks for your review!');
      api(`/products/${slug}`, { auth: false }).then(setData);
    } catch (err) { setReviewError(err.details[0]?.message || err.message); }
  };

  return (
    <div className="container" data-testid="product-page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link> / <Link to={`/shop?category=${p.category?.slug}`}>{p.category?.name}</Link> / <span>{p.name}</span>
      </nav>
      <div className="pdp">
        <div className="pdp__img"><img src={p.imageUrl} alt={p.name} data-testid="product-image" /></div>
        <div className="pdp__info">
          <div className="card__cat">{p.category?.name}</div>
          <h1 data-testid="product-title">{p.name}</h1>
          {p.reviewCount > 0 && <Stars value={p.rating} count={p.reviewCount} />}
          <div className="price price--lg">
            <span className="price__now" data-testid="product-price">{formatPrice(p.price)}</span>
            {onSale && <span className="price__was" data-testid="product-compare-price">{formatPrice(p.compareAtPrice)}</span>}
            {onSale && <span className="tag tag--sale tag--inline">Save {formatPrice(p.compareAtPrice - p.price)}</span>}
          </div>
          <p className="pdp__desc" data-testid="product-description">{p.description}</p>
          <div className={`stock ${p.stock === 0 ? 'stock--out' : p.stock <= 5 ? 'stock--low' : ''}`} data-testid="stock-status">
            {p.stock === 0 ? 'Out of stock' : p.stock <= 5 ? `Only ${p.stock} left in stock` : 'In stock'}
          </div>
          {p.inStock && (
            <div className="pdp__buy">
              <QtyStepper value={qty} onChange={setQty} max={p.stock} />
              <button className="btn btn--primary btn--lg" onClick={onAdd} disabled={adding} data-testid="add-to-cart">
                {adding ? 'Adding…' : 'Add to cart'}
              </button>
            </div>
          )}
          <ul className="pdp__perks">
            <li>Free delivery on orders above Rs 5,000</li>
            <li>Cash on delivery available</li>
            <li>7-day easy returns</li>
          </ul>
        </div>
      </div>

      <section className="section reviews" data-testid="reviews-section">
        <h2>Customer reviews</h2>
        {user ? (
          <form className="review-form" onSubmit={onReview} data-testid="review-form">
            <label>Your rating
              <select value={review.rating} onChange={(e) => setReview({ ...review, rating: e.target.value })} data-testid="review-rating">
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}
              </select>
            </label>
            <textarea placeholder="Share your experience with this product" value={review.comment} onChange={(e) => setReview({ ...review, comment: e.target.value })} data-testid="review-comment" rows={3} />
            {reviewError && <div className="field-error" data-testid="review-error">{reviewError}</div>}
            <button className="btn btn--small" type="submit" data-testid="review-submit">Submit review</button>
          </form>
        ) : (
          <p className="muted"><Link to={`/login?redirect=${encodeURIComponent(location.pathname)}`} className="link">Log in</Link> to write a review.</p>
        )}
        {reviews.length === 0 ? <p className="muted" data-testid="no-reviews">No reviews yet.</p> : (
          <ul className="review-list" data-testid="review-list">
            {reviews.map((r) => (
              <li key={r.id} data-testid="review-item">
                <Stars value={r.rating} small />
                <p>{r.comment}</p>
                <span className="muted">{r.userName} · {formatDate(r.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {data.related.length > 0 && (
        <section className="section">
          <h2>You may also like</h2>
          <div className="grid" data-testid="related-products">{data.related.map((r) => <ProductCard key={r.id} product={r} />)}</div>
        </section>
      )}
    </div>
  );
}
