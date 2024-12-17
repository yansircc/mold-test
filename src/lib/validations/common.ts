export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
  code?: number;
  message?: string;
}