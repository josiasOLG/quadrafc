import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputSwitchModule } from 'primeng/inputswitch';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { AvatarModule } from 'primeng/avatar';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { PasswordModule } from 'primeng/password';

// Routing
import { ConfiguracoesRoutingModule } from './configuracoes-routing.module';

// Components
import { ConfiguracoesComponent } from './components/configuracoes/configuracoes.component';

// Shared
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@NgModule({
  declarations: [
    ConfiguracoesComponent
  ],
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
    PageHeaderComponent
  ]
})
export class ConfiguracoesModule { }
