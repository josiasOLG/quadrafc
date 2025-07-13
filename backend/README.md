# QuadraFC Backend

Backend da aplicação QuadraFC - Sistema de palpites de futebol brasileiro.

api token: 7a9ae731057949969045f9e64afb9676

## 🚀 Tecnologias

- **NestJS** - Framework Node.js
- **MongoDB** - Banco de dados NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticação com cookies httpOnly
- **Swagger** - Documentação da API
- **Cron Jobs** - Sincronização automática de jogos

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env
```

## ⚙️ Configuração

Edite o arquivo `.env` com suas configurações:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/quadrafc
DATABASE_NAME=quadrafc

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# API Externa de Futebol
FOOTBALL_API_URL=https://api.football-data.org/v4
FOOTBALL_API_KEY=your-football-api-key-here

# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:4200

# Cron Jobs
ENABLE_CRON_JOBS=true
```

## 🎯 Scripts

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod

# Testes
npm test
npm run test:e2e
```

## 📚 Documentação da API

Após iniciar o servidor, acesse: `http://localhost:3000/api/docs`

## 🔐 Autenticação

O sistema utiliza **cookies httpOnly** para autenticação, proporcionando maior
segurança contra ataques XSS.

### Endpoints principais:

- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Fazer login (define cookie httpOnly)
- `POST /api/auth/logout` - Fazer logout (remove cookie)

## 🎮 Funcionalidades

### 👤 Usuários

- Cadastro e autenticação
- Perfil com bairro
- Sistema de pontos e moedas
- Rankings individual e por bairro

### ⚽ Jogos

- Sincronização automática via API externa
- Apenas jogos com times brasileiros
- Status: aberto/encerrado

### 🎯 Palpites

- Criação antes do início do jogo
- Validação automática de resultados
- Sistema de pontuação:
  - **Placar exato**: 10 pontos + 50 moedas
  - **Resultado (V/E/D)**: 5 pontos + 20 moedas

### 🏆 Rankings

- Ranking individual por pontos
- Ranking de bairros
- Atualização automática

### 💰 Sistema de Moedas

- Ganho automático por acertos
- Histórico de transações
- Extrato mensal

### 🔄 Cron Jobs

- **06:00 diário**: Sincronização de novos jogos
- **A cada 30min**: Atualização de resultados

## 🗃️ Estrutura do Banco

### Collections:

- `users` - Usuários do sistema
- `bairros` - Bairros para representação
- `jogos` - Jogos de futebol
- `rodadas` - Agrupamento de jogos
- `palpites` - Palpites dos usuários
- `transacoes_moedas` - Histórico de moedas

## 🌐 API Externa

Utiliza a API do football-data.org para:

- Buscar jogos com times brasileiros
- Atualizar resultados automaticamente
- Manter dados sincronizados

## 🛡️ Segurança

- Cookies httpOnly para JWT
- Validação de dados com class-validator
- CORS configurado
- Sanitização de entradas

## 📱 Estrutura de Módulos

```
src/
├── modules/
│   ├── auth/           # Autenticação
│   ├── users/          # Usuários
│   ├── bairros/        # Bairros
│   ├── jogos/          # Jogos
│   ├── rodadas/        # Rodadas
│   ├── palpites/       # Palpites
│   ├── transacoes-moedas/  # Moedas
│   └── football-api/   # API Externa
├── shared/
│   ├── schemas/        # Schemas MongoDB
│   ├── dto/           # Data Transfer Objects
│   ├── guards/        # Guards de autenticação
│   └── decorators/    # Decorators customizados
└── database/
    └── seed.service.ts # Dados iniciais
```

## 🚀 Deploy

1. Configure as variáveis de ambiente
2. Execute o build: `npm run build`
3. Inicie o servidor: `npm run start:prod`

## 📞 Suporte

Para dúvidas ou problemas, abra uma issue no repositório.
