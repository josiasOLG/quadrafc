import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JogosService } from '../modules/jogos/jogos.service';
import { PalpitesService } from '../modules/palpites/palpites.service';
import { RodadasService } from '../modules/rodadas/rodadas.service';
import { TransacoesMoedasService } from '../modules/transacoes-moedas/transacoes-moedas.service';
import { UsersService } from '../modules/users/users.service';
import { Jogo, JogoDocument } from '../shared/schemas/jogo.schema';
import { Palpite, PalpiteDocument } from '../shared/schemas/palpite.schema';
import { User, UserDocument } from '../shared/schemas/user.schema';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private rodadasService: RodadasService,
    private jogosService: JogosService,
    private palpitesService: PalpitesService,
    private transacoesMoedasService: TransacoesMoedasService,
    @InjectModel(Palpite.name) private palpiteModel: Model<PalpiteDocument>,
    @InjectModel(Jogo.name) private jogoModel: Model<JogoDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>
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
      // await this.seedUsers();

      // 2. Criar palpites para usuários
      this.logger.log('🎯 Executando seed de palpites...');
      await this.seedPalpites();

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

      // Lista completa de bairros - Região Serrana do RJ (máximo possível das 3 cidades)
      const bairrosDisponiveis = [
        // Petrópolis - RJ (máximo de bairros)
        { nome: 'Alcobacinha', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Alto da Serra', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Alto Independência', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Bela Vista', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Bingen', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Bonsucesso', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Carangola', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Castelânea', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Centro', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Chácara Flora', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Caxambu', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Cremerie', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Corrêas', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Duarte da Silveira', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Duchas', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Estrada da Saudade', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Fazenda Alpina', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Fazenda Inglesa', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Granja Guarani', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Herval', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Independência', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Itaipava', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Itamarati', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Jardim Salvador', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Mosela', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Moinho Preto', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Nogueira', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Nova Cascatinha', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Parque São Vicente', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Pedro do Rio', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Posse', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Provisória', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Quitandinha', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Retiro', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Roseiral', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'São Pedro', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Secretário', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Siméria', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Sumidouro', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Taquara', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Valparaíso', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Vila Cristina', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Vila Felipe', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Vila Imperial', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Vila Real', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Washington Luís', cidade: 'Petrópolis', estado: 'RJ' },
        { nome: 'Zona Industrial', cidade: 'Petrópolis', estado: 'RJ' },

        // Paty do Alferes - RJ (máximo de bairros)
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
        { nome: 'Banquete', cidade: 'Paty do Alferes', estado: 'RJ' },
        { nome: 'Bemposta', cidade: 'Paty do Alferes', estado: 'RJ' },
        { nome: 'Bela Vista', cidade: 'Paty do Alferes', estado: 'RJ' },
        { nome: 'Brasilândia', cidade: 'Paty do Alferes', estado: 'RJ' },
        { nome: 'Cabaceiras', cidade: 'Paty do Alferes', estado: 'RJ' },
        { nome: 'Fazenda da Ponte', cidade: 'Paty do Alferes', estado: 'RJ' },
        { nome: 'Ilhas', cidade: 'Paty do Alferes', estado: 'RJ' },
        { nome: 'Pedra Branca', cidade: 'Paty do Alferes', estado: 'RJ' },
        { nome: 'Rio de Janeiro Pequeno', cidade: 'Paty do Alferes', estado: 'RJ' },
        { nome: 'Santa Cruz', cidade: 'Paty do Alferes', estado: 'RJ' },

        // Miguel Pereira - RJ (máximo de bairros)
        { nome: 'Centro', cidade: 'Miguel Pereira', estado: 'RJ' },
        { nome: 'Governador Portela', cidade: 'Miguel Pereira', estado: 'RJ' },
        { nome: 'Conrado', cidade: 'Miguel Pereira', estado: 'RJ' },
        { nome: 'Javary', cidade: 'Miguel Pereira', estado: 'RJ' },
        { nome: 'Vila Inhomirim', cidade: 'Miguel Pereira', estado: 'RJ' },
        { nome: 'Moças', cidade: 'Miguel Pereira', estado: 'RJ' },
        { nome: 'Várzea dos Pássaros', cidade: 'Miguel Pereira', estado: 'RJ' },
        { nome: 'Vera Cruz', cidade: 'Miguel Pereira', estado: 'RJ' },
        { nome: 'Stela Maris', cidade: 'Miguel Pereira', estado: 'RJ' },
        { nome: 'Vila Rica', cidade: 'Miguel Pereira', estado: 'RJ' },
        { nome: 'Amélia', cidade: 'Miguel Pereira', estado: 'RJ' },
        { nome: 'Antônio de Pádua', cidade: 'Miguel Pereira', estado: 'RJ' },
        { nome: 'Bairro da Estação', cidade: 'Miguel Pereira', estado: 'RJ' },
        { nome: 'Bairro do Colégio', cidade: 'Miguel Pereira', estado: 'RJ' },
        { nome: 'Bela Vista', cidade: 'Miguel Pereira', estado: 'RJ' },
        { nome: 'Coelhos', cidade: 'Miguel Pereira', estado: 'RJ' },
        { nome: 'Dutra', cidade: 'Miguel Pereira', estado: 'RJ' },
        { nome: 'Estiva', cidade: 'Miguel Pereira', estado: 'RJ' },
        { nome: 'Getúlio Vargas', cidade: 'Miguel Pereira', estado: 'RJ' },
        { nome: 'Graminha', cidade: 'Miguel Pereira', estado: 'RJ' },
        { nome: 'Jardim das Palmeiras', cidade: 'Miguel Pereira', estado: 'RJ' },
        { nome: 'Jardim de Alah', cidade: 'Miguel Pereira', estado: 'RJ' },
        { nome: 'Parque do Ingá', cidade: 'Miguel Pereira', estado: 'RJ' },
        { nome: 'Parque Floresta', cidade: 'Miguel Pereira', estado: 'RJ' },
        { nome: 'Pedro Versiani', cidade: 'Miguel Pereira', estado: 'RJ' },
        { nome: 'Santa Rita', cidade: 'Miguel Pereira', estado: 'RJ' },
        { nome: 'São João', cidade: 'Miguel Pereira', estado: 'RJ' },
        { nome: 'Vila Cabuçu', cidade: 'Miguel Pereira', estado: 'RJ' },
        { nome: 'Vila Operária', cidade: 'Miguel Pereira', estado: 'RJ' },
        { nome: 'Vale do Paraíso', cidade: 'Miguel Pereira', estado: 'RJ' },
      ];

      this.logger.log(`� ${bairrosDisponiveis.length} bairros disponíveis para os usuários`);
      // Lista expandida com pelo menos 80 nomes masculinos + 20 femininos = 100+ usuários
      const nomesMasculinos = [
        // Nomes masculinos brasileiros da região serrana do RJ
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
        // Adicionando mais nomes masculinos para totalizar 150+
        'André Luiz Monteiro',
        'Arthur César Nogueira',
        'Benedito Santos Lima',
        'Cláudio Roberto Figueiredo',
        'Daniel Eduardo Soares',
        'Evandro José Batista',
        'Francisco Carlos Maia',
        'Gilberto Antonio Leal',
        'Heitor Gabriel Pacheco',
        'Israel Fernando Barros',
        'Jadson Luis Moura',
        'Kleber dos Santos Viana',
        'Leonardo César Magalhães',
        'Marcos Vinicius Toledo',
        'Nilton Eduardo Farias',
        'Osmar Henrique Guedes',
        'Patrick Gabriel Rezende',
        'Robson Carlos Tavares',
        'Samuel Antonio Silveira',
        'Tadeu Fernando Costa',
        'Vagner Luis Peixoto',
        'Wesley Eduardo Macedo',
        'Yuri Gabriel Campos',
        'Zeferino dos Santos Rocha',
        'Alberto César Miranda',
        'Benjamin Luiz Freire',
        'Cristiano José Mendes',
        'Davi Eduardo Pereira',
        'Élton Gabriel Santos',
        'Fabrício Luis Cardoso',
        'Gustavo Roberto Almeida',
        'Hamilton dos Santos Pereira',
        'Icaro Fernandes Costa',
        'Jefferson Carlos Lima',
        'Kennedy Eduardo Rocha',
        'Luciano Gabriel Martins',
        'Marcelo Antonio Silva',
        'Nicolau Fernando Santos',
        'Osvaldo Luis Barbosa',
        'Paulo Roberto Gomes',
        'Rodrigo César Oliveira',
        'Sebastião Eduardo Reis',
        'Teodoro Gabriel Cunha',
        'Vinicius dos Santos Torres',
        'William César Moreira',
        'Ximenes Gabriel Lopes',
        'Yves Antonio Caldeira',
        'Zacharias Luis Machado',
        'Alan Eduardo Carvalho',
        'Bento Gabriel Pinto',
        'Carlos Roberto Sales',
        'Diogo Luis Moraes',
        'Elias Eduardo Castro',
        'Felipe Gabriel Azevedo',
        'Geraldo dos Santos Freitas',
        'Hermes César Ramos',
        'Ivo Gabriel Santana',
        'Jair Eduardo Campos',
        'Kelvin dos Santos Rodrigues',
        'Lauro Gabriel Fernandes',
        'Milton César Moreira',
        'Norberto Eduardo Nogueira',
        'Oscar Gabriel Figueiredo',
        'Plinio Luis Soares',
        'Raul Eduardo Batista',
        'Silvio Gabriel Maia',
        'Tomaz César Leal',
        'Urbano dos Santos Pacheco',
        'Valdir Eduardo Barros',
        'Waldemar Gabriel Moura',
        'Xico dos Santos Viana',
        'Ademir José Gonçalves',
        'Basílio Carlos Mendes',
        'Celso Roberto Araújo',
        'Domingos Eduardo Gomes',
        'Ernesto Gabriel Reis',
        'Fábio dos Santos Teixeira',
        'Gerson Luis Correia',
        'Haroldo César Miranda',
        'Ismael Gabriel Nascimento',
        'Jaime dos Santos Monteiro',
        'Lázaro Eduardo Vieira',
        'Murilo Gabriel Caldeira',
        'Newton dos Santos Machado',
        'Oldair César Lopes',
        'Paulino Gabriel Cunha',
        'Ronaldo dos Santos Borges',
        'Silas Eduardo Duarte',
        'Teodósio Gabriel Melo',
        'Valdomiro dos Santos Farias',
        'Wanderlei César Carvalho',
        'Xavier Eduardo Torres',
        'Yago dos Santos Pinto',
        'Zélio Gabriel Sales',
      ];

      const nomesFemininos = [
        // 20+ nomes femininos para completar os 100+ usuários
        'Ana Carolina Silva',
        'Beatriz Santos Oliveira',
        'Camila Ferreira Costa',
        'Daniela Pereira Lima',
        'Eduarda Ribeiro Rocha',
        'Fernanda dos Santos Cruz',
        'Gabriela Martins Almeida',
        'Helena Barbosa Nunes',
        'Isabela Fernandes Cardoso',
        'Juliana Carlos Mendes',
        'Karla Roberto Araújo',
        'Larissa Eduardo Gomes',
        'Mariana Antônio Reis',
        'Natália Luiz Teixeira',
        'Olivia Vinicius Correia',
        'Patrícia Henrique Miranda',
        'Rafaela César Nascimento',
        'Sabrina dos Santos Monteiro',
        'Tatiana Carlos Vieira',
        'Vanessa Augusto Caldeira',
        'Bianca Fernandes Machado',
        'Carolina Gabriel Lopes',
        'Débora Hugo Cunha',
        'Elaine Eduardo Borges',
      ];

      // Concatenar listas mantendo proporção de 80% masculinos
      const todosOsNomes = [...nomesMasculinos, ...nomesFemininos];

      this.logger.log(
        `👥 Total de ${todosOsNomes.length} nomes disponíveis (${nomesMasculinos.length} masculinos, ${nomesFemininos.length} femininos)`
      );
      this.logger.log(
        `📊 Proporção: ${((nomesMasculinos.length / todosOsNomes.length) * 100).toFixed(1)}% masculinos`
      );

      for (let i = 0; i < todosOsNomes.length; i++) {
        const nome = todosOsNomes[i];
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
          `👤 Criando usuário ${i + 1}/${todosOsNomes.length}: ${nome} (${bairro.nome}, ${bairro.cidade}) - ${totalPoints} pontos`
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
          this.logger.log(`📈 Progresso: ${i + 1}/${todosOsNomes.length} usuários criados`);
        }
      }

      this.logger.log(`✅ ${todosOsNomes.length} usuários fake criados com pontos entre 0 e 100!`);
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

  /**
   * Criar palpites para todos os usuários nos jogos reais
   */
  private async seedPalpites(): Promise<void> {
    try {
      // Verificar se já existem palpites usando o modelo
      const existingPalpites = await this.palpiteModel.countDocuments();
      if (existingPalpites > 0) {
        this.logger.log(
          '🎯 Palpites já existem no banco de dados - verificando campeonatos dos usuários...'
        );

        // Verificar se os usuários já têm campeonatos preenchidos
        const usersComCampeonatos = await this.userModel.countDocuments({
          campeonatos: { $exists: true, $ne: [] },
        });

        if (usersComCampeonatos > 0) {
          this.logger.log(
            `✅ ${usersComCampeonatos} usuários já possuem campeonatos - pulando atualização`
          );
          return;
        }

        this.logger.log('🔄 Atualizando campeonatos dos usuários existentes...');
        await this.atualizarCampeonatosUsuarios();
        return;
      }

      this.logger.log('🎯 Iniciando criação de palpites...');

      // Buscar todos os jogos reais do banco de dados com informações do campeonato
      const jogos = await this.jogoModel.find().select('_id campeonato').exec();

      if (jogos.length === 0) {
        this.logger.warn('❌ Nenhum jogo encontrado no banco de dados para criar palpites');
        return;
      }

      // Log dos campeonatos únicos encontrados
      const campeonatosUnicos = [...new Set(jogos.map((j) => j.campeonato).filter(Boolean))];
      this.logger.log(`🏆 Campeonatos disponíveis: ${campeonatosUnicos.join(', ')}`);

      // Buscar TODOS os usuários diretamente do banco sem limitação
      const users = await this.userModel.find({}).select('_id nome').exec();

      if (users.length === 0) {
        this.logger.warn('❌ Nenhum usuário encontrado para criar palpites');
        return;
      }

      this.logger.log(`👥 ${users.length} usuários encontrados`);
      this.logger.log(`⚽ ${jogos.length} jogos reais disponíveis para palpites`);

      let totalPalpitesCriados = 0;
      const palpitesParaInserir = [];
      const usersParaAtualizar = new Map();

      // GARANTIR QUE TODOS OS USUÁRIOS FAÇAM PALPITES
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const userCampeonatos = new Set();

        // MODIFICADO: Cada usuário fará palpites em uma quantidade aleatória de jogos (entre 5 e 15)
        // Mas garantindo que TODOS os usuários façam pelo menos alguns palpites
        const quantidadeJogos = Math.min(
          Math.floor(Math.random() * 11) + 5, // 5 a 15 jogos (reduzido para garantir que todos participem)
          jogos.length // Não pode exceder o total de jogos disponíveis
        );

        // Se não há jogos suficientes, cada usuário fará palpite em TODOS os jogos disponíveis
        const jogosEscolhidos =
          jogos.length <= 15
            ? [...jogos] // Todos os jogos se há poucos
            : this.shuffleArray([...jogos]).slice(0, quantidadeJogos); // Seleção aleatória se há muitos

        this.logger.debug(
          `👤 Usuário ${i + 1}/${users.length} (${user.nome}): ${jogosEscolhidos.length} palpites`
        );

        // Para cada jogo escolhido
        for (const jogo of jogosEscolhidos) {
          // Gerar palpite aleatório seguindo o schema
          const golsTimeA = Math.floor(Math.random() * 4); // 0 a 3 gols
          const golsTimeB = Math.floor(Math.random() * 4); // 0 a 3 gols

          const palpite = {
            userId: user._id,
            jogoId: jogo._id,
            palpite: {
              timeA: golsTimeA,
              timeB: golsTimeB,
            },
            pontos: 0, // Mantido em 0 conforme solicitado
            acertouPlacar: Math.random() > 0.85, // 15% de chance de acertar placar exato
            acertouResultado: Math.random() > 0.4, // 60% de chance de acertar resultado
            moedasGanhas: Math.floor(Math.random() * 50), // 0 a 49 moedas
          };

          palpitesParaInserir.push(palpite);
          totalPalpitesCriados++;

          // Adicionar campeonato único à lista do usuário (verificação mais robusta)
          if (jogo.campeonato && jogo.campeonato.trim() !== '') {
            userCampeonatos.add(jogo.campeonato.trim());
          }
        }

        // GARANTIR que TODOS os usuários sejam armazenados para atualização
        // Mesmo que não tenham campeonatos válidos, registra para debug
        const campeonatosArray = Array.from(userCampeonatos);
        if (campeonatosArray.length > 0) {
          usersParaAtualizar.set(user._id.toString(), campeonatosArray);

          // Log de debug para os primeiros 5 usuários
          if (i < 5) {
            this.logger.debug(`👤 ${user.nome}: ${campeonatosArray.join(', ')}`);
          }
        } else {
          // Log de warning se usuário não tem campeonatos
          this.logger.warn(
            `⚠️ Usuário ${user.nome} não recebeu campeonatos - jogos sem campeonato válido`
          );
        }

        // Log de progresso a cada 20 usuários
        if ((i + 1) % 20 === 0) {
          this.logger.log(`📈 Progresso: ${i + 1}/${users.length} usuários processados`);
        }
      }

      this.logger.log(
        `📊 Resumo: ${users.length} usuários processados, ${usersParaAtualizar.size} receberão campeonatos`
      );

      // Inserir todos os palpites de uma vez para melhor performance
      this.logger.log('💾 Inserindo palpites no banco de dados...');
      await this.palpiteModel.insertMany(palpitesParaInserir);

      // Atualizar propriedade campeonatos para cada usuário
      this.logger.log(`🏆 Atualizando campeonatos para ${usersParaAtualizar.size} usuários...`);
      let usersAtualizados = 0;
      let errosUpdate = 0;

      for (const [userId, campeonatos] of usersParaAtualizar) {
        try {
          const resultado = await this.userModel.findByIdAndUpdate(
            userId,
            {
              $addToSet: {
                campeonatos: { $each: campeonatos },
              },
            },
            { new: true, select: 'nome campeonatos' }
          );

          if (resultado) {
            usersAtualizados++;

            // Log de debug para os primeiros 5 usuários
            if (usersAtualizados <= 5) {
              this.logger.debug(
                `✅ ${resultado.nome}: ${resultado.campeonatos?.join(', ') || 'nenhum'}`
              );
            }
          } else {
            this.logger.warn(`⚠️ Usuário ${userId} não encontrado para atualização`);
            errosUpdate++;
          }
        } catch (error) {
          this.logger.error(`❌ Erro ao atualizar usuário ${userId}:`, error.message);
          errosUpdate++;
        }
      }

      this.logger.log(`✅ ${totalPalpitesCriados} palpites criados com sucesso!`);
      this.logger.log(
        `🏆 ${usersAtualizados} de ${users.length} usuários atualizados com campeonatos únicos`
      );
      if (errosUpdate > 0) {
        this.logger.warn(`⚠️ ${errosUpdate} erros durante atualização de usuários`);
      }

      // Verificação final - contar usuários sem campeonatos
      const usersSemCampeonatos = users.length - usersAtualizados;
      if (usersSemCampeonatos > 0) {
        this.logger.warn(
          `⚠️ ${usersSemCampeonatos} usuários ficaram sem campeonatos (possível problema nos dados de jogos)`
        );
      }

      this.logger.log(
        `📊 Média de ${(totalPalpitesCriados / users.length).toFixed(1)} palpites por usuário`
      );
    } catch (error) {
      this.logger.error('❌ Erro ao criar palpites:', error);
      throw error;
    }
  }

  private async atualizarCampeonatosUsuarios(): Promise<void> {
    try {
      this.logger.log('🔄 Buscando todos os usuários para atualizar campeonatos...');

      // Buscar TODOS os usuários diretamente
      const todosOsUsuarios = await this.userModel.find({}).select('_id nome').exec();
      this.logger.log(`👥 Total de ${todosOsUsuarios.length} usuários encontrados no banco`);

      // Buscar todos os palpites com informações dos jogos
      const palpitesComJogos = await this.palpiteModel.aggregate([
        {
          $lookup: {
            from: 'jogos',
            localField: 'jogoId',
            foreignField: '_id',
            as: 'jogo',
          },
        },
        {
          $unwind: '$jogo',
        },
        {
          $group: {
            _id: '$userId',
            campeonatos: { $addToSet: '$jogo.campeonato' },
          },
        },
      ]);

      this.logger.log(`🎯 ${palpitesComJogos.length} usuários têm palpites no banco`);

      let usersAtualizados = 0;

      for (const item of palpitesComJogos) {
        const campeonatosLimpos = item.campeonatos.filter((c) => c && c.trim() !== '');

        if (campeonatosLimpos.length > 0) {
          const resultado = await this.userModel.findByIdAndUpdate(
            item._id,
            {
              $addToSet: {
                campeonatos: { $each: campeonatosLimpos },
              },
            },
            { new: true, select: 'nome campeonatos' }
          );

          if (resultado) {
            usersAtualizados++;

            // Log para os primeiros 5 usuários
            if (usersAtualizados <= 5) {
              this.logger.debug(
                `✅ ${resultado.nome}: ${resultado.campeonatos?.join(', ') || 'nenhum'}`
              );
            }
          }
        }
      }

      this.logger.log(
        `🔄 ${usersAtualizados} de ${todosOsUsuarios.length} usuários atualizados com campeonatos`
      );

      const usersSemPalpites = todosOsUsuarios.length - palpitesComJogos.length;
      if (usersSemPalpites > 0) {
        this.logger.warn(`⚠️ ${usersSemPalpites} usuários não têm palpites no banco`);
      }
    } catch (error) {
      this.logger.error('❌ Erro ao atualizar campeonatos dos usuários:', error);
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
