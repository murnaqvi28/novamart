import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatDate, formatPrice } from '../../api.js';
import Spinner from '../../components/Spinner.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';

export default function Dashboard() {
  const [s, setS] = useState(null);
  useEffect(() => { api('/admin/stats').then((d) => setS(d.data)); }, []);
  if (!s) return <Spinner />;
  return (
    <div data-testid="admin-dashboard">
      <h1>Dashboard</h1>
      <div className="stats">
        <div className="stat" data-testid="stat-revenue"><span>Revenue</span><strong>{formatPrice(s.revenue)}</strong></div>
        <div className="stat" data-testid="stat-orders"><span>Orders</span><strong>{s.orders}</strong></div>
        <div className="stat" data-testid="stat-to-fulfil"><span>To fulfil</span><strong>{s.ordersToFulfil}</strong></div>
        <div className="stat" data-testid="stat-customers"><span>Customers</span><strong>{s.customers}</strong></div>
      </div>
      <div className="info-grid">
        <div className="panel">
          <div className="panel__head"><h3>Recent orders</h3><Link to="/admin/orders" className="link">View all</Link></div>
          {s.recentOrders.length === 0 ? <p className="muted">No orders yet.</p> : (
            <table className="table">
              <tbody>
                {s.recentOrders.map((o) => (
                  <tr key={o.id}><td><strong>{o.orderNumber}</strong><div className="muted">{o.customer?.name} · {formatDate(o.createdAt)}</div></td><td><StatusBadge status={o.status} /></td><td className="num">{formatPrice(o.total)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="panel" data-testid="low-stock">
          <div className="panel__head"><h3>Low stock</h3><Link to="/admin/products" className="link">Manage</Link></div>
          <table className="table">
            <tbody>
              {s.lowStock.map((p) => (
                <tr key={p.id}><td>{p.name}</td><td className={`num ${p.stock === 0 ? 'text-danger' : 'text-warn'}`}>{p.stock} left</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
