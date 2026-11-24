import { createApp } from './app.js';
import { config } from './lib/config.js';
import { migrate } from './lib/migrate.js';
import { seedIfEmpty } from './lib/seed.js';

async function start() {
  await migrate();
  await seedIfEmpty();
  createApp().listen(config.port, () => {
    console.log(`NovaMart running on http://localhost:${config.port}`);
    console.log(`API docs:        http://localhost:${config.port}/api-docs`);
  });
}

start().catch((e) => { console.error('Failed to start', e); process.exit(1); });
