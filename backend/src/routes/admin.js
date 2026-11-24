import { Router } from 'express';
import { z } from 'zod';
import { query, withTransaction } from '../lib/db.js';
import { ah, badRequest, conflict, notFound } from '../lib/errors.js';
import { validate } from '../middleware/validate.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { PRODUCT_SELECT, formatOrder, formatProduct, formatUser } from '../lib/format.js';
import { getOrder, restock } from './orders.js';

const router = Router();
router.use(requireAuth, requireAdmin);

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

router.get('/stats', ah(async (_req, res) => {
  const [rev, counts, low, recent] = await Promise.all([
    query("SELECT COALESCE(SUM(total),0) AS revenue, COUNT(*)::int AS orders FROM orders WHERE status <> 'cancelled'"),
    query(`SELECT (SELECT COUNT(*)::int FROM users WHERE role='customer') AS customers,
                  (SELECT COUNT(*)::int FROM products WHERE is_active) AS products,
                  (SELECT COUNT(*)::int FROM orders WHERE status IN ('pending','paid')) AS to_fulfil`),
    query(`${PRODUCT_SELECT} WHERE p.is_active AND p.stock <= 5 ORDER BY p.stock ASC, p.id LIMIT 5`),
    query(`SELECT o.*, u.name AS customer_name, u.email AS customer_email FROM orders o JOIN users u ON u.id=o.user_id
           ORDER BY o.created_at DESC, o.id DESC LIMIT 5`),
  ]);
  res.json({
    data: {
      revenue: Number(rev.rows[0].revenue),
      orders: rev.rows[0].orders,
      customers: counts.rows[0].customers,
      products: counts.rows[0].products,
      ordersToFulfil: counts.rows[0].to_fulfil,
      lowStock: low.rows.map(formatProduct),
      recentOrders: recent.rows.map((o) => formatOrder(o)),
    },
  });
}));

// ---- Products ----
router.get('/products', ah(async (req, res) => {
  const search = (req.query.search || '').toString().trim();
  const params = [];
  let where = '';
  if (search) { params.push(`%${search}%`); where = 'WHERE p.name ILIKE $1'; }
  const { rows } = await query(`${PRODUCT_SELECT} ${where} ORDER BY p.id DESC`, params);
  res.json({ data: rows.map(formatProduct) });
}));

const productSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(200),
  description: z.string().trim().max(5000).default(''),
  price: z.number({ invalid_type_error: 'Price must be a number' }).positive('Price must be greater than 0').max(10000000),
  compareAtPrice: z.number().positive().nullable().optional(),
  stock: z.number({ invalid_type_error: 'Stock must be a number' }).int('Stock must be a whole number').min(0, 'Stock cannot be negative'),
  categoryId: z.number().int().positive().nullable().optional(),
  imageUrl: z.string().trim().max(1000).nullable().optional(),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
}).refine((v) => v.compareAtPrice == null || v.compareAtPrice > v.price, {
  path: ['compareAtPrice'], message: 'Compare-at price must be greater than price',
});

async function saveProduct(id, body) {
  const slugBase = slugify(body.name);
  const clash = await query('SELECT id FROM products WHERE slug = $1 AND ($2::int IS NULL OR id <> $2)', [slugBase, id]);
  const slug = clash.rowCount ? `${slugBase}-${Date.now().toString(36)}` : slugBase;
  if (body.categoryId) {
    const c = await query('SELECT 1 FROM categories WHERE id = $1', [body.categoryId]);
    if (!c.rowCount) throw badRequest('Category does not exist');
  }
  const vals = [body.name, slug, body.description, body.price, body.compareAtPrice ?? null, body.stock,
    body.categoryId ?? null, body.imageUrl || `/img/${slug}.svg`, body.isFeatured, body.isActive];
  if (id) {
    const r = await query(
      `UPDATE products SET name=$1, slug=$2, description=$3, price=$4, compare_at_price=$5, stock=$6, category_id=$7,
       image_url=$8, is_featured=$9, is_active=$10 WHERE id=$11 RETURNING id`, [...vals, id]);
    if (!r.rowCount) throw notFound('Product not found');
    return id;
  }
  const r = await query(
    `INSERT INTO products (name, slug, description, price, compare_at_price, stock, category_id, image_url, is_featured, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`, vals);
  return r.rows[0].id;
}

const getProductById = async (id) => formatProduct((await query(`${PRODUCT_SELECT} WHERE p.id = $1`, [id])).rows[0]);

router.post('/products', validate(productSchema), ah(async (req, res) => {
  const id = await saveProduct(null, req.body);
  res.status(201).json({ data: await getProductById(id) });
}));

router.put('/products/:id', validate(productSchema), ah(async (req, res) => {
  const id = await saveProduct(Number(req.params.id), req.body);
  res.json({ data: await getProductById(id) });
}));

// Soft delete: keeps order history intact
router.delete('/products/:id', ah(async (req, res) => {
  const r = await query('UPDATE products SET is_active = false WHERE id = $1 AND is_active RETURNING id', [Number(req.params.id)]);
  if (!r.rowCount) throw notFound('Product not found');
  await query('DELETE FROM cart_items WHERE product_id = $1', [Number(req.params.id)]);
  res.status(204).end();
}));

// ---- Orders ----
const TRANSITIONS = {
  pending: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

router.get('/orders', ah(async (req, res) => {
  const params = [];
  let where = '';
  if (req.query.status) { params.push(req.query.status); where = 'WHERE o.status = $1'; }
  const { rows } = await query(
    `SELECT o.*, u.name AS customer_name, u.email AS customer_email,
       (SELECT COALESCE(SUM(quantity),0) FROM order_items WHERE order_id = o.id) AS item_count
     FROM orders o JOIN users u ON u.id = o.user_id ${where} ORDER BY o.created_at DESC, o.id DESC`, params);
  res.json({ data: rows.map((o) => formatOrder(o)) });
}));

router.get('/orders/:id', ah(async (req, res) => {
  res.json({ data: await getOrder(Number(req.params.id)) });
}));

const statusSchema = z.object({ status: z.enum(['pending', 'paid', 'shipped', 'delivered', 'cancelled']) });

router.patch('/orders/:id/status', validate(statusSchema), ah(async (req, res) => {
  const id = Number(req.params.id);
  await withTransaction(async (client) => {
    const { rows } = await client.query('SELECT status FROM orders WHERE id = $1 FOR UPDATE', [id]);
    if (!rows[0]) throw notFound('Order not found');
    const from = rows[0].status;
    const to = req.body.status;
    if (!TRANSITIONS[from].includes(to)) throw conflict(`Cannot change order status from ${from} to ${to}`);
    if (to === 'cancelled') await restock(client, id);
    await client.query('UPDATE orders SET status = $1, updated_at = now() WHERE id = $2', [to, id]);
  });
  res.json({ data: await getOrder(id) });
}));

// ---- Users ----
router.get('/users', ah(async (_req, res) => {
  const { rows } = await query(
    `SELECT u.*, (SELECT COUNT(*)::int FROM orders WHERE user_id = u.id) AS order_count FROM users u ORDER BY u.id`);
  res.json({ data: rows.map((u) => ({ ...formatUser(u), orderCount: u.order_count })) });
}));

export default router;
