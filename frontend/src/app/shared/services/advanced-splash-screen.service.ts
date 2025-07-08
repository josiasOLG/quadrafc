import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdvancedSplashScreenService {
  private renderer: Renderer2;
  private splashElement: HTMLElement | null = null;
  private isShowing = new BehaviorSubject<boolean>(false);
  public isShowing$ = this.isShowing.asObservable();

  constructor(private rendererFactory: RendererFactory2) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }

  showSplashScreen(): void {
    if (this.splashElement) {
      return;
    }

    this.createSplashElement();
    this.isShowing.next(true);

    // Auto hide após 3 segundos
    setTimeout(() => {
      this.hideSplashScreen();
    }, 3000);
  }

  hideSplashScreen(): void {
    if (!this.splashElement) {
      return;
    }

    this.renderer.addClass(this.splashElement, 'fade-out');

    setTimeout(() => {
      if (this.splashElement) {
        this.renderer.removeChild(document.body, this.splashElement);
        this.splashElement = null;
        this.isShowing.next(false);
      }
    }, 600);
  }

  private createSplashElement(): void {
    // Container principal
    this.splashElement = this.renderer.createElement('div');
    this.renderer.addClass(this.splashElement, 'pwa-splash-screen');

    // Partículas de fundo
    const particles = this.renderer.createElement('div');
    this.renderer.addClass(particles, 'splash-particles');

    for (let i = 0; i < 9; i++) {
      const particle = this.renderer.createElement('div');
      this.renderer.addClass(particle, 'particle');
      this.renderer.appendChild(particles, particle);
    }
    this.renderer.appendChild(this.splashElement, particles);

    // Logo
    const logo = this.renderer.createElement('div');
    this.renderer.addClass(logo, 'splash-logo');

    const logoText = this.renderer.createElement('div');
    this.renderer.addClass(logoText, 'splash-logo-text');
    const logoTextContent = this.renderer.createText('Q⚽');
    this.renderer.appendChild(logoText, logoTextContent);
    this.renderer.appendChild(logo, logoText);
    this.renderer.appendChild(this.splashElement, logo);

    // Título
    const title = this.renderer.createElement('h1');
    this.renderer.addClass(title, 'splash-title');
    const titleText = this.renderer.createText('QuadraFC');
    this.renderer.appendChild(title, titleText);
    this.renderer.appendChild(this.splashElement, title);

    // Subtítulo
    const subtitle = this.renderer.createElement('p');
    this.renderer.addClass(subtitle, 'splash-subtitle');
    const subtitleText = this.renderer.createText('Palpites Esportivos');
    this.renderer.appendChild(subtitle, subtitleText);
    this.renderer.appendChild(this.splashElement, subtitle);

    // Loader
    const loader = this.renderer.createElement('div');
    this.renderer.addClass(loader, 'splash-loader');
    this.renderer.appendChild(this.splashElement, loader);

    // Barra de progresso
    const progress = this.renderer.createElement('div');
    this.renderer.addClass(progress, 'splash-progress');

    const progressBar = this.renderer.createElement('div');
    this.renderer.addClass(progressBar, 'splash-progress-bar');
    this.renderer.appendChild(progress, progressBar);
    this.renderer.appendChild(this.splashElement, progress);

    // Texto de carregamento
    const loadingText = this.renderer.createElement('p');
    this.renderer.addClass(loadingText, 'splash-loading-text');
    const loadingTextContent = this.renderer.createText('Carregando experiência...');
    this.renderer.appendChild(loadingText, loadingTextContent);
    this.renderer.appendChild(this.splashElement, loadingText);

    // Adicionar ao DOM
    this.renderer.appendChild(document.body, this.splashElement);
  }

  // Método para customizar splash baseado em contexto
  showContextualSplash(context: 'login' | 'ranking' | 'palpites' | 'default' = 'default'): void {
    const messages = {
      login: 'Conectando...',
      ranking: 'Carregando ranking...',
      palpites: 'Atualizando palpites...',
      default: 'Carregando experiência...',
    };

    this.showSplashScreen();

    if (this.splashElement) {
      const loadingText = this.splashElement.querySelector('.splash-loading-text');
      if (loadingText) {
        loadingText.textContent = messages[context];
      }
    }
  }

  // Método para splash com progresso customizado
  showProgressSplash(steps: string[]): void {
    this.showSplashScreen();

    let currentStep = 0;
    const interval = setInterval(() => {
      if (!this.splashElement || currentStep >= steps.length) {
        clearInterval(interval);
        return;
      }

      const loadingText = this.splashElement.querySelector('.splash-loading-text');
      if (loadingText) {
        loadingText.textContent = steps[currentStep];
      }

      currentStep++;
    }, 500);
  }
}
