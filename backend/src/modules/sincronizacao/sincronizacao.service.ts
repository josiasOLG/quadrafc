import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { Palpite, PalpiteDocument } from '../../shared/schemas/palpite.schema';
import { User, UserDocument } from '../../shared/schemas/user.schema';
import { FootballApiService } from '../football-api/football-api.service';
import { JogosService } from '../jogos/jogos.service';

@Injectable()
export class SincronizacaoService {
  private readonly logger = new Logger(SincronizacaoService.name);

  constructor(
    private readonly jogosService: JogosService,
    private readonly footballApiService: FootballApiService,
    @InjectModel(Palpite.name) private palpiteModel: Model<PalpiteDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ) {}

  // Os CRONs antigos de sincronização periódica e diária foram removidos conforme solicitado

  // Método para sincronização manual via API
  async sincronizarManual(data: string): Promise<any> {
    this.logger.log(`Iniciando sincronização manual para ${data}...`);

    try {
      const resultado = await this.jogosService.forcarSincronizacao(data);
      this.logger.log(`Sincronização manual concluída para ${data}: ${resultado.totalJogos} jogos`);
      return resultado;
    } catch (error) {
      this.logger.error(`Erro na sincronização manual para ${data}:`, error.message);
      throw error;
    }
  }

  // Executa exatamente 15 vezes por dia para economizar requisições à API
  @Cron('0 0,1,3,5,7,9,11,13,15,17,19,21,22,23 * * *', {
    name: 'verificar-jogos-finalizados',
    timeZone: 'America/Sao_Paulo',
  })
  async verificarJogosFinalizados() {
    this.logger.log('Iniciando verificação de jogos finalizados...');

    try {
      // Buscar jogos que ainda estão abertos mas já passaram da data de realização
      const jogosParaVerificar = await this.jogosService.findJogosParaProcessar();

      if (jogosParaVerificar.length === 0) {
        this.logger.log('Nenhum jogo pendente para verificar.');
        return;
      }

      this.logger.log(`Encontrados ${jogosParaVerificar.length} jogos para verificar status.`);

      for (const jogo of jogosParaVerificar) {
        try {
          // Buscar informações atualizadas do jogo na API externa
          const jogoAtualizado = await this.footballApiService.getJogoDetalhes(jogo.codigoAPI);

          // Verificar se o jogo já terminou
          if (jogoAtualizado.match.status === 'FINISHED') {
            this.logger.log(
              `Jogo #${jogo.codigoAPI} (${jogo.timeA.nome} x ${jogo.timeB.nome}) finalizado. Processando resultado...`
            );

            // Extrair placar final
            const placarFinal = {
              timeA: jogoAtualizado.match.score.fullTime.homeTeam || 0,
              timeB: jogoAtualizado.match.score.fullTime.awayTeam || 0,
            };

            // Atualizar status e resultado do jogo no banco de dados
            await this.jogosService.updateResultado(jogo._id.toString(), placarFinal);

            // Processar palpites e atribuir pontos
            await this.processarPalpites(jogo._id.toString(), placarFinal);
          } else {
            this.logger.log(
              `Jogo #${jogo.codigoAPI} ainda não finalizado. Status atual: ${jogoAtualizado.match.status}`
            );
          }
        } catch (error) {
          this.logger.error(`Erro ao processar jogo ${jogo._id}:`, error.message);
        }
      }

      this.logger.log('Verificação de jogos finalizados concluída.');
    } catch (error) {
      this.logger.error('Erro na verificação de jogos finalizados:', error.message);
    }
  }

  // Executa uma vez por dia para verificar jogos dos últimos 7 dias (usando menos requisições)
  @Cron('0 2 * * *', {
    name: 'verificar-jogos-ultimos-dias',
    timeZone: 'America/Sao_Paulo',
  })
  async verificarJogosUltimosDias() {
    this.logger.log('Iniciando verificação de jogos dos últimos 7 dias...');

    try {
      const hoje = new Date();

      // Verificar jogos dos últimos 7 dias
      for (let i = 0; i < 7; i++) {
        const data = new Date(hoje);
        data.setDate(data.getDate() - i);
        const dataStr = data.toISOString().split('T')[0];

        this.logger.log(`Verificando jogos para a data ${dataStr}...`);

        // Buscar jogos desta data
        const jogos = await this.jogosService.findByData(dataStr);

        // Filtrar apenas jogos que ainda estão abertos
        const jogosAbertos = jogos.jogos.filter((jogo) => jogo.status === 'aberto');

        if (jogosAbertos.length === 0) {
          this.logger.log(`Nenhum jogo aberto encontrado para ${dataStr}.`);
          continue;
        }

        this.logger.log(
          `Encontrados ${jogosAbertos.length} jogos abertos para verificar em ${dataStr}.`
        );

        // Processar cada jogo
        for (const jogo of jogosAbertos) {
          try {
            // Buscar informações atualizadas do jogo na API externa
            const jogoAtualizado = await this.footballApiService.getJogoDetalhes(jogo.codigoAPI);

            // Verificar se o jogo já terminou
            if (jogoAtualizado.match.status === 'FINISHED') {
              this.logger.log(
                `Jogo #${jogo.codigoAPI} (${jogo.timeA.nome} x ${jogo.timeB.nome}) finalizado. Processando resultado...`
              );

              // Extrair placar final
              const placarFinal = {
                timeA: jogoAtualizado.match.score.fullTime.homeTeam || 0,
                timeB: jogoAtualizado.match.score.fullTime.awayTeam || 0,
              };

              // Atualizar status e resultado do jogo no banco de dados
              await this.jogosService.updateResultado(jogo._id.toString(), placarFinal);

              // Processar palpites e atribuir pontos
              await this.processarPalpites(jogo._id.toString(), placarFinal);
            }
          } catch (error) {
            this.logger.error(
              `Erro ao processar jogo ${jogo._id} da data ${dataStr}:`,
              error.message
            );
          }
        }
      }

      this.logger.log('Verificação de jogos dos últimos 7 dias concluída.');
    } catch (error) {
      this.logger.error('Erro na verificação de jogos dos últimos 7 dias:', error.message);
    }
  }

  // Método para verificação manual de jogos finalizados de períodos passados
  async verificarJogosFinalizadosManual() {
    this.logger.log('Iniciando verificação manual de jogos finalizados de períodos passados...');

    try {
      const hoje = new Date();

      // Verificar jogos dos últimos 7 dias
      for (let i = 0; i < 7; i++) {
        const data = new Date(hoje);
        data.setDate(data.getDate() - i);
        const dataStr = data.toISOString().split('T')[0];

        this.logger.log(`Verificando jogos para a data ${dataStr}...`);

        // Buscar jogos desta data
        const jogos = await this.jogosService.findByData(dataStr);

        // Filtrar apenas jogos que ainda estão abertos
        const jogosAbertos = jogos.jogos.filter((jogo) => jogo.status === 'aberto');

        if (jogosAbertos.length === 0) {
          this.logger.log(`Nenhum jogo aberto encontrado para ${dataStr}.`);
          continue;
        }

        this.logger.log(
          `Encontrados ${jogosAbertos.length} jogos abertos para verificar em ${dataStr}.`
        );

        // Processar cada jogo
        for (const jogo of jogosAbertos) {
          try {
            // Buscar informações atualizadas do jogo na API externa
            const jogoAtualizado = await this.footballApiService.getJogoDetalhes(jogo.codigoAPI);

            // Verificar se o jogo já terminou
            if (jogoAtualizado.match.status === 'FINISHED') {
              this.logger.log(
                `Jogo #${jogo.codigoAPI} (${jogo.timeA.nome} x ${jogo.timeB.nome}) finalizado. Processando resultado...`
              );

              // Extrair placar final
              const placarFinal = {
                timeA: jogoAtualizado.match.score.fullTime.homeTeam || 0,
                timeB: jogoAtualizado.match.score.fullTime.awayTeam || 0,
              };

              // Atualizar status e resultado do jogo no banco de dados
              await this.jogosService.updateResultado(jogo._id.toString(), placarFinal);

              // Processar palpites e atribuir pontos
              await this.processarPalpites(jogo._id.toString(), placarFinal);
            }
          } catch (error) {
            this.logger.error(
              `Erro ao processar jogo ${jogo._id} da data ${dataStr}:`,
              error.message
            );
          }
        }
      }

      this.logger.log('Verificação manual de jogos finalizados concluída.');
      return {
        success: true,
        message: 'Verificação manual de jogos finalizados concluída com sucesso.',
      };
    } catch (error) {
      this.logger.error('Erro na verificação manual de jogos finalizados:', error.message);
      throw error;
    }
  }

  // Método para processar palpites e atribuir pontos aos usuários
  private async processarPalpites(jogoId: string, placarFinal: { timeA: number; timeB: number }) {
    this.logger.log(`Processando palpites para o jogo ${jogoId}...`);

    try {
      // Buscar todos os palpites para este jogo
      const palpites = await this.palpiteModel.find({ jogoId }).exec();

      if (palpites.length === 0) {
        this.logger.log(`Nenhum palpite encontrado para o jogo ${jogoId}.`);
        return;
      }

      this.logger.log(`Encontrados ${palpites.length} palpites para processar.`);

      // Processar cada palpite e atribuir pontos aos usuários que acertaram
      for (const palpite of palpites) {
        // Verificar se o palpite já foi processado (verificando se pontos > 0)
        if (palpite.pontos > 0) {
          this.logger.log(`Palpite ${palpite._id} já foi processado anteriormente.`);
          continue;
        }

        // Comparar palpite com resultado final para verificar acerto de placar exato
        const acertouPlacar =
          palpite.palpite.timeA === placarFinal.timeA &&
          palpite.palpite.timeB === placarFinal.timeB;

        // Verificar se acertou o resultado (vitória, derrota ou empate)
        const resultadoReal =
          placarFinal.timeA > placarFinal.timeB
            ? 'vitoria_casa'
            : placarFinal.timeA < placarFinal.timeB
              ? 'vitoria_visitante'
              : 'empate';

        const resultadoPalpite =
          palpite.palpite.timeA > palpite.palpite.timeB
            ? 'vitoria_casa'
            : palpite.palpite.timeA < palpite.palpite.timeB
              ? 'vitoria_visitante'
              : 'empate';

        const acertouResultado = resultadoReal === resultadoPalpite;

        // Definir pontuação de acordo com o acerto
        let pontos = 0;
        let moedasGanhas = 0;

        if (acertouPlacar) {
          pontos = 3; // Pontuação maior para acerto de placar exato
          moedasGanhas = 10;
        } else if (acertouResultado) {
          pontos = 1; // Pontuação menor para acerto apenas do resultado
          moedasGanhas = 3;
        }

        // Atualizar palpite
        await this.palpiteModel.findByIdAndUpdate(
          palpite._id,
          {
            acertouPlacar,
            acertouResultado,
            pontos,
            moedasGanhas,
          },
          { new: true }
        );

        // Se ganhou pontos, atualizar pontuação do usuário
        if (pontos > 0) {
          this.logger.log(
            `Usuário ${palpite.userId} ganhou ${pontos} pontos pelo palpite para o jogo ${jogoId}`
          );

          // Atualizar pontuação e moedas do usuário
          await this.userModel.findByIdAndUpdate(palpite.userId, {
            $inc: {
              pontos: pontos,
              palpites_corretos: 1,
              sequencia_atual: 1,
              moedas: moedasGanhas,
            },
          });
        } else {
          // Usuário errou - apenas incrementa total de palpites e zera sequência
          await this.userModel.findByIdAndUpdate(palpite.userId, {
            $inc: { total_palpites: 1 },
            $set: { sequencia_atual: 0 },
          });

          this.logger.log(`Usuário ${palpite.userId} errou o palpite para o jogo ${jogoId}.`);
        }
      }

      this.logger.log(`Processamento de palpites para o jogo ${jogoId} concluído.`);
    } catch (error) {
      this.logger.error(`Erro ao processar palpites para o jogo ${jogoId}:`, error.message);
    }
  }
}
