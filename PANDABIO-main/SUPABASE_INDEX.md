# Índice de Documentação - Supabase Integration

## Documentação Disponível

### 1. **Guia de Configuração**

`SUPABASE_SETUP.md` - Guia completo passo-a-passo para configurar Supabase

### 2. **Schema do Banco de Dados**

`src/database/schema.sql` - Schema SQL completo com todas as tabelas, índices, triggers e RLS

### 3. **Tipos TypeScript**

`src/supabase/types.ts` - Tipos do banco de dados para type safety

### 4. **Cliente Supabase**

`src/supabase/client.ts` - Configuração do cliente Supabase

## Serviços Implementados

### Serviços de Dados

- `src/supabase/services/profileService.ts` - Gerenciamento de perfis
- `src/supabase/services/linkService.ts` - Gerenciamento de links
- `src/supabase/services/productService.ts` - Gerenciamento de produtos
- `src/supabase/services/leadService.ts` - Gerenciamento de leads
- `src/supabase/services/activityService.ts` - Gerenciamento de atividades

### Serviços de Autenticação

- `src/supabase/services/authService.ts` - Autenticação e gerenciamento de usuários

## Hooks Customizados

### Hooks React

- `src/hooks/useSupabaseAuth.ts` - Hook para autenticação
- `src/hooks/useSupabaseData.ts` - Hook para dados do PandaBio

## Estrutura do Banco de Dados

### Tabelas Principais

```
profiles (perfis de usuário)
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── name, username, email
├── plan ('Gratuito' | 'PRO')
├── bio_url, page_title, bio_description
└── avatar_url

links (links da bio)
├── id (UUID, PK)
├── user_id (UUID, FK → profiles)
├── title, url
├── clicks, leads, active
├── icon, type, order
└── created_at, updated_at

products (produtos)
├── id (UUID, PK)
├── user_id (UUID, FK → profiles)
├── name, price
├── sales_count, status
├── image, description
└── created_at, updated_at

leads (leads capturados)
├── id (UUID, PK)
├── user_id (UUID, FK → profiles)
├── name, email, phone
├── channel, link_id
└── created_at

activities (atividades)
├── id (UUID, PK)
├── user_id (UUID, FK → profiles)
├── title, subtitle
├── time_ago, type, timestamp
└── created_at

analytics (eventos de analytics)
├── id (UUID, PK)
├── user_id (UUID, FK → profiles)
├── link_id (UUID, FK → links)
├── event_type, device_type
├── referrer, ip_address, user_agent
└── created_at
```

## Segurança Implementada

### Row Level Security (RLS)

- Políticas por tabela para isolamento de dados
- Usuários só acessam seus próprios dados
- Proteção contra acesso não autorizado

### Autenticação

- Integração com Supabase Auth
- Sessão persistente
- Auto-refresh de tokens
- Email/Password auth

## Próximos Passos

### Integração Imediata

1. Configurar projeto Supabase
2. Executar schema SQL
3. Configurar variáveis de ambiente
4. Testar conexão

### Migração de Dados

1. Criar script de migração
2. Migrar dados do localStorage
3. Validar dados migrados
4. Atualizar app para usar Supabase

### Features Adicionais

1. Implementar realtime updates
2. Adicionar webhooks
3. Configurar analytics avançado
4. Implementar backup automático

## Referências Rápidas

### Criar Link

```typescript
import { LinkService } from '../supabase/services/linkService';

const newLink = await LinkService.createLink({
  title: 'Meu Site',
  url: 'https://meusite.com',
  clicks: 0,
  leads: 0,
  active: true,
  icon: 'custom',
  type: 'custom',
});
```

### Autenticar

```typescript
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';

const { signIn, signUp, user } = useSupabaseAuth();

await signIn('email@example.com', 'password');
await signUp('email@example.com', 'password', { name: 'User' });
```

### Carregar Dados

```typescript
import { useSupabaseData } from '../hooks/useSupabaseData';

const { links, products, leads, loading } = useSupabaseData();
```

## Notas Importantes

1. **Fallback**: O app funciona com localStorage se Supabase não estiver configurado
2. **Type Safety**: Todos os serviços são tipados com TypeScript
3. **Error Handling**: Serviços têm tratamento de erros robusto
4. **Performance**: Dados são carregados de forma otimizada
5. **Segurança**: RLS garante isolamento de dados

## Solução de Problemas

### Erro de Conexão

- Verifique variáveis de ambiente
- Confirme URL e anon key
- Verifique se projeto Supabase está ativo

### Erro de Autenticação

- Verifique se Auth está habilitado
- Confirme políticas RLS
- Teste com usuário de teste

### Erro de Permissão

- Verifique políticas RLS
- Confirme user_id está correto
- Teste com diferentes usuários
