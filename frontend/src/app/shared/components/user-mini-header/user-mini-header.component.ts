import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';

import { User } from '../../schemas/user.schema';

@Component({
  selector: 'app-user-mini-header',
  standalone: true,
  imports: [CommonModule, AvatarModule],
  template: `
    <!-- Mini Header para Jogos -->
    <div class="user-mini-header">
      <div class="user-mini-header__content">
        <div class="user-mini-header__avatar">
          <p-avatar
            [image]="user?.foto_perfil || user?.avatarUrl"
            [label]="user?.nome?.charAt(0)"
            size="normal"
            shape="circle"
            styleClass="user-mini-header__avatar-img"
          />
        </div>

        <div class="user-mini-header__info">
          <span class="user-mini-header__name">{{ user?.nome || 'Usuário' }}</span>
          <span class="user-mini-header__location">{{ getBairroInfo() }}</span>
        </div>

        <div class="user-mini-header__points">
          <span class="user-mini-header__points-value">{{ getUserPoints() }}</span>
          <span class="user-mini-header__points-label">pts</span>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./user-mini-header.component.scss'],
})
export class UserMiniHeaderComponent {
  @Input() user: User | null = null;

  getUserPoints(): number {
    return this.user?.pontos_totais || this.user?.totalPoints || 0;
  }

  getBairroInfo(): string {
    if (this.user?.bairro && this.user?.cidade && this.user?.estado) {
      return `${this.user.bairro}, ${this.user.cidade}`;
    }
    return this.user?.bairro || 'Sem localização';
  }
}
