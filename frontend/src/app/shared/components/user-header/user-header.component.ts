import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { ProgressBarModule } from 'primeng/progressbar';

import { User } from '../../schemas/user.schema';

@Component({
  selector: 'app-user-header',
  standalone: true,
  imports: [CommonModule, AvatarModule, ProgressBarModule],
  template: `
    <!-- Header com Stats do Usuário -->
    <div class="user-header">
      <!-- 1. Dashboard Icon + Avatar + Pontos -->
      <div class="user-header__top">
        <i class="pi pi-th-large user-header__dashboard-icon"></i>
        <div class="user-header__avatar-points-container">
          <p-avatar
            [image]="user?.foto_perfil || user?.avatarUrl"
            [label]="user?.nome?.charAt(0)"
            size="large"
            shape="circle"
            styleClass="user-header__avatar"
          >
          </p-avatar>
          <div class="user-header__points">
            <div class="user-header__points-value">{{ getUserPoints() }}</div>
            <div class="user-header__points-label">pontos</div>
          </div>
        </div>
      </div>

      <!-- 2. Nome em negrito -->
      <div class="user-header__user-name">
        {{ user?.nome || 'Usuário' }}
      </div>

      <!-- 3. Localização -->
      <div class="user-header__user-location">
        <i class="pi pi-map-marker"></i>
        {{ getBairroInfo() }}
      </div>

      <!-- 4. Barra de Progresso -->
      <div class="user-header__level-progress">
        <div class="user-header__level-info">
          <span class="user-header__level-text">Nível {{ getUserLevel() }}</span>
          <span class="user-header__progress-text">{{ getLevelProgress() }}%</span>
        </div>
        <p-progressBar [value]="getLevelProgress()" styleClass="user-header__progress-bar">
        </p-progressBar>
      </div>
    </div>
  `,
  styleUrls: ['./user-header.component.scss'],
})
export class UserHeaderComponent {
  @Input() user: User | null = null;

  getUserPoints(): number {
    return this.user?.pontos_totais || this.user?.totalPoints || 0;
  }

  getUserCoins(): number {
    return this.user?.moedas || 0;
  }

  getUserStreak(): number {
    return this.user?.estatisticas?.sequencia_atual || 0;
  }

  getUserLevel(): number {
    return this.user?.nivel || 1;
  }

  getBairroInfo(): string {
    if (this.user?.bairro && this.user?.cidade && this.user?.estado) {
      const bairro = {
        nome: this.user.bairro,
        cidade: this.user.cidade,
        estado: this.user.estado,
      };
      return `${bairro.nome}, ${bairro.cidade} - ${bairro.estado}`;
    }
    return this.user?.bairro || 'Selecione seu bairro';
  }

  getLevelProgress(): number {
    const points = this.getUserPoints();
    const currentLevelPoints = (this.getUserLevel() - 1) * 1000;
    const nextLevelPoints = this.getUserLevel() * 1000;
    const progress = ((points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }
}
