import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  APP_INITIALIZER,
  ApplicationConfig,
  importProvidersFrom,
  isDevMode,
  provideZoneChangeDetection,
} from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { MessageService } from 'primeng/api';

import { provideClientHydration } from '@angular/platform-browser';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor.functional';
import { errorInterceptor } from './core/interceptors/error.interceptor.functional';
import { PremiumPermissionsService } from './core/services/premium-permissions.service';
import { AuthService } from './modules/auth/services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]), withFetch()),
    importProvidersFrom(BrowserAnimationsModule),
    MessageService,
    CookieService,
    {
      provide: APP_INITIALIZER,
      useFactory: (authService: AuthService) => () => authService.initializeAuth(),
      deps: [AuthService],
      multi: true,
    },
    // Inicializar o serviço de permissões premium
    PremiumPermissionsService,
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
