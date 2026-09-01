import nodemailer from 'nodemailer';
import { env } from '../../../config/env';
import { logger } from '../../../config/logger';

const transporter = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth:
        env.SMTP_USER && env.SMTP_PASSWORD
          ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
          : undefined,
    })
  : null;

export async function sendAuthEmail(input: {
  to: string;
  subject: string;
  token: string;
  kind: 'verification' | 'reset';
}) {
  const link = `${env.CLIENT_URL}/${input.kind === 'reset' ? 'reset-password' : 'verify-email'}?token=${encodeURIComponent(input.token)}`;
  if (!transporter) {
    logger.info('Auth email delivery skipped because SMTP is not configured', { kind: input.kind });
    return;
  }
  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to: input.to,
    subject: input.subject,
    text: `Complete this request: ${link}`,
  });
}
