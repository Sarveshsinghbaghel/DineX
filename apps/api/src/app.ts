import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { API_PREFIX, APP_NAME, REQUEST_BODY_LIMIT } from '@x10think/constants';

import { env } from './config/env';
import { errorHandler } from './errors/error-handler';
import { notFoundMiddleware } from './middlewares/not-found.middleware';
import { requestIdMiddleware } from './middlewares/request-id.middleware';
import { requestLoggerMiddleware } from './middlewares/request-logger.middleware';
import { nosqlSanitizeMiddleware } from './middlewares/nosql-sanitize.middleware';
import { apiRouter } from './routes';
import { sendSuccessResponse } from './utils/api-response';

export const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(requestIdMiddleware);
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(helmet());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: env.REQUEST_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.use(compression());
app.use(express.json({ limit: REQUEST_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true }));
app.use(nosqlSanitizeMiddleware);
app.use(requestLoggerMiddleware);

app.get('/', (_request, response) => {
  sendSuccessResponse(response, {
    message: `${APP_NAME} API foundation is running.`,
    data: {
      name: env.APP_NAME,
      version: env.APP_VERSION,
      apiPrefix: env.API_PREFIX,
    },
  });
});

app.use(API_PREFIX, apiRouter);

app.use(notFoundMiddleware);
app.use(errorHandler);
