import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RankingListComponent } from './components/ranking-list/ranking-list.component';

const routes: Routes = [
  {
    path: '',
    component: RankingListComponent,
    title: 'Ranking - QuadraFC'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RankingRoutingModule { }
