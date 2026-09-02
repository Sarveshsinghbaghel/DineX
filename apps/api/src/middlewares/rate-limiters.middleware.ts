import rateLimit from 'express-rate-limit';

/**
 * Strict Rate Limiter for Authentication Endpoints (login, register, reset password)
 * Limits per IP: 15 requests per 15 minutes window in production/dev
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
    errorCode: 'AUTH_TOO_MANY_REQUESTS',
  },
});

/**
 * Rate Limiter for Checkout / Order Submission Endpoints (QR & Delivery checkout)
 */
export const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Order submission rate limit exceeded. Please wait before placing another order.',
    errorCode: 'ORDER_TOO_MANY_REQUESTS',
  },
});

/**
 * Rate Limiter for Heavy Report Exports (CSV, XLSX, PDF)
 */
export const reportExportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Report export limit exceeded. Please wait a few minutes.',
    errorCode: 'EXPORT_TOO_MANY_REQUESTS',
  },
});
