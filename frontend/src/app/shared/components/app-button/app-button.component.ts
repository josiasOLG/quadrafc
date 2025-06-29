import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'text';
type ButtonSize = 'small' | 'normal' | 'large';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './app-button.component.html',
  styleUrl: './app-button.component.scss'
})
export class AppButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'normal';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() fullWidth: boolean = false;
  @Input() outlined: boolean = false;
  @Input() icon: string = '';
  @Input() iconPosition: 'left' | 'right' = 'left';
  @Input() type: 'button' | 'submit' = 'button';
  @Input() label: string = '';

  @Output() onClick = new EventEmitter<Event>();

  get buttonClasses(): string {
    const classes = ['app-button'];

    // Variant classes
    switch (this.variant) {
      case 'primary':
        classes.push(this.outlined ? 'p-button-outlined' : 'p-button-primary');
        break;
      case 'secondary':
        classes.push(this.outlined ? 'p-button-outlined p-button-secondary' : 'p-button-secondary');
        break;
      case 'success':
        classes.push(this.outlined ? 'p-button-outlined p-button-success' : 'p-button-success');
        break;
      case 'danger':
        classes.push(this.outlined ? 'p-button-outlined p-button-danger' : 'p-button-danger');
        break;
      case 'warning':
        classes.push(this.outlined ? 'p-button-outlined p-button-warning' : 'p-button-warning');
        break;
      case 'info':
        classes.push(this.outlined ? 'p-button-outlined p-button-info' : 'p-button-info');
        break;
      case 'text':
        classes.push('p-button-text');
        break;
    }

    // Size classes
    switch (this.size) {
      case 'small':
        classes.push('p-button-sm');
        break;
      case 'large':
        classes.push('p-button-lg');
        break;
    }

    if (this.fullWidth) {
      classes.push('w-full');
    }

    return classes.join(' ');
  }

  handleClick(event: Event): void {
    if (!this.disabled && !this.loading) {
      this.onClick.emit(event);
    }
  }
}
