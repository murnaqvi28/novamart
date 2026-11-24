import { formatPrice } from '../api.js';

export default function OrderSummary({ totals, itemCount, children }) {
  return (
    <div className="summary" data-testid="order-summary">
      <h3>Order summary</h3>
      <div className="summary__row"><span>Subtotal{itemCount ? ` (${itemCount} item${itemCount > 1 ? 's' : ''})` : ''}</span><span data-testid="summary-subtotal">{formatPrice(totals.subtotal)}</span></div>
      {totals.discount > 0 && (
        <div className="summary__row summary__row--discount"><span>Discount{totals.couponCode ? ` (${totals.couponCode})` : ''}</span><span data-testid="summary-discount">−{formatPrice(totals.discount)}</span></div>
      )}
      <div className="summary__row"><span>Delivery</span><span data-testid="summary-shipping">{totals.shippingFee === 0 ? 'Free' : formatPrice(totals.shippingFee)}</span></div>
      {children}
      <div className="summary__row summary__total"><span>Total</span><span data-testid="summary-total">{formatPrice(totals.total)}</span></div>
    </div>
  );
}
