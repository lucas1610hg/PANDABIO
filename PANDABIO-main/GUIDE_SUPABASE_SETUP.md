# Guia de Configuração do Supabase

## Passo 1: Criar arquivo .env

Crie um arquivo chamado `.env` na raiz do projeto (mesmo nível do package.json) com o seguinte conteúdo:

```env
VITE_SUPABASE_URL="https://irtrqccahpaxknidrxwy.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlydHJxY2NhaHBheGtuaWRyeHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NTYxNjAsImV4cCI6MjEwNTMzMjE2MH0.Ny3rHQsK0ARq2BbTsYBSr--pTvEE0gO49dq5DDCK0Sk"
```

## Passo 2: Configurar Providers OAuth (Opcional - para login social)

Para habilitar login com Google e Facebook:

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá para "Authentication" > "Providers"
4. Configure os providers que deseja usar:

### Google OAuth:
- Ative o provider "Google"
- Adicione seu Client ID e Client Secret do Google Console
- Configure o Redirect URL: `https://irtrqccahpaxknidrxwy.supabase.co/auth/v1/callback`

### Facebook OAuth:
- Ative o provider "Facebook"  
- Adicione seu App ID e App Secret do Facebook Developers
- Configure o Redirect URL: `https://irtrqccahpaxknidrxwy.supabase.co/auth/v1/callback`

## Passo 3: Executar Schema SQL no Supabase

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá para "SQL Editor" no menu lateral
4. Clique em "New Query"
5. Copie todo o conteúdo do arquivo `src/database/schema.sql`
6. Cole no editor SQL
7. Clique em "Run" para executar

## Passo 4: Reiniciar o projeto

Após criar o arquivo .env, reinicie o servidor de desenvolvimento:

```bash
# Pare o servidor atual (Ctrl+C)
# E execute novamente:
npm run dev
```

## O que o schema SQL faz:

1. **Cria tabela profiles** com campos para informações do usuário
2. **Configura relação** com a tabela auth.users do Supabase
3. **Cria trigger automático** para criar perfil quando usuário se cadastrar
4. **Configura RLS (Row Level Security)** para segurança dos dados
5. **Cria índices** para performance das consultas
6. **Configura políticas** para permitir OAuth e autenticação regular

## Funcionalidades habilitadas após configuração:

- ✅ Cadastro de usuários com email e senha
- ✅ Login com email e senha
- ✅ Login social (Google, Facebook) - se configurado
- ✅ Criação automática de perfil ao cadastrar
- ✅ Recuperação de senha
- ✅ Sessão persistente
- ✅ Refresh automático de token

## Teste a autenticação:

### Cadastro com email/senha:
1. Acesse http://localhost:3000
2. Clique em "Cadastrar"
3. Preencha com um email real e senha
4. O usuário será criado no Supabase Auth
5. O perfil será criado automaticamente na tabela profiles
6. Você será redirecionado para o dashboard

### Login social (se configurado):
1. Clique em "Continuar com Google" ou "Continuar com Facebook"
2. Será redirecionado para o provider OAuth
3. Após autorizar, será redirecionado de volta
4. O perfil será criado automaticamente
5. Você será redirecionado para o dashboard

## Solução de problemas:

### Erro "Supabase não configurado"
- Verifique se o arquivo .env foi criado na raiz do projeto
- Verifique se as variáveis de ambiente estão corretas
- Reinicie o servidor após criar o .env

### Erro "Tabela profiles não existe"
- Execute o schema SQL no painel do Supabase
- Verifique se não houve erros na execução do SQL

### Erro "Email já cadastrado"
- Use um email diferente para teste
- Ou exclua o usuário no painel do Supabase > Authentication > Users

### Erro "OAuth não configurado"
- Configure os providers no painel do Supabase > Authentication > Providers
- Verifique se as credenciais OAuth estão corretas
- Verifique se os Redirect URLs estão configurados corretamente
