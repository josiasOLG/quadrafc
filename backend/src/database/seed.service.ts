import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BairrosService } from '../modules/bairros/bairros.service';
import { UsersService } from '../modules/users/users.service';
import { RodadasService } from '../modules/rodadas/rodadas.service';
import { JogosService } from '../modules/jogos/jogos.service';
import { PalpitesService } from '../modules/palpites/palpites.service';
import { TransacoesMoedasService } from '../modules/transacoes-moedas/transacoes-moedas.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private configService: ConfigService,
    private bairrosService: BairrosService,
    private usersService: UsersService,
    private rodadasService: RodadasService,
    private jogosService: JogosService,
    private palpitesService: PalpitesService,
    private transacoesMoedasService: TransacoesMoedasService,
  ) {}

  async onModuleInit() {
    const shouldSeed = this.configService.get('NODE_ENV') === 'development';
    
    if (shouldSeed) {
      this.logger.log('🌱 Iniciando seed dos dados para parecer um app estabelecido...');
      await this.seedAllData();
      this.logger.log('✅ QuadraFC está pronto! App parece que já funciona há meses! 🚀');
    }
  }

  private async seedAllData() {
    try {
      // Verificar se já existe dados - usando uma verificação simples
      const bairrosExistentes = await this.bairrosService.findAll();
      if (bairrosExistentes.length > 50) { // Se já temos muitos bairros, assumimos que o seed já foi executado
        this.logger.log('📦 Dados já existem, pulando seed...');
        return;
      }

      // 1. Criar bairros primeiro
      await this.seedBairros();
      
      // 2. Criar usuários fictícios realistas
      await this.seedUsers();
      
      // 3. Criar rodadas históricas
      await this.seedRodadas();
      
      // 4. Criar jogos com resultados
      await this.seedJogos();
      
      // 5. Criar palpites históricos
      await this.seedPalpites();
      
      // 6. Criar transações de moedas
      await this.seedTransacoes();
      
    } catch (error) {
      this.logger.error('❌ Erro durante o seed:', error);
    }
  }

  private async seedBairros() {
    try {
      const bairrosExistentes = await this.bairrosService.findAll();
      
      if (bairrosExistentes.length === 0) {
        this.logger.log('🏘️ Criando bairros...');
        
        const bairros = [
          // São Paulo - SP
          { nome: 'Vila Madalena', cidade: 'São Paulo', estado: 'SP', totalPoints: 15420 },
          { nome: 'Itaim Bibi', cidade: 'São Paulo', estado: 'SP', totalPoints: 13890 },
          { nome: 'Pinheiros', cidade: 'São Paulo', estado: 'SP', totalPoints: 12750 },
          { nome: 'Moema', cidade: 'São Paulo', estado: 'SP', totalPoints: 11200 },
          { nome: 'Liberdade', cidade: 'São Paulo', estado: 'SP', totalPoints: 10850 },
          { nome: 'Vila Olímpia', cidade: 'São Paulo', estado: 'SP', totalPoints: 9950 },
          { nome: 'Jardins', cidade: 'São Paulo', estado: 'SP', totalPoints: 9400 },
          { nome: 'Centro', cidade: 'São Paulo', estado: 'SP', totalPoints: 8750 },
          
          // Rio de Janeiro - RJ
          { nome: 'Copacabana', cidade: 'Rio de Janeiro', estado: 'RJ', totalPoints: 14200 },
          { nome: 'Ipanema', cidade: 'Rio de Janeiro', estado: 'RJ', totalPoints: 13100 },
          { nome: 'Leblon', cidade: 'Rio de Janeiro', estado: 'RJ', totalPoints: 12300 },
          { nome: 'Barra da Tijuca', cidade: 'Rio de Janeiro', estado: 'RJ', totalPoints: 11800 },
          { nome: 'Tijuca', cidade: 'Rio de Janeiro', estado: 'RJ', totalPoints: 10900 },
          
          // Belo Horizonte - MG
          { nome: 'Savassi', cidade: 'Belo Horizonte', estado: 'MG', totalPoints: 8900 },
          { nome: 'Funcionários', cidade: 'Belo Horizonte', estado: 'MG', totalPoints: 7600 },
          { nome: 'Centro', cidade: 'Belo Horizonte', estado: 'MG', totalPoints: 6800 },
          
          // Porto Alegre - RS
          { nome: 'Moinhos de Vento', cidade: 'Porto Alegre', estado: 'RS', totalPoints: 7200 },
          { nome: 'Cidade Baixa', cidade: 'Porto Alegre', estado: 'RS', totalPoints: 6500 },
          
          // Salvador - BA
          { nome: 'Barra', cidade: 'Salvador', estado: 'BA', totalPoints: 6200 },
          { nome: 'Pelourinho', cidade: 'Salvador', estado: 'BA', totalPoints: 5800 },
        ];

        for (const bairro of bairros) {
          await this.bairrosService.create(bairro);
        }
        
        this.logger.log(`✅ ${bairros.length} bairros criados!`);
      }
    } catch (error) {
      this.logger.error('Erro ao criar bairros:', error);
    }
  }

  private async seedUsers() {
    try {
      this.logger.log('👥 Criando usuários realistas...');
      
      const bairros = await this.bairrosService.findAll();
      const nomesBrasileiros = [
        'Carlos Silva', 'Ana Santos', 'João Oliveira', 'Maria Costa', 'Pedro Souza',
        'Fernanda Lima', 'Rafael Pereira', 'Juliana Alves', 'Lucas Ferreira', 'Camila Rocha',
        'Thiago Martins', 'Larissa Barbosa', 'Bruno Ribeiro', 'Priscila Dias', 'André Gomes',
        'Letícia Cardoso', 'Mateus Araújo', 'Gabriela Mendes', 'Felipe Castro', 'Bianca Moreira',
        'Rodrigo Azevedo', 'Natália Reis', 'Vinicius Correia', 'Amanda Teixeira', 'Gustavo Nunes',
        'Isabella Freitas', 'Diego Carvalho', 'Sophia Ramos', 'Henrique Monteiro', 'Yasmin Torres',
        'Leonardo Pinto', 'Manuela Cruz', 'Ricardo Fernandes', 'Eduarda Campos', 'Marcelo Vieira',
        'Luana Rodrigues', 'Guilherme Miranda', 'Beatriz Santana', 'Caio Nascimento', 'Marina Sales',
        'Daniel Caldeira', 'Renata Moraes', 'Victor Hugo', 'Carolina Machado', 'Samuel Lopes',
        'Isadora Cunha', 'Nicolas Borges', 'Valentina Duarte', 'Arthur Melo', 'Giovanna Farias',
      ];

      for (let i = 0; i < nomesBrasileiros.length; i++) {
        const nome = nomesBrasileiros[i];
        const email = nome.toLowerCase().replace(' ', '.') + '@email.com';
        const bairro = bairros[Math.floor(Math.random() * bairros.length)];
        
        // Pontos variados para criar um ranking interessante
        const totalPoints = Math.floor(Math.random() * 2000) + 100;
        const moedas = Math.floor(totalPoints * 0.1) + Math.floor(Math.random() * 500);
        
        // Algumas medalhas aleatórias
        const medalhas = [];
        if (totalPoints > 500) medalhas.push('Primeira Vitória');
        if (totalPoints > 1000) medalhas.push('Especialista');
        if (totalPoints > 1500) medalhas.push('Mestre dos Palpites');
        if (Math.random() > 0.7) medalhas.push('Sequência de Ouro');

        await this.usersService.create({
          nome: nome,
          email,
          password: '123456', // Senha padrão para testes
          // Campos do onboarding para usuários de seed
          data_nascimento: new Date(1990 + Math.floor(Math.random() * 20), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          telefone: `(11) 9${Math.floor(Math.random() * 10000)}-${Math.floor(Math.random() * 10000)}`,
          cidade: bairro.cidade,
          estado: bairro.estado,
          bairroId: (bairro as any)._id.toString(),
        });

        // Atualizar pontos e moedas do usuário criado
        const user = await this.usersService.findByEmail(email);
        if (user) {
          user.totalPoints = totalPoints;
          user.moedas = moedas;
          user.medals = medalhas;
          await user.save();

          // Atualizar pontos do bairro
          await this.bairrosService.updateTotalPoints((bairro as any)._id.toString(), totalPoints);
        }
      }
      
      this.logger.log(`✅ ${nomesBrasileiros.length} usuários criados com rankings realistas!`);
    } catch (error) {
      this.logger.error('Erro ao criar usuários:', error);
    }
  }

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
      this.logger.log('⚽ Verificando se já existem jogos...');
      
      // Verificar se já existem jogos no banco
      const jogosExistentes = await this.jogosService.findAll();
      
      if (jogosExistentes.length > 0) {
        this.logger.log(`📦 ${jogosExistentes.length} jogos já existem no banco, pulando sincronização inicial...`);
        return;
      }
      
      this.logger.log('🌱 Sincronizando apenas jogos de hoje para inicialização rápida...');
      
      // Sincronizar apenas hoje para inicialização rápida
      const hoje = new Date().toISOString().split('T')[0];
      
      try {
        const resultado = await this.jogosService.forcarSincronizacao(hoje);
        this.logger.log(`✅ Sincronização inicial: ${resultado.totalJogos} jogos encontrados para hoje`);
      } catch (error) {
        this.logger.warn(`Erro na sincronização inicial:`, error.message);
      }
      
      this.logger.log('💡 Use o endpoint /api/jogos/sincronizar/{data} para sincronizar outras datas conforme necessário');
    } catch (error) {
      this.logger.error('Erro ao verificar/sincronizar jogos:', error);
    }
  }

  private async seedPalpites() {
    try {
      this.logger.log('🎯 Criando palpites históricos...');
      
      const users = await this.usersService.getRankingIndividual();
      const jogosEncerrados = await this.jogosService.findAll();
      
      // Para cada jogo encerrado, criar palpites de alguns usuários
      for (const jogo of jogosEncerrados.filter(j => j.status === 'encerrado')) {
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
          const acertouPlacar = (
            jogo.resultado.timeA === palpiteA && 
            jogo.resultado.timeB === palpiteB
          );
          
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
      
      for (const user of users.data) {
        // Criar algumas transações históricas para cada usuário
        const numTransacoes = Math.floor(Math.random() * 15) + 5;
        
        for (let i = 0; i < numTransacoes; i++) {
          const dataTransacao = new Date();
          dataTransacao.setDate(dataTransacao.getDate() - Math.floor(Math.random() * 60));
          
          const tipoTransacao = Math.random() > 0.7 ? 'gasto' : 'ganho';
          
          if (tipoTransacao === 'ganho') {
            const quantidade = Math.floor(Math.random() * 100) + 10;
            const origens = ['palpite_correto', 'bonus_diario', 'conquista', 'primeira_vitoria'];
            const origem = origens[Math.floor(Math.random() * origens.length)];
            
            await this.transacoesMoedasService.registrarGanho(
              user._id.toString(),
              origem,
              quantidade,
              `Moedas ganhas por ${origem.replace('_', ' ')}`
            );
          } else {
            const quantidade = Math.floor(Math.random() * 50) + 5;
            const origens = ['loja_avatar', 'loja_tema', 'boost_palpite'];
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
      
      this.logger.log(`✅ Histórico de transações criado!`);
    } catch (error) {
      this.logger.error('Erro ao criar transações:', error);
    }
  }

  private getResultado(golsA: number, golsB: number): 'vitoria_a' | 'empate' | 'vitoria_b' {
    if (golsA > golsB) return 'vitoria_a';
    if (golsA < golsB) return 'vitoria_b';
    return 'empate';
  }
}
