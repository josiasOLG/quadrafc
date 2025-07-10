import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { ProgressBarModule } from 'primeng/progressbar';

import { User } from '../../schemas/user.schema';

@Component({
  selector: 'app-user-header',
  standalone: true,
  imports: [CommonModule, AvatarModule, ProgressBarModule, CardModule, ChipModule],
  template: `
    <!-- User Header Profissional -->
    <div class="user-header">
      <!-- Avatar e Info Principal -->
      <div class="user-header__main">
        <div class="user-header__avatar-section">
          <p-avatar
            [image]="user?.foto_perfil || user?.avatarUrl"
            [label]="user?.nome?.charAt(0)"
            size="large"
            shape="circle"
            styleClass="user-header__avatar"
          />
        </div>
        <div class="user-header__info">
          <h2 class="user-header__name">{{ user?.nome || 'Usuário' }}</h2>
          <p class="user-header__location">
            <i class="pi pi-map-marker"></i>
            {{ getBairroInfo() }}
          </p>
        </div>
        <div class="user-header__stats">
          <div class="user-header__stat-item">
            <span class="user-header__stat-value">{{ getUserPoints() }}</span>
            <span class="user-header__stat-label">Pontos</span>
          </div>
        </div>
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
