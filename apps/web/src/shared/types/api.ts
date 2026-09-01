export interface ApiResponse<TData> {
  success: boolean;
  message: string;
  data: TData;
  meta?: Record<string, unknown>;
}
