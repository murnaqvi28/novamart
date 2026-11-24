import { badRequest } from '../lib/errors.js';

// Validate req[part] against a zod schema; replaces it with parsed data
export const validate = (schema, part = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[part] ?? {});
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return next(badRequest('Validation failed', details));
  }
  if (part === 'query') req.validQuery = result.data; else req[part] = result.data;
  next();
};
