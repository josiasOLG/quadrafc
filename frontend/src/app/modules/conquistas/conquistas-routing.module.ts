import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConquistasListComponent } from './components/conquistas-list/conquistas-list.component';

const routes: Routes = [
  {
    path: '',
    component: ConquistasListComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ConquistasRoutingModule { }
