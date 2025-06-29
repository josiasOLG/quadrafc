import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

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
          matches: []
        };
      }
      
      // Primeira tentativa: buscar jogos da data solicitada até 30 dias no futuro
      let resultado = await this.buscarJogosEmRange(data, 30);
      
      // Se não encontrou jogos, tenta buscar em competições específicas
      if (resultado.matches.length === 0) {
        this.logger.log('Nenhum jogo encontrado na busca geral, tentando competições específicas...');
        resultado = await this.buscarJogosCompeticoesBrasileiras(data);
      }
      
      // NÃO MAIS CRIA JOGOS FAKE - apenas retorna resultado vazio se não encontrou
      if (resultado.matches.length === 0) {
        this.logger.log('Nenhum jogo real encontrado para a data solicitada.');
        return {
          filters: { date: data },
          resultSet: { count: 0 },
          matches: []
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
        matches: []
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
    return jogosAPI.map(jogo => ({
      codigoAPI: jogo.id,
      timeA: {
        nome: jogo.homeTeam.name,
        escudo: jogo.homeTeam.crest || '',
      },
      timeB: {
        nome: jogo.awayTeam.name,
        escudo: jogo.awayTeam.crest || '',
      },
      data: new Date(jogo.utcDate),
      campeonato: jogo.competition?.name || 'Brasileirão Serie A',
      status: jogo.status === 'FINISHED' ? 'encerrado' : 'aberto',
      resultado: jogo.status === 'FINISHED' && jogo.score?.fullTime ? {
        timeA: jogo.score.fullTime.home,
        timeB: jogo.score.fullTime.away,
      } : null,
    }));
  }

  // Lista de times brasileiros conhecidos (principais clubes)
  private timesBrasileiros = [
    // Times do Brasileirão Serie A
    'Flamengo', 'Palmeiras', 'São Paulo', 'Corinthians', 'Santos', 'Grêmio', 
    'Internacional', 'Fluminense', 'Atlético Mineiro', 'Cruzeiro', 'Botafogo',
    'Vasco da Gama', 'Athletico Paranaense', 'Bahia', 'Sport Recife', 'Ceará',
    'Fortaleza', 'Goiás', 'Coritiba', 'Avaí', 'Juventude', 'América Mineiro',
    'Atlético Goianiense', 'Bragantino', 'Cuiabá', 'Chapecoense',
    
    // Times históricos e outros importantes
    'Atlético-MG', 'Atlético Mineiro', 'Atlético-PR', 'Athletico-PR',
    'Internacional', 'Inter', 'Grêmio FBPA', 'Sport Club do Recife',
    'Clube de Regatas do Flamengo', 'Sociedade Esportiva Palmeiras',
    'São Paulo FC', 'Sport Club Corinthians Paulista',
    
    // Variações de nomes que podem aparecer na API
    'CR Flamengo', 'SE Palmeiras', 'Sao Paulo', 'SC Corinthians Paulista',
    'Santos FC', 'Gremio', 'SC Internacional', 'Fluminense FC',
    'Atletico Mineiro', 'Cruzeiro EC', 'Botafogo FR', 'CR Vasco da Gama'
  ];

  private isTimeBrasileiro(nomeTime: string): boolean {
    if (!nomeTime) return false;
    
    // Converte para lowercase para comparação mais flexível
    const nomeNormalizado = nomeTime.toLowerCase();
    
    // Verifica se o nome do time está na lista ou contém palavras-chave brasileiras
    return this.timesBrasileiros.some(time => 
      nomeNormalizado.includes(time.toLowerCase()) || 
      time.toLowerCase().includes(nomeNormalizado)
    ) || 
    // Verifica palavras-chave que indicam times brasileiros
    nomeNormalizado.includes('brasil') ||
    nomeNormalizado.includes('brazil') ||
    nomeNormalizado.includes('rio') ||
    nomeNormalizado.includes('são paulo') ||
    nomeNormalizado.includes('sao paulo') ||
    nomeNormalizado.includes('minas') ||
    nomeNormalizado.includes('bahia') ||
    nomeNormalizado.includes('ceará') ||
    nomeNormalizado.includes('goiás');
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
          this.logger.log(`${index + 1}. ${jogo.homeTeam?.name} vs ${jogo.awayTeam?.name} - ${jogo.competition?.name}`);
        });
      }
      
      // Filtra apenas jogos com times brasileiros
      const jogosBrasileiros = todosJogos.filter(jogo => {
        const timeCasaBrasileiro = this.isTimeBrasileiro(jogo.homeTeam?.name);
        const timeVisitanteBrasileiro = this.isTimeBrasileiro(jogo.awayTeam?.name);
        const temTimeBrasileiro = timeCasaBrasileiro || timeVisitanteBrasileiro;
        
        if (temTimeBrasileiro) {
          this.logger.log(`Jogo brasileiro encontrado: ${jogo.homeTeam?.name} vs ${jogo.awayTeam?.name} - ${jogo.competition?.name}`);
        }
        
        return temTimeBrasileiro;
      });

      this.logger.log(`Jogos com times brasileiros: ${jogosBrasileiros.length}`);
      
      return {
        ...response.data,
        matches: jogosBrasileiros
      };
    } catch (error) {
      this.logger.error('Erro ao buscar jogos brasileiros:', error.message);
      throw error;
    }
  }

  // Método para buscar jogos de times brasileiros em competições específicas
  async buscarJogosCompeticoesBrasileiras(data: string) {
    try {
      // IDs de competições que frequentemente têm times brasileiros
      const competicoesBrasileiras = [
        'BSA', // Brasileirão Serie A
        'CL',  // Champions League (times brasileiros às vezes participam de amistosos)
        'CLI', // Copa Libertadores (se disponível)
        'CSA', // Copa Sul-Americana (se disponível)
        'WC',  // Copa do Mundo de Clubes
      ];

      let todosJogos = [];

      for (const competicao of competicoesBrasileiras) {
        try {
          this.logger.log(`Buscando jogos na competição: ${competicao}`);
          
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
          this.logger.log(`Jogos encontrados em ${competicao}: ${jogosCompetição.length}`);
          
          todosJogos = [...todosJogos, ...jogosCompetição];
        } catch (error) {
          this.logger.warn(`Erro ao buscar competição ${competicao}:`, error.message);
          // Continua com as outras competições
        }
      }

      // Filtra jogos com times brasileiros
      const jogosBrasileiros = todosJogos.filter(jogo => {
        const timeCasaBrasileiro = this.isTimeBrasileiro(jogo.homeTeam?.name);
        const timeVisitanteBrasileiro = this.isTimeBrasileiro(jogo.awayTeam?.name);
        return timeCasaBrasileiro || timeVisitanteBrasileiro;
      });

      this.logger.log(`Total de jogos brasileiros encontrados: ${jogosBrasileiros.length}`);

      return {
        filters: { dateFrom: data, dateTo: data },
        resultSet: { count: jogosBrasileiros.length },
        matches: jogosBrasileiros
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
    
    this.logger.log(`Buscando jogos de ${dataInicial} até ${dataFinal.toISOString().split('T')[0]} (${diasNoFuturo} dias)`);
    this.logger.log('Dividindo em múltiplas chamadas de até 10 dias cada para respeitar limite da API...');
    
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
        this.logger.log(`Tentativa ${tentativa}: Buscando jogos de ${dataInicioStr} até ${dataFimStr}`);
        
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
        this.logger.log(`Tentativa ${tentativa}: ${jogosEncontrados.length} jogos encontrados no período`);
        
        // Filtra jogos de TODAS as competições importantes (não apenas brasileiros)
        const jogosRelevantes = jogosEncontrados.filter(jogo => {
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
            'primeira liga'
          ];
          
          const competicaoImportante = competicoesImportantes.some(comp => 
            jogo.competition?.name?.toLowerCase().includes(comp.toLowerCase())
          );
          
          // Inclui se: tem time brasileiro OU é competição importante
          const jogoRelevante = temTimeBrasileiro || competicaoImportante;
          
          if (jogoRelevante) {
            const tipo = temTimeBrasileiro ? 'brasileiro' : 'competição importante';
            this.logger.log(`Jogo ${tipo} encontrado: ${jogo.homeTeam?.name} vs ${jogo.awayTeam?.name} - ${jogo.competition?.name} (${jogo.utcDate})`);
          }
          
          return jogoRelevante;
        });
        
        todosJogosRelevantes.push(...jogosRelevantes);
        this.logger.log(`Tentativa ${tentativa}: ${jogosRelevantes.length} jogos relevantes adicionados`);
        
        // Pequena pausa entre requests para ser gentil com a API
        if (dataFimPedaco < dataFinal) {
          await new Promise(resolve => setTimeout(resolve, 500)); // 500ms de pausa
        }
        
      } catch (error) {
        this.logger.error(`Erro na tentativa ${tentativa} (${dataInicioStr} - ${dataFimStr}):`, error.message);
        
        // Se é erro 400, pode ser que ainda esteja ultrapassando o limite
        if (error.response?.status === 400) {
          this.logger.warn(`Erro 400 na tentativa ${tentativa}, pulando este período...`);
        } else {
          // Para outros tipos de erro, relança para que o método pai possa tratar
          this.logger.error(`Erro não recuperável na tentativa ${tentativa}, continuando com outros períodos...`);
        }
      }
      
      // Avança para o próximo pedaço
      dataAtual.setDate(dataAtual.getDate() + LIMITE_DIAS_POR_REQUEST);
      tentativa++;
    }
    
    this.logger.log(`Busca completa finalizada. Total de ${todosJogosRelevantes.length} jogos relevantes encontrados em ${tentativa - 1} chamadas`);
    
    // Se não encontrou jogos suficientes, tenta buscar em todas as competições específicas
    if (todosJogosRelevantes.length === 0) {
      this.logger.log('Nenhum jogo encontrado na busca geral, tentando buscar em todas as competições...');
      try {
        const resultadoCompeticoes = await this.buscarJogosTodasCompeticoes(dataInicial, diasNoFuturo);
        this.logger.log(`Encontrados ${resultadoCompeticoes.matches.length} jogos em competições específicas`);
        return resultadoCompeticoes;
      } catch (error) {
        this.logger.warn('Erro ao buscar em competições específicas:', error.message);
      }
    }
    
    // Retorna no mesmo formato que a API original
    return {
      filters: { 
        dateFrom: dataInicial,
        dateTo: dataFinal.toISOString().split('T')[0]
      },
      resultSet: { count: todosJogosRelevantes.length },
      matches: todosJogosRelevantes
    };
  }

  // Método para buscar jogos separados por campeonatos específicos
  async buscarJogosPorCampeonatos(dataInicial: string, diasNoFuturo: number = 30) {
    const campeonatosEspecificos = {
      'Mundial de Clubes FIFA': ['CWC', 'FWC', 'CLUB_WORLD_CUP'],
      'Copa do Mundo FIFA': ['WC', 'WORLD_CUP'],
      'Brasileirão Serie A': ['BSA', 'BRA', 'BRASIL_SERIE_A'],
      'Copa Libertadores': ['CLI', 'CL', 'LIBERTADORES'],
      'Copa Sul-Americana': ['CSA', 'SUDAMERICANA'],
      'Copa América': ['CA', 'COPA_AMERICA'],
      'Campeonato Carioca': ['CARIOCA', 'RJ'],
      'Copa do Brasil': ['CDB', 'COPA_BRASIL'],
      'Campeonato Paulista': ['PAULISTA', 'SP'],
      'Campeonato Mineiro': ['MINEIRO', 'MG'],
      'Campeonato Gaúcho': ['GAUCHO', 'RS'],
      'Liga dos Campeões UEFA': ['CL', 'UCL', 'CHAMPIONS_LEAGUE'],
      'Liga Europa UEFA': ['UEL', 'EUROPA_LEAGUE'],
      'Premier League': ['PL', 'PREMIER_LEAGUE'],
      'La Liga': ['PD', 'PRIMERA_DIVISION'],
      'Serie A Italiana': ['SA', 'SERIE_A'],
      'Bundesliga': ['BL1', 'BUNDESLIGA'],
      'Ligue 1': ['FL1', 'LIGUE_1'],
      'Eurocopa': ['EC', 'EUROS', 'EUROPEAN_CHAMPIONSHIP'],
      'Nations League': ['UNL', 'NATIONS_LEAGUE']
    };

    const jogosPorCampeonato = {};
    
    this.logger.log(`Buscando jogos por campeonatos de ${dataInicial} até ${diasNoFuturo} dias no futuro`);
    
    // Primeiro, busca todos os jogos usando o método de range
    const todosJogos = await this.buscarJogosEmRange(dataInicial, diasNoFuturo);
    
    // Categoriza os jogos por campeonato
    for (const jogo of todosJogos.matches) {
      const nomeCampeonato = jogo.competition?.name || 'Outros';
      const categorizacao = this.categorizarCampeonato(nomeCampeonato);
      
      if (!jogosPorCampeonato[categorizacao]) {
        jogosPorCampeonato[categorizacao] = {
          nome: categorizacao,
          jogos: [],
          total: 0
        };
      }
      
      jogosPorCampeonato[categorizacao].jogos.push(jogo);
      jogosPorCampeonato[categorizacao].total++;
    }
    
    // Também busca em competições específicas que podem não ter aparecido na busca geral
    for (const [nomeCampeonato, codigosAPI] of Object.entries(campeonatosEspecificos)) {
      for (const codigoAPI of codigosAPI) {
        try {
          const jogosCompetição = await this.buscarJogosCompetição(codigoAPI, dataInicial, diasNoFuturo);
          
          if (jogosCompetição.length > 0) {
            if (!jogosPorCampeonato[nomeCampeonato]) {
              jogosPorCampeonato[nomeCampeonato] = {
                nome: nomeCampeonato,
                jogos: [],
                total: 0
              };
            }
            
            // Evita duplicatas verificando se o jogo já existe
            for (const jogo of jogosCompetição) {
              const jaExiste = jogosPorCampeonato[nomeCampeonato].jogos.some(
                jogoExistente => jogoExistente.id === jogo.id
              );
              
              if (!jaExiste) {
                jogosPorCampeonato[nomeCampeonato].jogos.push(jogo);
                jogosPorCampeonato[nomeCampeonato].total++;
              }
            }
          }
        } catch (error) {
          this.logger.warn(`Erro ao buscar competição ${codigoAPI} (${nomeCampeonato}):`, error.message);
        }
      }
    }
    
    // Filtra apenas campeonatos com jogos
    const campeonatosComJogos = Object.values(jogosPorCampeonato).filter(
      (campeonato: any) => campeonato.total > 0
    );
    
    // Ordena por relevância (campeonatos brasileiros primeiro)
    campeonatosComJogos.sort((a: any, b: any) => {
      const prioridadeBrasileiros = ['Brasileirão Serie A', 'Copa do Brasil', 'Campeonato Carioca', 'Copa Libertadores'];
      const prioridadeA = prioridadeBrasileiros.indexOf(a.nome);
      const prioridadeB = prioridadeBrasileiros.indexOf(b.nome);
      
      if (prioridadeA !== -1 && prioridadeB !== -1) {
        return prioridadeA - prioridadeB;
      }
      if (prioridadeA !== -1) return -1;
      if (prioridadeB !== -1) return 1;
      
      return a.nome.localeCompare(b.nome);
    });
    
    this.logger.log(`Jogos categorizados em ${campeonatosComJogos.length} campeonatos`);
    campeonatosComJogos.forEach((campeonato: any) => {
      this.logger.log(`- ${campeonato.nome}: ${campeonato.total} jogos`);
    });
    
    return {
      totalCampeonatos: campeonatosComJogos.length,
      totalJogos: campeonatosComJogos.reduce((acc: number, c: any) => acc + c.total, 0),
      campeonatos: campeonatosComJogos,
      periodo: {
        dataInicial,
        dataFinal: new Date(new Date(dataInicial).getTime() + diasNoFuturo * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    };
  }

  // Método auxiliar para categorizar campeonatos
  private categorizarCampeonato(nomeCampeonato: string): string {
    const nome = nomeCampeonato.toLowerCase();
    
    // Mundial e Copa do Mundo
    if (nome.includes('fifa world cup') || nome.includes('world cup') || nome.includes('copa do mundo')) {
      return 'Copa do Mundo FIFA';
    }
    if (nome.includes('fifa club world cup') || nome.includes('club world cup') || 
        nome.includes('mundial de clubes') || nome.includes('mundial club')) {
      return 'Mundial de Clubes FIFA';
    }
    
    // Campeonatos brasileiros
    if (nome.includes('brasileirão') || nome.includes('brasileiro') || nome.includes('serie a')) {
      return 'Brasileirão Serie A';
    }
    if (nome.includes('carioca') || nome.includes('rio de janeiro')) {
      return 'Campeonato Carioca';
    }
    if (nome.includes('paulista') || nome.includes('são paulo')) {
      return 'Campeonato Paulista';
    }
    if (nome.includes('mineiro') || nome.includes('minas gerais')) {
      return 'Campeonato Mineiro';
    }
    if (nome.includes('gaúcho') || nome.includes('rio grande do sul')) {
      return 'Campeonato Gaúcho';
    }
    if (nome.includes('copa do brasil')) {
      return 'Copa do Brasil';
    }
    
    // Competições sul-americanas
    if (nome.includes('libertadores')) {
      return 'Copa Libertadores';
    }
    if (nome.includes('sul-americana') || nome.includes('sudamericana')) {
      return 'Copa Sul-Americana';
    }
    if (nome.includes('copa america') || nome.includes('copa américa')) {
      return 'Copa América';
    }
    
    // Competições europeias
    if (nome.includes('champions league') || nome.includes('liga dos campeões')) {
      return 'Liga dos Campeões UEFA';
    }
    if (nome.includes('europa league') || nome.includes('liga europa')) {
      return 'Liga Europa UEFA';
    }
    if (nome.includes('european championship') || nome.includes('euros') || nome.includes('eurocopa')) {
      return 'Eurocopa';
    }
    if (nome.includes('nations league')) {
      return 'Nations League UEFA';
    }
    
    // Ligas nacionais importantes
    if (nome.includes('premier league')) {
      return 'Premier League';
    }
    if (nome.includes('la liga') || nome.includes('primera división')) {
      return 'La Liga';
    }
    if (nome.includes('serie a') && nome.includes('ita')) {
      return 'Serie A Italiana';
    }
    if (nome.includes('bundesliga')) {
      return 'Bundesliga';
    }
    if (nome.includes('ligue 1')) {
      return 'Ligue 1';
    }
    
    // Se não conseguir categorizar, retorna o nome original
    return nomeCampeonato;
  }

  // Método auxiliar para buscar jogos de uma competição específica
  private async buscarJogosCompetição(codigoCompetição: string, dataInicial: string, diasNoFuturo: number): Promise<any[]> {
    const LIMITE_DIAS_POR_REQUEST = 10;
    const todosJogos = [];
    let dataAtual = new Date(dataInicial);
    const dataFinal = new Date(dataInicial);
    dataFinal.setDate(dataFinal.getDate() + diasNoFuturo);
    
    while (dataAtual < dataFinal) {
      const dataFimPedaco = new Date(dataAtual);
      dataFimPedaco.setDate(dataAtual.getDate() + LIMITE_DIAS_POR_REQUEST - 1);
      
      if (dataFimPedaco > dataFinal) {
        dataFimPedaco.setTime(dataFinal.getTime() - 24 * 60 * 60 * 1000);
      }
      
      const dataInicioStr = dataAtual.toISOString().split('T')[0];
      const dataFimStr = dataFimPedaco.toISOString().split('T')[0];
      
      try {
        const response = await axios.get(`${this.apiUrl}/competitions/${codigoCompetição}/matches`, {
          headers: {
            'X-Auth-Token': this.apiKey,
          },
          params: {
            dateFrom: dataInicioStr,
            dateTo: dataFimStr,
          },
        });

        const jogosEncontrados = response.data.matches || [];
        todosJogos.push(...jogosEncontrados);
        
        // Pausa entre requests
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        // Ignora erros de competições específicas para não quebrar a busca geral
        break;
      }
      
      dataAtual.setDate(dataAtual.getDate() + LIMITE_DIAS_POR_REQUEST);
    }
    
    return todosJogos;
  }

  // Método melhorado para buscar jogos por data com opção de organizar por campeonatos
  async getJogosPorDataComCampeonatos(data: string, organizarPorCampeonatos: boolean = false, diasNoFuturo: number = 30) {
    try {
      this.logger.log(`Buscando jogos para a data: ${data} ${organizarPorCampeonatos ? '(organizados por campeonatos)' : ''} até ${diasNoFuturo} dias no futuro`);
      
      // Validar se a data está dentro do limite permitido (até 30 dias no futuro)
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() + 30);
      const dataBusca = new Date(data);
      
      if (dataBusca > dataLimite) {
        this.logger.warn(`Data ${data} está além do limite de 30 dias. Não buscando jogos.`);
        return organizarPorCampeonatos 
          ? { totalCampeonatos: 0, totalJogos: 0, campeonatos: [], periodo: { dataInicial: data, dataFinal: data } }
          : { filters: { date: data }, resultSet: { count: 0 }, matches: [] };
      }
      
      if (organizarPorCampeonatos) {
        // Retorna jogos organizados por campeonatos
        return await this.buscarJogosPorCampeonatos(data, diasNoFuturo);
      } else {
        // Comportamento original
        let resultado = await this.buscarJogosEmRange(data, diasNoFuturo);
        
        if (resultado.matches.length === 0) {
          this.logger.log('Nenhum jogo encontrado na busca geral, tentando competições específicas...');
          resultado = await this.buscarJogosCompeticoesBrasileiras(data);
        }
        
        if (resultado.matches.length === 0) {
          this.logger.log('Nenhum jogo real encontrado para a data solicitada.');
          return {
            filters: { date: data },
            resultSet: { count: 0 },
            matches: []
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
        ? { totalCampeonatos: 0, totalJogos: 0, campeonatos: [], periodo: { dataInicial: data, dataFinal: data } }
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
          
          const response = await axios.get(`${this.apiUrl}/competitions/${competicao.code}/matches`, {
            headers: {
              'X-Auth-Token': this.apiKey,
            },
            params: {
              dateFrom: dataInicial,
              dateTo: dataFimStr,
            },
          });

          const jogosCompetição = response.data.matches || [];
          this.logger.log(`${jogosCompetição.length} jogos encontrados em ${competicao.name}`);
          
          if (jogosCompetição.length > 0) {
            todosJogos.push(...jogosCompetição);
          }
          
          // Pausa entre requests para não sobrecarregar a API
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          this.logger.warn(`Erro ao buscar competição ${competicao.name}:`, error.message);
          // Continua com as outras competições
        }
      }
      
      this.logger.log(`Total de jogos encontrados em todas as competições: ${todosJogos.length}`);
      
      return {
        filters: { 
          dateFrom: dataInicial,
          dateTo: dataFimStr
        },
        resultSet: { count: todosJogos.length },
        matches: todosJogos
      };
      
    } catch (error) {
      this.logger.error('Erro ao buscar jogos de todas as competições:', error.message);
      throw error;
    }
  }
}
