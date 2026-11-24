import { Router } from 'express';
import { z } from 'zod';
import { query } from '../lib/db.js';
import { ah, notFound, conflict } from '../lib/errors.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { PRODUCT_SELECT, formatProduct } from '../lib/format.js';

const router = Router();

router.get('/categories', ah(async (_req, res) => {
  const { rows } = await query(`
    SELECT c.id, c.name, c.slug, COUNT(p.id)::int AS product_count
    FROM categories c LEFT JOIN products p ON p.category_id = c.id AND p.is_active
    GROUP BY c.id ORDER BY c.name`);
  res.json({ data: rows.map((r) => ({ id: r.id, name: r.name, slug: r.slug, productCount: r.product_count })) });
}));

const listSchema = z.object({
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z.enum(['true', 'false']).optional(),
  featured: z.enum(['true', 'false']).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'name_asc', 'rating']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

const SORTS = {
  newest: 'p.created_at DESC, p.id DESC',
  price_asc: 'p.price ASC, p.id ASC',
  price_desc: 'p.price DESC, p.id ASC',
  name_asc: 'p.name ASC',
  rating: 'rating DESC, review_count DESC, p.id ASC',
};

router.get('/products', validate(listSchema, 'query'), ah(async (req, res) => {
  const q = req.validQuery;
  const where = ['p.is_active = true'];
  const params = [];
  const add = (clause, value) => { params.push(value); where.push(clause.replace('?', `$${params.length}`)); };

  if (q.search) add('(p.name ILIKE ? OR p.description ILIKE $' + (params.length + 1) + ')', `%${q.search}%`);
  if (q.category) add('c.slug = ?', q.category);
  if (q.minPrice !== undefined) add('p.price >= ?', q.minPrice);
  if (q.maxPrice !== undefined) add('p.price <= ?', q.maxPrice);
  if (q.inStock === 'true') where.push('p.stock > 0');
  if (q.featured === 'true') where.push('p.is_featured = true');

  const whereSql = `WHERE ${where.join(' AND ')}`;
  const base = `SELECT * FROM (${PRODUCT_SELECT} ${whereSql}) AS p`;
  const countRes = await query(`SELECT COUNT(*)::int AS n FROM (${base}) t`, params);
  const total = countRes.rows[0].n;
  const offset = (q.page - 1) * q.limit;
  const { rows } = await query(`${base} ORDER BY ${SORTS[q.sort]} LIMIT ${q.limit} OFFSET ${offset}`, params);

  res.json({
    data: rows.map(formatProduct),
    pagination: { page: q.page, limit: q.limit, total, totalPages: Math.max(1, Math.ceil(total / q.limit)) },
  });
}));

async function findProduct(idOrSlug) {
  const isId = /^\d+$/.test(idOrSlug);
  const { rows } = await query(
    `${PRODUCT_SELECT} WHERE p.is_active = true AND ${isId ? 'p.id = $1' : 'p.slug = $1'}`,
    [isId ? Number(idOrSlug) : idOrSlug],
  );
  if (!rows[0]) throw notFound('Product not found');
  return rows[0];
}

router.get('/products/:idOrSlug', ah(async (req, res) => {
  const product = formatProduct(await findProduct(req.params.idOrSlug));
  const related = await query(
    `${PRODUCT_SELECT} WHERE p.is_active = true AND p.category_id = $1 AND p.id <> $2 ORDER BY p.id LIMIT 4`,
    [product.category?.id ?? null, product.id],
  );
  res.json({ data: product, related: related.rows.map(formatProduct) });
}));

router.get('/products/:idOrSlug/reviews', ah(async (req, res) => {
  const p = await findProduct(req.params.idOrSlug);
  const { rows } = await query(
    `SELECT r.id, r.rating, r.comment, r.created_at, u.name AS user_name
     FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.product_id = $1 ORDER BY r.created_at DESC`,
    [p.id],
  );
  res.json({ data: rows.map((r) => ({ id: r.id, rating: r.rating, comment: r.comment, userName: r.user_name, createdAt: r.created_at })) });
}));

const reviewSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
  comment: z.string().trim().min(3, 'Review must be at least 3 characters').max(1000),
});

router.post('/products/:idOrSlug/reviews', requireAuth, validate(reviewSchema), ah(async (req, res) => {
  const p = await findProduct(req.params.idOrSlug);
  try {
    const { rows } = await query(
      'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES ($1,$2,$3,$4) RETURNING *',
      [p.id, req.user.id, req.body.rating, req.body.comment],
    );
    const r = rows[0];
    res.status(201).json({ data: { id: r.id, rating: r.rating, comment: r.comment, userName: req.user.name, createdAt: r.created_at } });
  } catch (e) {
    if (e.code === '23505') throw conflict('You have already reviewed this product');
    throw e;
  }
}));

export default router;
