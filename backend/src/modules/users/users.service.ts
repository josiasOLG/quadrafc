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
    return this.userModel.findById(id).exec();
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
}
