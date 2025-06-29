import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BairrosSelectionComponent } from './components/bairros-selection/bairros-selection.component';

const routes: Routes = [
  {
    path: '',
    component: BairrosSelectionComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BairrosRoutingModule { }
