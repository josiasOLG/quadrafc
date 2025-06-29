import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { Bairro, BairroDocument } from '../../shared/schemas/bairro.schema';
import { User, UserDocument } from '../../shared/schemas/user.schema';
import { PremiumAccessService } from '../../shared/services/premium-access.service';

@Injectable()
export class BairrosService {
  constructor(
    @InjectModel(Bairro.name) private bairroModel: Model<BairroDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private premiumAccessService: PremiumAccessService
  ) {}

  async findAll(): Promise<Bairro[]> {
    return this.bairroModel.find().exec();
  }

  async findAllPaginated(
    paginationDto: PaginationDto,
    cidade?: string,
    estado?: string
  ): Promise<{ data: Bairro[]; total: number }> {
    const filter: any = {};

    if (cidade) filter.cidade = cidade;
    if (estado) filter.estado = estado;

    const [data, total] = await Promise.all([
      this.bairroModel.find(filter).skip(paginationDto.skip).limit(paginationDto.limit).exec(),
      this.bairroModel.countDocuments(filter).exec(),
    ]);

    return { data, total };
  }

  async findById(id: string): Promise<Bairro> {
    return this.bairroModel.findById(id).exec();
  }

  async findByCidade(cidade: string, estado: string): Promise<Bairro[]> {
    return this.bairroModel.find({ cidade, estado }).exec();
  }

  async search(
    searchTerm: string,
    paginationDto: PaginationDto,
    cidade?: string
  ): Promise<{ data: Bairro[]; total: number }> {
    const filter: any = {};

    if (cidade) {
      filter.cidade = cidade;
    }

    if (searchTerm && searchTerm.trim()) {
      filter.$or = [
        { nome: { $regex: searchTerm, $options: 'i' } },
        { cidade: { $regex: searchTerm, $options: 'i' } },
        { estado: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.bairroModel
        .find(filter)
        .sort({ nome: 1 })
        .skip(paginationDto.skip)
        .limit(paginationDto.limit)
        .exec(),
      this.bairroModel.countDocuments(filter).exec(),
    ]);

    return { data, total };
  }

  async create(createBairroDto: Partial<Bairro>): Promise<Bairro> {
    const createdBairro = new this.bairroModel(createBairroDto);
    return createdBairro.save();
  }

  async updateTotalPoints(bairroId: string, pontos: number): Promise<Bairro> {
    return this.bairroModel
      .findByIdAndUpdate(bairroId, { $inc: { totalPoints: pontos } }, { new: true })
      .exec();
  }

  async getRankingBairros(
    paginationDto?: PaginationDto
  ): Promise<{ data: Bairro[]; total: number }> {
    if (paginationDto) {
      const [data, total] = await Promise.all([
        this.bairroModel
          .find()
          .sort({ totalPoints: -1 })
          .skip(paginationDto.skip)
          .limit(paginationDto.limit)
          .exec(),
        this.bairroModel.countDocuments().exec(),
      ]);

      return { data, total };
    }

    const data = await this.bairroModel.find().sort({ totalPoints: -1 }).limit(10).exec();

    return { data, total: data.length };
  }

  // Ranking de bairros da mesma cidade do usuário (gratuito)
  async getRankingBairrosPorCidade(
    userId: string,
    paginationDto: PaginationDto
  ): Promise<{ data: Bairro[]; total: number }> {
    // Buscar o usuário e seu bairro
    const user = await this.userModel.findById(userId).populate('bairroId').exec();
    if (!user || !user.bairroId) {
      throw new ForbiddenException('Usuário não encontrado ou sem bairro definido');
    }

    const userBairro = user.bairroId as any;
    const cidade = userBairro.cidade;
    const estado = userBairro.estado;

    const [data, total] = await Promise.all([
      this.bairroModel
        .find({ cidade, estado })
        .sort({ totalPoints: -1 })
        .skip(paginationDto.skip)
        .limit(paginationDto.limit)
        .exec(),
      this.bairroModel.countDocuments({ cidade, estado }).exec(),
    ]);

    return { data, total };
  }

  // Ranking nacional (premium - custo em moedas)
  async getRankingNacional(
    userId: string,
    paginationDto: PaginationDto
  ): Promise<{ data: Bairro[]; total: number }> {
    // Verificar se usuário tem acesso nacional
    const temAcesso = await this.premiumAccessService.temAcessoNacional(userId);

    if (!temAcesso) {
      throw new ForbiddenException(
        'Você não tem acesso ao ranking nacional. Compre o acesso premium.'
      );
    }

    const [data, total] = await Promise.all([
      this.bairroModel
        .find()
        .sort({ totalPoints: -1 })
        .skip(paginationDto.skip)
        .limit(paginationDto.limit)
        .exec(),
      this.bairroModel.countDocuments().exec(),
    ]);

    return { data, total };
  }

  // Ranking por estado específico (premium)
  async getRankingPorEstado(
    userId: string,
    estado: string,
    paginationDto: PaginationDto
  ): Promise<{ data: Bairro[]; total: number }> {
    // Verificar se usuário tem acesso a este estado
    const temAcesso = await this.premiumAccessService.temAcessoEstado(userId, estado);

    if (!temAcesso) {
      throw new ForbiddenException(
        `Você não tem acesso ao ranking do estado ${estado}. Compre o acesso premium.`
      );
    }

    const [data, total] = await Promise.all([
      this.bairroModel
        .find({ estado })
        .sort({ totalPoints: -1 })
        .skip(paginationDto.skip)
        .limit(paginationDto.limit)
        .exec(),
      this.bairroModel.countDocuments({ estado }).exec(),
    ]);

    return { data, total };
  }
}
