import { Router } from 'express';
import { z } from 'zod';
import { query } from '../lib/db.js';
import { ah, badRequest, notFound } from '../lib/errors.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { computeTotals, resolveCoupon } from '../lib/pricing.js';

const router = Router();
router.use(requireAuth);

export async function loadCart(userId, db = { query }) {
  const { rows } = await db.query(
    `SELECT ci.product_id, ci.quantity, p.name, p.slug, p.price, p.stock, p.image_url, p.is_active
     FROM cart_items ci JOIN products p ON p.id = ci.product_id
     WHERE ci.user_id = $1 ORDER BY ci.added_at, ci.id`,
    [userId],
  );
  const items = rows.map((r) => ({
    productId: r.product_id,
    name: r.name,
    slug: r.slug,
    imageUrl: r.image_url,
    unitPrice: r.price,
    quantity: r.quantity,
    stock: r.stock,
    available: r.is_active && r.stock >= r.quantity,
    lineTotal: Math.round(r.price * r.quantity * 100) / 100,
  }));
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  return { items, subtotal, itemCount: items.reduce((s, i) => s + i.quantity, 0) };
}

async function cartResponse(userId, couponCode) {
  const cart = await loadCart(userId);
  let coupon = null;
  let couponError = null;
  if (couponCode) {
    try { coupon = await resolveCoupon(couponCode, cart.subtotal); } catch (e) { couponError = e.message; }
  }
  return { items: cart.items, itemCount: cart.itemCount, totals: computeTotals(cart.subtotal, coupon), ...(couponError ? { couponError } : {}) };
}

async function getActiveProduct(productId) {
  const { rows } = await query('SELECT id, stock, is_active FROM products WHERE id = $1', [productId]);
  if (!rows[0] || !rows[0].is_active) throw notFound('Product not found');
  return rows[0];
}

router.get('/', ah(async (req, res) => {
  res.json(await cartResponse(req.user.id, req.query.coupon));
}));

const addSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(99).default(1),
});

router.post('/items', validate(addSchema), ah(async (req, res) => {
  const { productId, quantity } = req.body;
  const product = await getActiveProduct(productId);
  const existing = await query('SELECT quantity FROM cart_items WHERE user_id = $1 AND product_id = $2', [req.user.id, productId]);
  const newQty = (existing.rows[0]?.quantity || 0) + quantity;
  if (product.stock === 0) throw badRequest('This product is out of stock');
  if (newQty > product.stock) throw badRequest(`Only ${product.stock} item(s) available in stock`);
  await query(
    `INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1,$2,$3)
     ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity`,
    [req.user.id, productId, newQty],
  );
  res.status(201).json(await cartResponse(req.user.id));
}));

const updateSchema = z.object({ quantity: z.number().int().min(1, 'Quantity must be at least 1').max(99) });

router.patch('/items/:productId', validate(updateSchema), ah(async (req, res) => {
  const productId = Number(req.params.productId);
  const existing = await query('SELECT 1 FROM cart_items WHERE user_id = $1 AND product_id = $2', [req.user.id, productId]);
  if (!existing.rowCount) throw notFound('Item is not in your cart');
  const product = await getActiveProduct(productId);
  if (req.body.quantity > product.stock) throw badRequest(`Only ${product.stock} item(s) available in stock`);
  await query('UPDATE cart_items SET quantity = $1 WHERE user_id = $2 AND product_id = $3', [req.body.quantity, req.user.id, productId]);
  res.json(await cartResponse(req.user.id));
}));

router.delete('/items/:productId', ah(async (req, res) => {
  const r = await query('DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2', [req.user.id, Number(req.params.productId)]);
  if (!r.rowCount) throw notFound('Item is not in your cart');
  res.json(await cartResponse(req.user.id));
}));

router.delete('/', ah(async (req, res) => {
  await query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);
  res.json(await cartResponse(req.user.id));
}));

const couponSchema = z.object({ code: z.string().trim().min(1, 'Coupon code is required') });

router.post('/coupon', validate(couponSchema), ah(async (req, res) => {
  const cart = await loadCart(req.user.id);
  if (!cart.items.length) throw badRequest('Your cart is empty');
  const coupon = await resolveCoupon(req.body.code, cart.subtotal);
  res.json({ valid: true, coupon: { code: coupon.code, type: coupon.type, value: coupon.value }, totals: computeTotals(cart.subtotal, coupon) });
}));

export default router;
