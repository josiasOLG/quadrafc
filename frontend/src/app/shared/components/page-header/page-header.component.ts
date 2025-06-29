import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';
import { User } from '../../schemas/user.schema';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyFormatPipe
  ],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss'
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() icon = 'pi pi-home';
  @Input() user: User | null = null;
  @Input() showUserStats = true;
  @Input() customClass = '';
}
