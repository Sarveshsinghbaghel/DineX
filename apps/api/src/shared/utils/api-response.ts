import type { Response } from 'express';
import type { ApiSuccessResponse } from '@x10think/types';

interface SuccessResponseOptions<TData> {
  statusCode?: number;
  message: string;
  data: TData;
}

export function sendSuccessResponse<TData>(
  response: Response,
  options: SuccessResponseOptions<TData>,
) {
  const payload: ApiSuccessResponse<TData> = {
    success: true,
    message: options.message,
    data: options.data,
    meta: {
      requestId: response.locals.requestId,
    },
  };

  return response.status(options.statusCode ?? 200).json(payload);
}
