import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class WelcomeService {
  private readonly WELCOME_DIALOG_KEY = 'qfc_welcome_dialog_shown';

  hasSeenWelcomeDialog(): boolean {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return true; // No servidor, assume que já viu
    }

    return this.getCookie(this.WELCOME_DIALOG_KEY) === 'true';
  }

  markWelcomeDialogAsSeen(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    this.setCookie(this.WELCOME_DIALOG_KEY, 'true', 365); // Válido por 1 ano
  }

  private setCookie(name: string, value: string, days: number): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
  }

  private getCookie(name: string): string | null {
    const nameEQ = name + '=';
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return cookie.substring(nameEQ.length);
      }
    }

    return null;
  }

  // Método para resetar (útil para desenvolvimento)
  resetWelcomeDialog(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    document.cookie = `${this.WELCOME_DIALOG_KEY}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }
}
