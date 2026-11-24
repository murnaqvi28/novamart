import { Link, useNavigate } from 'react-router-dom';
import { formatPrice } from '../api.js';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import QtyStepper from '../components/QtyStepper.jsx';
import OrderSummary from '../components/OrderSummary.jsx';

export default function Cart() {
  const { cart, updateItem, removeItem } = useCart();
  const notify = useToast();
  const navigate = useNavigate();

  const change = async (item, qty) => {
    try { await updateItem(item.productId, qty); } catch (e) { notify(e.message, 'error'); }
  };
  const remove = async (item) => {
    try { await removeItem(item.productId); notify(`${item.name} removed from cart`); } catch (e) { notify(e.message, 'error'); }
  };

  if (cart.items.length === 0) {
    return (
      <div className="container empty" data-testid="cart-empty">
        <h2>Your cart is empty</h2>
        <p className="muted">Looks like you haven’t added anything yet.</p>
        <Link to="/shop" className="btn btn--primary" data-testid="continue-shopping">Start shopping</Link>
      </div>
    );
  }

  const unavailable = cart.items.some((i) => !i.available);
  const toFree = 5000 - cart.totals.subtotal;

  return (
    <div className="container" data-testid="cart-page">
      <h1>Shopping cart</h1>
      {toFree > 0 && <div className="alert alert--info" data-testid="free-shipping-hint">Add {formatPrice(toFree)} more to get free delivery.</div>}
      <div className="split">
        <ul className="cart-list" data-testid="cart-items">
          {cart.items.map((i) => (
            <li key={i.productId} className="cart-item" data-testid="cart-item" data-product-id={i.productId}>
              <Link to={`/product/${i.slug}`} className="cart-item__img"><img src={i.imageUrl} alt={i.name} /></Link>
              <div className="cart-item__info">
                <Link to={`/product/${i.slug}`} className="cart-item__name" data-testid="cart-item-name">{i.name}</Link>
                <span className="muted" data-testid="cart-item-unit-price">{formatPrice(i.unitPrice)} each</span>
                {!i.available && <span className="field-error" data-testid="cart-item-unavailable">Only {i.stock} left — please reduce quantity</span>}
                <button className="link link--danger" onClick={() => remove(i)} data-testid="cart-item-remove">Remove</button>
              </div>
              <QtyStepper value={i.quantity} max={Math.max(i.stock, 1)} onChange={(q) => change(i, q)} testid="cart-qty" />
              <div className="cart-item__total" data-testid="cart-item-total">{formatPrice(i.lineTotal)}</div>
            </li>
          ))}
        </ul>
        <aside>
          <OrderSummary totals={cart.totals} itemCount={cart.itemCount} />
          <button className="btn btn--primary btn--block btn--lg" disabled={unavailable} onClick={() => navigate('/checkout')} data-testid="checkout-button">
            Proceed to checkout
          </button>
          <Link to="/shop" className="link center-link">Continue shopping</Link>
        </aside>
      </div>
    </div>
  );
}
