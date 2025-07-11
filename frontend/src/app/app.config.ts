import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  importProvidersFrom,
  isDevMode,
  provideZoneChangeDetection,
} from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  PreloadAllModules,
  provideRouter,
  withEnabledBlockingInitialNavigation,
  withPreloading,
  withRouterConfig,
} from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { MessageService } from 'primeng/api';

import { provideClientHydration } from '@angular/platform-browser';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor.functional';
import { errorInterceptor } from './core/interceptors/error.interceptor.functional';
import { PremiumPermissionsService } from './core/services/premium-permissions.service';
import { cacheInvalidationInterceptor } from './shared/interceptors/cache-invalidation.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Otimização de Zone.js para melhor performance
    provideZoneChangeDetection({
      eventCoalescing: true,
      runCoalescing: true,
    }),
    provideRouter(
      routes,
      withEnabledBlockingInitialNavigation(), // BLOQUEIA navegação inicial até guards serem resolvidos
      withPreloading(PreloadAllModules), // Precarrega módulos lazy-loaded
      withRouterConfig({
        onSameUrlNavigation: 'reload', // Recarrega em mesma URL
        urlUpdateStrategy: 'eager', // Atualiza URL de forma eager
      })
    ),
    provideClientHydration(),
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor, cacheInvalidationInterceptor]),
      withFetch()
    ),
    importProvidersFrom(BrowserAnimationsModule),
    MessageService,
    CookieService,
    PremiumPermissionsService,
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
