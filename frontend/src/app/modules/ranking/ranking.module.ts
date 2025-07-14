import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CampeonatosComponent } from './components/campeonatos/campeonatos.component';
import { RankingRoutingModule } from './ranking-routing.module';

@NgModule({
  declarations: [],
  imports: [CommonModule, RankingRoutingModule, CampeonatosComponent],
})
export class RankingModule {}
