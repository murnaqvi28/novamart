export const config = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres@localhost:5432/novamart',
  databaseSsl: process.env.DATABASE_SSL === 'true',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  testResetKey: process.env.TEST_RESET_KEY || '',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  // Business rules (exposed via /api/config so tests can read them)
  freeShippingThreshold: 5000,
  shippingFee: 250,
  currency: 'PKR',
};
