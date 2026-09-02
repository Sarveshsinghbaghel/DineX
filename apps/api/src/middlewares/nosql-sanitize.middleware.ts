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

function sanitizeInPlace(target: Record<string, any>): void {
  if (!target || typeof target !== 'object') return;
  for (const key of Object.keys(target)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete target[key];
    } else {
      target[key] = cleanNoSQLPayload(target[key]);
    }
  }
}

/**
 * Express middleware to sanitize req.body, req.query, and req.params against NoSQL operator injection
 */
export function nosqlSanitizeMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = cleanNoSQLPayload(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    sanitizeInPlace(req.query as Record<string, any>);
  }
  if (req.params && typeof req.params === 'object') {
    sanitizeInPlace(req.params as Record<string, any>);
  }
  next();
}
