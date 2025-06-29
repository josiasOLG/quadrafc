import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { BairrosRoutingModule } from './bairros-routing.module';
import { BairrosSelectionComponent } from './components/bairros-selection/bairros-selection.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    BairrosSelectionComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    BairrosRoutingModule,
    SharedModule,
    ProgressSpinnerModule
  ]
})
export class BairrosModule { }
