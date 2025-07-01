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

  async findOrCreate(bairroData: {
    nome: string;
    cidade: string;
    estado: string;
    pais?: string;
    cep?: string;
  }): Promise<Bairro> {
    // Primeiro, tenta encontrar o bairro existente
    let bairro = await this.bairroModel
      .findOne({
        nome: bairroData.nome,
        cidade: bairroData.cidade,
        estado: bairroData.estado,
      })
      .exec();

    // Se não existe, cria um novo
    if (!bairro) {
      const novoBairro = new this.bairroModel({
        nome: bairroData.nome,
        cidade: bairroData.cidade,
        estado: bairroData.estado,
        pais: bairroData.pais || 'Brasil',
        cep: bairroData.cep,
        totalPoints: 0,
      });
      bairro = await novoBairro.save();
    }

    return bairro;
  }

  async updateTotalPoints(bairroId: string, pontos: number): Promise<Bairro> {
    return this.bairroModel
      .findByIdAndUpdate(bairroId, { $inc: { totalPoints: pontos } }, { new: true })
      .exec();
  }

  async setTotalPoints(bairroId: string, totalPoints: number): Promise<Bairro> {
    return this.bairroModel.findByIdAndUpdate(bairroId, { totalPoints }, { new: true }).exec();
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
    // Buscar o usuário e verificar se tem localização definida
    const user = await this.userModel.findById(userId).exec();
    if (!user || !user.cidade || !user.estado) {
      throw new ForbiddenException('Usuário não encontrado ou sem localização definida');
    }

    const cidade = user.cidade;
    const estado = user.estado;

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

  async createWithValidation(createBairroDto: {
    nome: string;
    cidade: string;
    estado: string;
    cep?: string;
  }): Promise<{ success: boolean; bairro?: Bairro; message: string; similares?: Bairro[] }> {
    try {
      // Normalizar o nome do bairro
      const nomeNormalizado = createBairroDto.nome.trim();

      // Verificar se já existe um bairro com mesmo nome, cidade e estado
      const bairroExistente = await this.bairroModel
        .findOne({
          nome: { $regex: new RegExp(`^${nomeNormalizado}$`, 'i') },
          cidade: { $regex: new RegExp(`^${createBairroDto.cidade}$`, 'i') },
          estado: createBairroDto.estado.toUpperCase(),
        })
        .exec();

      if (bairroExistente) {
        return {
          success: true,
          message: 'Bairro encontrado com sucesso!',
          bairro: bairroExistente,
        };
      }

      // Buscar bairros similares
      const bairrosSimilares = await this.buscarBairrosSimilares(
        nomeNormalizado,
        createBairroDto.cidade,
        createBairroDto.estado
      );

      if (bairrosSimilares.length > 0) {
        return {
          success: false,
          message: 'Encontramos bairros similares. Verifique se não é um deles:',
          similares: bairrosSimilares,
        };
      }

      // Criar o novo bairro
      const novoBairro = new this.bairroModel({
        nome: nomeNormalizado,
        cidade: createBairroDto.cidade,
        estado: createBairroDto.estado.toUpperCase(),
        pais: 'Brasil',
        cep: createBairroDto.cep,
        totalPoints: 0,
      });

      const bairroSalvo = await novoBairro.save();

      return {
        success: true,
        bairro: bairroSalvo,
        message: 'Bairro criado com sucesso!',
      };
    } catch (error) {
      return {
        success: false,
        message: `Erro ao criar bairro: ${error.message}`,
      };
    }
  }

  /**
   * Busca bairros similares para evitar duplicatas
   */
  private async buscarBairrosSimilares(
    nomeBairro: string,
    cidade: string,
    estado: string
  ): Promise<Bairro[]> {
    const nomeNormalizado = this.normalizarNome(nomeBairro);

    try {
      // Busca bairros na mesma cidade
      const bairros = await this.bairroModel
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

        // Verifica se um contém o outro
        if (
          nomeExistenteNormalizado.includes(nomeNormalizado) ||
          nomeNormalizado.includes(nomeExistenteNormalizado)
        )
          return true;

        // Verifica similaridade
        return this.calcularSimilaridade(nomeNormalizado, nomeExistenteNormalizado) > 0.75;
      });

      return bairrosSimilares;
    } catch (error) {
      return [];
    }
  }

  /**
   * Normaliza o nome do bairro para comparação
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
   * Calcula similaridade entre duas strings
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
}
