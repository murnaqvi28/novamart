import { useEffect, useState } from 'react';
import { api, formatDate, formatPrice } from '../../api.js';
import { useToast } from '../../context/ToastContext.jsx';
import Spinner from '../../components/Spinner.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';

const NEXT = { pending: ['paid', 'cancelled'], paid: ['shipped', 'cancelled'], shipped: ['delivered'], delivered: [], cancelled: [] };
const FILTERS = ['', 'pending', 'paid', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const notify = useToast();
  const [orders, setOrders] = useState(null);
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(null);

  const load = () => api(`/admin/orders${status ? `?status=${status}` : ''}`).then((d) => setOrders(d.data));
  useEffect(() => { setOrders(null); load(); }, [status]); // eslint-disable-line

  const changeStatus = async (o, to) => {
    try {
      await api(`/admin/orders/${o.id}/status`, { method: 'PATCH', body: { status: to } });
      notify(`Order ${o.orderNumber} marked as ${to}`);
      load();
      if (open?.id === o.id) setOpen((await api(`/admin/orders/${o.id}`)).data);
    } catch (e) { notify(e.message, 'error'); }
  };

  const view = async (o) => setOpen((await api(`/admin/orders/${o.id}`)).data);

  return (
    <div data-testid="admin-orders">
      <h1>Orders</h1>
      <div className="chips" data-testid="order-status-filter">
        {FILTERS.map((s) => (
          <button key={s || 'all'} className={`chip ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)} data-testid={`order-filter-${s || 'all'}`}>
            {s ? s[0].toUpperCase() + s.slice(1) : 'All'}
          </button>
        ))}
      </div>
      {!orders ? <Spinner /> : orders.length === 0 ? <p className="muted" data-testid="admin-orders-empty">No orders found.</p> : (
        <div className="table-wrap">
          <table className="table" data-testid="admin-order-table">
            <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th className="num">Total</th><th>Status</th><th>Update</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} data-testid="admin-order-row" data-order-number={o.orderNumber}>
                  <td><button className="link" onClick={() => view(o)} data-testid="admin-order-view">{o.orderNumber}</button></td>
                  <td>{o.customer?.name}<div className="muted">{o.customer?.email}</div></td>
                  <td>{formatDate(o.createdAt)}</td>
                  <td className="num">{formatPrice(o.total)}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td>
                    {NEXT[o.status].length ? (
                      <select value="" onChange={(e) => e.target.value && changeStatus(o, e.target.value)} data-testid="admin-order-status-select" aria-label={`Update status for ${o.orderNumber}`}>
                        <option value="">Change to…</option>
                        {NEXT[o.status].map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
                      </select>
                    ) : <span className="muted">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open && (
        <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && setOpen(null)} data-testid="admin-order-modal">
          <div className="modal__card">
            <div className="panel__head"><h3>{open.orderNumber}</h3><button className="icon-btn" onClick={() => setOpen(null)} aria-label="Close">×</button></div>
            <p><StatusBadge status={open.status} /> <span className="muted">· {open.paymentMethod === 'cod' ? 'Cash on delivery' : `Card •••• ${open.cardLast4}`}</span></p>
            <table className="table"><tbody>
              {open.items.map((i, k) => <tr key={k}><td>{i.name} × {i.quantity}</td><td className="num">{formatPrice(i.lineTotal)}</td></tr>)}
              <tr><td>Delivery</td><td className="num">{formatPrice(open.shippingFee)}</td></tr>
              {open.discount > 0 && <tr><td>Discount ({open.couponCode})</td><td className="num">−{formatPrice(open.discount)}</td></tr>}
              <tr><td><strong>Total</strong></td><td className="num"><strong>{formatPrice(open.total)}</strong></td></tr>
            </tbody></table>
            <h4>Ship to</h4>
            <p>{open.shipping.name}, {open.shipping.phone}<br />{open.shipping.address}, {open.shipping.city} {open.shipping.postalCode}</p>
          </div>
        </div>
      )}
    </div>
  );
}
