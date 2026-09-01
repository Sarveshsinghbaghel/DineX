import { createAppMetadata } from '@x10think/configuration';
import { createLogger, format, transports } from 'winston';

const metadata = createAppMetadata('worker');

export const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
  defaultMeta: {
    service: metadata.service,
    app: metadata.name,
    version: metadata.version,
  },
  transports: [new transports.Console()],
});
