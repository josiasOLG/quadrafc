import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CompartilharBairroComponent } from './components/compartilhar-bairro/compartilhar-bairro.component';

const routes: Routes = [
  {
    path: '',
    component: CompartilharBairroComponent,
    title: 'Compartilhar Bairro - QuadraFC',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BairrosRoutingModule {}
