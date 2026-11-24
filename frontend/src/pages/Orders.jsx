import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatDate, formatPrice } from '../api.js';
import Spinner from '../components/Spinner.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

export default function Orders() {
  const [orders, setOrders] = useState(null);
  useEffect(() => { api('/orders').then((d) => setOrders(d.data)); }, []);
  if (!orders) return <Spinner />;
  return (
    <div className="container narrow" data-testid="orders-page">
      <h1>My orders</h1>
      {orders.length === 0 ? (
        <div className="empty" data-testid="orders-empty">
          <h3>No orders yet</h3>
          <Link to="/shop" className="btn btn--primary">Start shopping</Link>
        </div>
      ) : (
        <ul className="order-list" data-testid="order-list">
          {orders.map((o) => (
            <li key={o.id}>
              <Link to={`/orders/${o.id}`} className="order-row" data-testid="order-row" data-order-number={o.orderNumber}>
                <div>
                  <strong data-testid="order-number">{o.orderNumber}</strong>
                  <span className="muted">{formatDate(o.createdAt)} · {o.itemCount} item{o.itemCount > 1 ? 's' : ''}</span>
                </div>
                <StatusBadge status={o.status} />
                <strong data-testid="order-total">{formatPrice(o.total)}</strong>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
