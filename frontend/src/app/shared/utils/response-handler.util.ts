import { GlobalDialogService } from '../services/global-dialog.service';

export interface ResponseHandler {
  showSuccessDialog?: boolean;
  showErrorDialog?: boolean;
  successMessage?: string;
  redirectTo?: string;
  callback?: (data?: any) => void;
  errorCallback?: (error: any) => void;
}

export class ApiResponseHandler {
  constructor(private globalDialogService: GlobalDialogService) {}

  handleSuccess<T>(data: T, options: ResponseHandler = {}): T {
    const {
      showSuccessDialog = false,
      successMessage = 'Operação realizada com sucesso!',
      callback,
      redirectTo,
    } = options;

    if (showSuccessDialog) {
      this.globalDialogService.showSuccess('Sucesso', successMessage);
    }

    if (callback) {
      callback(data);
    }

    if (redirectTo) {
      window.location.href = redirectTo;
    }

    return data;
  }

  handleError(error: any, options: ResponseHandler = {}): never {
    const { showErrorDialog = true, errorCallback } = options;

    const errorMessage = error?.message || 'Erro inesperado';

    if (showErrorDialog) {
      this.globalDialogService.showError('Erro', errorMessage);
    }

    if (errorCallback) {
      errorCallback(error);
    }

    throw error;
  }
}

export const handleApiSuccess = <T>(
  data: T,
  globalDialogService: GlobalDialogService,
  options: ResponseHandler = {}
): T => {
  const handler = new ApiResponseHandler(globalDialogService);
  return handler.handleSuccess(data, options);
};

export const handleApiError = (
  error: any,
  globalDialogService: GlobalDialogService,
  options: ResponseHandler = {}
): never => {
  const handler = new ApiResponseHandler(globalDialogService);
  return handler.handleError(error, options);
};
