import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { TooltipModule } from 'primeng/tooltip';

// Routing
import { ConfiguracoesRoutingModule } from './configuracoes-routing.module';

// Components
import { ConfiguracoesComponent } from './components/configuracoes/configuracoes.component';

// Shared
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { UserMiniHeaderComponent } from '../../shared/components/user-mini-header/user-mini-header.component';

@NgModule({
  declarations: [ConfiguracoesComponent],
  imports: [
    CommonModule,
    FormsModule,
    ConfiguracoesRoutingModule,

    // PrimeNG
    CardModule,
    ButtonModule,
    InputSwitchModule,
    DropdownModule,
    InputTextModule,
    AvatarModule,
    DividerModule,
    TooltipModule,
    DialogModule,
    PasswordModule,

    // Shared
    ConfirmDialogComponent,
    PageHeaderComponent,
    UserMiniHeaderComponent,
  ],
})
export class ConfiguracoesModule {}
