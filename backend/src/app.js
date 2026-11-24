import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load as yamlLoad } from 'js-yaml';
import swaggerUi from 'swagger-ui-express';
import { config } from './lib/config.js';
import { query } from './lib/db.js';
import { productSvg } from './lib/images.js';
import { resetDatabase } from './lib/seed.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import authRoutes from './routes/auth.js';
import catalogRoutes from './routes/catalog.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(cors({ origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(',') }));
  app.use(express.json({ limit: '100kb' }));
  if (process.env.NODE_ENV !== 'test') app.use(morgan('tiny'));

  // ---- API ----
  const api = express.Router();
  api.get('/health', async (_req, res) => {
    await query('SELECT 1');
    res.json({ status: 'ok', time: new Date().toISOString() });
  });
  api.get('/config', (_req, res) => res.json({
    currency: config.currency,
    freeShippingThreshold: config.freeShippingThreshold,
    shippingFee: config.shippingFee,
  }));
  api.use('/auth', authRoutes);
  api.use('/', catalogRoutes);
  api.use('/cart', cartRoutes);
  api.use('/orders', orderRoutes);
  api.use('/admin', adminRoutes);

  // Test-support endpoint: restores seed data. Disabled unless TEST_RESET_KEY is set.
  api.post('/test/reset', async (req, res, next) => {
    try {
      if (!config.testResetKey || req.headers['x-test-reset-key'] !== config.testResetKey) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route POST /api/test/reset not found' } });
      }
      await resetDatabase();
      res.json({ status: 'reset' });
    } catch (e) { next(e); }
  });

  app.use('/api', api);
  app.use('/api', notFoundHandler);

  // ---- Swagger docs ----
  const spec = yamlLoad(fs.readFileSync(path.join(__dirname, 'openapi.yaml'), 'utf8'));
  app.get('/api-docs/openapi.json', (_req, res) => res.json(spec));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec, { customSiteTitle: 'NovaMart API Docs' }));

  // ---- Generated product images ----
  app.get('/img/:file', async (req, res, next) => {
    try {
      const slug = req.params.file.replace(/\.svg$/, '');
      const { rows } = await query(
        'SELECT c.slug AS cat FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.slug = $1', [slug]);
      res.set('Content-Type', 'image/svg+xml').set('Cache-Control', 'public, max-age=86400');
      res.send(productSvg(slug, rows[0]?.cat));
    } catch (e) { next(e); }
  });

  // ---- Frontend (production build) ----
  const dist = path.resolve(__dirname, '../../frontend/dist');
  if (fs.existsSync(dist)) {
    app.use(express.static(dist, { index: false, maxAge: '1h' }));
    app.get('/{*splat}', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  app.use(errorHandler);
  return app;
}
