import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import OrderSummary from '../components/OrderSummary.jsx';

const CITIES = ['Islamabad', 'Rawalpindi', 'Lahore', 'Karachi', 'Peshawar', 'Faisalabad', 'Multan', 'Quetta'];

function Field({ label, name, error, ...props }) {
  return (
    <label className={`field ${error ? 'field--invalid' : ''}`}>
      <span>{label}</span>
      <input name={name} data-testid={`checkout-${name}`} aria-invalid={!!error} {...props} />
      {error && <span className="field-error" data-testid={`error-${name}`}>{error}</span>}
    </label>
  );
}

export default function Checkout() {
  const { user } = useAuth();
  const { cart, refresh } = useCart();
  const notify = useToast();
  const navigate = useNavigate();
  const [ship, setShip] = useState({ name: user?.name || '', phone: '', address: '', city: 'Rawalpindi', postalCode: '' });
  const [method, setMethod] = useState('cod');
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', nameOnCard: '' });
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [placing, setPlacing] = useState(false);

  if (cart.items.length === 0 && !placing) return <Navigate to="/cart" replace />;

  const totals = coupon?.totals || cart.totals;

  const applyCoupon = async () => {
    setCouponError('');
    try {
      const r = await api('/cart/coupon', { method: 'POST', body: { code: couponInput } });
      setCoupon(r); notify(`Coupon ${r.coupon.code} applied`);
    } catch (e) { setCoupon(null); setCouponError(e.details[0]?.message || e.message); }
  };

  const formatCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
  const formatExpiry = (v) => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; };

  const placeOrder = async (e) => {
    e.preventDefault();
    setErrors({}); setFormError(''); setPlacing(true);
    try {
      const body = { shipping: ship, paymentMethod: method, couponCode: coupon?.coupon.code || null };
      if (method === 'card') body.card = card;
      const r = await api('/orders', { method: 'POST', body });
      await refresh();
      navigate(`/orders/${r.data.id}?placed=1`, { replace: true });
    } catch (err) {
      setPlacing(false);
      const fe = err.fieldErrors || {};
      const mapped = {};
      Object.entries(fe).forEach(([k, v]) => { mapped[k.replace(/^shipping\./, '').replace(/^card\./, 'card-')] = v; });
      setErrors(mapped);
      setFormError(Object.keys(mapped).length ? 'Please fix the highlighted fields.' : err.message);
    }
  };

  return (
    <div className="container" data-testid="checkout-page">
      <h1>Checkout</h1>
      <form className="split" onSubmit={placeOrder} noValidate>
        <div className="checkout">
          {formError && <div className="alert alert--error" data-testid="checkout-error" role="alert">{formError}</div>}
          <section className="panel">
            <h3>1. Delivery details</h3>
            <div className="form-grid">
              <Field label="Full name" name="name" value={ship.name} onChange={(e) => setShip({ ...ship, name: e.target.value })} error={errors.name} autoComplete="name" />
              <Field label="Mobile number" name="phone" placeholder="03001234567" value={ship.phone} onChange={(e) => setShip({ ...ship, phone: e.target.value })} error={errors.phone} autoComplete="tel" />
              <div className="span-2"><Field label="Address" name="address" placeholder="House, street, area" value={ship.address} onChange={(e) => setShip({ ...ship, address: e.target.value })} error={errors.address} autoComplete="street-address" /></div>
              <label className={`field ${errors.city ? 'field--invalid' : ''}`}>
                <span>City</span>
                <select value={ship.city} onChange={(e) => setShip({ ...ship, city: e.target.value })} data-testid="checkout-city">
                  {CITIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
              <Field label="Postal code" name="postalCode" placeholder="46000" value={ship.postalCode} onChange={(e) => setShip({ ...ship, postalCode: e.target.value })} error={errors.postalCode} inputMode="numeric" />
            </div>
          </section>

          <section className="panel">
            <h3>2. Payment</h3>
            <div className="pay-options">
              <label className={`pay-option ${method === 'cod' ? 'active' : ''}`}>
                <input type="radio" name="payment" value="cod" checked={method === 'cod'} onChange={() => setMethod('cod')} data-testid="payment-cod" />
                <div><strong>Cash on delivery</strong><span className="muted">Pay when your order arrives</span></div>
              </label>
              <label className={`pay-option ${method === 'card' ? 'active' : ''}`}>
                <input type="radio" name="payment" value="card" checked={method === 'card'} onChange={() => setMethod('card')} data-testid="payment-card" />
                <div><strong>Debit / credit card</strong><span className="muted">Visa, Mastercard</span></div>
              </label>
            </div>
            {method === 'card' && (
              <div className="form-grid" data-testid="card-form">
                <div className="span-2"><Field label="Card number" name="card-number" placeholder="1234 5678 9012 3456" inputMode="numeric" value={card.number} onChange={(e) => setCard({ ...card, number: formatCard(e.target.value) })} error={errors['card-number']} autoComplete="cc-number" /></div>
                <Field label="Expiry (MM/YY)" name="card-expiry" placeholder="MM/YY" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })} error={errors['card-expiry']} autoComplete="cc-exp" />
                <Field label="CVV" name="card-cvv" placeholder="123" inputMode="numeric" maxLength={3} value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '') })} error={errors['card-cvv']} autoComplete="cc-csc" />
                <div className="span-2"><Field label="Name on card" name="card-nameOnCard" value={card.nameOnCard} onChange={(e) => setCard({ ...card, nameOnCard: e.target.value })} error={errors['card-nameOnCard']} autoComplete="cc-name" /></div>
              </div>
            )}
            {errors.card && <div className="field-error" data-testid="error-card">{errors.card}</div>}
          </section>
        </div>

        <aside>
          <div className="summary-items" data-testid="checkout-items">
            {cart.items.map((i) => (
              <div key={i.productId} className="summary-item">
                <img src={i.imageUrl} alt="" />
                <span>{i.name} <span className="muted">× {i.quantity}</span></span>
              </div>
            ))}
          </div>
          <OrderSummary totals={totals} itemCount={cart.itemCount}>
            <div className="coupon">
              {coupon ? (
                <div className="coupon__applied" data-testid="coupon-applied">
                  <span>Coupon <strong>{coupon.coupon.code}</strong> applied</span>
                  <button type="button" className="link link--danger" onClick={() => { setCoupon(null); setCouponInput(''); }} data-testid="coupon-remove">Remove</button>
                </div>
              ) : (
                <>
                  <div className="coupon__row">
                    <input placeholder="Coupon code" value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} data-testid="coupon-input" aria-label="Coupon code" />
                    <button type="button" className="btn btn--small" onClick={applyCoupon} disabled={!couponInput.trim()} data-testid="coupon-apply">Apply</button>
                  </div>
                  {couponError && <div className="field-error" data-testid="coupon-error">{couponError}</div>}
                </>
              )}
            </div>
          </OrderSummary>
          <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={placing} data-testid="place-order">
            {placing ? 'Placing order…' : `Place order`}
          </button>
          <Link to="/cart" className="link center-link">Back to cart</Link>
        </aside>
      </form>
    </div>
  );
}
