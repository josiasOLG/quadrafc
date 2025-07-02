# QuadraFC Admin Dashboard

Dashboard administrativo para o QuadraFC - Sistema de palpites de futebol
brasileiro.

## 🚀 Tecnologias Utilizadas

- **Angular 18** - Framework frontend
- **PrimeNG 17** - Biblioteca de componentes UI
- **PrimeFlex** - Utilitários de CSS
- **Zod** - Validação de esquemas TypeScript
- **Chart.js** - Gráficos interativos
- **TypeScript** - Linguagem de programação

## 📋 Funcionalidades

### ✅ Implementadas

- **Dashboard Principal**

  - Estatísticas gerais do sistema
  - Gráficos de atividade
  - Resumo de atividades recentes

- **Gerenciamento de Usuários**
  - Listagem com filtros avançados
  - Criação e edição de usuários
  - Ativação/desativação de usuários
  - Gerenciamento de assinaturas premium
  - Controle de moedas e pontuação

### 🔄 Em Desenvolvimento

- **Gerenciamento de Jogos**

  - CRUD completo de jogos
  - Controle de resultados
  - Gestão de palpites

- **Outros Módulos**
  - Bairros e Cidades
  - Conquistas
  - Transações de Moedas
  - Ranking
  - Sincronização

## 🛠️ Instalação e Configuração

### Pré-requisitos

- Node.js 18+
- NPM ou Yarn
- Angular CLI 18

### Passos de Instalação

1. **Instale as dependências**

   ```bash
   npm install
   ```

2. **Configure o ambiente**

   - Edite `src/environments/environment.ts` para desenvolvimento
   - Edite `src/environments/environment.prod.ts` para produção

3. **Execute o projeto**

   ```bash
   npm start
   # ou
   ng serve --port 4201
   ```

4. **Acesse o dashboard**
   - URL: `http://localhost:4201`

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── layout/                 # Layout principal com sidebar e header
│   ├── modules/                # Módulos funcionais
│   │   ├── dashboard/          # Dashboard principal
│   │   └── users/              # Gerenciamento de usuários
│   └── shared/                 # Recursos compartilhados
│       ├── models/             # Interfaces e schemas Zod
│       └── services/           # Serviços HTTP
├── environments/               # Configurações de ambiente
└── styles.scss                # Estilos globais
```

## 🔗 Integração com Backend

Configure a URL da API em `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
};
```

---

**Desenvolvido com ❤️ para o QuadraFC**
