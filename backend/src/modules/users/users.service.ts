import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { RegisterDto } from '../../shared/dto/register.dto';
import { User, UserDocument } from '../../shared/schemas/user.schema';
import { CodeGeneratorUtil } from '../../shared/utils/code-generator.util';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: RegisterDto): Promise<UserDocument> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const uniqueCode = CodeGeneratorUtil.generateUniqueCode();

    const createdUser = new this.userModel({
      ...createUserDto,
      passwordHash: hashedPassword,
      code: uniqueCode,
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

  async addCampeonatoToUser(userId: string, campeonato: string): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { $addToSet: { campeonatos: campeonato } }, { new: true })
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
    let user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Garantir que os campos obrigatórios existam
    if (!user.ultimoResetPalpites || !user.limitePalpitesDia) {
      await this.inicializarCamposPalpites(userId);
      // Buscar o usuário novamente após a inicialização
      user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new NotFoundException('Usuário não encontrado após inicialização');
      }
    }

    // Verificar se precisa resetar o contador diário (SEMPRE verificar, mesmo se atingiu limite)
    const precisaReset = await this.verificarSeNecessarioReset(user);
    if (precisaReset) {
      await this.resetarContadorPalpitesDiario(userId);
      // Após reset, pode palpitar
      return true;
    }

    // Determinar limite baseado na assinatura
    const limiteDiario = this.obterLimitePalpitesDiario(user);

    // Verificar se ainda pode palpitar
    return user.palpitesHoje < limiteDiario;
  }

  private async verificarSeNecessarioReset(user: UserDocument): Promise<boolean> {
    if (!user.ultimoResetPalpites) {
      return true;
    }

    const agora = new Date();
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const ultimoReset = new Date(user.ultimoResetPalpites);
    const diaUltimoReset = new Date(
      ultimoReset.getFullYear(),
      ultimoReset.getMonth(),
      ultimoReset.getDate()
    );

    // Retorna true se é um dia diferente
    return hoje.getTime() !== diaUltimoReset.getTime();
  }

  async incrementarContadorPalpites(userId: string): Promise<void> {
    let user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Garantir que os campos obrigatórios existam
    if (!user.ultimoResetPalpites || !user.limitePalpitesDia) {
      await this.inicializarCamposPalpites(userId);
      // Buscar o usuário novamente após a inicialização
      user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new NotFoundException('Usuário não encontrado após inicialização');
      }
    }

    // Verificar se precisa resetar o contador diário
    const precisaReset = await this.verificarSeNecessarioReset(user);

    if (precisaReset) {
      // Se precisa reset, definir como 1 (este palpite) e atualizar data
      await this.userModel
        .findByIdAndUpdate(
          userId,
          {
            palpitesHoje: 1,
            ultimoResetPalpites: new Date(),
          },
          { new: true }
        )
        .exec();
    } else {
      // Se não precisa reset, apenas incrementar
      await this.userModel
        .findByIdAndUpdate(userId, { $inc: { palpitesHoje: 1 } }, { new: true })
        .exec();
    }
  }

  async obterStatusPalpites(userId: string): Promise<{
    palpitesHoje: number;
    limiteDiario: number;
    podesPalpitar: boolean;
    restantes: number;
  }> {
    let user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Garantir que os campos obrigatórios existam
    if (!user.ultimoResetPalpites || !user.limitePalpitesDia) {
      await this.inicializarCamposPalpites(userId);
      user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new NotFoundException('Usuário não encontrado após inicialização');
      }
    }

    // Verificar se precisa resetar o contador diário
    const precisaReset = await this.verificarSeNecessarioReset(user);
    let palpitesHoje = user.palpitesHoje;

    if (precisaReset) {
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

  private async inicializarCamposPalpites(userId: string): Promise<void> {
    const agora = new Date();
    const updateFields: any = {};

    // Buscar o usuário atual para verificar quais campos estão faltando
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (!user.limitePalpitesDia) {
      updateFields.limitePalpitesDia = 5;
    }

    if (!user.ultimoResetPalpites) {
      updateFields.ultimoResetPalpites = agora;
      updateFields.palpitesHoje = 0; // Resetar também os palpites se não há data de reset
    } else if (user.palpitesHoje === undefined || user.palpitesHoje === null) {
      updateFields.palpitesHoje = 0;
    }

    // Aplicar apenas os campos necessários
    if (Object.keys(updateFields).length > 0) {
      await this.userModel.findByIdAndUpdate(userId, updateFields, { new: true }).exec();
    }
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
  async entrarEmBairro(userId: string, codigo: string): Promise<UserDocument> {
    // Buscar usuário pelo código
    const usuarioComCodigo = await this.userModel.findOne({ code: codigo }).exec();

    if (!usuarioComCodigo) {
      throw new NotFoundException('Código não encontrado');
    }

    // Verificar se o usuário tem dados de localização
    if (!usuarioComCodigo.bairro || !usuarioComCodigo.cidade || !usuarioComCodigo.estado) {
      throw new NotFoundException('Usuário do código não possui dados de localização completos');
    }

    // Verificar se o usuário já atingiu o limite de 5 usos de códigos
    const usuarioLogado = await this.userModel.findById(userId).exec();
    if (!usuarioLogado) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const contagemAtual = usuarioLogado.contagemCompartilhamentos || 0;
    if (contagemAtual >= 5) {
      throw new ConflictException(
        'Você já atingiu o limite de 5 usos de códigos de outros usuários'
      );
    }

    // Atualizar dados de localização do usuário logado e incrementar contagem
    const dadosAtualizacao = {
      bairro: usuarioComCodigo.bairro,
      cidade: usuarioComCodigo.cidade,
      estado: usuarioComCodigo.estado,
      pais: usuarioComCodigo.pais || 'Brasil',
      cep: usuarioComCodigo.cep || undefined,
      $inc: { contagemCompartilhamentos: 1 },
    };

    const usuarioAtualizado = await this.userModel
      .findByIdAndUpdate(userId, dadosAtualizacao, { new: true })
      .select('-passwordHash')
      .exec();

    if (!usuarioAtualizado) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return usuarioAtualizado;
  }

  async corrigirDadosInconsistentesPalpites(): Promise<{
    usuariosCorrigidos: number;
    totalUsuarios: number;
    detalhes: {
      camposInicializados: number;
      contadoresResetados: number;
      limitesDefinidos: number;
    };
    message: string;
  }> {
    const usuarios = await this.userModel.find({}).exec();

    let usuariosCorrigidos = 0;
    const detalhes = {
      camposInicializados: 0,
      contadoresResetados: 0,
      limitesDefinidos: 0,
    };

    const agora = new Date();

    for (const user of usuarios) {
      const updates: any = {};
      let precisaAtualizacao = false;

      // 1. Verificar e corrigir limitePalpitesDia
      if (!user.limitePalpitesDia || user.limitePalpitesDia === 0) {
        updates.limitePalpitesDia = 5;
        detalhes.limitesDefinidos++;
        precisaAtualizacao = true;
      }

      // 2. Verificar e corrigir ultimoResetPalpites
      if (!user.ultimoResetPalpites) {
        updates.ultimoResetPalpites = agora;
        updates.palpitesHoje = 0; // Resetar contador junto
        detalhes.camposInicializados++;
        precisaAtualizacao = true;
      }

      // 3. Verificar e corrigir palpitesHoje
      if (user.palpitesHoje === undefined || user.palpitesHoje === null) {
        updates.palpitesHoje = 0;
        precisaAtualizacao = true;
      }

      // 4. Resetar usuários que ainda têm contador de ontem
      if (user.ultimoResetPalpites && user.palpitesHoje > 0) {
        const ultimoReset = new Date(user.ultimoResetPalpites);
        const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
        const diaUltimoReset = new Date(
          ultimoReset.getFullYear(),
          ultimoReset.getMonth(),
          ultimoReset.getDate()
        );

        // Se é um dia diferente e ainda tem palpites contados, resetar
        if (hoje.getTime() !== diaUltimoReset.getTime() && user.palpitesHoje > 0) {
          updates.palpitesHoje = 0;
          updates.ultimoResetPalpites = agora;
          detalhes.contadoresResetados++;
          precisaAtualizacao = true;
        }
      }

      // 5. Aplicar correções se necessário
      if (precisaAtualizacao) {
        await this.userModel.findByIdAndUpdate(user._id, updates).exec();
        usuariosCorrigidos++;
      }
    }

    return {
      usuariosCorrigidos,
      totalUsuarios: usuarios.length,
      detalhes,
      message: `Correção concluída! ${usuariosCorrigidos} de ${usuarios.length} usuários foram corrigidos. Detalhes: ${detalhes.limitesDefinidos} limites definidos, ${detalhes.camposInicializados} campos inicializados, ${detalhes.contadoresResetados} contadores resetados.`,
    };
  }
}
