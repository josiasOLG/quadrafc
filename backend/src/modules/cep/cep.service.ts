import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class CepService {
  private readonly logger = new Logger(CepService.name);
  private readonly apiUrl = 'https://viacep.com.br/ws';

  /**
   * Busca informações de endereço a partir de um CEP brasileiro.
   * @param cep CEP no formato 01001000 ou 01001-000
   * @returns Dados do endereço ou null se não encontrado
   */
  async buscarCep(cep: string): Promise<any> {
    try {
      // Remove caracteres não numéricos
      const cepLimpo = cep.replace(/\D/g, '');
      if (cepLimpo.length !== 8) {
        this.logger.warn(`CEP inválido: ${cep}`);
        return null;
      }
      const url = `${this.apiUrl}/${cepLimpo}/json/`;
      this.logger.log(`Consultando CEP: ${cepLimpo}`);
      const response = await axios.get(url);
      if (response.data.erro) {
        this.logger.warn(`CEP não encontrado: ${cepLimpo}`);
        return null;
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Erro ao buscar CEP ${cep}:`, error.message);
      return null;
    }
  }
}
