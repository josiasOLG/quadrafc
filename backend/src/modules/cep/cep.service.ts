import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { Model } from 'mongoose';
import { Bairro, BairroDocument } from '../../shared/schemas/bairro.schema';

interface CepApiResponse {
  cep: string;
  logradouro: string;
  complemento?: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia?: string;
  ddd?: string;
  siafi?: string;
  erro?: boolean;
}

interface CepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

interface CepWithBairros extends CepResponse {
  bairrosSugeridos?: string[];
  bairrosDisponiveis?: { nome: string; id: string }[];
}

@Injectable()
export class CepService {
  private readonly logger = new Logger(CepService.name);
  private readonly apiUrl = 'https://opencep.com/v1';

  constructor(@InjectModel(Bairro.name) private bairroModel: Model<BairroDocument>) {}

  /**
   * Busca informações de endereço a partir de um CEP brasileiro.
   * Se não houver bairro, busca bairros sugeridos via GeoNames
   * @param cep CEP no formato 01001000 ou 01001-000
   * @returns Dados do endereço ou null se não encontrado
   */
  async buscarCep(cep: string): Promise<CepWithBairros | null> {
    try {
      const cepLimpo = cep.replace(/\D/g, '');
      if (cepLimpo.length !== 8) {
        this.logger.warn(`CEP inválido: ${cep}`);
        return null;
      }

      const url = `${this.apiUrl}/${cepLimpo}`;
      this.logger.log(`Consultando CEP: ${cepLimpo}`);

      const response = await axios.get<CepApiResponse>(url);

      this.logger.log(`Response da API:`, JSON.stringify(response.data, null, 2));

      if (!response.data || !response.data.cep) {
        this.logger.warn(`CEP não encontrado: ${cepLimpo}`);
        return null;
      }

      const apiData = response.data;

      const cepData: CepWithBairros = {
        cep: apiData.cep,
        logradouro: apiData.logradouro || '',
        complemento: apiData.complemento || '',
        bairro: apiData.bairro || '',
        localidade: apiData.localidade || '',
        uf: apiData.uf || '',
        ibge: apiData.ibge || '',
        gia: apiData.gia || '',
        ddd: apiData.ddd || '',
        siafi: apiData.siafi || '',
      };

      if (!cepData.bairro || cepData.bairro.trim() === '') {
        this.logger.log(
          `Bairro não encontrado no CEP ${cepLimpo}, buscando bairros existentes na cidade ${cepData.localidade}/${cepData.uf}`
        );

        try {
          const bairrosExistentes = await this.bairroModel
            .find({
              cidade: { $regex: new RegExp(`^${cepData.localidade}$`, 'i') },
              estado: cepData.uf,
            })
            .select('nome')
            .limit(10)
            .exec();

          if (bairrosExistentes.length > 0) {
            cepData.bairrosDisponiveis = bairrosExistentes.map((b) => ({
              nome: b.nome,
              id: b._id.toString(),
            }));
          }
        } catch (error) {
          this.logger.error(`Erro ao buscar bairros existentes: ${error.message}`);
        }
      }

      return cepData;
    } catch (error) {
      this.logger.error(`Erro ao buscar CEP ${cep}:`, error.message);
      return null;
    }
  }

  /**
   * Normaliza o nome do bairro para comparação
   * Remove acentos, converte para minúsculas e remove caracteres especiais
   */
  private normalizarNome(nome: string): string {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Busca bairros similares para evitar duplicatas
   */
  async buscarBairrosSimilares(
    nomeBairro: string,
    cidade: string,
    estado: string
  ): Promise<Bairro[]> {
    const nomeNormalizado = this.normalizarNome(nomeBairro);

    try {
      // Busca exata primeiro
      let bairros = await this.bairroModel
        .find({
          cidade: { $regex: new RegExp(`^${cidade}$`, 'i') },
          estado: estado.toUpperCase(),
        })
        .exec();

      // Filtra por nomes similares
      const bairrosSimilares = bairros.filter((bairro) => {
        const nomeExistenteNormalizado = this.normalizarNome(bairro.nome);

        // Verifica se são exatamente iguais após normalização
        if (nomeExistenteNormalizado === nomeNormalizado) return true;

        // Verifica se um contém o outro (para casos como "Centro" e "Centro Histórico")
        if (
          nomeExistenteNormalizado.includes(nomeNormalizado) ||
          nomeNormalizado.includes(nomeExistenteNormalizado)
        )
          return true;

        // Verifica similaridade por distância Levenshtein simples
        return this.calcularSimilaridade(nomeNormalizado, nomeExistenteNormalizado) > 0.8;
      });

      return bairrosSimilares;
    } catch (error) {
      this.logger.error(`Erro ao buscar bairros similares: ${error.message}`);
      return [];
    }
  }

  /**
   * Calcula similaridade entre duas strings (algoritmo simples)
   */
  private calcularSimilaridade(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calcula distância Levenshtein entre duas strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Busca bairros por cidade para sugestões
   */
  async buscarBairrosPorCidade(
    cidade: string,
    estado: string,
    limite: number = 20
  ): Promise<{ nome: string; id: string }[]> {
    try {
      const bairros = await this.bairroModel
        .find({
          cidade: { $regex: new RegExp(`^${cidade}$`, 'i') },
          estado: estado.toUpperCase(),
        })
        .select('nome')
        .sort({ nome: 1 })
        .limit(limite)
        .exec();

      return bairros.map((b) => ({
        nome: b.nome,
        id: b._id.toString(),
      }));
    } catch (error) {
      this.logger.error(`Erro ao buscar bairros por cidade: ${error.message}`);
      return [];
    }
  }

  /**
   * Valida se um bairro pode ser criado (não existe similar)
   */
  async validarNovoBairro(
    nomeBairro: string,
    cidade: string,
    estado: string
  ): Promise<{ valido: boolean; similares: Bairro[]; sugestoes: string[] }> {
    const similares = await this.buscarBairrosSimilares(nomeBairro, cidade, estado);

    const resultado = {
      valido: similares.length === 0,
      similares,
      sugestoes: similares.map((b) => b.nome),
    };

    return resultado;
  }
}
