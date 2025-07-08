import { Injectable } from '@angular/core';

/**
 * Serviço de diagnóstico para iOS PWA
 *
 * Este serviço fornece informações detalhadas sobre o ambiente de execução
 * e ajuda a diagnosticar problemas específicos do iOS PWA, especialmente
 * relacionados a cookies http-only e persistência de sessão.
 */
@Injectable({
  providedIn: 'root',
})
export class IosPwaDiagnosticService {
  /**
   * Executa diagnóstico completo do ambiente iOS PWA
   */
  runDiagnostics(): IosPwaDiagnosticResult {
    const result: IosPwaDiagnosticResult = {
      environment: this.getEnvironmentInfo(),
      cookies: this.getCookieInfo(),
      storage: this.getStorageInfo(),
      network: this.getNetworkInfo(),
      pwa: this.getPwaInfo(),
      timestamp: new Date().toISOString(),
    };

    console.group('📱 iOS PWA Diagnostic Report');
    console.log('Environment:', result.environment);
    console.log('Cookies:', result.cookies);
    console.log('Storage:', result.storage);
    console.log('Network:', result.network);
    console.log('PWA:', result.pwa);
    console.groupEnd();

    return result;
  }

  /**
   * Verifica se está rodando em iOS PWA
   */
  isIosPwa(): boolean {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;
    return isIOS && isStandalone;
  }

  /**
   * Verifica se está rodando em Safari iOS (não PWA)
   */
  isIosSafari(): boolean {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari =
      /Safari/.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS/.test(navigator.userAgent);
    const isNotStandalone =
      !window.matchMedia('(display-mode: standalone)').matches &&
      (navigator as any).standalone !== true;
    return isIOS && isSafari && isNotStandalone;
  }

  /**
   * Testa conectividade básica com o backend
   */
  async testBackendConnectivity(): Promise<BackendConnectivityResult> {
    const results: BackendConnectivityResult = {
      ping: { success: false, responseTime: 0, error: null },
      auth: { success: false, responseTime: 0, error: null },
      profile: { success: false, responseTime: 0, error: null },
    };

    // Teste de ping
    try {
      const start = performance.now();
      const response = await fetch('/api/auth/ping', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-cache',
      });
      results.ping.responseTime = performance.now() - start;
      results.ping.success = response.ok;
      if (!response.ok) {
        results.ping.error = `HTTP ${response.status}`;
      }
    } catch (error) {
      results.ping.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Teste de autenticação
    try {
      const start = performance.now();
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-cache',
      });
      results.auth.responseTime = performance.now() - start;
      results.auth.success = response.ok;
      if (!response.ok) {
        results.auth.error = `HTTP ${response.status}`;
      }
    } catch (error) {
      results.auth.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Teste de perfil
    try {
      const start = performance.now();
      const response = await fetch('/api/auth/profile', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-cache',
      });
      results.profile.responseTime = performance.now() - start;
      results.profile.success = response.ok;
      if (!response.ok) {
        results.profile.error = `HTTP ${response.status}`;
      }
    } catch (error) {
      results.profile.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return results;
  }

  private getEnvironmentInfo(): EnvironmentInfo {
    return {
      userAgent: navigator.userAgent,
      isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
      standaloneProperty: (navigator as any).standalone,
      screenSize: `${screen.width}x${screen.height}`,
      windowSize: `${window.innerWidth}x${window.innerHeight}`,
      devicePixelRatio: window.devicePixelRatio,
      language: navigator.language,
      online: navigator.onLine,
      serviceWorkerSupported: 'serviceWorker' in navigator,
    };
  }

  private getCookieInfo(): CookieInfo {
    return {
      enabled: navigator.cookieEnabled,
      count: document.cookie.split(';').filter((c) => c.trim()).length,
      thirdPartyBlocked: this.isThirdPartyCookiesBlocked(),
      sameSiteSupported: this.isSameSiteSupported(),
    };
  }

  private getStorageInfo(): StorageInfo {
    const result: StorageInfo = {
      localStorage: { available: false, quota: 0, used: 0 },
      sessionStorage: { available: false, quota: 0, used: 0 },
      indexedDB: { available: false },
    };

    // localStorage
    try {
      const testKey = '__ios_pwa_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      result.localStorage.available = true;

      if ('storage' in navigator && 'estimate' in navigator.storage) {
        navigator.storage.estimate().then((estimate) => {
          result.localStorage.quota = estimate.quota || 0;
          result.localStorage.used = estimate.usage || 0;
        });
      }
    } catch {
      result.localStorage.available = false;
    }

    // sessionStorage
    try {
      const testKey = '__ios_pwa_test__';
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
      result.sessionStorage.available = true;
    } catch {
      result.sessionStorage.available = false;
    }

    // IndexedDB
    result.indexedDB.available = 'indexedDB' in window;

    return result;
  }

  private getNetworkInfo(): NetworkInfo {
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    return {
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
      saveData: connection?.saveData || false,
      online: navigator.onLine,
    };
  }

  private getPwaInfo(): PwaInfo {
    return {
      isInstalled: window.matchMedia('(display-mode: standalone)').matches,
      canInstall: false, // Will be updated by beforeinstallprompt event
      serviceWorkerRegistered: false, // Will be updated after checking
      manifestValid: this.hasValidManifest(),
      httpsEnabled: location.protocol === 'https:',
    };
  }

  private isThirdPartyCookiesBlocked(): boolean {
    // Simples heurística - não 100% precisa
    try {
      document.cookie = '__third_party_test=1; SameSite=None; Secure';
      const hasThirdParty = document.cookie.includes('__third_party_test');
      document.cookie = '__third_party_test=; expires=Thu, 01 Jan 1970 00:00:00 UTC';
      return !hasThirdParty;
    } catch {
      return true;
    }
  }

  private isSameSiteSupported(): boolean {
    // Verificar se SameSite é suportado
    try {
      document.cookie = '__samesite_test=1; SameSite=Strict';
      const supported = document.cookie.includes('__samesite_test');
      document.cookie = '__samesite_test=; expires=Thu, 01 Jan 1970 00:00:00 UTC';
      return supported;
    } catch {
      return false;
    }
  }

  private hasValidManifest(): boolean {
    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    return !!manifestLink && !!manifestLink.href;
  }
}

// Interfaces para tipagem
export interface IosPwaDiagnosticResult {
  environment: EnvironmentInfo;
  cookies: CookieInfo;
  storage: StorageInfo;
  network: NetworkInfo;
  pwa: PwaInfo;
  timestamp: string;
}

export interface EnvironmentInfo {
  userAgent: string;
  isIOS: boolean;
  isStandalone: boolean;
  standaloneProperty: boolean;
  screenSize: string;
  windowSize: string;
  devicePixelRatio: number;
  language: string;
  online: boolean;
  serviceWorkerSupported: boolean;
}

export interface CookieInfo {
  enabled: boolean;
  count: number;
  thirdPartyBlocked: boolean;
  sameSiteSupported: boolean;
}

export interface StorageInfo {
  localStorage: {
    available: boolean;
    quota: number;
    used: number;
  };
  sessionStorage: {
    available: boolean;
    quota: number;
    used: number;
  };
  indexedDB: {
    available: boolean;
  };
}

export interface NetworkInfo {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
  online: boolean;
}

export interface PwaInfo {
  isInstalled: boolean;
  canInstall: boolean;
  serviceWorkerRegistered: boolean;
  manifestValid: boolean;
  httpsEnabled: boolean;
}

export interface BackendConnectivityResult {
  ping: {
    success: boolean;
    responseTime: number;
    error: string | null;
  };
  auth: {
    success: boolean;
    responseTime: number;
    error: string | null;
  };
  profile: {
    success: boolean;
    responseTime: number;
    error: string | null;
  };
}
