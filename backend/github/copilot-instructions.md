# GitHub Copilot Instructions - Backend (NestJS)

## Contexto do Projeto

Este é o backend de um aplicativo de futebol desenvolvido com **NestJS**, **TypeScript** e **MongoDB**. O projeto segue uma arquitetura modular com separação clara de responsabilidades.

## Regras Gerais de Desenvolvimento

### 1. Estrutura de Arquivos

- Sempre seguir a estrutura modular do NestJS: `controller`, `service`, `module`
- Manter os arquivos organizados em módulos específicos dentro de `src/modules/`
- Utilizar a pasta `shared/` para código reutilizável (DTOs, interfaces, decorators, etc.)
- Schemas do MongoDB devem ficar em `src/shared/schemas/`

### 2. Padrões de Código TypeScript/NestJS

- **Sempre** usar TypeScript com tipagem estrita
- Utilizar decorators do NestJS: `@Controller()`, `@Injectable()`, `@Module()`
- Implementar validação com `class-validator` e `class-transformer`
- Usar DTOs para todas as requisições e respostas
- Aplicar interceptors para transformação de dados quando necessário

### 3. Estrutura de Controllers

```typescript
@Controller("endpoint")
export class ExampleController {
  constructor(private readonly service: ExampleService) {}

  @Get()
  async findAll(): Promise<ResponseDto[]> {
    return this.service.findAll();
  }

  @Post()
  async create(@Body() createDto: CreateExampleDto): Promise<ResponseDto> {
    return this.service.create(createDto);
  }
}
```

### 4. Estrutura de Services

```typescript
@Injectable()
export class ExampleService {
  constructor(
    @InjectModel(Example.name) private exampleModel: Model<Example>,
  ) {}

  async findAll(): Promise<Example[]> {
    return this.exampleModel.find().exec();
  }

  async create(createDto: CreateExampleDto): Promise<Example> {
    const created = new this.exampleModel(createDto);
    return created.save();
  }
}
```

### 5. Padrões de Resposta da API

- Seguir o padrão definido em `API_RESPONSE_PATTERN.md`
- Sempre retornar objetos JSON estruturados
- Usar status codes HTTP apropriados
- Implementar tratamento de erros consistente

### 6. Validação e DTOs

- Criar DTOs para todas as entradas de dados
- Usar decorators de validação: `@IsString()`, `@IsNumber()`, `@IsOptional()`, etc.
- Implementar transformação de dados quando necessário

### 7. Schemas MongoDB (Mongoose)

```typescript
@Schema({ timestamps: true })
export class Example {
  @Prop({ required: true })
  name: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User" })
  userId: mongoose.Types.ObjectId;
}

export const ExampleSchema = SchemaFactory.createForClass(Example);
```

### 8. Autenticação e Autorização

- Utilizar Guards para proteção de rotas
- Implementar estratégias de autenticação na pasta `strategies/`
- Usar decorators customizados para extrair informações do usuário

### 9. Tratamento de Erros

- Usar exception filters personalizados
- Lançar exceções apropriadas do NestJS: `NotFoundException`, `BadRequestException`, etc.
- Sempre incluir mensagens de erro descritivas

### 10. Imports e Dependencies

- Organizar imports: bibliotecas externas primeiro, depois imports locais
- Usar barrel exports quando apropriado
- Não deixar imports não utilizados

## Módulos Específicos

### Football API

- Integração com APIs externas de futebol
- Usar HttpModule para requisições HTTP
- Implementar cache quando necessário

### Sincronização

- Serviços para sincronizar dados com APIs externas
- Usar schedulers para tarefas programadas
- Implementar logs detalhados

### Dashboard

- Agregações e estatísticas
- Usar pipelines do MongoDB para consultas complexas
- Otimizar performance de consultas

## Convenções de Nomenclatura

- Arquivos: kebab-case (exemplo: `jogos.controller.ts`)
- Classes: PascalCase (exemplo: `JogosController`)
- Variáveis e funções: camelCase (exemplo: `findAllJogos`)
- Constantes: UPPER_SNAKE_CASE (exemplo: `DEFAULT_LIMIT`)

## Padrões SOLID e Reutilização de Código

- **SEMPRE** seguir os princípios SOLID em todo o desenvolvimento
- **ANTES** de criar qualquer arquivo, verificar se já existe implementação similar
- **ANTES** de criar um método, verificar se ele já existe para evitar duplicação
- Analisar outros arquivos do projeto para manter consistência de padrões
- Reutilizar código existente sempre que possível
- Manter a arquitetura e padrões já estabelecidos no backend

## Performance e Boas Práticas

- Usar paginação em listagens
- Implementar cache para dados frequentemente acessados
- Validar dados de entrada rigorosamente
- Usar índices apropriados no MongoDB
- Implementar rate limiting quando necessário

## Segurança

- Nunca expor informações sensíveis
- Validar e sanitizar todas as entradas
- Usar HTTPS em produção
- Implementar CORS adequadamente
