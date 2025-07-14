import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CampeonatosComponent } from './components/campeonatos/campeonatos.component';
import { RankingListComponent } from './components/ranking-list/ranking-list.component';

const routes: Routes = [
  {
    path: '',
    component: RankingListComponent,
    title: 'Ranking - QuadraFC',
  },
  {
    path: 'campeonatos',
    component: CampeonatosComponent,
    title: 'Campeonatos - QuadraFC',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RankingRoutingModule {}
