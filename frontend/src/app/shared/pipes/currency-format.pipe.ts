import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyFormat',
  standalone: true
})
export class CurrencyFormatPipe implements PipeTransform {

  transform(value: number | null | undefined, currency: string = 'BRL', display: 'symbol' | 'code' | 'name' = 'symbol'): string {
    if (value === null || value === undefined || isNaN(value)) {
      return currency === 'BRL' ? 'R$ 0,00' : '0';
    }

    if (currency === 'BRL') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        currencyDisplay: display
      }).format(value);
    }

    // Para moedas virtuais do app (QuadraCoins)
    if (currency === 'QFC') {
      return `${value.toLocaleString('pt-BR')} QC`;
    }

    return value.toLocaleString('pt-BR');
  }
}
