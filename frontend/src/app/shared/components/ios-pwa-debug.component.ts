import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AdvancedPwaService, IosPwaIssues } from '../services/advanced-pwa.service';
import {
  BackendConnectivityResult,
  IosPwaDiagnosticResult,
  IosPwaDiagnosticService,
} from '../services/ios-pwa-diagnostic.service';

/**
 * Componente de debug para iOS PWA
 *
 * Este componente fornece uma interface visual para diagnosticar problemas
 * específicos do iOS PWA, especialmente relacionados a sessões e cookies.
 *
 * Para usar: adicione <app-ios-pwa-debug></app-ios-pwa-debug> temporariamente
 * em qualquer template durante desenvolvimento/teste.
 */
@Component({
  selector: 'app-ios-pwa-debug',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ios-pwa-debug" *ngIf="showDebug">
      <div class="debug-header">
        <h3>🔍 iOS PWA Debug Console</h3>
        <button (click)="toggleDebug()" class="toggle-btn">
          {{ isExpanded ? '🔼' : '🔽' }}
        </button>
        <button (click)="closeDebug()" class="close-btn">❌</button>
      </div>

      <div class="debug-content" *ngIf="isExpanded">
        <div class="debug-section">
          <h4>📱 Environment</h4>
          <div class="info-grid">
            <div>
              <strong>iOS PWA:</strong>
              {{
                diagnostics?.environment?.isIOS && diagnostics?.environment?.isStandalone
                  ? 'Yes'
                  : 'No'
              }}
            </div>
            <div><strong>Safari iOS:</strong> {{ isIosSafari ? 'Yes' : 'No' }}</div>
            <div>
              <strong>Standalone:</strong>
              {{ diagnostics?.environment?.isStandalone ? 'Yes' : 'No' }}
            </div>
            <div>
              <strong>Online:</strong> {{ diagnostics?.environment?.online ? 'Yes' : 'No' }}
            </div>
          </div>
        </div>

        <div class="debug-section">
          <h4>🍪 Cookies & Storage</h4>
          <div class="info-grid">
            <div>
              <strong>Cookies Enabled:</strong> {{ diagnostics?.cookies?.enabled ? 'Yes' : 'No' }}
            </div>
            <div><strong>Cookie Count:</strong> {{ diagnostics?.cookies?.count || 0 }}</div>
            <div>
              <strong>LocalStorage:</strong>
              {{ diagnostics?.storage?.localStorage?.available ? 'Available' : 'Blocked' }}
            </div>
            <div>
              <strong>SessionStorage:</strong>
              {{ diagnostics?.storage?.sessionStorage?.available ? 'Available' : 'Blocked' }}
            </div>
          </div>
        </div>

        <div class="debug-section">
          <h4>🌐 Backend Connectivity</h4>
          <div class="info-grid" *ngIf="connectivity">
            <div [class]="connectivity.ping.success ? 'success' : 'error'">
              <strong>Ping:</strong> {{ connectivity.ping.success ? '✅' : '❌' }} ({{
                connectivity.ping.responseTime.toFixed(0)
              }}ms)
              <span *ngIf="connectivity.ping.error"> - {{ connectivity.ping.error }}</span>
            </div>
            <div [class]="connectivity.auth.success ? 'success' : 'error'">
              <strong>Auth:</strong> {{ connectivity.auth.success ? '✅' : '❌' }} ({{
                connectivity.auth.responseTime.toFixed(0)
              }}ms)
              <span *ngIf="connectivity.auth.error"> - {{ connectivity.auth.error }}</span>
            </div>
            <div [class]="connectivity.profile.success ? 'success' : 'error'">
              <strong>Profile:</strong> {{ connectivity.profile.success ? '✅' : '❌' }} ({{
                connectivity.profile.responseTime.toFixed(0)
              }}ms)
              <span *ngIf="connectivity.profile.error"> - {{ connectivity.profile.error }}</span>
            </div>
          </div>
        </div>

        <div class="debug-section" *ngIf="issues.recommendations.length > 0">
          <h4>⚠️ Issues & Recommendations</h4>
          <ul>
            <li *ngFor="let recommendation of issues.recommendations">{{ recommendation }}</li>
          </ul>
        </div>

        <div class="debug-actions">
          <button (click)="runDiagnostics()" class="action-btn">🔄 Refresh Diagnostics</button>
          <button (click)="testConnectivity()" class="action-btn">🌐 Test Connectivity</button>
          <button (click)="forceSessionRefresh()" class="action-btn">
            🔑 Force Session Refresh
          </button>
          <button (click)="clearAllData()" class="action-btn danger">🗑️ Clear All Data</button>
        </div>

        <div class="debug-section">
          <h4>📋 Raw Data</h4>
          <details>
            <summary>View Raw Diagnostic Data</summary>
            <pre>{{ diagnostics | json }}</pre>
          </details>
        </div>
      </div>
    </div>

    <!-- Floating Debug Button -->
    <button
      *ngIf="!showDebug && shouldShowFloatingButton"
      (click)="openDebug()"
      class="floating-debug-btn"
      title="Open iOS PWA Debug Console"
    >
      🔍
    </button>
  `,
  styles: [
    `
      .ios-pwa-debug {
        position: fixed;
        top: 10px;
        right: 10px;
        width: 400px;
        max-width: 90vw;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        border-radius: 8px;
        z-index: 10000;
        font-family: monospace;
        font-size: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      }

      .debug-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px 8px 0 0;
      }

      .debug-header h3 {
        margin: 0;
        font-size: 14px;
      }

      .toggle-btn,
      .close-btn,
      .action-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      }

      .toggle-btn:hover,
      .close-btn:hover,
      .action-btn:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .debug-content {
        padding: 10px;
        max-height: 70vh;
        overflow-y: auto;
      }

      .debug-section {
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .debug-section h4 {
        margin: 0 0 8px 0;
        color: #4caf50;
        font-size: 13px;
      }

      .info-grid {
        display: grid;
        gap: 5px;
      }

      .info-grid div {
        padding: 2px 0;
      }

      .success {
        color: #4caf50;
      }

      .error {
        color: #f44336;
      }

      .debug-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 5px;
        margin: 10px 0;
      }

      .action-btn.danger {
        background: rgba(244, 67, 54, 0.7);
      }

      .action-btn.danger:hover {
        background: rgba(244, 67, 54, 0.9);
      }

      .floating-debug-btn {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        border: none;
        font-size: 20px;
        cursor: pointer;
        z-index: 9999;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      }

      .floating-debug-btn:hover {
        background: rgba(0, 0, 0, 0.9);
      }

      pre {
        background: rgba(255, 255, 255, 0.1);
        padding: 10px;
        border-radius: 4px;
        max-height: 200px;
        overflow-y: auto;
        font-size: 10px;
      }

      ul {
        margin: 5px 0;
        padding-left: 20px;
      }

      li {
        margin-bottom: 5px;
        color: #ff9800;
      }

      details summary {
        cursor: pointer;
        padding: 5px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
      }
    `,
  ],
})
export class IosPwaDebugComponent implements OnInit {
  showDebug = false;
  isExpanded = true;
  diagnostics: IosPwaDiagnosticResult | null = null;
  connectivity: BackendConnectivityResult | null = null;
  issues: IosPwaIssues = {
    cookieIssues: false,
    storageIssues: false,
    networkIssues: false,
    standaloneModeIssues: false,
    recommendations: [],
  };

  constructor(
    private advancedPwaService: AdvancedPwaService,
    private diagnosticService: IosPwaDiagnosticService
  ) {}

  ngOnInit() {
    // Mostrar automaticamente em iOS PWA se houver parâmetro de debug na URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('pwa-debug') === 'true' || this.diagnosticService.isIosPwa()) {
      this.openDebug();
    }
  }

  get shouldShowFloatingButton(): boolean {
    return this.diagnosticService.isIosPwa() || this.isIosSafari;
  }

  get isIosSafari(): boolean {
    return this.diagnosticService.isIosSafari();
  }

  openDebug() {
    this.showDebug = true;
    this.runDiagnostics();
    this.testConnectivity();
  }

  closeDebug() {
    this.showDebug = false;
  }

  toggleDebug() {
    this.isExpanded = !this.isExpanded;
  }

  runDiagnostics() {
    console.log('🔍 Running iOS PWA diagnostics...');
    this.diagnostics = this.diagnosticService.runDiagnostics();
    this.issues = this.advancedPwaService.checkIosIssues();
  }

  async testConnectivity() {
    console.log('🌐 Testing backend connectivity...');
    this.connectivity = await this.diagnosticService.testBackendConnectivity();
  }

  async forceSessionRefresh() {
    console.log('🔑 Forcing session refresh...');
    const success = await this.advancedPwaService.forceIosSessionRefresh();
    if (success) {
      alert('✅ Session refresh successful!');
      // Refresh diagnostics after successful refresh
      this.runDiagnostics();
      this.testConnectivity();
    } else {
      alert('❌ Session refresh failed. Check console for details.');
    }
  }

  clearAllData() {
    if (confirm('⚠️ This will clear all local storage, session storage, and cookies. Continue?')) {
      try {
        localStorage.clear();
        sessionStorage.clear();

        // Clear all cookies
        document.cookie.split(';').forEach(function (c) {
          document.cookie = c
            .replace(/^ +/, '')
            .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
        });

        alert('✅ All data cleared! You may need to refresh the page.');
        this.runDiagnostics();
      } catch (error) {
        alert('❌ Error clearing data: ' + error);
      }
    }
  }
}
