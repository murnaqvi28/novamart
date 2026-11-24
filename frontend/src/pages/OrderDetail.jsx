import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api, formatDate, formatPrice } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import OrderSummary from '../components/OrderSummary.jsx';
import Spinner from '../components/Spinner.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

const STEPS = ['pending', 'paid', 'shipped', 'delivered'];

export default function OrderDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const notify = useToast();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => { api(`/orders/${id}`).then((d) => setOrder(d.data)).catch((e) => setError(e.message)); }, [id]);

  if (error) return <div className="container empty" data-testid="order-not-found"><h2>{error}</h2><Link to="/orders" className="btn btn--primary">My orders</Link></div>;
  if (!order) return <Spinner />;

  const cancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    setCancelling(true);
    try { const d = await api(`/orders/${order.id}/cancel`, { method: 'POST' }); setOrder(d.data); notify('Order cancelled'); }
    catch (e) { notify(e.message, 'error'); }
    finally { setCancelling(false); }
  };

  const stepIdx = STEPS.indexOf(order.status);

  return (
    <div className="container" data-testid="order-detail-page">
      {params.get('placed') && (
        <div className="success-banner" data-testid="order-success">
          <div className="success-banner__icon">✓</div>
          <div>
            <h2>Thank you! Your order has been placed.</h2>
            <p>Order <strong data-testid="success-order-number">{order.orderNumber}</strong> — we’ll text updates to {order.shipping.phone}.</p>
          </div>
        </div>
      )}
      <div className="order-head">
        <div>
          <h1 data-testid="order-number">{order.orderNumber}</h1>
          <span className="muted">Placed on {formatDate(order.createdAt)}</span>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {order.status !== 'cancelled' && (
        <ol className="timeline" data-testid="order-timeline">
          {STEPS.map((s, i) => <li key={s} className={i <= stepIdx ? 'done' : ''}>{s[0].toUpperCase() + s.slice(1)}</li>)}
        </ol>
      )}

      <div className="split">
        <div>
          <ul className="cart-list" data-testid="order-items">
            {order.items.map((i, idx) => (
              <li key={idx} className="cart-item cart-item--static" data-testid="order-item">
                <div className="cart-item__img">{i.imageUrl && <img src={i.imageUrl} alt={i.name} />}</div>
                <div className="cart-item__info">
                  {i.slug ? <Link to={`/product/${i.slug}`} className="cart-item__name">{i.name}</Link> : <span className="cart-item__name">{i.name}</span>}
                  <span className="muted">{formatPrice(i.unitPrice)} × {i.quantity}</span>
                </div>
                <div className="cart-item__total">{formatPrice(i.lineTotal)}</div>
              </li>
            ))}
          </ul>
          <div className="info-grid">
            <div className="panel" data-testid="order-shipping">
              <h4>Delivery address</h4>
              <p>{order.shipping.name}<br />{order.shipping.address}<br />{order.shipping.city} {order.shipping.postalCode}<br />{order.shipping.phone}</p>
            </div>
            <div className="panel" data-testid="order-payment">
              <h4>Payment</h4>
              <p>{order.paymentMethod === 'cod' ? 'Cash on delivery' : `Card ending in ${order.cardLast4}`}</p>
            </div>
          </div>
        </div>
        <aside>
          <OrderSummary totals={order} />
          {['pending', 'paid'].includes(order.status) && (
            <button className="btn btn--danger btn--block" onClick={cancel} disabled={cancelling} data-testid="cancel-order">
              {cancelling ? 'Cancelling…' : 'Cancel order'}
            </button>
          )}
          <Link to="/orders" className="link center-link">All orders</Link>
        </aside>
      </div>
    </div>
  );
}
