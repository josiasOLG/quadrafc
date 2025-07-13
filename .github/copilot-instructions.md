# 🤖 GitHub Copilot Instructions

Este workspace possui 3 projetos distintos que compartilham o mesmo VSCode:

- `/frontend` → Angular 18 (app do usuário)
- `/admin` → Angular 18 (painel administrativo)
- `/backend` → NestJS (API REST em Node.js)

Todas as sugestões geradas pelo Copilot devem respeitar o contexto de cada
projeto, com foco em **performance**, **escalabilidade**, **padrões existentes**
e **boas práticas avançadas**.

---

## ✅ REGRAS GERAIS (TODOS OS PROJETOS)

- Sempre aplicar os princípios: **Clean Code**, **SOLID**, **DRY**, **KISS**
- Proibido:
  - Comentários em código (`//` ou `/* */`)
  - `console.log` ou qualquer tipo de log sem controle
  - `any`, `@ts-ignore`, `TODO`, `FIXME`
- Nunca sugerir funções ou variáveis sem necessidade real
- Antes de sugerir algo, **analisar a estrutura do projeto** para seguir a mesma
  organização
- Usar nomes **significativos** e **semânticos** para métodos, variáveis e
  componentes
- Preservar padronização já existente em arquitetura, nomenclatura, formatação e
  responsabilidades
- Nunca adicionar exemplos extras após a entrega do código.
- Nunca sugerir ou gerar arquivos `.md`, `.markdown` ou qualquer tipo de
  documentação adicional.
- Nunca criar README, tutorial ou instruções explicativas automaticamente.

---

## 🌐 FRONTEND: `/frontend` (Angular 18 + PrimeNG/PrimeFlex)

### ✅ Diretrizes principais

- Usar **Angular 18 standalone components** sempre organizados por `modules`
- Utilizar **PrimeNG** (componentes visuais) e **PrimeFlex** (layout e grid)
  obrigatoriamente
- Os estilos (`.scss`) de cada componente não devem ultrapassar **200 linhas**
- Sempre que um componente crescer demais, **dividir em subcomponentes** dentro
  da pasta do módulo
- Nunca repetir lógica: reutilizar pipes, services, utils e componentes
- Verificar se a funcionalidade já existe antes de sugerir nova
- Este projeto é um **PWA exclusivo para uso em dispositivos móveis (iOS e
  Android)**.
  - **Nunca** otimizar pensando em navegador web ou desktop.
  - Toda a estrutura, UX, UI e comportamento devem ser pensados exclusivamente
    para **experiência mobile**.
  - Sempre simular viewport e interações com base em **smartphones**.

### ⚙️ Estrutura de HTML/CSS

- O HTML e o SCSS devem **sempre priorizar o uso de PrimeFlex** (`p-grid`,
  `p-col`, `flex`, `gap-*`, `align-items-*`, etc).
- Usar classes utilitárias do PrimeFlex para evitar código CSS desnecessário.
- O uso de SCSS deve ser **mínimo e apenas quando necessário**. Evitar estilos
  manuais se existir utilitário correspondente no PrimeFlex.
- Quando precisar criar estilos próprios, **usar a metodologia BEM (Block
  Element Modifier)** de forma obrigatória e padronizada:

  - Nome de classes: `bloco__elemento--modificador`
  - Nesting no SCSS deve respeitar os níveis BEM sem exageros
  - **Nunca** usar camelCase, kebab-case genérico, ou classes abreviadas

- Sempre que possível, resolver layout e espaçamento com classes utilitárias do
  PrimeFlex ao invés de SCSS.

- O objetivo é manter o SCSS o menor possível, limpo e sem regras duplicadas.

### ⚙️ Padrões obrigatórios

- Utilizar `@Input`, `@Output`, `EventEmitter` de forma enxuta
- Services devem conter apenas responsabilidades de negócio
- Componentes não devem conter regras de negócio
- Evitar qualquer lógica de formatação, conversão ou validação nos templates
- Priorizar templates simples e sem lógica inline
- Nunca sugerir _FormGroup_ ou _HttpClient_ diretamente no componente, sempre
  via Service

---

## 🔐 ADMIN: `/admin` (Angular 18 + PrimeNG/PrimeFlex)

### ✅ Seguir todas as regras do projeto `/frontend`

- O painel administrativo deve ter a **mesma estrutura**, **mesmos princípios**,
  **mesmas bibliotecas**
- As sugestões devem manter **consistência visual e arquitetural** com o app do
  usuário
- Manter também os mesmos cuidados com modularização, divisão de
  responsabilidades e reutilização
- Estrutura esperada: `features`, `shared`, `core`, `guards`, `pipes`,
  `directives`, `utils`

---

## 🧠 BACKEND: `/backend` (NestJS com arquitetura modular)

### ✅ Estrutura esperada

- Organização por `modules`, `controllers`, `services`, `dto`, `entities`
- Utilizar **decorators do NestJS** corretamente: `@Injectable`, `@Controller`,
  `@Module`, `@UseGuards`
- Validar sempre com `class-validator` nos DTOs
- Nunca criar lógica de negócio dentro do controller

### ⚙️ Boas práticas obrigatórias

- Antes de sugerir métodos novos, verificar se já existem funções semelhantes
- Serviços não devem ultrapassar **uma única responsabilidade**
- Evitar arquivos com mais de 200 linhas (dividir em helpers ou services
  auxiliares)
- Funções devem ser coesas, com propósito claro e nome preciso
- Respostas devem ser claras e padronizadas com `HttpException` e `HttpStatus`
- **Nunca sugerir `console.log`, `console.error`, `console.warn` ou logs
  diretos.**
  - Remover imediatamente qualquer `console.*` não tratado
  - Logs devem ser controlados usando o `Logger` do NestJS **apenas quando
    necessário**
  - Não usar log para debug temporário
  - Sugestões com logger devem seguir o padrão:
    ```ts
    import { Logger } from '@nestjs/common';
    const logger = new Logger(NomeDaClasse);
    logger.log('Mensagem'); // apenas quando justificado
    ```

---

## 🔄 IMPORTANTE PARA O AGENTE

- Sempre **adaptar sugestões ao padrão existente no repositório**
- Priorizar reutilização de código e recursos já existentes (components,
  services, functions)
- Quando gerar arquivos novos, nomear de forma clara e consistente com o
  restante do projeto
- Se houver dúvida entre criar algo novo ou reutilizar, **sempre prefira
  reutilizar**
- As sugestões devem ser **prontas para produção**, com foco em desempenho,
  organização e manutenção
