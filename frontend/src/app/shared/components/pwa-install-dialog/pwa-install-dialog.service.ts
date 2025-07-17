import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

export interface PwaInstallState {
  isVisible: boolean;
  shouldShow: boolean;
  hasBeenDismissed: boolean;
  dismissedUntil?: Date;
  neverShowAgain: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class PwaInstallDialogService {
  private platformId = inject(PLATFORM_ID);
  private readonly STORAGE_KEY = 'pwa-install-dialog-state';

  private state = signal<PwaInstallState>({
    isVisible: false,
    shouldShow: false,
    hasBeenDismissed: false,
    neverShowAgain: false,
  });

  readonly isVisible = computed(() => this.state().isVisible);
  readonly shouldShow = computed(() => this.state().shouldShow);
  readonly canShow = computed(() => {
    const currentState = this.state();
    return (
      !currentState.neverShowAgain &&
      !currentState.hasBeenDismissed &&
      this.isMobile() &&
      !this.isPWA()
    );
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadState();
      this.checkShouldShow();
    }
  }

  show(): void {
    if (this.canShow()) {
      this.state.update((state) => ({
        ...state,
        isVisible: true,
      }));
    }
  }

  hide(): void {
    this.state.update((state) => ({
      ...state,
      isVisible: false,
    }));
  }

  dismissLater(): void {
    const dismissedUntil = new Date();
    dismissedUntil.setHours(dismissedUntil.getHours() + 24); // 24 horas

    this.state.update((state) => ({
      ...state,
      isVisible: false,
      hasBeenDismissed: true,
      dismissedUntil,
    }));

    this.saveState();
  }

  neverShowAgain(): void {
    this.state.update((state) => ({
      ...state,
      isVisible: false,
      neverShowAgain: true,
      hasBeenDismissed: true,
    }));

    this.saveState();
  }

  reset(): void {
    this.state.set({
      isVisible: false,
      shouldShow: false,
      hasBeenDismissed: false,
      neverShowAgain: false,
    });

    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  checkShouldAutoShow(): void {
    if (this.canShow() && !this.state().hasBeenDismissed) {
      setTimeout(() => {
        this.show();
      }, 3000); // Mostrar após 3 segundos
    }
  }

  private checkShouldShow(): void {
    const currentState = this.state();

    if (currentState.dismissedUntil) {
      const now = new Date();
      const dismissedUntil = new Date(currentState.dismissedUntil);

      if (now > dismissedUntil) {
        this.state.update((state) => ({
          ...state,
          hasBeenDismissed: false,
          dismissedUntil: undefined,
        }));
        this.saveState();
      }
    }

    this.state.update((state) => ({
      ...state,
      shouldShow: this.canShow(),
    }));
  }

  private isMobile(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;

    const userAgent = navigator.userAgent || navigator.vendor;
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  }

  private isPWA(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;

    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    );
  }

  private loadState(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsedState = JSON.parse(saved);
        this.state.update((state) => ({
          ...state,
          ...parsedState,
          isVisible: false, // Nunca iniciar visível
        }));
      }
    } catch (error) {
      console.warn('Erro ao carregar estado do PWA Install Dialog:', error);
    }
  }

  private saveState(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const stateToSave = {
        hasBeenDismissed: this.state().hasBeenDismissed,
        dismissedUntil: this.state().dismissedUntil,
        neverShowAgain: this.state().neverShowAgain,
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('Erro ao salvar estado do PWA Install Dialog:', error);
    }
  }
}
