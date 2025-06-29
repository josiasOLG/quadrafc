import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cidade, CidadeDocument } from '../../shared/schemas/cidade.schema';
import { PaginationDto } from '../../shared/dto/pagination.dto';

@Injectable()
export class CidadesService {
  constructor(
    @InjectModel(Cidade.name) private cidadeModel: Model<CidadeDocument>,
  ) {}

  async findAll(): Promise<Cidade[]> {
    return this.cidadeModel.find({ ativo: true }).sort({ nome: 1 }).exec();
  }

  async findAllPaginated(
    paginationDto: PaginationDto,
    uf?: string
  ): Promise<{ data: Cidade[]; total: number }> {
    const filter: any = { ativo: true };
    
    if (uf) filter.uf = uf;

    const [data, total] = await Promise.all([
      this.cidadeModel
        .find(filter)
        .sort({ nome: 1 })
        .skip(paginationDto.skip)
        .limit(paginationDto.limit)
        .exec(),
      this.cidadeModel.countDocuments(filter).exec(),
    ]);

    return { data, total };
  }

  async search(
    searchTerm: string,
    paginationDto: PaginationDto,
    uf?: string
  ): Promise<{ data: Cidade[]; total: number }> {
    const filter: any = { ativo: true };
    
    if (uf) filter.uf = uf;
    
    if (searchTerm && searchTerm.trim()) {
      filter.$or = [
        { nome: { $regex: searchTerm, $options: 'i' } },
        { estado: { $regex: searchTerm, $options: 'i' } },
        { uf: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    const [data, total] = await Promise.all([
      this.cidadeModel
        .find(filter)
        .sort({ nome: 1 })
        .skip(paginationDto.skip)
        .limit(paginationDto.limit)
        .exec(),
      this.cidadeModel.countDocuments(filter).exec(),
    ]);

    return { data, total };
  }

  async findById(id: string): Promise<Cidade> {
    return this.cidadeModel.findById(id).exec();
  }

  async findByUf(uf: string): Promise<Cidade[]> {
    return this.cidadeModel.find({ uf, ativo: true }).sort({ nome: 1 }).exec();
  }

  async create(createCidadeDto: Partial<Cidade>): Promise<Cidade> {
    const createdCidade = new this.cidadeModel(createCidadeDto);
    return createdCidade.save();
  }

  async seedCidades(): Promise<void> {
    const count = await this.cidadeModel.countDocuments().exec();
    
    if (count === 0) {
      // Seed com algumas cidades principais do Brasil
      const cidadesSeed = [
        { nome: 'São Paulo', estado: 'São Paulo', uf: 'SP', regiao: 'Sudeste' },
        { nome: 'Rio de Janeiro', estado: 'Rio de Janeiro', uf: 'RJ', regiao: 'Sudeste' },
        { nome: 'Brasília', estado: 'Distrito Federal', uf: 'DF', regiao: 'Centro-Oeste' },
        { nome: 'Salvador', estado: 'Bahia', uf: 'BA', regiao: 'Nordeste' },
        { nome: 'Fortaleza', estado: 'Ceará', uf: 'CE', regiao: 'Nordeste' },
        { nome: 'Belo Horizonte', estado: 'Minas Gerais', uf: 'MG', regiao: 'Sudeste' },
        { nome: 'Manaus', estado: 'Amazonas', uf: 'AM', regiao: 'Norte' },
        { nome: 'Curitiba', estado: 'Paraná', uf: 'PR', regiao: 'Sul' },
        { nome: 'Recife', estado: 'Pernambuco', uf: 'PE', regiao: 'Nordeste' },
        { nome: 'Porto Alegre', estado: 'Rio Grande do Sul', uf: 'RS', regiao: 'Sul' },
        { nome: 'Goiânia', estado: 'Goiás', uf: 'GO', regiao: 'Centro-Oeste' },
        { nome: 'Belém', estado: 'Pará', uf: 'PA', regiao: 'Norte' },
        { nome: 'Guarulhos', estado: 'São Paulo', uf: 'SP', regiao: 'Sudeste' },
        { nome: 'Campinas', estado: 'São Paulo', uf: 'SP', regiao: 'Sudeste' },
        { nome: 'São Luís', estado: 'Maranhão', uf: 'MA', regiao: 'Nordeste' },
        { nome: 'São Gonçalo', estado: 'Rio de Janeiro', uf: 'RJ', regiao: 'Sudeste' },
        { nome: 'Maceió', estado: 'Alagoas', uf: 'AL', regiao: 'Nordeste' },
        { nome: 'Duque de Caxias', estado: 'Rio de Janeiro', uf: 'RJ', regiao: 'Sudeste' },
        { nome: 'Natal', estado: 'Rio Grande do Norte', uf: 'RN', regiao: 'Nordeste' },
        { nome: 'Teresina', estado: 'Piauí', uf: 'PI', regiao: 'Nordeste' }
      ];

      await this.cidadeModel.insertMany(cidadesSeed);
    }
  }
}
