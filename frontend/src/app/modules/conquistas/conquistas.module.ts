import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConquistasRoutingModule } from './conquistas-routing.module';
import { ConquistasListComponent } from './components/conquistas-list/conquistas-list.component';
import { SharedModule } from '../../shared/shared.module';
import { ProgressBarModule } from 'primeng/progressbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { TabViewModule } from 'primeng/tabview';

@NgModule({
  declarations: [
    ConquistasListComponent
  ],
  imports: [
    CommonModule,
    ConquistasRoutingModule,
    SharedModule,
    ProgressBarModule,
    ProgressSpinnerModule,
    TagModule,
    TabViewModule
  ]
})
export class ConquistasModule { }
