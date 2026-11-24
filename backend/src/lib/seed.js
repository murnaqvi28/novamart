import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'node:url';
import { pool, withTransaction } from './db.js';
import { migrate } from './migrate.js';
import * as data from './seedData.js';

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Wipes all data and restores the known baseline. Used by `npm run seed` and the test reset endpoint.
export async function resetDatabase() {
  await withTransaction(async (c) => {
    await c.query('TRUNCATE order_items, orders, cart_items, reviews, products, categories, coupons, users RESTART IDENTITY CASCADE');

    const catIds = {};
    for (const cat of data.categories) {
      const r = await c.query('INSERT INTO categories (name, slug) VALUES ($1,$2) RETURNING id', [cat.name, cat.slug]);
      catIds[cat.slug] = r.rows[0].id;
    }

    const productIds = [];
    // Insert with staggered timestamps so "newest" sort is deterministic
    for (let i = 0; i < data.products.length; i += 1) {
      const [name, cat, price, compareAt, stock, featured, description] = data.products[i];
      const slug = slugify(name);
      const r = await c.query(
        `INSERT INTO products (name, slug, description, price, compare_at_price, stock, category_id, image_url, is_featured, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now() - ($10 || ' hours')::interval) RETURNING id`,
        [name, slug, description, price, compareAt, stock, catIds[cat], `/img/${slug}.svg`, featured, String(data.products.length - i)],
      );
      productIds.push(r.rows[0].id);
    }

    const userIds = {};
    for (const u of data.users) {
      const hash = await bcrypt.hash(u.password, 10);
      const r = await c.query('INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id', [u.name, u.email, hash, u.role]);
      userIds[u.email] = r.rows[0].id;
    }

    for (const cp of data.coupons) {
      await c.query('INSERT INTO coupons (code, type, value, min_subtotal, is_active, expires_at) VALUES ($1,$2,$3,$4,$5,$6)',
        [cp.code, cp.type, cp.value, cp.min_subtotal, cp.is_active, cp.expires_at]);
    }

    for (const [pi, email, rating, comment] of data.reviews) {
      await c.query('INSERT INTO reviews (product_id, user_id, rating, comment) VALUES ($1,$2,$3,$4)', [productIds[pi], userIds[email], rating, comment]);
    }
  });
}

export async function seedIfEmpty() {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM products');
  if (rows[0].n === 0) {
    await resetDatabase();
    console.log('Database was empty — seeded with demo data');
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  (async () => {
    await migrate();
    if (process.argv.includes('--force')) await resetDatabase(); else await seedIfEmpty();
    console.log('Seed complete');
    await pool.end();
  })().catch((e) => { console.error(e); process.exit(1); });
}
