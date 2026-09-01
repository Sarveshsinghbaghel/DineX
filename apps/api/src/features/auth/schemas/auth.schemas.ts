import { z } from 'zod';

const password = z
  .string()
  .min(12)
  .max(128)
  .regex(/[A-Z]/, 'Password must include an uppercase letter.')
  .regex(/[a-z]/, 'Password must include a lowercase letter.')
  .regex(/[0-9]/, 'Password must include a number.')
  .regex(/[^A-Za-z0-9]/, 'Password must include a symbol.');

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().max(32).optional(),
  password,
});
export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(128),
});
export const tokenSchema = z.object({ token: z.string().min(32).max(256) });
export const emailSchema = z.object({ email: z.string().trim().email() });
export const passwordSchema = z.object({ password });
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  password,
});
