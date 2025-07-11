import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AdvancedPwaService {
  private deferredPrompt: any;
  private isStandalone = false;

  constructor(private swUpdate: SwUpdate, @Inject(PLATFORM_ID) private platformId: object) {
    this.initPWA();
    this.checkForUpdates();
    this.detectStandaloneMode();
  }

  private initPWA(): void {
    // Detectar prompt de instalação
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallBanner();
    });

    // Detectar instalação
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.hideInstallBanner();
      this.trackInstallation();
    });

    // Configurar orientação
    if ('screen' in window && 'orientation' in window.screen) {
      try {
        (window.screen.orientation as any).lock('portrait-primary');
      } catch (error) {
        console.error('❌ PWA: Orientation lock failed:', error);
      }
    }
  }

  private checkForUpdates(): void {
    if (this.swUpdate.isEnabled) {
      // Verificar atualizações a cada 30 segundos
      setInterval(() => {
        this.swUpdate.checkForUpdate();
      }, 30000);

      // Escutar por atualizações disponíveis
      this.swUpdate.versionUpdates
        .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
        .subscribe(() => {
          this.showUpdateAvailable();
        });

      // Verificar imediatamente
      this.swUpdate.checkForUpdate().then(() => {
        console.log('🔄 PWA: Checked for updates');
      });
    }
  }

  private detectStandaloneMode(): void {
    // Detectar se está rodando como PWA
    this.isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone ||
      document.referrer.includes('android-app://');

    if (this.isStandalone) {
      console.log('📱 PWA: Running in standalone mode');
      document.body.classList.add('pwa-standalone');
      this.setupStandaloneFeatures();
    }
  }

  private setupStandaloneFeatures(): void {
    // Desabilitar zoom em standalone
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      viewport.setAttribute(
        'content',
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
      );
    }

    // Configurar status bar para iOS
    if (this.isIOS()) {
      document.body.classList.add('ios-standalone');

      // Adicionar padding para safe area
      document.documentElement.style.setProperty('--safe-area-top', 'env(safe-area-inset-top)');
      document.documentElement.style.setProperty(
        '--safe-area-bottom',
        'env(safe-area-inset-bottom)'
      );
    }

    // Configurar para Android
    if (this.isAndroid()) {
      document.body.classList.add('android-standalone');
    }
  }

  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('❌ PWA: Install prompt not available');
      return false;
    }

    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;

      console.log(`👤 PWA: User choice: ${outcome}`);

      if (outcome === 'accepted') {
        this.deferredPrompt = null;
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ PWA: Install prompt failed:', error);
      return false;
    }
  }

  async updateApp(): Promise<void> {
    if (!this.swUpdate.isEnabled) {
      window.location.reload();
      return;
    }

    try {
      await this.swUpdate.activateUpdate();
      window.location.reload();
    } catch (error) {
      console.error('❌ PWA: Update failed:', error);
      window.location.reload();
    }
  }

  private showInstallBanner(): void {
    // Criar banner de instalação customizado
    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.className = 'pwa-install-banner';
    banner.innerHTML = `
      <div class="install-content">
        <div class="install-icon">📱</div>
        <div class="install-text">
          <strong>Instalar QuadraFC</strong>
          <span>Acesso rápido e funciona offline!</span>
        </div>
        <div class="install-actions">
          <button class="install-btn" onclick="this.closest('.pwa-install-banner').remove()">
            ✕
          </button>
          <button class="install-btn primary" id="pwa-install-button">
            Instalar
          </button>
        </div>
      </div>
    `;

    // Adicionar estilos
    const style = document.createElement('style');
    style.textContent = `
      .pwa-install-banner {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
        color: white;
        padding: 16px;
        box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideUp 0.3s ease-out;
      }

      .install-content {
        display: flex;
        align-items: center;
        gap: 12px;
        max-width: 600px;
        margin: 0 auto;
      }

      .install-icon {
        font-size: 24px;
      }

      .install-text {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .install-text strong {
        font-weight: 600;
        font-size: 16px;
      }

      .install-text span {
        font-size: 14px;
        opacity: 0.9;
      }

      .install-actions {
        display: flex;
        gap: 8px;
      }

      .install-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        background: rgba(255,255,255,0.2);
        color: white;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .install-btn.primary {
        background: #ff6a3d;
      }

      .install-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      }

      @keyframes slideUp {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }

      @media (max-width: 480px) {
        .install-content {
          flex-direction: column;
          text-align: center;
          gap: 16px;
        }

        .install-actions {
          order: -1;
          justify-content: space-between;
          width: 100%;
        }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(banner);

    // Configurar botão de instalação
    const installButton = document.getElementById('pwa-install-button');
    if (installButton) {
      installButton.addEventListener('click', () => {
        this.promptInstall().then((installed) => {
          if (installed) {
            banner.remove();
          }
        });
      });
    }

    // Auto remover após 10 segundos
    setTimeout(() => {
      if (banner.parentNode) {
        banner.remove();
      }
    }, 10000);
  }

  private hideInstallBanner(): void {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.remove();
    }
  }

  private showUpdateAvailable(): void {
    // Criar notificação de atualização
    const notification = document.createElement('div');
    notification.className = 'pwa-update-notification';
    notification.innerHTML = `
      <div class="update-content">
        <div class="update-icon">🔄</div>
        <div class="update-text">
          <strong>Atualização Disponível</strong>
          <span>Nova versão do QuadraFC está pronta!</span>
        </div>
        <button class="update-btn" id="pwa-update-button">
          Atualizar
        </button>
      </div>
    `;

    // Adicionar estilos para notificação
    const style = document.createElement('style');
    style.textContent = `
      .pwa-update-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 16px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);
        z-index: 1001;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
      }

      .update-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .update-icon {
        font-size: 20px;
        animation: spin 2s linear infinite;
      }

      .update-text {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .update-text strong {
        font-weight: 600;
        font-size: 14px;
      }

      .update-text span {
        font-size: 12px;
        opacity: 0.9;
      }

      .update-btn {
        padding: 6px 12px;
        border: none;
        border-radius: 6px;
        background: rgba(255,255,255,0.2);
        color: white;
        font-weight: 500;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
      }

      .update-btn:hover {
        background: rgba(255,255,255,0.3);
      }

      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(notification);

    // Configurar botão de atualização
    const updateButton = document.getElementById('pwa-update-button');
    if (updateButton) {
      updateButton.addEventListener('click', () => {
        this.updateApp();
      });
    }

    // Auto remover após 15 segundos
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 15000);
  }

  private trackInstallation(): void {
    // Analytics ou tracking da instalação
    console.log('📊 PWA: Installation tracked');

    // Enviar evento para analytics se disponível
    if (typeof (window as any).gtag !== 'undefined') {
      (window as any).gtag('event', 'pwa_install', {
        event_category: 'PWA',
        event_label: 'App Installation',
      });
    }
  }

  // Utility methods
  isInstallable(): boolean {
    return !!this.deferredPrompt;
  }

  isStandaloneMode(): boolean {
    return this.isStandalone;
  }

  private isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  private isAndroid(): boolean {
    return /Android/.test(navigator.userAgent);
  }

  // Método específico para detectar iOS PWA
  isIOSPWA(): boolean {
    return this.isIOS() && this.isStandalone;
  }

  // Método para obter informações do ambiente PWA
  getPWAEnvironment(): {
    isStandalone: boolean;
    isIOS: boolean;
    isAndroid: boolean;
    isIOSPWA: boolean;
    platform: string;
  } {
    return {
      isStandalone: this.isStandalone,
      isIOS: this.isIOS(),
      isAndroid: this.isAndroid(),
      isIOSPWA: this.isIOSPWA(),
      platform: this.isIOSPWA()
        ? 'ios-pwa'
        : this.isAndroid() && this.isStandalone
        ? 'android-pwa'
        : 'web',
    };
  }

  // Método para configurar notificações push
  async setupPushNotifications(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('❌ Push notifications not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          'YOUR_VAPID_PUBLIC_KEY_HERE' // Substituir pela chave VAPID real
        ),
      });

      console.log('✅ Push subscription:', subscription);
      return true;
    } catch (error) {
      console.error('❌ Push subscription failed:', error);
      return false;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}
