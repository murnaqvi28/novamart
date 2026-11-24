import { useEffect, useState } from 'react';
import { api, formatPrice } from '../../api.js';
import { useToast } from '../../context/ToastContext.jsx';
import Spinner from '../../components/Spinner.jsx';

const EMPTY = { name: '', description: '', price: '', compareAtPrice: '', stock: '', categoryId: '', imageUrl: '', isFeatured: false, isActive: true };

function ProductForm({ initial, categories, onClose, onSaved }) {
  const notify = useToast();
  const [f, setF] = useState(initial ? {
    name: initial.name, description: initial.description, price: String(initial.price), compareAtPrice: initial.compareAtPrice ? String(initial.compareAtPrice) : '',
    stock: String(initial.stock), categoryId: initial.category?.id ? String(initial.category.id) : '', imageUrl: initial.imageUrl?.startsWith('/img/') ? '' : (initial.imageUrl || ''),
    isFeatured: initial.isFeatured, isActive: initial.isActive,
  } : EMPTY);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const num = (v) => (v === '' ? NaN : Number(v));

  const submit = async (e) => {
    e.preventDefault(); setErrors({}); setBusy(true);
    const body = {
      name: f.name, description: f.description, price: num(f.price), stock: num(f.stock),
      compareAtPrice: f.compareAtPrice === '' ? null : Number(f.compareAtPrice),
      categoryId: f.categoryId ? Number(f.categoryId) : null, imageUrl: f.imageUrl || null,
      isFeatured: f.isFeatured, isActive: f.isActive,
    };
    try {
      const r = initial
        ? await api(`/admin/products/${initial.id}`, { method: 'PUT', body })
        : await api('/admin/products', { method: 'POST', body });
      notify(initial ? 'Product updated' : 'Product created');
      onSaved(r.data);
    } catch (err) { setErrors(err.fieldErrors); if (!err.details.length) notify(err.message, 'error'); setBusy(false); }
  };

  const input = (k, label, props = {}) => (
    <label className={`field ${errors[k] ? 'field--invalid' : ''}`}><span>{label}</span>
      <input value={f[k]} onChange={set(k)} data-testid={`product-form-${k}`} {...props} />
      {errors[k] && <span className="field-error" data-testid={`product-form-error-${k}`}>{errors[k]}</span>}
    </label>
  );

  return (
    <div className="modal" role="dialog" aria-modal="true" data-testid="product-form-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal__card" onSubmit={submit} noValidate>
        <div className="panel__head"><h3>{initial ? 'Edit product' : 'Add product'}</h3><button type="button" className="icon-btn" onClick={onClose} aria-label="Close" data-testid="product-form-close">×</button></div>
        {input('name', 'Name')}
        <label className="field"><span>Description</span><textarea rows={3} value={f.description} onChange={set('description')} data-testid="product-form-description" /></label>
        <div className="form-grid">
          {input('price', 'Price (Rs)', { type: 'number', min: 0 })}
          {input('compareAtPrice', 'Compare-at price (optional)', { type: 'number', min: 0 })}
          {input('stock', 'Stock', { type: 'number', min: 0 })}
          <label className="field"><span>Category</span>
            <select value={f.categoryId} onChange={set('categoryId')} data-testid="product-form-categoryId">
              <option value="">None</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </div>
        {input('imageUrl', 'Image URL (optional — leave blank for generated artwork)', { placeholder: 'https://…' })}
        <div className="row-gap">
          <label className="check"><input type="checkbox" checked={f.isFeatured} onChange={set('isFeatured')} data-testid="product-form-isFeatured" /> Featured on home page</label>
          <label className="check"><input type="checkbox" checked={f.isActive} onChange={set('isActive')} data-testid="product-form-isActive" /> Active (visible in store)</label>
        </div>
        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn--primary" disabled={busy} data-testid="product-form-submit">{busy ? 'Saving…' : 'Save product'}</button>
        </div>
      </form>
    </div>
  );
}

export default function AdminProducts() {
  const notify = useToast();
  const [products, setProducts] = useState(null);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new

  const load = (s = search) => api(`/admin/products${s ? `?search=${encodeURIComponent(s)}` : ''}`).then((d) => setProducts(d.data));
  useEffect(() => { load(); api('/categories', { auth: false }).then((d) => setCategories(d.data)); }, []); // eslint-disable-line

  const remove = async (p) => {
    if (!window.confirm(`Deactivate "${p.name}"? It will be hidden from the store.`)) return;
    try { await api(`/admin/products/${p.id}`, { method: 'DELETE' }); notify('Product deactivated'); load(); }
    catch (e) { notify(e.message, 'error'); }
  };

  return (
    <div data-testid="admin-products">
      <div className="panel__head">
        <h1>Products</h1>
        <button className="btn btn--primary" onClick={() => setEditing(null)} data-testid="add-product">+ Add product</button>
      </div>
      <form className="toolbar" onSubmit={(e) => { e.preventDefault(); load(); }}>
        <input placeholder="Search by name" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="admin-product-search" />
        <button className="btn btn--small" type="submit">Search</button>
      </form>
      {!products ? <Spinner /> : (
        <div className="table-wrap">
          <table className="table" data-testid="admin-product-table">
            <thead><tr><th>Product</th><th>Category</th><th className="num">Price</th><th className="num">Stock</th><th>Status</th><th /></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} data-testid="admin-product-row" data-product-id={p.id}>
                  <td><div className="prod-cell"><img src={p.imageUrl} alt="" /><span data-testid="admin-product-name">{p.name}</span></div></td>
                  <td>{p.category?.name || '—'}</td>
                  <td className="num">{formatPrice(p.price)}</td>
                  <td className={`num ${p.stock === 0 ? 'text-danger' : p.stock <= 5 ? 'text-warn' : ''}`} data-testid="admin-product-stock">{p.stock}</td>
                  <td><span className={`status ${p.isActive ? 'status--delivered' : 'status--cancelled'}`}>{p.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td className="actions">
                    <button className="link" onClick={() => setEditing(p)} data-testid="admin-product-edit">Edit</button>
                    {p.isActive && <button className="link link--danger" onClick={() => remove(p)} data-testid="admin-product-delete">Deactivate</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing !== undefined && (
        <ProductForm initial={editing} categories={categories} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); load(); }} />
      )}
    </div>
  );
}
