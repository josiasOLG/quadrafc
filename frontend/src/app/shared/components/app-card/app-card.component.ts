import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule, CardModule],
  templateUrl: './app-card.component.html',
  styleUrl: './app-card.component.scss'
})
export class AppCardComponent {
  @Input() header: string = '';
  @Input() subheader: string = '';
  @Input() footer: string = '';
  @Input() showHeader: boolean = true;
  @Input() showFooter: boolean = false;
  @Input() elevation: boolean = true;
  @Input() padding: 'none' | 'small' | 'medium' | 'large' = 'medium';
  @Input() fullHeight: boolean = false;

  get cardClasses(): string {
    const classes = ['app-card'];

    if (!this.elevation) {
      classes.push('no-elevation');
    }

    classes.push(`padding-${this.padding}`);

    if (this.fullHeight) {
      classes.push('h-full');
    }

    return classes.join(' ');
  }
}
