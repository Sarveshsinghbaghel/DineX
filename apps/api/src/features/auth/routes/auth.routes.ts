import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateAuth } from '../middlewares/validate-auth.middleware';
import {
  changePasswordSchema,
  emailSchema,
  loginSchema,
  passwordSchema,
  registerSchema,
  tokenSchema,
} from '../schemas/auth.schemas';

const sensitiveLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts. Try again later.',
    errorCode: 'RATE_LIMITED',
  },
});
const router = Router();

router.post('/register', sensitiveLimit, validateAuth(registerSchema), authController.register);
router.post('/login', sensitiveLimit, validateAuth(loginSchema), authController.login);
router.post('/refresh', sensitiveLimit, authController.refresh);
router.post('/logout', authController.logout);
router.post('/verify-email', sensitiveLimit, validateAuth(tokenSchema), authController.verifyEmail);
router.post(
  '/resend-verification',
  sensitiveLimit,
  validateAuth(emailSchema),
  authController.resendVerification,
);
router.post(
  '/forgot-password',
  sensitiveLimit,
  validateAuth(emailSchema),
  authController.forgotPassword,
);
router.post(
  '/reset-password',
  sensitiveLimit,
  validateAuth(tokenSchema.merge(passwordSchema)),
  authController.resetPassword,
);
router.post(
  '/change-password',
  requireAuth,
  validateAuth(changePasswordSchema),
  authController.changePassword,
);
router.get('/me', requireAuth, authController.me);

export const authRouter = router;
