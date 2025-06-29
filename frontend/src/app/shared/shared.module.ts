import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppButtonComponent } from './components/app-button/app-button.component';
import { AppInputComponent } from './components/app-input/app-input.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    AppButtonComponent,
    AppInputComponent
  ],
  exports: [
    AppButtonComponent,
    AppInputComponent
  ]
})
export class SharedModule { }
