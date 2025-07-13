import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GlobalDialogService } from './global-dialog.service';

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService {
  constructor(private globalDialogService: GlobalDialogService) {}

  handleHttpError(error: HttpErrorResponse, customTitle?: string): void {
    const title = customTitle || 'Erro na Comunicação';
    let message = 'Ocorreu um erro inesperado.';
    let details = '';
    let code = '';

    switch (error.status) {
      case 0:
        message = 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.';
        details = 'Erro de conectividade ou servidor indisponível.';
        break;

      case 400:
        message = 'Os dados enviados são inválidos.';
        details = error.error?.message || error.message;
        break;

      case 401:
        message = 'Sua sessão expirou. Por favor, faça login novamente.';
        this.globalDialogService.showCriticalError(
          'Sessão Expirada',
          message,
          'Você será redirecionado para a página de login.',
          'HTTP_401'
        );
        return;

      case 403:
        message = 'Você não tem permissão para realizar esta ação.';
        details = 'Acesso negado pelo servidor.';
        break;

      case 404:
        message = 'O recurso solicitado não foi encontrado.';
        details = 'Endpoint ou dados não existem no servidor.';
        break;

      case 422:
        message = 'Os dados enviados não puderam ser processados.';
        details = error.error?.message || 'Erro de validação no servidor.';
        break;

      case 500:
        message = 'Erro interno do servidor. Tente novamente em alguns instantes.';
        details = 'O servidor encontrou um problema interno.';
        code = 'HTTP_500';
        break;

      case 502:
      case 503:
      case 504:
        message = 'Serviço temporariamente indisponível.';
        details = 'O servidor está passando por manutenção ou sobrecarga.';
        this.globalDialogService.showRetryError(
          'Serviço Indisponível',
          message,
          () => window.location.reload(),
          details
        );
        return;

      default:
        message = `Erro ${error.status}: ${error.statusText}`;
        details = error.error?.message || error.message;
        code = `HTTP_${error.status}`;
    }

    this.globalDialogService.showError(title, message, details);

    if (code) {
      this.globalDialogService.show({
        title,
        message,
        details,
        code,
        actions: [
          {
            label: 'Fechar',
            action: () => this.globalDialogService.hide(),
            severity: 'primary',
          },
        ],
      });
    }
  }

  handleGenericError(error: Error, title?: string): void {
    this.globalDialogService.showError(
      title || 'Erro Inesperado',
      error.message || 'Ocorreu um erro não identificado.',
      error.stack
    );
  }

  handleValidationError(message: string, details?: string): void {
    this.globalDialogService.showError('Erro de Validação', message, details);
  }

  handleCustomError(title: string, message: string, retryAction?: () => void): void {
    if (retryAction) {
      this.globalDialogService.showRetryError(title, message, retryAction);
    } else {
      this.globalDialogService.showError(title, message);
    }
  }
}
