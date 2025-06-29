import { Injectable } from '@angular/core';
import { AuthService } from '../../modules/auth/services/auth.service';
import { firstValueFrom } from 'rxjs';
import { filter, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AppInitializerService {
  constructor(private authService: AuthService) {}

  async initialize(): Promise<void> {
    // Aguarda o AuthService terminar o carregamento inicial
    await firstValueFrom(
      this.authService.loading$.pipe(
        filter(loading => !loading),
        take(1)
      )
    );
  }
}
