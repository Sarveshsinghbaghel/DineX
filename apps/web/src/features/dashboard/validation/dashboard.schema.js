import { z } from 'zod';
export const dashboardFilterSchema = z.object({
  search: z.string().trim().max(50),
});
