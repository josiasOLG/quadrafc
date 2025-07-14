import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { RegisterDto } from '../../shared/dto/register.dto';
import { User, UserDocument } from '../../shared/schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: RegisterDto): Promise<UserDocument> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const createdUser = new this.userModel({
      ...createUserDto,
      passwordHash: hashedPassword,
    });

    return createdUser.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('-passwordHash').exec();
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async updateMoedas(userId: string, quantidade: number): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { $inc: { moedas: quantidade } }, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async updateTotalPoints(userId: string, pontos: number): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { $inc: { totalPoints: pontos } }, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async addMedal(userId: string, medal: string): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { $addToSet: { medals: medal } }, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async getRankingIndividual(paginationDto?: {
    page: number;
    limit: number;
    skip: number;
  }): Promise<{ data: UserDocument[]; total: number }> {
    if (paginationDto) {
      const [data, total] = await Promise.all([
        this.userModel
          .find()
          .sort({ totalPoints: -1 })
          .skip(paginationDto.skip)
          .limit(paginationDto.limit)
          .exec(),
        this.userModel.countDocuments().exec(),
      ]);

      return { data, total };
    }

    const data = await this.userModel.find().sort({ totalPoints: -1 }).limit(10).exec();

    return { data, total: data.length };
  }

  async updateProfile(userId: string, updateData: Partial<User>): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(userId, updateData, { new: true }).exec();

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async findAll(
    paginationDto: { page: number; limit: number },
    filters?: {
      search?: string;
      ativo?: boolean;
      assinaturaPremium?: boolean;
      banned?: boolean;
    }
  ): Promise<{ data: UserDocument[]; total: number }> {
    const query: any = {};

    // Aplicar filtros
    if (filters) {
      if (filters.search) {
        query.$or = [
          { nome: { $regex: filters.search, $options: 'i' } },
          { email: { $regex: filters.search, $options: 'i' } },
        ];
      }

      if (filters.ativo !== undefined) {
        query.ativo = filters.ativo;
      }

      if (filters.assinaturaPremium !== undefined) {
        query.assinaturaPremium = filters.assinaturaPremium;
      }

      if (filters.banned !== undefined) {
        query.banned = filters.banned;
      }
    }

    const skip = (paginationDto.page - 1) * paginationDto.limit;

    const [data, total] = await Promise.all([
      this.userModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(paginationDto.limit)
        .select('-passwordHash') // Não retornar senha
        .exec(),
      this.userModel.countDocuments(query).exec(),
    ]);

    return { data, total };
  }

  async searchUsers(
    paginationDto: { page: number; limit: number },
    filters?: {
      nome?: string;
      email?: string;
      bairro?: string;
      cidade?: string;
      search?: string;
      ativo?: boolean;
      assinaturaPremium?: boolean;
      banned?: boolean;
      isAdmin?: boolean;
    }
  ): Promise<{ data: UserDocument[]; total: number }> {
    const query: any = {};
    const orConditions = [];

    // Aplicar filtros de busca avançada
    if (filters) {
      // Busca global - procura em nome, email, bairro e cidade
      if (filters.search) {
        const searchTerm = filters.search.trim();
        orConditions.push(
          { nome: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } },
          { bairro: { $regex: searchTerm, $options: 'i' } },
          { cidade: { $regex: searchTerm, $options: 'i' } }
        );
      }

      // Busca por nome - pode incluir email se o usuário digitou email no campo nome
      if (filters.nome) {
        const searchTerm = filters.nome.trim();
        // Se o termo de busca contém @ ou parece ser um email, buscar em ambos os campos
        if (searchTerm.includes('@') || /\S+@\S+\.\S+/.test(searchTerm)) {
          orConditions.push(
            { nome: { $regex: searchTerm, $options: 'i' } },
            { email: { $regex: searchTerm, $options: 'i' } }
          );
        } else {
          // Busca normal por nome, mas também inclui busca parcial no email
          orConditions.push(
            { nome: { $regex: searchTerm, $options: 'i' } },
            { email: { $regex: searchTerm, $options: 'i' } }
          );
        }
      }

      // Busca específica por email
      if (filters.email) {
        const emailTerm = filters.email.trim();
        orConditions.push({ email: { $regex: emailTerm, $options: 'i' } });
      }

      // Filtros de localização
      if (filters.bairro) {
        query.bairro = { $regex: filters.bairro.trim(), $options: 'i' };
      }

      if (filters.cidade) {
        query.cidade = { $regex: filters.cidade.trim(), $options: 'i' };
      }

      // Filtros booleanos - usar valores exatos
      if (filters.ativo !== undefined && filters.ativo !== null) {
        query.ativo = filters.ativo;
      }

      if (filters.assinaturaPremium !== undefined && filters.assinaturaPremium !== null) {
        query.assinaturaPremium = filters.assinaturaPremium;
      }

      if (filters.banned !== undefined && filters.banned !== null) {
        query.banned = filters.banned;
      }

      if (filters.isAdmin !== undefined && filters.isAdmin !== null) {
        query.isAdmin = filters.isAdmin;
      }

      // Aplicar condições OR se existirem
      if (orConditions.length > 0) {
        query.$or = orConditions;
      }
    }

    const skip = (paginationDto.page - 1) * paginationDto.limit;

    try {
      const [data, total] = await Promise.all([
        this.userModel
          .find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(paginationDto.limit)
          .select('-passwordHash') // Não retornar senha
          .lean() // Usar lean() para melhor performance
          .exec(),
        this.userModel.countDocuments(query).exec(),
      ]);

      return { data: data as UserDocument[], total };
    } catch (error) {
      // Log do erro para debug
      console.error('Erro na busca de usuários:', error);
      throw error;
    }
  }

  async verificarLimitePalpites(userId: string): Promise<boolean> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se precisa resetar o contador diário
    const hoje = new Date();
    const ultimoReset = new Date(user.ultimoResetPalpites);

    // Se é um dia diferente, resetar contador
    if (hoje.toDateString() !== ultimoReset.toDateString()) {
      await this.resetarContadorPalpitesDiario(userId);
      return true; // Pode palpitar após reset
    }

    // Determinar limite baseado na assinatura
    const limiteDiario = this.obterLimitePalpitesDiario(user);

    // Verificar se ainda pode palpitar
    return user.palpitesHoje < limiteDiario;
  }

  async incrementarContadorPalpites(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se precisa resetar o contador diário
    const hoje = new Date();
    const ultimoReset = new Date(user.ultimoResetPalpites);

    if (hoje.toDateString() !== ultimoReset.toDateString()) {
      await this.resetarContadorPalpitesDiario(userId);
    }

    await this.userModel
      .findByIdAndUpdate(userId, { $inc: { palpitesHoje: 1 } }, { new: true })
      .exec();
  }

  async obterStatusPalpites(userId: string): Promise<{
    palpitesHoje: number;
    limiteDiario: number;
    podesPalpitar: boolean;
    restantes: number;
  }> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se precisa resetar o contador diário
    const hoje = new Date();
    const ultimoReset = new Date(user.ultimoResetPalpites);

    let palpitesHoje = user.palpitesHoje;

    if (hoje.toDateString() !== ultimoReset.toDateString()) {
      palpitesHoje = 0; // Reset virtual para cálculo
    }

    const limiteDiario = this.obterLimitePalpitesDiario(user);
    const restantes = Math.max(0, limiteDiario - palpitesHoje);
    const podesPalpitar = restantes > 0;

    return {
      palpitesHoje,
      limiteDiario,
      podesPalpitar,
      restantes,
    };
  }

  private async resetarContadorPalpitesDiario(userId: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          palpitesHoje: 0,
          ultimoResetPalpites: new Date(),
        },
        { new: true }
      )
      .exec();
  }

  private obterLimitePalpitesDiario(user: UserDocument): number {
    // Se tem assinatura premium ativa
    if (this.temAssinaturaPremiumAtiva(user)) {
      return 15; // Premium pode fazer 15 palpites por dia
    }

    // Usar o limite personalizado do usuário ou padrão
    return user.limitePalpitesDia || 5;
  }

  private temAssinaturaPremiumAtiva(user: UserDocument): boolean {
    // Se tem premium vitalício
    if (user.assinaturaPremium) {
      return true;
    }

    // Se tem premium temporário e ainda está válido
    if (user.dataVencimentoPremium) {
      return new Date() <= new Date(user.dataVencimentoPremium);
    }

    return false;
  }

  async atualizarLimitePalpites(userId: string, novoLimite: number): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { limitePalpitesDia: novoLimite }, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async migrarUsuariosComLimitePalpites(): Promise<{
    atualizados: number;
    total: number;
    message: string;
  }> {
    const usuarios = await this.userModel.find({
      $or: [
        { limitePalpitesDia: { $exists: false } },
        { palpitesHoje: { $exists: false } },
        { ultimoResetPalpites: { $exists: false } },
      ],
    });

    let atualizados = 0;
    const dataAtual = new Date();

    for (const user of usuarios) {
      const updates: any = {};

      if (!user.limitePalpitesDia) {
        updates.limitePalpitesDia = 5;
      }

      if (!user.palpitesHoje) {
        updates.palpitesHoje = 0;
      }

      if (!user.ultimoResetPalpites) {
        updates.ultimoResetPalpites = dataAtual;
      }

      if (Object.keys(updates).length > 0) {
        await this.userModel.findByIdAndUpdate(user._id, updates);
        atualizados++;
      }
    }

    return {
      atualizados,
      total: usuarios.length,
      message: `Migração concluída: ${atualizados} usuários atualizados de ${usuarios.length} encontrados`,
    };
  }

  async migrarUsuariosComIsPublicProfile(): Promise<{
    atualizados: number;
    total: number;
    message: string;
  }> {
    const usuariosParaAtualizar = await this.userModel
      .find({ isPublicProfile: { $exists: false } })
      .exec();

    let atualizados = 0;
    for (const user of usuariosParaAtualizar) {
      await this.userModel.findByIdAndUpdate(user._id, { isPublicProfile: true });
      atualizados++;
    }

    return {
      atualizados,
      total: usuariosParaAtualizar.length,
      message: `Migração concluída. ${atualizados} usuários atualizados com isPublicProfile: true.`,
    };
  }

  async updateProfileVisibility(userId: string, isPublicProfile: boolean): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { isPublicProfile }, { new: true })
      .select('-passwordHash')
      .exec();

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }
}
