# Guia de Configuração do Supabase - PandaBio

## Passo 1: Criar Projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Clique em "New Project"
3. Nome do projeto: `pandabio`
4. Senha do banco: Defina uma senha forte
5. Região: Escolha a região mais próxima (ex: South America)
6. Clique em "Create new project"

## Passo 2: Configurar o Banco de Dados

### 2.1 Executar o Schema SQL

1. No dashboard do Supabase, vá em "SQL Editor"
2. Clique em "New Query"
3. Copie o conteúdo do arquivo `src/database/schema.sql`
4. Cole e execute o SQL
5. Verifique se todas as tabelas foram criadas

### 2.2 Verificar Tabelas Criadas

As seguintes tabelas devem ser criadas:

- `profiles` - Perfis de usuário
- `links` - Links da bio
- `products` - Produtos
- `leads` - Leads capturados
- `activities` - Atividades do usuário
- `analytics` - Analytics de eventos
- `public_page_events` - Visitas e cliques da página pública

### 2.3 Ativar Analytics da Página Pública

Execute no SQL Editor o arquivo `src/database/2026093002_public_analytics_bootstrap.sql`.
Essa migration cria tabela, índices, RLS e RPC usados pela página pública. Sem ela, o painel
continua carregando, mas métricas públicas ficam vazias.

### 2.4 Publicar links da seção Links na bio

Execute no SQL Editor o arquivo `src/database/2026093003_public_profile_links.sql`.
Essa migration atualiza a view pública para retornar somente links ativos cadastrados na seção
`Links`, mantendo estatísticas internas fora da página pública.

### 2.5 Ativar Leads, CRM e captura pública

Execute as migrations na ordem abaixo:

1. `src/database/2026100102_leads_crm.sql` — status, origem, UTM, score, consentimento e RLS
   de atualização/exclusão.
2. `src/database/2026100103_central_event_tracking.sql` — eventos centralizados e contexto de
   origem.
3. `src/database/2026100104_public_lead_capture.sql` — RPC público `capture_public_lead`, com
   validação de consentimento e inserção segura de leads.
4. `src/database/2026100105_custom_form_lead_metadata.sql` — respostas dos campos personalizados
   em `leads.metadata`.
5. `src/database/2026100106_public_forms.sql` — disponibiliza definições de formulários na página
   pública para blocos `Formulário`.

Depois, crie um formulário em `Formulários`, adicione o bloco `Formulário` em `Minha Página` e
publique a página. O bloco `Contato` com `Captura de lead` continua suportado. A origem registrada
usa UTM/referrer; ela não identifica perfil individual de rede social.

## Passo 3: Configurar Autenticação

### 3.1 Habilitar Email Auth

1. Vá em "Authentication" > "Providers"
2. Habilite "Email"
3. Configure as seguintes opções:
   - **Confirm email**: Desabilitado (para desenvolvimento)
   - **Secure email change**: Habilitado
   - **Double opt-in**: Desabilitado

### 3.2 Configurar Email Templates (Opcional)

1. Vá em "Authentication" > "Email Templates"
2. Personalize os templates de:
   - Confirm signup
   - Reset password
   - Email change

## Passo 4: Obter Credenciais

### 4.1 API Keys

1. Vá em "Project Settings" > "API"
2. Copie:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY`

### 4.2 Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL="sua-project-url"
VITE_SUPABASE_ANON_KEY="sua-anon-key"
```

## Passo 5: Testar a Conexão

### 5.1 Testar com TypeScript

```bash
npm run lint
```

Deve não ter erros relacionados ao Supabase.

### 5.2 Testar a Aplicação

```bash
npm run dev
```

A aplicação deve:

- Carregar sem erros
- Detectar se Supabase está configurado
- Exigir Supabase configurado para autenticação e dados

## Passo 6: Integrar com Autenticação

### 6.1 Atualizar AuthScreen

O componente `AuthScreen.tsx` usa somente autenticação Supabase.

1. Importar o hook `useSupabaseAuth`
2. Substituir a lógica de autenticação local
3. Usar os métodos `signIn`, `signUp`, `signOut`

### 6.2 Exemplo de Integração

```typescript
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';

export const AuthScreen = () => {
  const { signIn, signUp, isSupabaseConfigured } = useSupabaseAuth();

  return <SupabaseAuthScreen />;
};
```

## Passo 7: Dados Existentes

Dados da aplicação devem existir no Supabase. O projeto não usa banco local nem migração automática a partir de armazenamento local.

## Passo 8: Configurar Row Level Security (RLS)

O schema SQL já inclui políticas RLS básicas. Para produção:

1. Vá em "Authentication" > "Policies"
2. Revise as políticas criadas
3. Adicione políticas específicas para seu caso de uso
4. Teste as políticas com diferentes usuários

## Passo 9: Configurar Realtime (Opcional)

Para atualizações em tempo real:

1. Vá em "Database" > "Replication"
2. Habilite "Realtime"
3. Selecione as tabelas para replicação:
   - `links`
   - `products`
   - `leads`
   - `activities`

## Passo 10: Monitoramento

### 10.1 Logs

1. Vá em "Database" > "Logs"
2. Configure logs para consultas lentas
3. Monitore erros de conexão

### 10.2 Performance

1. Vá em "Database" > "Performance"
2. Monitore consultas lentas
3. Otimize índices se necessário

## Passo 11: Testes

### 11.1 Testar Serviços

```typescript
import { ProfileService } from '../supabase/services/profileService';

// Testar criação de perfil
const profile = await ProfileService.upsertProfile({
  name: 'Test User',
  username: 'testuser',
  email: 'test@example.com',
  // ...
});
```

### 11.2 Testar Autenticação

```typescript
import { AuthService } from '../supabase/services/authService';

// Testar signup
const result = await AuthService.signUp('test@example.com', 'password123', {
  name: 'Test User',
  username: 'testuser',
});
```

## Passo 12: Documentação

### 12.1 API Reference

Documente os serviços criados:

- `ProfileService` - Gerenciamento de perfis
- `LinkService` - Gerenciamento de links
- `ProductService` - Gerenciamento de produtos
- `LeadService` - Gerenciamento de leads
- `ActivityService` - Gerenciamento de atividades
- `AuthService` - Autenticação

### 12.2 Schema do Banco

Mantenha o arquivo `src/database/schema.sql` atualizado
como documentação do schema do banco.

## Passo 13: Deploy

### 13.1 Variáveis de Ambiente de Produção

Configure as variáveis de ambiente no seu serviço de hosting:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 13.2 Webhooks (Opcional)

Configure webhooks para:

- Novos usuários
- Atualizações de perfil
- Novos leads

## Checklist Final

- [ ] Projeto Supabase criado
- [ ] Schema SQL executado
- [ ] Autenticação configurada
- [ ] Credenciais obtidas
- [ ] Variáveis de ambiente configuradas
- [ ] Conexão testada
- [ ] RLS configurado
- [ ] Serviços testados
- [ ] Integração com app validada
- [ ] Documentação atualizada

## Recursos Úteis

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime](https://supabase.com/docs/guides/realtime)

## Notas Importantes

1. **Segurança**: Nunca commite credenciais reais
2. **Ambientes**: Use projetos diferentes para dev/prod
3. **Backup**: Faça backup regular do banco
4. **RLS**: Teste políticas rigorosamente em produção
5. **Rate Limits**: Configure rate limits para APIs públicas

## Suporte

Se encontrar problemas:

1. Verifique as credenciais no `.env`
2. Confirme que o schema foi executado
3. Verifique os logs no dashboard Supabase
4. Teste a conexão com o script de teste
