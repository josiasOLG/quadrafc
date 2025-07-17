import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';

export interface User {
  _id: string;
  nome: string;
  email: string;
  code?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  pais?: string;
  cep?: string;
  moedas: number;
  totalPoints: number;
  avatarUrl?: string;
  assinaturaPremium: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly endpoint = 'users';

  constructor(private httpService: HttpService) {}

  getProfile(): Observable<User> {
    return this.httpService.get<User>(`${this.endpoint}/profile`);
  }
}
