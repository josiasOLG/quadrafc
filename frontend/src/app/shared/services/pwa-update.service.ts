import { Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { BehaviorSubject, filter, fromEvent, merge } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PwaUpdateService {
  private updateAvailable$ = new BehaviorSubject<boolean>(false);
  private updateActivated$ = new BehaviorSubject<boolean>(false);

  constructor(private swUpdate: SwUpdate) {
    this.initUpdateChecks();
  }

  get isUpdateAvailable$() {
    return this.updateAvailable$.asObservable();
  }

  get isUpdateActivated$() {
    return this.updateActivated$.asObservable();
  }

  private initUpdateChecks(): void {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    // Verificar atualizações quando o app volta para foreground
    const appVisible$ = merge(fromEvent(document, 'visibilitychange'), fromEvent(window, 'focus'));

    appVisible$.subscribe(() => {
      if (!document.hidden) {
        this.checkForUpdate();
      }
    });

    // Escutar eventos de versão pronta
    this.swUpdate.versionUpdates
      .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
      .subscribe(() => {
        this.updateAvailable$.next(true);
      });

    // Escutar falhas de instalação
    this.swUpdate.versionUpdates
      .pipe(filter((evt) => evt.type === 'VERSION_INSTALLATION_FAILED'))
      .subscribe(() => {
        this.updateActivated$.next(false);
      });

    // Verificação periódica a cada 6 horas
    setInterval(() => {
      this.checkForUpdate();
    }, 6 * 60 * 60 * 1000);

    // Verificação inicial
    this.checkForUpdate();
  }

  async checkForUpdate(): Promise<boolean> {
    if (!this.swUpdate.isEnabled) {
      return false;
    }

    try {
      return await this.swUpdate.checkForUpdate();
    } catch {
      return false;
    }
  }

  async activateUpdate(): Promise<void> {
    if (!this.swUpdate.isEnabled) {
      window.location.reload();
      return;
    }

    try {
      await this.swUpdate.activateUpdate();
      this.updateAvailable$.next(false);
      window.location.reload();
    } catch {
      window.location.reload();
    }
  }

  async promptForUpdate(): Promise<boolean> {
    const userResponse = confirm(
      'Nova versão do QuadraFC disponível! Deseja atualizar agora para aproveitar as melhorias?'
    );

    if (userResponse) {
      await this.activateUpdate();
      return true;
    }

    return false;
  }
}
