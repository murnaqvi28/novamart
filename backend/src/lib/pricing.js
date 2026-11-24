import { config } from './config.js';
import { query } from './db.js';
import { badRequest } from './errors.js';

const round2 = (n) => Math.round(n * 100) / 100;

// Looks up and validates a coupon against a subtotal. Throws 400 with a clear reason if unusable.
export async function resolveCoupon(code, subtotal, db = { query }) {
  if (!code) return null;
  const { rows } = await db.query('SELECT * FROM coupons WHERE UPPER(code) = UPPER($1)', [code.trim()]);
  const c = rows[0];
  if (!c || !c.is_active) throw badRequest('Invalid coupon code');
  if (c.expires_at && new Date(c.expires_at) < new Date()) throw badRequest('This coupon has expired');
  if (subtotal < c.min_subtotal) {
    throw badRequest(`Minimum order of ${config.currency} ${c.min_subtotal} required for this coupon`);
  }
  return c;
}

export function computeTotals(subtotal, coupon) {
  subtotal = round2(subtotal);
  let discount = 0;
  if (coupon) {
    discount = coupon.type === 'percent' ? round2((subtotal * coupon.value) / 100) : Math.min(coupon.value, subtotal);
  }
  const shippingFee = subtotal === 0 || subtotal >= config.freeShippingThreshold ? 0 : config.shippingFee;
  const total = round2(subtotal - discount + shippingFee);
  return { subtotal, discount: round2(discount), shippingFee, total, couponCode: coupon ? coupon.code : null };
}
