import { Router } from 'express';
import { z } from 'zod';
import { query, withTransaction } from '../lib/db.js';
import { ApiError, ah, badRequest, notFound } from '../lib/errors.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { computeTotals, resolveCoupon } from '../lib/pricing.js';
import { formatOrder } from '../lib/format.js';
import { loadCart } from './cart.js';

const router = Router();
router.use(requireAuth);

// Mock payment gateway test cards
export const TEST_CARDS = {
  SUCCESS: '4242424242424242',
  DECLINED: '4000000000000002',
  INSUFFICIENT_FUNDS: '4000000000009995',
};

const luhn = (num) => {
  let sum = 0; let dbl = false;
  for (let i = num.length - 1; i >= 0; i -= 1) {
    let d = Number(num[i]);
    if (dbl) { d *= 2; if (d > 9) d -= 9; }
    sum += d; dbl = !dbl;
  }
  return sum % 10 === 0;
};

const cardSchema = z.object({
  number: z.string().transform((s) => s.replace(/\s+/g, '')).pipe(
    z.string().regex(/^\d{16}$/, 'Card number must be 16 digits').refine(luhn, 'Card number is invalid'),
  ),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Expiry must be in MM/YY format').refine((v) => {
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(v)) return true; // format error already reported
    const [mm, yy] = v.split('/').map(Number);
    const endOfMonth = new Date(2000 + yy, mm, 0, 23, 59, 59);
    return endOfMonth >= new Date();
  }, 'Card has expired'),
  cvv: z.string().regex(/^\d{3}$/, 'CVV must be 3 digits'),
  nameOnCard: z.string().trim().min(2, 'Name on card is required'),
});

const orderSchema = z.object({
  shipping: z.object({
    name: z.string().trim().min(2, 'Full name is required').max(100),
    phone: z.string().trim().regex(/^(\+92|0)3\d{9}$/, 'Enter a valid Pakistani mobile number, e.g. 03001234567'),
    address: z.string().trim().min(5, 'Address is required').max(255),
    city: z.string().trim().min(2, 'City is required').max(100),
    postalCode: z.string().trim().regex(/^\d{5}$/, 'Postal code must be 5 digits'),
  }),
  paymentMethod: z.enum(['cod', 'card'], { errorMap: () => ({ message: 'Payment method must be cod or card' }) }),
  card: cardSchema.optional(),
  couponCode: z.string().trim().optional().nullable(),
}).superRefine((v, ctx) => {
  if (v.paymentMethod === 'card' && !v.card) ctx.addIssue({ code: 'custom', path: ['card'], message: 'Card details are required for card payment' });
});

const genOrderNumber = () => {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `NM-${ymd}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
};

router.post('/', validate(orderSchema), ah(async (req, res) => {
  const { shipping, paymentMethod, card, couponCode } = req.body;

  if (paymentMethod === 'card') {
    if (card.number === TEST_CARDS.DECLINED) throw new ApiError(402, 'PAYMENT_DECLINED', 'Your card was declined');
    if (card.number === TEST_CARDS.INSUFFICIENT_FUNDS) throw new ApiError(402, 'INSUFFICIENT_FUNDS', 'Insufficient funds on card');
  }

  const order = await withTransaction(async (client) => {
    // Lock product rows to prevent overselling under concurrent checkouts
    const cart = await loadCart(req.user.id, client);
    if (!cart.items.length) throw badRequest('Your cart is empty');
    const ids = cart.items.map((i) => i.productId);
    const locked = await client.query('SELECT id, name, stock, is_active FROM products WHERE id = ANY($1) FOR UPDATE', [ids]);
    const byId = new Map(locked.rows.map((p) => [p.id, p]));
    for (const item of cart.items) {
      const p = byId.get(item.productId);
      if (!p || !p.is_active) throw badRequest(`"${item.name}" is no longer available`);
      if (p.stock < item.quantity) throw badRequest(`Only ${p.stock} of "${item.name}" left in stock`);
    }

    const coupon = await resolveCoupon(couponCode, cart.subtotal, client);
    const totals = computeTotals(cart.subtotal, coupon);
    const status = paymentMethod === 'card' ? 'paid' : 'pending';

    const { rows } = await client.query(
      `INSERT INTO orders (order_number, user_id, status, payment_method, card_last4, subtotal, discount, shipping_fee, total,
         coupon_code, ship_name, ship_phone, ship_address, ship_city, ship_postal)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [genOrderNumber(), req.user.id, status, paymentMethod, card ? card.number.slice(-4) : null,
        totals.subtotal, totals.discount, totals.shippingFee, totals.total, totals.couponCode,
        shipping.name, shipping.phone, shipping.address, shipping.city, shipping.postalCode],
    );
    const o = rows[0];
    for (const item of cart.items) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, line_total) VALUES ($1,$2,$3,$4,$5,$6)',
        [o.id, item.productId, item.name, item.unitPrice, item.quantity, item.lineTotal],
      );
      await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.quantity, item.productId]);
    }
    await client.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);
    return o;
  });

  res.status(201).json({ data: await getOrder(order.id, req.user.id) });
}));

export async function getOrder(orderId, userId) {
  const params = [orderId];
  let sql = 'SELECT o.*, u.name AS customer_name, u.email AS customer_email FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = $1';
  if (userId) { params.push(userId); sql += ' AND o.user_id = $2'; }
  const { rows } = await query(sql, params);
  if (!rows[0]) throw notFound('Order not found');
  const items = await query(
    `SELECT oi.*, p.image_url, p.slug FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1 ORDER BY oi.id`, [orderId]);
  return formatOrder(rows[0], items.rows);
}

router.get('/', ah(async (req, res) => {
  const { rows } = await query(
    `SELECT o.*, (SELECT COALESCE(SUM(quantity),0) FROM order_items WHERE order_id = o.id) AS item_count
     FROM orders o WHERE o.user_id = $1 ORDER BY o.created_at DESC, o.id DESC`,
    [req.user.id],
  );
  res.json({ data: rows.map((o) => formatOrder(o)) });
}));

router.get('/:id', ah(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw notFound('Order not found');
  res.json({ data: await getOrder(id, req.user.id) });
}));

router.post('/:id/cancel', ah(async (req, res) => {
  const id = Number(req.params.id);
  await withTransaction(async (client) => {
    const { rows } = await client.query('SELECT * FROM orders WHERE id = $1 AND user_id = $2 FOR UPDATE', [id, req.user.id]);
    const o = rows[0];
    if (!o) throw notFound('Order not found');
    if (!['pending', 'paid'].includes(o.status)) throw badRequest(`Order cannot be cancelled once it is ${o.status}`);
    await restock(client, id);
    await client.query("UPDATE orders SET status = 'cancelled', updated_at = now() WHERE id = $1", [id]);
  });
  res.json({ data: await getOrder(id, req.user.id) });
}));

export async function restock(client, orderId) {
  const items = await client.query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [orderId]);
  for (const it of items.rows) {
    if (it.product_id) await client.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [it.quantity, it.product_id]);
  }
}

export default router;
