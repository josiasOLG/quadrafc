import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { HttpService } from './http.service';

export interface Cidade {
  _id?: string;
  nome: string;
  estado: string;
  uf: string;
  regiao?: string;
  codigo_ibge?: string;
  ativo: boolean;
  total_bairros: number;
}

export interface CreateCidadeDto {
  nome: string;
  estado: string;
  uf: string;
  regiao?: string;
  codigo_ibge?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CidadesService extends BaseApiService<Cidade, CreateCidadeDto> {
  protected readonly endpoint = 'cidades';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  search(searchTerm: string = '', uf?: string): Observable<{ data: Cidade[]; pagination: any }> {
    const params: any = { q: searchTerm };
    if (uf) params.uf = uf;

    return this.httpService.getPaginated<Cidade>(`${this.endpoint}/search`, params);
  }

  findByUf(uf: string): Observable<Cidade[]> {
    return this.httpService.get<Cidade[]>(`${this.endpoint}/uf/${uf}`);
  }
}
