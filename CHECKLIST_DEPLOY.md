# ✅ Checklist de Deploy no Vercel

## 🎯 Estratégia: Monorepo com 3 Projetos

**1 GitHub Repository + 3 Projetos Vercel = Deploy Automático Perfeito!**

```
GitHub: josiasolg/quadrafc
├── frontend/ → Vercel: quadrafc-frontend
├── admin/    → Vercel: quadrafc-admin
├── backend/  → Vercel: quadrafc-backend
```

✅ **Vantagens:**

- Um só repositório GitHub para gerenciar
- Deploy automático individual para cada app
- Fácil manutenção e versionamento
- URLs separadas para cada aplicação

## Pré-Deploy

- [ ] Código commitado e enviado para o GitHub
- [ ] CLI do Vercel instalado (`npm i -g vercel`)
- [ ] Logado no Vercel (`vercel login`)
- [ ] Builds locais funcionando para todos os projetos
- [ ] Variáveis de ambiente definidas

## Deploy Manual (Passo a Passo)

### 1. Backend (Execute PRIMEIRO!)

```bash
cd backend
vercel --prod
```

**Respostas para as perguntas do Vercel:**

- `Set up and deploy`? → **yes**
- `Which scope`? → **josiasolg's projects**
- `Link to existing project`? → **no**
- `What's your project's name`? → **quadrafc-backend**
- `In which directory is your code located`? → **./** (deixe em branco)

- [ ] Deploy do backend concluído
- [ ] API respondendo em https://quadrafc-backend.vercel.app/api/docs
- [ ] Configurar variáveis de ambiente no painel do Vercel:
  - [ ] `NODE_ENV=production`
  - [ ] `MONGODB_URI=sua_string_conexao`
  - [ ] `JWT_SECRET=seu_jwt_secret`
  - [ ] Outras variáveis específicas do projeto

### 2. Frontend

```bash
cd frontend
vercel --prod
```

**Respostas para as perguntas do Vercel:**

- `Set up and deploy`? → **yes**
- `Which scope`? → **josiasolg's projects**
- `Link to existing project`? → **no**
- `What's your project's name`? → **quadrafc-frontend**
- `In which directory is your code located`? → **./** (deixe em branco)

- [ ] Deploy do frontend concluído
- [ ] App carregando em https://quadrafc-frontend.vercel.app
- [ ] Conexão com API funcionando

### 3. Admin

```bash
cd admin
vercel --prod
```

**Respostas para as perguntas do Vercel:**

- `Set up and deploy`? → **yes**
- `Which scope`? → **josiasolg's projects**
- `Link to existing project`? → **no**
- `What's your project's name`? → **quadrafc-admin**
- `In which directory is your code located`? → **./** (deixe em branco)

- [ ] Deploy do admin concluído
- [ ] Painel admin carregando em https://quadrafc-admin.vercel.app
- [ ] Conexão com API funcionando

## Deploy Automático via GitHub (Recomendado!)

Após o primeiro deploy manual, configure deploy automático:

### 1. Conectar ao GitHub

No painel do Vercel (vercel.com), para cada projeto:

- [ ] Ir em **Settings** → **Git**
- [ ] Conectar ao repositório GitHub: `josiasolg/quadrafc` (ou nome do seu repo)
- [ ] Configurar o **Root Directory** para cada projeto:

#### Frontend:

- **Root Directory**: `frontend`
- **Framework Preset**: Angular
- **Build Command**: `ng build --configuration=production`
- **Output Directory**: `dist/quadrafc`
- **Install Command**: `npm ci`

#### Admin:

- **Root Directory**: `admin`
- **Framework Preset**: Angular
- **Build Command**: `ng build --configuration=production`
- **Output Directory**: `dist/admin`
- **Install Command**: `npm ci`

#### Backend:

- **Root Directory**: `backend`
- **Framework Preset**: Other
- **Build Command**: `npm run build`
- **Output Directory**: `api`
- **Install Command**: `npm ci`

### 2. Deploy Automático Configurado ✅

Agora toda vez que você fizer push no GitHub:

- Mudanças em `/frontend` → deploy automático do frontend
- Mudanças em `/admin` → deploy automático do admin
- Mudanças em `/backend` → deploy automático do backend

## Deploy Automático (Script)

- [ ] Script executado: `.\deploy-all.ps1` (Windows) ou `./deploy-all.sh`
      (Linux/Mac)
- [ ] Todos os 3 projetos deployados com sucesso

## Pós-Deploy

- [ ] Testar todas as URLs principais
- [ ] Verificar se as APIs estão respondendo
- [ ] Testar autenticação nos apps
- [ ] Verificar logs de erro no Vercel
- [ ] Configurar domínios customizados (opcional)
- [ ] Configurar deploy automático via GitHub (opcional)

## URLs Finais

- 🔗 **Backend API**: https://quadrafc-backend.vercel.app
- 🔗 **Frontend**: https://quadrafc-frontend.vercel.app
- 🔗 **Admin**: https://quadrafc-admin.vercel.app
- 📚 **Docs da API**: https://quadrafc-backend.vercel.app/api/docs

## Troubleshooting

### Build Errors

- [ ] Verificar versão do Node.js (recomendado: 18+)
- [ ] Rodar `npm ci` em cada projeto
- [ ] Verificar se build local funciona

### CORS Errors

- [ ] Verificar configuração de CORS no backend
- [ ] Adicionar domínios do Vercel na lista de origens permitidas

### 404 Errors

- [ ] Verificar se `vercel.json` está presente em cada projeto
- [ ] Confirmar configuração de rotas para SPAs Angular

### Environment Variables

- [ ] Confirmar que todas as variáveis estão configuradas no painel do Vercel
- [ ] Verificar se URLs da API estão corretas nos environment files
