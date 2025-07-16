import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { isStatusValido, obterDetalhesStatus } from '../../shared/enums/jogo-status.enum';
import { formatarDataBrasil } from '../../shared/utils/timezone.util';

@Injectable()
export class FootballApiService {
  private readonly logger = new Logger(FootballApiService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('FOOTBALL_API_URL');
    this.apiKey = this.configService.get<string>('FOOTBALL_API_KEY');
  }

  async getJogosPorData(data: string) {
    try {
      this.logger.log(`Buscando jogos para a data: ${data}`);
      this.logger.log(`URL da API: ${this.apiUrl}`);
      this.logger.log(`API Key configurada: ${this.apiKey ? 'Sim' : 'Não'}`);

      // Validar se a data está dentro do limite permitido (até 30 dias no futuro)
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() + 30);
      const dataBusca = new Date(data);

      if (dataBusca > dataLimite) {
        this.logger.warn(`Data ${data} está além do limite de 30 dias. Não buscando jogos.`);
        return {
          filters: { date: data },
          resultSet: { count: 0 },
          matches: [],
        };
      }

      // Primeira tentativa: buscar jogos da data solicitada até 30 dias no futuro
      let resultado = await this.buscarJogosEmRange(data, 30);

      // Se não encontrou jogos, tenta buscar em competições específicas
      if (resultado.matches.length === 0) {
        this.logger.log(
          'Nenhum jogo encontrado na busca geral, tentando competições específicas...'
        );
        resultado = await this.buscarJogosCompeticoesBrasileiras(data);
      }

      // NÃO MAIS CRIA JOGOS FAKE - apenas retorna resultado vazio se não encontrou
      if (resultado.matches.length === 0) {
        this.logger.log('Nenhum jogo real encontrado para a data solicitada.');
        return {
          filters: { date: data },
          resultSet: { count: 0 },
          matches: [],
        };
      }

      this.logger.log(`Jogos reais encontrados: ${resultado.matches.length}`);
      return resultado;
    } catch (error) {
      this.logger.error('Erro ao buscar jogos por data:', error.message);
      if (error.response) {
        this.logger.error('Resposta de erro:', error.response.data);
        this.logger.error('Status:', error.response.status);
      }

      // Em caso de erro, retorna resultado vazio ao invés de jogos fake
      this.logger.log('Erro na API, retornando resultado vazio.');
      return {
        filters: { date: data },
        resultSet: { count: 0 },
        matches: [],
      };
    }
  }

  async listarCompeticoes() {
    try {
      const response = await axios.get(`${this.apiUrl}/competitions`, {
        headers: {
          'X-Auth-Token': this.apiKey,
        },
      });

      return response.data.competitions || [];
    } catch (error) {
      this.logger.error('Erro ao listar competições:', error.message);
      return [];
    }
  }

  async getJogoDetalhes(jogoId: number) {
    try {
      const response = await axios.get(`${this.apiUrl}/matches/${jogoId}`, {
        headers: {
          'X-Auth-Token': this.apiKey,
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Erro ao buscar detalhes do jogo ${jogoId}:`, error.message);
      throw error;
    }
  }

  transformarJogosAPI(jogosAPI: any[]): any[] {
    return jogosAPI.map((jogo) => {
      const statusOriginal = jogo.status;
      const statusDetalhes = obterDetalhesStatus(statusOriginal);

      if (!isStatusValido(statusOriginal)) {
        this.logger.warn(
          `Status inválido encontrado: ${statusOriginal}. Usando 'agendado' como padrão.`
        );
      }

      const dataOriginal = new Date(jogo.utcDate);
      const dataAjustada = new Date(dataOriginal.getTime() - 60 * 60 * 1000);

      return {
        codigoAPI: jogo.id,
        timeA: {
          nome: jogo.homeTeam.name,
          escudo: jogo.homeTeam.crest || '',
        },
        timeB: {
          nome: jogo.awayTeam.name,
          escudo: jogo.awayTeam.crest || '',
        },
        data: dataAjustada.toISOString(),
        campeonato: jogo.competition?.name || 'Sem Campeonato',
        campeonatoStartDate: jogo.season?.startDate || null,
        campeonatoEndDate: jogo.season?.endDate || null,
        status: statusDetalhes.traduzido,
        _statusOriginalAPI: statusOriginal,
        _statusDetalhes: {
          podeAceitar: statusDetalhes.podeAceitar,
          jogoFinalizado: statusDetalhes.jogoFinalizado,
          descricao: statusDetalhes.descricao,
        },
        resultado:
          jogo.score?.fullTime &&
          jogo.score.fullTime.home !== null &&
          jogo.score.fullTime.away !== null
            ? {
                timeA: jogo.score.fullTime.home,
                timeB: jogo.score.fullTime.away,
              }
            : null,
      };
    });
  }

  // Lista simplificada de times brasileiros (principais clubes)
  private timesBrasileiros = [
    'Flamengo',
    'Palmeiras',
    'São Paulo',
    'Corinthians',
    'Santos',
    'Grêmio',
    'Internacional',
    'Fluminense',
    'Atlético Mineiro',
    'Cruzeiro',
    'Botafogo',
    'Vasco da Gama',
    'Athletico Paranaense',
    'Bahia',
    'Fortaleza',
    'Bragantino',
  ];

  private isTimeBrasileiro(nomeTime: string): boolean {
    if (!nomeTime) return false;
    const nomeNormalizado = nomeTime.toLowerCase();
    return this.timesBrasileiros.some(
      (time) =>
        nomeNormalizado.includes(time.toLowerCase()) || time.toLowerCase().includes(nomeNormalizado)
    );
  }

  // Método para buscar jogos de times brasileiros em todas as competições
  async buscarJogosBrasileirosHoje(data?: string) {
    const dataBusca = data || new Date().toISOString().split('T')[0];

    try {
      this.logger.log('Buscando todas as competições ativas...');

      // Primeiro, lista todas as competições para ver quais estão ativas
      const competicoes = await this.listarCompeticoes();
      this.logger.log(`Competições encontradas: ${competicoes.length}`);

      // Busca jogos de hoje em todas as competições
      const response = await axios.get(`${this.apiUrl}/matches`, {
        headers: {
          'X-Auth-Token': this.apiKey,
        },
        params: {
          dateFrom: dataBusca,
          dateTo: dataBusca,
        },
      });

      const todosJogos = response.data.matches || [];
      this.logger.log(`Total de jogos encontrados hoje: ${todosJogos.length}`);

      // Log de alguns jogos para debug
      if (todosJogos.length > 0) {
        this.logger.log('Primeiros 3 jogos encontrados:');
        todosJogos.slice(0, 3).forEach((jogo, index) => {
          this.logger.log(
            `${index + 1}. ${jogo.homeTeam?.name} vs ${jogo.awayTeam?.name} - ${jogo.competition?.name}`
          );
        });
      }

      // Filtra apenas jogos com times brasileiros
      const jogosBrasileiros = todosJogos.filter((jogo) => {
        const timeCasaBrasileiro = this.isTimeBrasileiro(jogo.homeTeam?.name);
        const timeVisitanteBrasileiro = this.isTimeBrasileiro(jogo.awayTeam?.name);
        const temTimeBrasileiro = timeCasaBrasileiro || timeVisitanteBrasileiro;

        if (temTimeBrasileiro) {
          this.logger.log(
            `Jogo brasileiro encontrado: ${jogo.homeTeam?.name} vs ${jogo.awayTeam?.name} - ${jogo.competition?.name}`
          );
        }

        return temTimeBrasileiro;
      });

      this.logger.log(`Jogos com times brasileiros: ${jogosBrasileiros.length}`);

      return {
        ...response.data,
        matches: jogosBrasileiros,
      };
    } catch (error) {
      this.logger.error('Erro ao buscar jogos brasileiros:', error.message);
      throw error;
    }
  }

  // Método simplificado para buscar jogos de times brasileiros em competições específicas
  async buscarJogosCompeticoesBrasileiras(data: string) {
    try {
      const competicoesBrasileiras = ['BSA', 'CLI', 'CSA'];
      let todosJogos = [];

      for (const competicao of competicoesBrasileiras) {
        try {
          const response = await axios.get(`${this.apiUrl}/competitions/${competicao}/matches`, {
            headers: {
              'X-Auth-Token': this.apiKey,
            },
            params: {
              dateFrom: data,
              dateTo: data,
            },
          });

          const jogosCompetição = response.data.matches || [];
          todosJogos = [...todosJogos, ...jogosCompetição];
        } catch (error) {
          this.logger.warn(`Erro ao buscar competição ${competicao}:`, error.message);
        }
      }

      // Filtra jogos com times brasileiros
      const jogosBrasileiros = todosJogos.filter((jogo) => {
        const timeCasaBrasileiro = this.isTimeBrasileiro(jogo.homeTeam?.name);
        const timeVisitanteBrasileiro = this.isTimeBrasileiro(jogo.awayTeam?.name);
        return timeCasaBrasileiro || timeVisitanteBrasileiro;
      });

      return {
        filters: { dateFrom: data, dateTo: data },
        resultSet: { count: jogosBrasileiros.length },
        matches: jogosBrasileiros,
      };
    } catch (error) {
      this.logger.error('Erro ao buscar jogos em competições brasileiras:', error.message);
      throw error;
    }
  }

  // Método para buscar jogos em um range de datas (da data inicial até X dias no futuro)
  // IMPORTANTE: A API football-data.org só permite buscar até 10 dias por request
  async buscarJogosEmRange(dataInicial: string, diasNoFuturo: number = 30) {
    const LIMITE_DIAS_POR_REQUEST = 10; // Limite da API
    const todosJogosRelevantes = [];
    let dataAtual = new Date(dataInicial);
    const dataFinal = new Date(dataInicial);
    dataFinal.setDate(dataFinal.getDate() + diasNoFuturo);

    this.logger.log(
      `Buscando jogos de ${dataInicial} até ${dataFinal.toISOString().split('T')[0]} (${diasNoFuturo} dias)`
    );
    this.logger.log(
      'Dividindo em múltiplas chamadas de até 10 dias cada para respeitar limite da API...'
    );

    let tentativa = 1;

    while (dataAtual < dataFinal) {
      // Calcula o fim deste pedaço (máximo 10 dias ou até a data final)
      const dataFimPedaco = new Date(dataAtual);
      dataFimPedaco.setDate(dataAtual.getDate() + LIMITE_DIAS_POR_REQUEST - 1);

      // Se ultrapassar a data final, ajusta para a data final
      if (dataFimPedaco > dataFinal) {
        dataFimPedaco.setTime(dataFinal.getTime() - 24 * 60 * 60 * 1000); // Um dia antes para não ultrapassar
      }

      const dataInicioStr = dataAtual.toISOString().split('T')[0];
      const dataFimStr = dataFimPedaco.toISOString().split('T')[0];

      try {
        this.logger.log(
          `Tentativa ${tentativa}: Buscando jogos de ${dataInicioStr} até ${dataFimStr}`
        );

        const response = await axios.get(`${this.apiUrl}/matches`, {
          headers: {
            'X-Auth-Token': this.apiKey,
          },
          params: {
            dateFrom: dataInicioStr,
            dateTo: dataFimStr,
          },
        });

        const jogosEncontrados = response.data.matches || [];
        this.logger.log(
          `Tentativa ${tentativa}: ${jogosEncontrados.length} jogos encontrados no período`
        );

        // Filtra jogos de TODAS as competições importantes (não apenas brasileiros)
        const jogosRelevantes = jogosEncontrados.filter((jogo) => {
          // Times brasileiros
          const timeCasaBrasileiro = this.isTimeBrasileiro(jogo.homeTeam?.name);
          const timeVisitanteBrasileiro = this.isTimeBrasileiro(jogo.awayTeam?.name);
          const temTimeBrasileiro = timeCasaBrasileiro || timeVisitanteBrasileiro;

          // Competições importantes que sempre incluímos (independente de times)
          const competicoesImportantes = [
            'fifa world cup',
            'fifa club world cup',
            'mundial de clubes',
            'world cup',
            'copa libertadores',
            'uefa champions league',
            'uefa europa league',
            'copa america',
            'euros',
            'european championship',
            'premier league',
            'la liga',
            'primera division',
            'serie a',
            'bundesliga',
            'ligue 1',
            'championship',
            'eredivisie',
            'primeira liga',
          ];

          const competicaoImportante = competicoesImportantes.some((comp) =>
            jogo.competition?.name?.toLowerCase().includes(comp.toLowerCase())
          );

          // Inclui se: tem time brasileiro OU é competição importante
          const jogoRelevante = temTimeBrasileiro || competicaoImportante;

          if (jogoRelevante) {
            const tipo = temTimeBrasileiro ? 'brasileiro' : 'competição importante';
            const dataFormatadaBrasil = formatarDataBrasil(jogo.utcDate, 'dd/MM/yyyy HH:mm');
            this.logger.log(
              `Jogo ${tipo} encontrado: ${jogo.homeTeam?.name} vs ${jogo.awayTeam?.name} - ${jogo.competition?.name} (${dataFormatadaBrasil})`
            );
          }

          return jogoRelevante;
        });

        todosJogosRelevantes.push(...jogosRelevantes);
        this.logger.log(
          `Tentativa ${tentativa}: ${jogosRelevantes.length} jogos relevantes adicionados`
        );

        // Pequena pausa entre requests para ser gentil com a API
        if (dataFimPedaco < dataFinal) {
          await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms de pausa
        }
      } catch (error) {
        this.logger.error(
          `Erro na tentativa ${tentativa} (${dataInicioStr} - ${dataFimStr}):`,
          error.message
        );

        // Se é erro 400, pode ser que ainda esteja ultrapassando o limite
        if (error.response?.status === 400) {
          this.logger.warn(`Erro 400 na tentativa ${tentativa}, pulando este período...`);
        } else {
          // Para outros tipos de erro, relança para que o método pai possa tratar
          this.logger.error(
            `Erro não recuperável na tentativa ${tentativa}, continuando com outros períodos...`
          );
        }
      }

      // Avança para o próximo pedaço
      dataAtual.setDate(dataAtual.getDate() + LIMITE_DIAS_POR_REQUEST);
      tentativa++;
    }

    this.logger.log(
      `Busca completa finalizada. Total de ${todosJogosRelevantes.length} jogos relevantes encontrados em ${tentativa - 1} chamadas`
    );

    // Se não encontrou jogos suficientes, tenta buscar em todas as competições específicas
    if (todosJogosRelevantes.length === 0) {
      this.logger.log(
        'Nenhum jogo encontrado na busca geral, tentando buscar em todas as competições...'
      );
      try {
        const resultadoCompeticoes = await this.buscarJogosTodasCompeticoes(
          dataInicial,
          diasNoFuturo
        );
        this.logger.log(
          `Encontrados ${resultadoCompeticoes.matches.length} jogos em competições específicas`
        );
        return resultadoCompeticoes;
      } catch (error) {
        this.logger.warn('Erro ao buscar em competições específicas:', error.message);
      }
    }

    // Retorna no mesmo formato que a API original
    return {
      filters: {
        dateFrom: dataInicial,
        dateTo: dataFinal.toISOString().split('T')[0],
      },
      resultSet: { count: todosJogosRelevantes.length },
      matches: todosJogosRelevantes,
    };
  }

  // Método melhorado para buscar jogos por data com opção de organizar por campeonatos
  async getJogosPorDataComCampeonatos(
    data: string,
    organizarPorCampeonatos: boolean = false,
    diasNoFuturo: number = 30
  ) {
    try {
      this.logger.log(
        `Buscando jogos para a data: ${data} ${organizarPorCampeonatos ? '(organizados por campeonatos)' : ''} até ${diasNoFuturo} dias no futuro`
      );

      // Validar se a data está dentro do limite permitido (até 30 dias no futuro)
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() + 30);
      const dataBusca = new Date(data);

      if (dataBusca > dataLimite) {
        this.logger.warn(`Data ${data} está além do limite de 30 dias. Não buscando jogos.`);
        return organizarPorCampeonatos
          ? {
              totalCampeonatos: 0,
              totalJogos: 0,
              campeonatos: [],
              periodo: { dataInicial: data, dataFinal: data },
            }
          : { filters: { date: data }, resultSet: { count: 0 }, matches: [] };
      }

      if (organizarPorCampeonatos) {
        // Retorna jogos organizados por campeonatos
        return await this.buscarJogosEmRange(data, diasNoFuturo);
      } else {
        // Comportamento original
        let resultado = await this.buscarJogosEmRange(data, diasNoFuturo);

        if (resultado.matches.length === 0) {
          this.logger.log(
            'Nenhum jogo encontrado na busca geral, tentando competições específicas...'
          );
          resultado = await this.buscarJogosCompeticoesBrasileiras(data);
        }

        if (resultado.matches.length === 0) {
          this.logger.log('Nenhum jogo real encontrado para a data solicitada.');
          return {
            filters: { date: data },
            resultSet: { count: 0 },
            matches: [],
          };
        }

        this.logger.log(`Jogos reais encontrados: ${resultado.matches.length}`);
        return resultado;
      }
    } catch (error) {
      this.logger.error('Erro ao buscar jogos por data:', error.message);
      if (error.response) {
        this.logger.error('Resposta de erro:', error.response.data);
        this.logger.error('Status:', error.response.status);
      }

      // Em caso de erro, retorna resultado vazio
      this.logger.log('Erro na API, retornando resultado vazio.');
      return organizarPorCampeonatos
        ? {
            totalCampeonatos: 0,
            totalJogos: 0,
            campeonatos: [],
            periodo: { dataInicial: data, dataFinal: data },
          }
        : { filters: { date: data }, resultSet: { count: 0 }, matches: [] };
    }
  }

  // Método para buscar jogos de TODAS as competições disponíveis
  async buscarJogosTodasCompeticoes(dataInicial: string, diasNoFuturo: number = 10) {
    try {
      this.logger.log('Buscando todas as competições disponíveis na API...');

      // Primeiro, lista todas as competições disponíveis
      const competicoes = await this.listarCompeticoes();
      this.logger.log(`${competicoes.length} competições encontradas na API`);

      const todosJogos = [];
      const dataFim = new Date(dataInicial);
      dataFim.setDate(dataFim.getDate() + diasNoFuturo);
      const dataFimStr = dataFim.toISOString().split('T')[0];

      // Busca jogos em cada competição
      for (const competicao of competicoes) {
        try {
          this.logger.log(`Buscando jogos na competição: ${competicao.name} (${competicao.code})`);

          const response = await axios.get(
            `${this.apiUrl}/competitions/${competicao.code}/matches`,
            {
              headers: {
                'X-Auth-Token': this.apiKey,
              },
              params: {
                dateFrom: dataInicial,
                dateTo: dataFimStr,
              },
            }
          );

          const jogosCompetição = response.data.matches || [];
          this.logger.log(`${jogosCompetição.length} jogos encontrados em ${competicao.name}`);

          if (jogosCompetição.length > 0) {
            todosJogos.push(...jogosCompetição);
          }

          // Pausa entre requests para não sobrecarregar a API
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          this.logger.warn(`Erro ao buscar competição ${competicao.name}:`, error.message);
          // Continua com as outras competições
        }
      }

      this.logger.log(`Total de jogos encontrados em todas as competições: ${todosJogos.length}`);

      return {
        filters: {
          dateFrom: dataInicial,
          dateTo: dataFimStr,
        },
        resultSet: { count: todosJogos.length },
        matches: todosJogos,
      };
    } catch (error) {
      this.logger.error('Erro ao buscar jogos de todas as competições:', error.message);
      throw error;
    }
  }

  // Método específico para buscar TODOS os jogos (sem filtros) para sincronização global
  async buscarTodosJogosEmRange(dataInicial: string, diasNoFuturo: number = 10) {
    const dataFinal = new Date(dataInicial);
    dataFinal.setDate(dataFinal.getDate() + diasNoFuturo);
    const dataFinalStr = dataFinal.toISOString().split('T')[0];

    this.logger.log(
      `🌍 Buscando TODOS os jogos de ${dataInicial} até ${dataFinalStr} (${diasNoFuturo} dias) - SEM FILTROS`
    );

    try {
      this.logger.log(
        `🔍 Fazendo chamada direta: GET ${this.apiUrl}/matches?dateFrom=${dataInicial}&dateTo=${dataFinalStr}`
      );

      const response = await axios.get(`${this.apiUrl}/matches`, {
        headers: {
          'X-Auth-Token': this.apiKey,
        },
        params: {
          dateFrom: dataInicial,
          dateTo: dataFinalStr,
        },
      });

      const todosJogos = response.data.matches || [];
      this.logger.log(
        `✅ ${todosJogos.length} jogos encontrados de TODOS os campeonatos automaticamente`
      );

      // Log de alguns jogos para verificação
      if (todosJogos.length > 0) {
        this.logger.log(`📝 Exemplos de jogos encontrados:`);
        todosJogos.slice(0, 5).forEach((jogo, index) => {
          const dataFormatadaBrasil = formatarDataBrasil(jogo.utcDate, 'dd/MM/yyyy HH:mm');
          this.logger.log(
            `   ${index + 1}. ${jogo.homeTeam?.name} vs ${jogo.awayTeam?.name} - ${jogo.competition?.name} (${dataFormatadaBrasil})`
          );
        });
      }

      // Retorna no mesmo formato que a API original
      return {
        filters: {
          dateFrom: dataInicial,
          dateTo: dataFinalStr,
        },
        resultSet: { count: todosJogos.length },
        matches: todosJogos,
      };
    } catch (error) {
      this.logger.error(
        `❌ Erro ao buscar jogos de ${dataInicial} até ${dataFinalStr}:`,
        error.message
      );

      if (error.response) {
        this.logger.error(`Status: ${error.response.status}`);
        this.logger.error(`Dados do erro:`, error.response.data);
      }

      // Retorna resultado vazio em caso de erro
      return {
        filters: {
          dateFrom: dataInicial,
          dateTo: dataFinalStr,
        },
        resultSet: { count: 0 },
        matches: [],
      };
    }
  }

  // Novo método para buscar jogos finalizados por período
  async getJogosFinalizadosPorPeriodo(dataInicial: string, dataFinal: string): Promise<any> {
    try {
      const params = {
        dateFrom: dataInicial,
        dateTo: dataFinal,
        status: 'FINISHED',
      };

      const url = `${this.apiUrl}/matches`;
      const urlComParams = new URL(url);
      Object.keys(params).forEach((key) => urlComParams.searchParams.append(key, params[key]));
      const response = await axios.get(url, {
        headers: {
          'X-Auth-Token': this.apiKey,
        },
        params: params,
      });

      return response.data;
    } catch (error) {
      this.logger.error('Erro ao buscar jogos finalizados por período:', error.message);
      if (error.response) {
        this.logger.error('Status da resposta de erro:', error.response.status);
        this.logger.error('Headers da resposta de erro:', error.response.headers);
        this.logger.error('Dados da resposta de erro:', error.response.data);
      }
      if (error.request) {
        this.logger.error('Dados da requisição que falhou:', {
          url: error.request.url || error.config?.url,
          method: error.request.method || error.config?.method,
          headers: error.config?.headers,
          params: error.config?.params,
        });
      }
      throw error;
    }
  }
}
