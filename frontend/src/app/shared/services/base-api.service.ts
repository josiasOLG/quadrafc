import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../services/http.service';
import { PaginationParams } from '../schemas';

@Injectable()
export abstract class BaseApiService<T, CreateDto = Partial<T>, UpdateDto = Partial<T>> {
  protected abstract readonly endpoint: string;

  constructor(protected httpService: HttpService) {}

  // CRUD básico
  create(data: CreateDto): Observable<T> {
    return this.httpService.post<T>(this.endpoint, data);
  }

  getAll(params?: PaginationParams): Observable<{ data: T[]; pagination: any }> {
    return this.httpService.getPaginated<T>(this.endpoint, params);
  }

  getById(id: string): Observable<T> {
    return this.httpService.get<T>(`${this.endpoint}/${id}`);
  }

  update(id: string, data: UpdateDto): Observable<T> {
    return this.httpService.put<T>(`${this.endpoint}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.httpService.delete<void>(`${this.endpoint}/${id}`);
  }

  // Métodos auxiliares para endpoints customizados
  protected get<TResult>(customEndpoint: string, params?: Record<string, any>): Observable<TResult> {
    return this.httpService.get<TResult>(`${this.endpoint}/${customEndpoint}`, params);
  }

  protected post<TResult>(customEndpoint: string, data?: any): Observable<TResult> {
    return this.httpService.post<TResult>(`${this.endpoint}/${customEndpoint}`, data);
  }

  protected put<TResult>(customEndpoint: string, data?: any): Observable<TResult> {
    return this.httpService.put<TResult>(`${this.endpoint}/${customEndpoint}`, data);
  }

  protected patch<TResult>(customEndpoint: string, data?: any): Observable<TResult> {
    return this.httpService.patch<TResult>(`${this.endpoint}/${customEndpoint}`, data);
  }

  protected getPaginated<TResult>(customEndpoint: string, params?: PaginationParams): Observable<{ data: TResult[]; pagination: any }> {
    return this.httpService.getPaginated<TResult>(`${this.endpoint}/${customEndpoint}`, params);
  }

  // Métodos para endpoints globais (admin, etc)
  protected getGlobal<TResult>(endpoint: string, params?: Record<string, any>): Observable<TResult> {
    return this.httpService.get<TResult>(endpoint, params);
  }

  protected postGlobal<TResult>(endpoint: string, data?: any): Observable<TResult> {
    return this.httpService.post<TResult>(endpoint, data);
  }

  protected getPaginatedGlobal<TResult>(endpoint: string, params?: PaginationParams): Observable<{ data: TResult[]; pagination: any }> {
    return this.httpService.getPaginated<TResult>(endpoint, params);
  }
}
