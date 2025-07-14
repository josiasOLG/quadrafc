import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, computed } from '@angular/core';
import { ButtonModule } from 'primeng/button';

import { AuthService } from '../../../modules/auth/services/auth.service';
import { User } from '../../schemas/user.schema';
import { ProfileEditDialogComponent } from './profile-edit-dialog/profile-edit-dialog.component';

@Component({
  selector: 'app-user-mini-header',
  standalone: true,
  imports: [CommonModule, ButtonModule, ProfileEditDialogComponent],
  template: `
    <!-- Mini Header para Jogos -->
    <div class="user-mini-header">
      <div class="user-mini-header__content">
        <div class="user-mini-header__avatar">
          <div class="avatar-container" [class.has-image]="avatarUrl()">
            <img *ngIf="avatarUrl()" [src]="avatarUrl()" alt="Avatar" class="avatar-image" />
            <div *ngIf="!avatarUrl()" class="avatar-placeholder">
              {{ getInitials() }}
            </div>
          </div>
        </div>

        <div class="user-mini-header__info">
          <span class="user-mini-header__name"
            >Bem vindo, {{ currentUser()?.nome || 'Usuário' }}!</span
          >
          <span class="user-mini-header__location">{{ getBairroInfo() }}</span>
        </div>

        <div class="user-mini-header__actions">
          <button
            type="button"
            pButton
            icon="pi pi-pencil"
            severity="secondary"
            size="small"
            class="edit-profile-btn"
            (click)="openProfileEditDialog()"
            title="Editar perfil"
          ></button>

          <div class="user-mini-header__points">
            <span class="user-mini-header__points-value">{{ getUserPoints() }}</span>
            <span class="user-mini-header__points-label">pts</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Profile Edit Dialog -->
    <app-profile-edit-dialog
      [(visible)]="showProfileEditDialog"
      (dialogClose)="onProfileEditDialogClose()"
    >
    </app-profile-edit-dialog>
  `,
  styleUrls: ['./user-mini-header.component.scss'],
})
export class UserMiniHeaderComponent {
  showProfileEditDialog = false;

  // Signal reativo do usuário atual com tipagem explícita
  currentUser: () => User | null;

  // Computed signal para avatar - deriva automaticamente do currentUser
  avatarUrl = computed(() => {
    const user = this.currentUser();
    const url = user?.foto_perfil || user?.avatarUrl || null;
    console.log('🖼️ Avatar URL computed:', { url, user: user?.nome });
    return url;
  });

  constructor(private authService: AuthService, private cdr: ChangeDetectorRef) {
    this.currentUser = this.authService.currentUser;
  }

  getUserPoints(): number {
    const user = this.currentUser();
    return user?.pontos_totais || user?.totalPoints || 0;
  }

  getBairroInfo(): string {
    const user = this.currentUser();
    if (user?.bairro && user?.cidade && user?.estado) {
      return `${user.bairro}, ${user.cidade}`;
    }
    return user?.bairro || 'Sem localização';
  }

  getInitials(): string {
    const user = this.currentUser();
    return user?.nome?.charAt(0)?.toUpperCase() || 'U';
  }

  openProfileEditDialog(): void {
    this.showProfileEditDialog = true;
  }

  onProfileEditDialogClose(): void {
    this.showProfileEditDialog = false;
  }
}
