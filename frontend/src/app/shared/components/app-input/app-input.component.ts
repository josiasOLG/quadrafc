import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { InputTextareaModule } from 'primeng/inputtextarea';

type InputType = 'text' | 'email' | 'password' | 'number' | 'date' | 'textarea';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    InputTextModule,
    PasswordModule,
    InputNumberModule,
    CalendarModule,
    InputTextareaModule
  ],
  templateUrl: './app-input.component.html',
  styleUrl: './app-input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppInputComponent),
      multi: true
    }
  ]
})
export class AppInputComponent implements ControlValueAccessor {
  @Input() type: InputType = 'text';
  @Input() placeholder: string = '';
  @Input() label: string = '';
  @Input() disabled: boolean = false;
  @Input() required: boolean = false;
  @Input() errorMessage: string = '';
  @Input() helpText: string = '';
  @Input() icon: string = '';
  @Input() clearable: boolean = false;
  @Input() rows: number = 3; // Para textarea
  @Input() maxLength: number | null = null;
  @Input() min: number | null = null;
  @Input() max: number | null = null;

  @Output() onBlur = new EventEmitter<Event>();
  @Output() onFocus = new EventEmitter<Event>();
  @Output() onInput = new EventEmitter<any>();

  value: any = '';

  private onChange = (value: any) => {};
  private onTouched = () => {};

  get hasError(): boolean {
    return !!this.errorMessage;
  }

  get inputClasses(): string {
    const classes = ['app-input-field', 'w-full'];
    if (this.hasError) {
      classes.push('ng-invalid', 'ng-dirty');
    }
    return classes.join(' ');
  }

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  handleInput(event: any): void {
    const value = event.target ? event.target.value : event;
    this.value = value;
    this.onChange(value);
    this.onInput.emit(value);
  }

  handleBlur(event: Event): void {
    this.onTouched();
    this.onBlur.emit(event);
  }

  handleFocus(event: Event): void {
    this.onFocus.emit(event);
  }
}
