import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  bairrosSugeridos?: string[];
  bairrosDisponiveis?: { nome: string; id: string }[];
}

@Injectable({
  providedIn: 'root',
})
export class CepService {
  private readonly baseUrl = `${environment.apiUrl}/cep`;

  constructor(private http: HttpClient) {}

  buscarCep(cep: string): Observable<CepResponse> {
    const cepLimpo = cep.replace(/\D/g, '');
    return this.http.get<CepResponse>(`${this.baseUrl}/${cepLimpo}`);
  }

  buscarBairrosPorCidade(
    cidade: string,
    estado: string,
    limite = 20
  ): Observable<{ nome: string; id: string }[]> {
    return this.http.get<{ nome: string; id: string }[]>(
      `${this.baseUrl}/bairros/${cidade}/${estado}?limite=${limite}`
    );
  }

  validarNovoBairro(
    nome: string,
    cidade: string,
    estado: string
  ): Observable<{ valido: boolean; similares: any[]; sugestoes: string[] }> {
    return this.http.post<{ valido: boolean; similares: any[]; sugestoes: string[] }>(
      `${this.baseUrl}/validar-bairro`,
      {
        nome,
        cidade,
        estado,
      }
    );
  }
}
