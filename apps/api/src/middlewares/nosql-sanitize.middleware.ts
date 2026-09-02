import type { Request, Response, NextFunction } from 'express';

/**
 * Recursively strips keys starting with '$' or containing '.' to prevent NoSQL operator injection attacks
 */
function cleanNoSQLPayload(val: unknown): unknown {
  if (val === null || val === undefined) {
    return val;
  }

  if (Array.isArray(val)) {
    return val.map((item) => cleanNoSQLPayload(item));
  }

  if (typeof val === 'object' && val.constructor === Object) {
    const cleanedObj: Record<string, unknown> = {};
    for (const key of Object.keys(val as Record<string, unknown>)) {
      // Strip keys starting with $ (e.g. $gt, $ne, $where, $regex) or containing dot notation injection
      if (key.startsWith('$') || key.includes('.')) {
        continue;
      }
      cleanedObj[key] = cleanNoSQLPayload((val as Record<string, unknown>)[key]);
    }
    return cleanedObj;
  }

  return val;
}

/**
 * Express middleware to sanitize req.body, req.query, and req.params against NoSQL operator injection
 */
export function nosqlSanitizeMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (req.body) {
    req.body = cleanNoSQLPayload(req.body);
  }
  if (req.query) {
    req.query = cleanNoSQLPayload(req.query) as Record<string, any>;
  }
  if (req.params) {
    req.params = cleanNoSQLPayload(req.params) as Record<string, any>;
  }
  next();
}
