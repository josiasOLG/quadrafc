import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginationParams } from '../schemas';

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  private readonly baseUrl = environment.apiUrl || 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  private buildParams(params?: Record<string, any>): HttpParams {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key];
        if (value !== null && value !== undefined) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return httpParams;
  }

  private buildHeaders(headers?: Record<string, string>): HttpHeaders {
    let httpHeaders = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    if (headers) {
      Object.keys(headers).forEach((key) => {
        httpHeaders = httpHeaders.set(key, headers[key]);
      });
    }

    return httpHeaders;
  }

  private handleResponse<T>(response: ApiResponse<T>): T {
    if (!response.success) {
      throw new Error(response.message || 'Erro na requisição');
    }
    return response.data as T;
  }

  private handleError(error: any): Observable<never> {
    console.error('HTTP Error:', error);

    let errorMessage = 'Erro inesperado';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }

  get<T>(
    endpoint: string,
    params?: Record<string, any>,
    headers?: Record<string, string>
  ): Observable<T> {
    const httpParams = this.buildParams(params);
    const httpHeaders = this.buildHeaders(headers);

    return this.http
      .get<ApiResponse<T>>(`${this.baseUrl}/${endpoint}`, {
        params: httpParams,
        headers: httpHeaders,
        withCredentials: true,
      })
      .pipe(
        map((response) => this.handleResponse(response)),
        catchError((error) => this.handleError(error))
      );
  }

  post<T>(endpoint: string, data?: any, headers?: Record<string, string>): Observable<T> {
    const httpHeaders = this.buildHeaders(headers);

    return this.http
      .post<ApiResponse<T>>(`${this.baseUrl}/${endpoint}`, data, {
        headers: httpHeaders,
        withCredentials: true,
      })
      .pipe(
        map((response) => this.handleResponse(response)),
        catchError((error) => this.handleError(error))
      );
  }

  put<T>(endpoint: string, data?: any, headers?: Record<string, string>): Observable<T> {
    const httpHeaders = this.buildHeaders(headers);

    return this.http
      .put<ApiResponse<T>>(`${this.baseUrl}/${endpoint}`, data, {
        headers: httpHeaders,
        withCredentials: true,
      })
      .pipe(
        map((response) => this.handleResponse(response)),
        catchError((error) => this.handleError(error))
      );
  }

  patch<T>(endpoint: string, data?: any, headers?: Record<string, string>): Observable<T> {
    const httpHeaders = this.buildHeaders(headers);

    return this.http
      .patch<ApiResponse<T>>(`${this.baseUrl}/${endpoint}`, data, {
        headers: httpHeaders,
        withCredentials: true,
      })
      .pipe(
        map((response) => this.handleResponse(response)),
        catchError((error) => this.handleError(error))
      );
  }

  delete<T>(endpoint: string, headers?: Record<string, string>): Observable<T> {
    const httpHeaders = this.buildHeaders(headers);

    return this.http
      .delete<ApiResponse<T>>(`${this.baseUrl}/${endpoint}`, {
        headers: httpHeaders,
        withCredentials: true,
      })
      .pipe(
        map((response) => this.handleResponse(response)),
        catchError((error) => this.handleError(error))
      );
  }

  // Método especializado para requests com paginação
  getPaginated<T>(
    endpoint: string,
    pagination?: PaginationParams,
    params?: Record<string, any>
  ): Observable<{ data: T[]; pagination: any }> {
    const allParams = { ...pagination, ...params };

    return this.http
      .get<ApiResponse<{ data: T[]; pagination: any }>>(`${this.baseUrl}/${endpoint}`, {
        params: this.buildParams(allParams),
        withCredentials: true,
      })
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(response.message || 'Erro na requisição');
          }
          // A resposta já vem no formato correto dentro de response.data
          return response.data || { data: [], pagination: {} };
        }),
        catchError((error) => this.handleError(error))
      );
  }
}
