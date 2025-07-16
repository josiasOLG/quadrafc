import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePalpiteDto } from '../../shared/dto/create-palpite.dto';
import { Palpite, PalpiteDocument } from '../../shared/schemas/palpite.schema';
import { JogosService } from '../jogos/jogos.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class PalpitesService {
  constructor(
    @InjectModel(Palpite.name) private palpiteModel: Model<PalpiteDocument>,
    private jogosService: JogosService,
    private usersService: UsersService
  ) {}

  async create(userId: string, createPalpiteDto: CreatePalpiteDto): Promise<Palpite> {
    // Verificar limite de palpites diários
    const podePalpitar = await this.usersService.verificarLimitePalpites(userId);
    if (!podePalpitar) {
      const status = await this.usersService.obterStatusPalpites(userId);
      throw new BadRequestException(
        `Limite diário de palpites atingido. Você já fez ${status.palpitesHoje} de ${status.limiteDiario} palpites hoje.`
      );
    }

    // Verificar se o jogo existe
    const jogo = await this.jogosService.findById(createPalpiteDto.jogoId);
    if (!jogo) {
      throw new NotFoundException('Jogo não encontrado');
    }

    // Verificar se o jogo ainda está aberto para palpites
    if (new Date() >= new Date(jogo.data)) {
      throw new BadRequestException('Este jogo não está mais aberto para palpites');
    }

    // Verificar se o usuário já fez palpite para este jogo
    const existingPalpite = await this.palpiteModel.findOne({
      userId,
      jogoId: createPalpiteDto.jogoId,
    });

    if (existingPalpite) {
      throw new ConflictException('Você já fez um palpite para este jogo');
    }

    // Criar palpite
    const createdPalpite = new this.palpiteModel({
      userId,
      jogoId: createPalpiteDto.jogoId,
      palpite: {
        timeA: createPalpiteDto.timeA,
        timeB: createPalpiteDto.timeB,
      },
    });

    const savedPalpite = await createdPalpite.save();

    // Incrementar contador de palpites do usuário
    await this.usersService.incrementarContadorPalpites(userId);

    // Adicionar campeonato ao array de campeonatos do usuário (único)
    await this.usersService.addCampeonatoToUser(userId, jogo.campeonato);

    // Adiciona o palpite ao array de palpites do jogo
    await this.jogosService.addPalpiteToJogo(
      createPalpiteDto.jogoId.toString(),
      savedPalpite._id.toString()
    );

    return savedPalpite;
  }

  async findByUser(userId: string): Promise<Palpite[]> {
    return this.palpiteModel.find({ userId }).populate('jogoId').exec();
  }

  async findByJogo(jogoId: string): Promise<Palpite[]> {
    return this.palpiteModel.find({ jogoId }).populate('userId').exec();
  }

  async findByUserAndJogo(userId: string, jogoId: string): Promise<Palpite> {
    return this.palpiteModel.findOne({ userId, jogoId }).populate('jogoId').exec();
  }

  async processarPalpites(jogoId: string, resultado: any): Promise<void> {
    const palpites = await this.palpiteModel.find({ jogoId });

    for (const palpite of palpites) {
      let pontos = 0;
      let moedasGanhas = 0;
      let acertouPlacar = false;
      let acertouResultado = false;

      // Verificar se acertou o placar exato
      if (palpite.palpite.timeA === resultado.timeA && palpite.palpite.timeB === resultado.timeB) {
        acertouPlacar = true;
        pontos = 10;
        moedasGanhas = 50;
      }
      // Verificar se acertou o resultado (vitória/empate/derrota)
      else if (this.verificarResultado(palpite.palpite, resultado)) {
        acertouResultado = true;
        pontos = 5;
        moedasGanhas = 20;
      }

      // Atualizar palpite
      await this.palpiteModel.findByIdAndUpdate(palpite._id, {
        acertouPlacar,
        acertouResultado,
        pontos,
        moedasGanhas,
      });
    }
  }

  private verificarResultado(palpite: any, resultado: any): boolean {
    const palpiteResultado = this.obterResultado(palpite.timeA, palpite.timeB);
    const jogoResultado = this.obterResultado(resultado.timeA, resultado.timeB);
    return palpiteResultado === jogoResultado;
  }

  private obterResultado(timeA: number, timeB: number): string {
    if (timeA > timeB) return 'vitoria_a';
    if (timeA < timeB) return 'vitoria_b';
    return 'empate';
  }

  async obterStatusPalpitesUsuario(userId: string): Promise<{
    palpitesHoje: number;
    limiteDiario: number;
    podesPalpitar: boolean;
    restantes: number;
  }> {
    return this.usersService.obterStatusPalpites(userId);
  }
}
