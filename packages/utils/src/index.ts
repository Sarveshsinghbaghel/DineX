import { randomUUID } from 'node:crypto';

export function createRequestId(): string {
  return randomUUID();
}

export function getSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown error';
}
