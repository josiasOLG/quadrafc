import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { JogosListComponent } from './components/jogos-list/jogos-list.component';

const routes: Routes = [
  {
    path: '',
    component: JogosListComponent,
    title: 'Jogos do Dia - QuadraFC'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class JogosRoutingModule { }
