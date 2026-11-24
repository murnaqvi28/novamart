import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import ProductCard from '../components/ProductCard.jsx';
import Spinner from '../components/Spinner.jsx';

export default function Home() {
  const [featured, setFeatured] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api('/products?featured=true&limit=8', { auth: false }).then((d) => setFeatured(d.data));
    api('/categories', { auth: false }).then((d) => setCategories(d.data));
  }, []);

  return (
    <div data-testid="home-page">
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__copy">
            <span className="eyebrow">Winter Collection 2026</span>
            <h1>Thoughtfully chosen.<br />Delivered to your door.</h1>
            <p>From noise-cancelling headphones to hand-finished shawls, find quality essentials at honest prices. Pay by card or cash on delivery.</p>
            <div className="hero__cta">
              <Link to="/shop" className="btn btn--primary" data-testid="hero-shop-now">Shop now</Link>
              <Link to="/shop?sort=price_asc" className="btn btn--ghost">Browse deals</Link>
            </div>
          </div>
          <div className="hero__art" aria-hidden="true">
            <img src="/img/aero-wireless-headphones.svg" alt="" />
            <img src="/img/classic-cotton-kurta.svg" alt="" />
            <img src="/img/halo-table-lamp.svg" alt="" />
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="section__head"><h2>Shop by category</h2></div>
        <div className="cats" data-testid="category-list">
          {categories.map((c) => (
            <Link key={c.id} to={`/shop?category=${c.slug}`} className={`cat cat--${c.slug}`} data-testid={`category-${c.slug}`}>
              <span className="cat__name">{c.name}</span>
              <span className="cat__count">{c.productCount} products</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="section__head">
          <h2>Featured picks</h2>
          <Link to="/shop" className="link">View all →</Link>
        </div>
        {!featured ? <Spinner /> : (
          <div className="grid" data-testid="featured-products">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      <section className="container section perks">
        <div><strong>Free delivery</strong><span>On orders above Rs 5,000</span></div>
        <div><strong>Cash on delivery</strong><span>Pay when it arrives</span></div>
        <div><strong>7-day returns</strong><span>No questions asked</span></div>
        <div><strong>Secure payments</strong><span>Card details never stored</span></div>
      </section>
    </div>
  );
}
