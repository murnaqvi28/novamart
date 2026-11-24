import { Link } from 'react-router-dom';
import { formatPrice } from '../api.js';
import Stars from './Stars.jsx';

export default function ProductCard({ product }) {
  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;
  const off = onSale ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0;
  return (
    <Link to={`/product/${product.slug}`} className="card" data-testid="product-card" data-product-id={product.id}>
      <div className="card__img">
        <img src={product.imageUrl} alt={product.name} loading="lazy" />
        {onSale && <span className="tag tag--sale" data-testid="sale-badge">-{off}%</span>}
        {!product.inStock && <span className="tag tag--out" data-testid="out-of-stock-badge">Sold out</span>}
      </div>
      <div className="card__body">
        <div className="card__cat">{product.category?.name}</div>
        <h3 className="card__title" data-testid="product-name">{product.name}</h3>
        {product.reviewCount > 0 && <Stars value={product.rating} count={product.reviewCount} small />}
        <div className="price">
          <span className="price__now" data-testid="product-price">{formatPrice(product.price)}</span>
          {onSale && <span className="price__was">{formatPrice(product.compareAtPrice)}</span>}
        </div>
      </div>
    </Link>
  );
}
