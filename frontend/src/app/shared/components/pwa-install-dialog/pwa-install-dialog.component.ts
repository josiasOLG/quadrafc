import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ImageModule } from 'primeng/image';
import { TabViewModule } from 'primeng/tabview';
import { Subject } from 'rxjs';
import { PwaInstallDialogService } from './pwa-install-dialog.service';

@Component({
  selector: 'app-pwa-install-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule, ImageModule, TabViewModule],
  templateUrl: './pwa-install-dialog.component.html',
  styleUrls: ['./pwa-install-dialog.component.scss'],
})
export class PwaInstallDialogComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  private pwaService = inject(PwaInstallDialogService);
  private sanitizer = inject(DomSanitizer);

  visible = this.pwaService.isVisible;

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get iosVideoUrl(): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://www.youtube.com/embed/Bm3VIOUe7ZY?autoplay=0&mute=1&controls=1&rel=0&modestbranding=1'
    );
  }

  get androidVideoUrl(): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://www.youtube.com/embed/K_RhGbqzIGk?autoplay=0&mute=1&controls=1&rel=0&modestbranding=1'
    );
  }

  close() {
    this.pwaService.hide();
  }

  installLater() {
    this.pwaService.dismissLater();
  }

  neverShow() {
    this.pwaService.neverShowAgain();
  }
}
