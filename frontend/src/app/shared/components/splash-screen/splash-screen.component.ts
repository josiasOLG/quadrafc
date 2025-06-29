import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-splash-screen',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="splash-screen">
      <div class="splash-content">
        <div class="splash-logo">
          <i class="pi pi-trophy" style="font-size: 4rem; color: var(--primary-color);"></i>
        </div>
        <h1 class="splash-title">QuadraFC</h1>
        <p class="splash-subtitle">Compete com seu bairro</p>
        <div class="splash-loading">
          <div class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./splash-screen.component.scss']
})
export class SplashScreenComponent {}
