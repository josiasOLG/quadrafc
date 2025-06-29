`````instructions
````instructions
# GitHub Copilot Instructions - Frontend (Angular)

## Contexto do Projeto
Este é o frontend de um aplicativo de futebol desenvolvido com **Angular**, **TypeScript**, **SCSS** e configurado como **PWA**. O projeto segue as melhores práticas do Angular com arquitetura modular.

## Regras Gerais de Desenvolvimento

### 1. Estrutura de Arquivos Angular
- Seguir a estrutura modular do Angular
- Organizar em `core/`, `shared/` e `modules/`
- Cada feature deve ter seu próprio módulo
- Usar lazy loading para módulos de features

### 2. Padrões de Código TypeScript/Angular
- **Sempre** usar TypeScript com tipagem estrita
- Seguir as convenções do Angular Style Guide
- Usar RxJS para programação reativa
- Implementar OnDestroy para unsubscribe de observables

### 3. Estrutura de Components
```typescript
@Component({
  selector: 'app-example',
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.scss']
})
export class ExampleComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(private service: ExampleService) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.service.getData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        // handle data
      });
  }
}
```

### 4. Estrutura de Services
```typescript
@Injectable({
  providedIn: 'root'
})
export class ExampleService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getData(): Observable<DataType[]> {
    return this.http.get<DataType[]>(`${this.apiUrl}/endpoint`);
  }

  createData(data: CreateDataDto): Observable<DataType> {
    return this.http.post<DataType>(`${this.apiUrl}/endpoint`, data);
  }
}
```

### 5. Templates HTML
- Usar interpolation: `{{ data }}`
- Property binding: `[property]="value"`
- Event binding: `(click)="method()"`
- Two-way binding: `[(ngModel)]="property"`
- Usar trackBy functions em *ngFor para performance
- Implementar loading states e error handling

### 6. Estilos SCSS
- **SEMPRE** usar SCSS para todos os estilos (nunca CSS puro)
- **OBRIGATÓRIO** seguir metodologia BEM para nomenclatura de classes CSS
- Usar variáveis SCSS para cores, tamanhos e espaçamentos
- Implementar mixins para código reutilizável
- Usar Angular Material quando apropriado
- Implementar design responsivo (mobile-first)
- **SEMPRE** aplicar BEM: Bloco__Elemento--Modificador

```scss
// Exemplo BEM - Bloco__Elemento--Modificador
.user-card {
  padding: 1rem;
  border: 1px solid #ddd;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  &__title {
    font-size: 1.2rem;
    font-weight: bold;

    &--highlighted {
      color: $primary-color;
    }
  }

  &__content {
    padding: 1rem;

    &--expanded {
      padding: 2rem;
    }

    @media (min-width: 768px) {
      padding: 2rem;
    }
  }

  &__button {
    padding: 0.5rem 1rem;

    &--primary {
      background-color: $primary-color;
      color: white;
    }

    &--secondary {
      background-color: $secondary-color;
      color: $text-color;
    }
  }
}
```

## Padrões de CSS/SCSS

### Metodologia BEM Obrigatória
- **SEMPRE** usar BEM: `.bloco__elemento--modificador`
- **Bloco**: Componente independente (ex: `user-card`, `navigation-menu`)
- **Elemento**: Parte do bloco (ex: `user-card__title`, `navigation-menu__item`)
- **Modificador**: Variação do bloco ou elemento (ex: `user-card--highlighted`, `button--disabled`)

### Estrutura SCSS
- **SEMPRE** usar arquivos `.scss` (nunca `.css`)
- Usar nesting do SCSS para estruturar BEM
- Criar variáveis para cores, tamanhos e breakpoints
- Implementar mixins para funcionalidades reutilizáveis
- Organizar imports de forma hierárquica

### Exemplo de Estrutura BEM com SCSS:
```scss
.product-list {
  display: grid;
  gap: 1rem;

  &__item {
    border: 1px solid $border-color;
    border-radius: $border-radius;

    &--featured {
      border-color: $primary-color;
      box-shadow: 0 2px 8px rgba($primary-color, 0.2);
    }

    &--sold-out {
      opacity: 0.6;
      pointer-events: none;
    }
  }

  &__title {
    font-size: 1.1rem;
    margin-bottom: 0.5rem;

    &--large {
      font-size: 1.3rem;
    }
  }

  &__price {
    color: $success-color;
    font-weight: bold;

    &--discounted {
      color: $danger-color;
    }
  }
}
```

### 7. Formulários
- Usar Reactive Forms (FormBuilder, FormGroup, FormControl)
- Implementar validações personalizadas quando necessário
- Usar async validators para validações que dependem do servidor
- Mostrar mensagens de erro apropriadas

```typescript
this.form = this.fb.group({
  name: ['', [Validators.required, Validators.minLength(3)]],
  email: ['', [Validators.required, Validators.email]]
});
```

### 8. Estado e Gerenciamento de Dados
- Usar services para compartilhar estado entre components
- Implementar BehaviorSubject para estado reativo
- Considerar NgRx para estados complexos
- Cachear dados quando apropriado

### 9. Roteamento
- Usar lazy loading para módulos
- Implementar guards (CanActivate, CanLoad)
- Usar resolvers para pre-carregar dados
- Implementar breadcrumbs quando necessário

### 10. PWA Features
- Configurar service worker corretamente
- Implementar notificações push quando apropriado
- Cachear recursos offline
- Mostrar status de conectividade

### 11. Interceptors HTTP
- Implementar interceptors para autenticação
- Adicionar loading indicators
- Tratar erros globalmente
- Transformar dados quando necessário

```typescript
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();

    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(req);
  }
}
```

### 12. Interfaces e Types
- Criar interfaces para todos os objetos de dados
- Usar types para unions e literais
- Organizar em arquivos separados quando necessário

```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export type UserRole = 'admin' | 'user' | 'guest';
```

## Convenções de Nomenclatura
- Arquivos: kebab-case (exemplo: `user-profile.component.ts`)
- Classes TypeScript: PascalCase (exemplo: `UserProfileComponent`)
- Variáveis e funções: camelCase (exemplo: `getUserData`)
- Constantes: UPPER_SNAKE_CASE (exemplo: `API_ENDPOINTS`)
- Seletores: app-kebab-case (exemplo: `app-user-profile`)
- **Classes CSS (BEM)**: kebab-case com BEM (exemplo: `user-card__title--highlighted`)

## Estrutura de Módulos

### Core Module
- Services singleton (AuthService, ApiService)
- Guards e Interceptors
- Configurações globais

### Shared Module
- Components reutilizáveis
- Pipes customizados
- Directives comuns
- Material modules

### Feature Modules
- Cada feature em seu próprio módulo
- Lazy loading quando possível
- Routing próprio

## Performance e Boas Práticas
- Usar OnPush change detection quando apropriado
- Implementar virtual scrolling para listas grandes
- Usar trackBy em *ngFor
- Lazy load images
- Implementar pagination
- Minimizar bundle size

## Acessibilidade
- Usar semantic HTML
- Implementar ARIA labels
- Garantir contraste adequado
- Suporte a navegação por teclado
- Testes com screen readers

## UI/UX e Componentes

### PrimeNG e PrimeFlex
- **SEMPRE** usar componentes do PrimeNG para interface
- **SEMPRE** usar PrimeFlex para layout e responsividade
- Manter consistência visual em todas as telas
- Utilizar o sistema de grid do PrimeFlex

### Shared Components
- **OBRIGATÓRIO** usar componentes da pasta `shared/` sempre que disponível
- Antes de criar um novo component, verificar se já existe um similar no shared
- Contribuir com novos componentes reutilizáveis para o shared quando apropriado

### Desenvolvimento de Telas
- **ANTES** de criar uma nova tela, analisar outras telas existentes
- Manter padrões visuais e de layout consistentes
- Seguir a mesma estrutura de pastas e nomenclatura
- Reutilizar layouts e componentes já criados

### Schemas e Interfaces Zod
- **ANTES** de criar o arquivo `.ts`, verificar se já existe schema Zod
- **ANTES** de criar interfaces, verificar se já existe interface Zod para usar
- Reutilizar validações existentes
- Manter consistência nos schemas de validação

### Serviços HTTP
- **ANTES** de criar requisições, verificar se já existe serviço de requisição
- Reutilizar métodos HTTP existentes
- Manter padronização nos serviços de API
- Evitar duplicação de endpoints

## Análise Prévia e Reutilização
- **SEMPRE** analisar arquivos existentes antes de criar novos
- Verificar padrões estabelecidos no projeto
- Evitar duplicação de código e funcionalidades
- Manter arquitetura consistente em todo o frontend

## Segurança
- Sanitizar inputs
- Validar dados no frontend e backend
- Implementar CSP headers
- Não expor informações sensíveis
- Usar HTTPS

## Build e Deploy
- Configurar diferentes environments
- Otimizar para produção
- Implementar CI/CD
- Monitorar performance

## RxJS Best Practices
- Sempre fazer unsubscribe
- Usar operators apropriados (map, filter, switchMap, etc.)
- Evitar nested subscriptions
- Usar async pipe quando possível
````
`````
