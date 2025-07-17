import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../shared/services/http.service';

export interface EntrarEmBairroRequest {
  codigo: string;
}

@Injectable({
  providedIn: 'root',
})
export class BairroService {
  private readonly endpoint = 'users';

  constructor(private httpService: HttpService) {}

  entrarEmBairro(codigo: string): Observable<any> {
    const payload: EntrarEmBairroRequest = { codigo };
    return this.httpService.post(`${this.endpoint}/entrar-em-bairro`, payload);
  }
}
