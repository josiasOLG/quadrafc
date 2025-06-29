import { ToastService } from '../services/toast.service';

export interface ResponseHandler {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  redirectTo?: string;
  callback?: (data?: any) => void;
  errorCallback?: (error: any) => void;
}

export class ApiResponseHandler {
  constructor(private toastService: ToastService) {}

  handleSuccess<T>(data: T, options: ResponseHandler = {}): T {
    const {
      showSuccessToast = false,
      successMessage = 'Operação realizada com sucesso!',
      callback,
      redirectTo
    } = options;

    if (showSuccessToast) {
      this.toastService.success('Sucesso', successMessage);
    }

    if (callback) {
      callback(data);
    }

    if (redirectTo) {
      // Implementar navegação se necessário
      window.location.href = redirectTo;
    }

    return data;
  }

  handleError(error: any, options: ResponseHandler = {}): never {
    const {
      showErrorToast = true,
      errorCallback
    } = options;

    const errorMessage = error?.message || 'Erro inesperado';

    if (showErrorToast) {
      this.toastService.error('Erro', errorMessage);
    }

    if (errorCallback) {
      errorCallback(error);
    }

    throw error;
  }
}

// Utility functions para uso direto
export const handleApiSuccess = <T>(
  data: T,
  toastService: ToastService,
  options: ResponseHandler = {}
): T => {
  const handler = new ApiResponseHandler(toastService);
  return handler.handleSuccess(data, options);
};

export const handleApiError = (
  error: any,
  toastService: ToastService,
  options: ResponseHandler = {}
): never => {
  const handler = new ApiResponseHandler(toastService);
  return handler.handleError(error, options);
};
