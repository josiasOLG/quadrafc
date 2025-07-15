import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../shared/services/http.service';

export interface EnviarCodigoResponse {
  success: boolean;
  message: string;
  codigo?: string; // Para desenvolvimento
}

export interface VerificarCodigoResponse {
  success: boolean;
  message: string;
  emailVerificado: boolean;
}

export interface StatusEmailResponse {
  emailVerificado: boolean;
  temCodigoPendente: boolean;
  codigoExpirado: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class EmailVerificationService {
  constructor(private httpService: HttpService) {}

  enviarCodigoVerificacao(email: string): Observable<EnviarCodigoResponse> {
    return this.httpService.post<EnviarCodigoResponse>('auth/enviar-codigo-email', { email });
  }

  verificarCodigo(email: string, codigo: string): Observable<VerificarCodigoResponse> {
    return this.httpService.post<VerificarCodigoResponse>('auth/verificar-codigo-email', {
      email,
      codigo,
    });
  }

  reenviarCodigo(email: string): Observable<EnviarCodigoResponse> {
    return this.httpService.post<EnviarCodigoResponse>('auth/reenviar-codigo-email', { email });
  }

  verificarStatusEmail(email: string): Observable<StatusEmailResponse> {
    return this.httpService.post<StatusEmailResponse>('auth/status-email', { email });
  }
}
