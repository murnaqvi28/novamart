import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import ProductCard from '../components/ProductCard.jsx';
import Spinner from '../components/Spinner.jsx';

const SORTS = [
  ['newest', 'Newest'],
  ['price_asc', 'Price: low to high'],
  ['price_desc', 'Price: high to low'],
  ['name_asc', 'Name: A–Z'],
  ['rating', 'Top rated'],
];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [minPrice, setMinPrice] = useState(params.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(params.get('maxPrice') || '');

  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const sort = params.get('sort') || 'newest';
  const page = Number(params.get('page') || 1);
  const inStock = params.get('inStock') === 'true';

  useEffect(() => { api('/categories', { auth: false }).then((d) => setCategories(d.data)); }, []);

  useEffect(() => {
    setResult(null); setError('');
    const qs = new URLSearchParams(params);
    if (!qs.get('limit')) qs.set('limit', '12');
    api(`/products?${qs.toString()}`, { auth: false }).then(setResult).catch((e) => setError(e.message));
    setMinPrice(params.get('minPrice') || ''); setMaxPrice(params.get('maxPrice') || '');
  }, [params]);

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v === '' || v === null || v === false ? next.delete(k) : next.set(k, String(v))));
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  };

  const applyPrice = (e) => { e.preventDefault(); update({ minPrice, maxPrice }); };
  const activeCat = categories.find((c) => c.slug === category);

  return (
    <div className="container shop" data-testid="shop-page">
      <aside className="filters" data-testid="filters">
        <h3>Category</h3>
        <ul className="filter-list">
          <li><button className={!category ? 'active' : ''} onClick={() => update({ category: '' })} data-testid="filter-category-all">All products</button></li>
          {categories.map((c) => (
            <li key={c.id}>
              <button className={category === c.slug ? 'active' : ''} onClick={() => update({ category: c.slug })} data-testid={`filter-category-${c.slug}`}>
                {c.name} <span>{c.productCount}</span>
              </button>
            </li>
          ))}
        </ul>
        <h3>Price (Rs)</h3>
        <form className="price-filter" onSubmit={applyPrice}>
          <input type="number" min="0" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} data-testid="filter-min-price" aria-label="Minimum price" />
          <span>–</span>
          <input type="number" min="0" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} data-testid="filter-max-price" aria-label="Maximum price" />
          <button className="btn btn--small" type="submit" data-testid="filter-price-apply">Apply</button>
        </form>
        <label className="check">
          <input type="checkbox" checked={inStock} onChange={(e) => update({ inStock: e.target.checked ? 'true' : '' })} data-testid="filter-in-stock" />
          In stock only
        </label>
        {(category || search || minPrice || maxPrice || inStock) && (
          <button className="link" onClick={() => setParams({})} data-testid="clear-filters">Clear all filters</button>
        )}
      </aside>

      <section className="shop__results">
        <div className="shop__head">
          <div>
            <h1 data-testid="shop-title">{search ? `Results for “${search}”` : activeCat ? activeCat.name : 'All products'}</h1>
            {result && <p className="muted" data-testid="result-count">{result.pagination.total} {result.pagination.total === 1 ? 'product' : 'products'}</p>}
          </div>
          <label className="sort">
            Sort by
            <select value={sort} onChange={(e) => update({ sort: e.target.value })} data-testid="sort-select">
              {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        </div>

        {error && <div className="alert alert--error" data-testid="shop-error">{error}</div>}
        {!result && !error && <Spinner />}
        {result && result.data.length === 0 && (
          <div className="empty" data-testid="no-results">
            <h3>No products found</h3>
            <p className="muted">Try a different search or remove some filters.</p>
          </div>
        )}
        {result && result.data.length > 0 && (
          <>
            <div className="grid grid--3" data-testid="product-grid">
              {result.data.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
            {result.pagination.totalPages > 1 && (
              <nav className="pager" aria-label="Pagination" data-testid="pagination">
                <button disabled={page <= 1} onClick={() => update({ page: page - 1 })} data-testid="page-prev">← Previous</button>
                {Array.from({ length: result.pagination.totalPages }, (_, i) => i + 1).map((n) => (
                  <button key={n} className={n === page ? 'active' : ''} onClick={() => update({ page: n })} data-testid={`page-${n}`} aria-current={n === page ? 'page' : undefined}>{n}</button>
                ))}
                <button disabled={page >= result.pagination.totalPages} onClick={() => update({ page: page + 1 })} data-testid="page-next">Next →</button>
              </nav>
            )}
          </>
        )}
      </section>
    </div>
  );
}
