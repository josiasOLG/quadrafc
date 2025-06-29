export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  timestamp: string;
  path: string;
  statusCode: number;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
  path: string;
  statusCode: number;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: string[];
  timestamp: string;
  path: string;
  statusCode: number;
  errorCode?: string;
}
