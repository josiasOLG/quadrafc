import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JogosService } from '../modules/jogos/jogos.service';
import { PalpitesService } from '../modules/palpites/palpites.service';
import { RodadasService } from '../modules/rodadas/rodadas.service';
import { TransacoesMoedasService } from '../modules/transacoes-moedas/transacoes-moedas.service';
import { UsersService } from '../modules/users/users.service';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private rodadasService: RodadasService,
    private jogosService: JogosService,
    private palpitesService: PalpitesService,
    private transacoesMoedasService: TransacoesMoedasService
  ) {}

  async onModuleInit() {
    const shouldSeed = this.configService.get('NODE_ENV') === 'development';

    this.logger.log(`🔍 NODE_ENV: ${this.configService.get('NODE_ENV')}`);
    this.logger.log(`🔍 Should seed: ${shouldSeed}`);

    if (shouldSeed) {
      // Verificar se já foi executado verificando apenas usuários existentes
      const usersExistentes = await this.usersService.getRankingIndividual();

      this.logger.log(`📊 Estado atual: ${usersExistentes.data.length} usuários`);

      // if (usersExistentes.data.length > 10) {
      //   this.logger.log('✅ Seed já foi executado anteriormente - pulando execução');
      //   this.logger.log('💡 Para executar novamente, limpe o banco de dados primeiro');
      //   this.logger.log(`📊 Encontrados: ${usersExistentes.data.length} usuários`);
      //   return;
      // }

      this.logger.log(
        '🌱 Iniciando seed para criar APENAS usuários fake com pontos entre 0 e 100...'
      );

      this.logger.log('✅ Seed com usuários fake finalizado!');
      this.logger.log('🔒 Seed finalizado - não executará novamente automaticamente');
    } else {
      this.logger.log('⏸️ Seed desabilitado - NODE_ENV não é development');
    }

    await this.seedAllData();
  }

  private async seedAllData() {
    try {
      // Verificar estado atual dos dados
      const usersExistentes = await this.usersService.getRankingIndividual();

      // const hasUsers = usersExistentes.data.length > 0;

      this.logger.log(
        '🏔️ Verificando dados para a região serrana - Petrópolis e Paty do Alferes...'
      );
      this.logger.log(`    Usuários: ${usersExistentes.data.length} existentes`);

      // Se já tem usuários, pular
      // if (hasUsers) {
      //   this.logger.log('✅ Dados completos já existem, pulando seed...');
      //   return;
      // }

      // 1. Criar usuários - ÚNICO PASSO NECESSÁRIO
      this.logger.log('👥 Executando seed de usuários...');
      await this.seedUsers();

      /* COMENTADO - NÃO NECESSÁRIO
      // 2. Criar rodadas históricas
      await this.seedRodadas();

      // 3. Pular jogos (gerados pela API real)
      this.logger.log('⚽ Pulando criação de jogos - serão sincronizados da API real');

      // 4. Criar palpites históricos (só se houver jogos)
      const jogosExistentes = await this.jogosService.findAll();
      if (jogosExistentes.length > 0) {
        await this.seedPalpites();
      } else {
        this.logger.log('🎯 Pulando palpites - nenhum jogo encontrado ainda');
      }

      // 5. Criar transações de moedas
      await this.seedTransacoes();
      */
    } catch (error) {
      this.logger.error('❌ Erro durante o seed:', error);
    }
  }

  private async seedUsers() {
    try {
      this.logger.log('👥 Criando usuários fake com pontos entre 0 e 100...');

      // Verificar quantos usuários já existem para evitar duplicatas
      // const usersExistentes = await this.usersService.getRankingIndividual();
      // if (usersExistentes.data.length > 0) {
      //   this.logger.log(
      //     `⚠️ ${usersExistentes.data.length} usuários já existem, pulando criação de usuários para evitar duplicatas`
      //   );
      //   return;
      // }

      // Lista de bairros disponíveis - Novos bairros de Petrópolis
      const bairrosDisponiveis = [
        // Petrópolis - RJ - Novos bairros
        { nome: 'Alcobacinha', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Bela Vista', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Provisória', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Alto Independência', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Castelânea', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Chácara Flora', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Estrada da Saudade', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Fazenda Alpina', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Granja Guarani', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Herval', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Itamarati', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Jardim Salvador', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Moinho Preto', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Nova Cascatinha', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Parque São Vicente', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Quitandinha', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Roseiral', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'São Pedro', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Secretário', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Sumidouro', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Valparaíso', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Vila Cristina', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Vila Imperial', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Vila Real', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Washington Luís', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Zona Industrial', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Corrêas', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Itaipava', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Pedro do Rio', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Posse', cidade: 'Petrópolis', estado: 'RJ' },

        // Paty do Alferes - RJ
        { nome: 'Centro', cidade: 'Paty do Alferes', estado: 'RJ' },
        { nome: 'Avelar', cidade: 'Paty do Alferes', estado: 'RJ' },
        { nome: 'Arcozelo', cidade: 'Paty do Alferes', estado: 'RJ' },
        { nome: 'Werneck', cidade: 'Paty do Alferes', estado: 'RJ' },
        { nome: 'Cacaria', cidade: 'Paty do Alferes', estado: 'RJ' },
        { nome: 'São José do Turvo', cidade: 'Paty do Alferes', estado: 'RJ' },
        { nome: 'Queluz de Minas', cidade: 'Paty do Alferes', estado: 'RJ' },
        { nome: 'Palmital', cidade: 'Paty do Alferes', estado: 'RJ' },
        { nome: 'Governador Portela', cidade: 'Paty do Alferes', estado: 'RJ' },
        { nome: 'São João Marcos', cidade: 'Paty do Alferes', estado: 'RJ' },
      ];

      this.logger.log(`� ${bairrosDisponiveis.length} bairros disponíveis para os usuários`);
      const nomesBrasileiros = [
        // Novos nomes masculinos brasileiros da região serrana do RJ
        'Alexandre Moreira Silva',
        'Anderson Pereira dos Santos',
        'Antonio Carlos Oliveira',
        'Bernardo Henrique Costa',
        'César Augusto Ferreira',
        'Danilo José Almeida',
        'Eduardo Ribeiro Lima',
        'Fabiano dos Santos Cruz',
        'Gabriel Martins Rocha',
        'Henrique Barbosa Nunes',
        'Igor Fernandes Cardoso',
        'João Carlos Mendes',
        'José Roberto Araújo',
        'Klaus Eduardo Gomes',
        'Leandro Antônio Reis',
        'Márcio Luiz Teixeira',
        'Nelson Vinicius Correia',
        'Otávio Henrique Miranda',
        'Paulo César Nascimento',
        'Quintino dos Santos Monteiro',
        'Roberto Carlos Vieira',
        'Sérgio Augusto Caldeira',
        'Tiago Fernandes Machado',
        'Ulisses Gabriel Lopes',
        'Valter Hugo Cunha',
        'Wagner Eduardo Borges',
        'Xavier dos Santos Duarte',
        'Yago Henrique Melo',
        'Zacarias Antonio Farias',
        'Adriano Silva Carvalho',
        'Bruno César Torres',
        'Caio Roberto Pinto',
        'Diego Augusto Sales',
        'Emerson Luis Moraes',
        'Fernando Gabriel Castro',
        'Gustavo Antônio Azevedo',
        'Hugo dos Santos Pereira',
        'Ivan Eduardo Freitas',
        'Juliano César Ramos',
        'Kevin Gabriel Santana',
        'Lucas Henrique Campos',
        'Mauricio dos Santos Rodrigues',
        'Nathan Eduardo Fernandes',
        'Orlando César Moreira',
        'Pedro Augusto Barbosa',
        'Quirino José Alves',
        'Renato Luis Dias',
        'Sandro Henrique Ribeiro',
        'Thales Gabriel Martins',
        'Ubiratan dos Santos Gomes',
      ];

      for (let i = 0; i < nomesBrasileiros.length; i++) {
        const nome = nomesBrasileiros[i];
        const email =
          nome
            .toLowerCase()
            .replace(/\s+/g, '.')
            .replace(/ç/g, 'c')
            .replace(/[áàãâ]/g, 'a')
            .replace(/[éêë]/g, 'e')
            .replace(/[íîï]/g, 'i')
            .replace(/[óôõö]/g, 'o')
            .replace(/[úûü]/g, 'u') + '@email.com';

        const bairro = bairrosDisponiveis[Math.floor(Math.random() * bairrosDisponiveis.length)];

        // MODIFICADO: Pontos limitados entre 0 e 100
        const totalPoints = Math.floor(Math.random() * 101); // 0 a 100
        const moedas = Math.floor(totalPoints * 0.5) + Math.floor(Math.random() * 20); // Reduzido

        // Remover medalhas complexas
        const medalhas = [];
        if (totalPoints > 50) medalhas.push('Iniciante');
        if (totalPoints > 75) medalhas.push('Participante');
        if (totalPoints > 90) medalhas.push('Entusiasta');

        this.logger.debug(
          `👤 Criando usuário ${i + 1}/${nomesBrasileiros.length}: ${nome} (${bairro.nome}, ${bairro.cidade}) - ${totalPoints} pontos`
        );

        // Criar usuário
        await this.usersService.create({
          nome: nome,
          email,
          password: '123456', // Senha padrão para testes
          // Campos do onboarding para usuários de seed
          data_nascimento: new Date(
            1985 + Math.floor(Math.random() * 25),
            Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 28) + 1
          ),
          telefone: `(24) 9${Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, '0')}-${Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, '0')}`,
          cidade: bairro.cidade,
          estado: bairro.estado,
          bairro: bairro.nome, // Agora usando apenas o nome do bairro como string
        });

        // Atualizar pontos e moedas do usuário criado
        const user = await this.usersService.findByEmail(email);
        if (user) {
          user.totalPoints = totalPoints;
          user.moedas = moedas;
          user.medals = medalhas;
          await user.save();

          this.logger.debug(
            `✅ Usuário ${nome} (${totalPoints} pts) criado no bairro ${bairro.nome}`
          );
        }

        // Log de progresso a cada 10 usuários
        if ((i + 1) % 10 === 0) {
          this.logger.log(`📈 Progresso: ${i + 1}/${nomesBrasileiros.length} usuários criados`);
        }
      }

      this.logger.log(
        `✅ ${nomesBrasileiros.length} usuários fake criados com pontos entre 0 e 100!`
      );
    } catch (error) {
      this.logger.error('Erro ao criar usuários:', error);
    }
  }

  /**
   * COMENTADO - Não necessário para a criação apenas de usuários fake
   */
  /*
  private async seedRodadas() {
    try {
      this.logger.log('🗓️ Criando rodadas históricas...');

      const agora = new Date();
      const rodadas = [];

      // Criar 10 rodadas: 7 finalizadas, 2 em andamento, 1 futura
      for (let i = 1; i <= 10; i++) {
        const dataInicio = new Date(agora);
        dataInicio.setDate(agora.getDate() - (10 - i) * 7);

        const dataFim = new Date(dataInicio);
        dataFim.setDate(dataInicio.getDate() + 6);

        const ativa = i === 8; // Rodada 8 está ativa

        rodadas.push({
          nome: `Rodada ${i}`,
          descricao: `Rodada ${i} do Campeonato Brasileiro`,
          dataInicio,
          dataFim,
          ativa,
        });
      }

      for (const rodada of rodadas) {
        await this.rodadasService.create(rodada);
      }

      this.logger.log(`✅ ${rodadas.length} rodadas criadas!`);
    } catch (error) {
      this.logger.error('Erro ao criar rodadas:', error);
    }
  }

  private async seedJogos() {
    try {
      this.logger.log('⚽ Verificando jogos da API real...');

      // Verificar se já existem jogos no banco
      const jogosExistentes = await this.jogosService.findAll();

      if (jogosExistentes.length > 0) {
        this.logger.log(`📦 ${jogosExistentes.length} jogos já existem no banco`);
        return;
      }

      this.logger.log('🔄 Tentando sincronizar jogos de hoje da API real...');

      // Sincronizar apenas hoje para inicialização
      const hoje = new Date().toISOString().split('T')[0];

      try {
        const resultado = await this.jogosService.forcarSincronizacao(hoje);
        this.logger.log(`✅ Sincronização: ${resultado.totalJogos} jogos encontrados para hoje`);
      } catch (error) {
        this.logger.warn('⚠️ Nenhum jogo encontrado para hoje na API, isso é normal');
        this.logger.log(
          '💡 Use /api/jogos/sincronizar/{data} para sincronizar datas específicas quando necessário'
        );
      }
    } catch (error) {
      this.logger.warn(
        '⚠️ Erro ao verificar/sincronizar jogos (isso é normal se a API estiver indisponível):',
        error.message
      );
    }
  }

  private async seedPalpites() {
    try {
      this.logger.log('🎯 Criando palpites históricos...');

      const users = await this.usersService.getRankingIndividual();
      const jogosEncerrados = await this.jogosService.findAll();

      // Para cada jogo encerrado, criar palpites de alguns usuários
      for (const jogo of jogosEncerrados.filter((j) => j.status === 'encerrado')) {
        // 60-80% dos usuários fizeram palpites
        const numPalpites = Math.floor(users.data.length * (0.6 + Math.random() * 0.2));
        const usuariosQueVaoPalpitar = users.data
          .sort(() => Math.random() - 0.5)
          .slice(0, numPalpites);

        for (const user of usuariosQueVaoPalpitar) {
          // Gerar palpite realista
          const palpiteA = Math.floor(Math.random() * 4);
          const palpiteB = Math.floor(Math.random() * 4);

          // Calcular se acertou
          const acertouPlacar =
            jogo.resultado.timeA === palpiteA && jogo.resultado.timeB === palpiteB;

          const resultadoReal = this.getResultado(jogo.resultado.timeA, jogo.resultado.timeB);
          const resultadoPalpite = this.getResultado(palpiteA, palpiteB);
          const acertouResultado = resultadoReal === resultadoPalpite;

          // Calcular pontos
          let pontos = 0;
          let moedas = 0;

          if (acertouPlacar) {
            pontos = 10;
            moedas = 50;
          } else if (acertouResultado) {
            pontos = 3;
            moedas = 15;
          }

          try {
            const createPalpiteDto = {
              jogoId: (jogo as any)._id.toString(),
              timeA: palpiteA,
              timeB: palpiteB,
            };

            await this.palpitesService.create((user as any)._id.toString(), createPalpiteDto);
          } catch (error) {
            // Pular palpites duplicados ou outros erros
          }
        }
      }

      this.logger.log(`✅ Palpites históricos criados!`);
    } catch (error) {
      this.logger.error('Erro ao criar palpites:', error);
    }
  }

  private async seedTransacoes() {
    try {
      this.logger.log('💰 Criando histórico de transações...');

      const users = await this.usersService.getRankingIndividual();

      if (users.data.length === 0) {
        this.logger.log('👥 Nenhum usuário encontrado, pulando transações...');
        return;
      }

      for (const user of users.data) {
        // Criar algumas transações históricas para cada usuário
        const numTransacoes = Math.floor(Math.random() * 15) + 5;

        for (let i = 0; i < numTransacoes; i++) {
          const dataTransacao = new Date();
          dataTransacao.setDate(dataTransacao.getDate() - Math.floor(Math.random() * 60));

          const tipoTransacao = Math.random() > 0.7 ? 'gasto' : 'ganho';

          if (tipoTransacao === 'ganho') {
            const quantidade = Math.floor(Math.random() * 150) + 15; // Valores mais generosos
            const origens = [
              'palpite_correto',
              'bonus_diario',
              'conquista',
              'primeira_vitoria',
              'sequencia_acertos',
            ];
            const origem = origens[Math.floor(Math.random() * origens.length)];

            await this.transacoesMoedasService.registrarGanho(
              user._id.toString(),
              origem,
              quantidade,
              `Moedas ganhas por ${origem.replace('_', ' ')}`
            );
          } else {
            const quantidade = Math.floor(Math.random() * 80) + 10;
            const origens = ['loja_avatar', 'loja_tema', 'boost_palpite', 'acesso_premium'];
            const origem = origens[Math.floor(Math.random() * origens.length)];

            await this.transacoesMoedasService.registrarGasto(
              user._id.toString(),
              origem,
              quantidade,
              `Compra: ${origem.replace('_', ' ')}`
            );
          }
        }
      }

      this.logger.log(`✅ Histórico de transações criado para ${users.data.length} usuários!`);
    } catch (error) {
      this.logger.error('Erro ao criar transações:', error);
    }
  }

  private getResultado(golsA: number, golsB: number): 'vitoria_a' | 'empate' | 'vitoria_b' {
    if (golsA > golsB) return 'vitoria_a';
    if (golsA < golsB) return 'vitoria_b';
    return 'empate';
  }

  /**
   * Método público para executar o seed manualmente
   * Use via endpoint ou console do Node.js
   */
  async executarSeedManual(): Promise<void> {
    this.logger.log('🔧 Executando seed MANUALMENTE...');
    await this.seedAllData();
    this.logger.log('✅ Seed manual finalizado!');
  }

  /**
   * Método para limpar todos os dados antes de executar o seed
   */
  async limparEExecutarSeed(): Promise<void> {
    this.logger.log('🧹 Limpando dados existentes...');

    try {
      // Aqui você pode adicionar limpeza se necessário
      // await this.usersService.deleteAll();

      this.logger.log('✅ Dados limpos, executando seed...');
      await this.seedAllData();
      this.logger.log('✅ Seed completo finalizado!');
    } catch (error) {
      this.logger.error('❌ Erro durante limpeza e seed:', error);
    }
  }
}
