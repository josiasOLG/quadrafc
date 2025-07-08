# QuadraFC - Deploy no Vercel

Este projeto contém 3 aplicações que serão deployadas separadamente no Vercel:

## 🚀 Aplicações

1. **Frontend** (App principal) - `quadrafc-frontend`
2. **Admin** (Painel administrativo) - `quadrafc-admin`
3. **Backend** (API) - `quadrafc-backend`

## 📋 Pré-requisitos

1. Conta no Vercel
2. CLI do Vercel instalado: `npm i -g vercel`
3. Repositório GitHub com o código

## 🛠️ Deploy das Aplicações

### 1. Backend (API) - Deploy primeiro!

```bash
cd backend
vercel --prod
```

**Configurações importantes:**

- Nome do projeto: `quadrafc-backend`
- Framework: Other
- Build Command: `npm run build && npm run build:vercel`
- Output Directory: `api`
- Install Command: `npm ci`

### 2. Frontend (App Principal)

```bash
cd frontend
vercel --prod
```

**Configurações importantes:**

- Nome do projeto: `quadrafc-frontend`
- Framework: Angular
- Build Command: `ng build --configuration=production`
- Output Directory: `dist/quadrafc`
- Install Command: `npm ci`

### 3. Admin (Painel Administrativo)

```bash
cd admin
vercel --prod
```

**Configurações importantes:**

- Nome do projeto: `quadrafc-admin`
- Framework: Angular
- Build Command: `ng build --configuration=production`
- Output Directory: `dist/admin`
- Install Command: `npm ci`

## 🔧 Variáveis de Ambiente

### Backend

Configure no painel do Vercel:

- `NODE_ENV=production`
- `MONGODB_URI=sua_string_de_conexao_mongodb`
- `JWT_SECRET=seu_jwt_secret`
- `FOOTBALL_API_KEY=sua_chave_da_api_de_futebol`

### Frontend/Admin

As URLs da API já estão configuradas nos arquivos de environment para apontar
para:

- `https://quadrafc-backend.vercel.app/api`

## 📝 URLs de Deploy

Após o deploy, suas aplicações estarão disponíveis em:

- **Backend API**: `https://quadrafc-backend.vercel.app`
- **Frontend**: `https://quadrafc-frontend.vercel.app`
- **Admin**: `https://quadrafc-admin.vercel.app`

## 🔄 Deploy Automático

Para configurar deploy automático:

1. Conecte cada projeto ao seu repositório GitHub no painel do Vercel
2. Configure as seguintes configurações para cada projeto:

### Frontend:

- **Root Directory**: `frontend`
- **Framework Preset**: Angular
- **Build Command**: `ng build --configuration=production`
- **Output Directory**: `dist/quadrafc`

### Admin:

- **Root Directory**: `admin`
- **Framework Preset**: Angular
- **Build Command**: `ng build --configuration=production`
- **Output Directory**: `dist/admin`

### Backend:

- **Root Directory**: `backend`
- **Framework Preset**: Other
- **Build Command**: `npm run build`
- **Output Directory**: `api`

## 🐛 Troubleshooting

### Erro de CORS

Se houver problemas de CORS, adicione os domínios do Vercel na configuração de
CORS do backend.

### Erro de Build do Angular

Certifique-se de que as versões do Node.js são compatíveis (recomendado: Node
18+).

### Erro 404 nas rotas do Angular

Os arquivos `vercel.json` já estão configurados para redirecionar todas as rotas
para `index.html`.

## 📞 Suporte

Se tiver problemas durante o deploy, verifique:

1. Se todas as dependências estão instaladas
2. Se os builds locais funcionam corretamente
3. Se as variáveis de ambiente estão configuradas
4. Os logs de build no painel do Vercel
