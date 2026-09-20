# Arquitetura - Módulo Minha Página

## Visão Geral

Este documento descreve a arquitetura do módulo "Minha Página" da PandaBio, projetado para produção e escalabilidade.

## Estrutura do Banco de Dados

```
auth.users
    │
    └── profiles
          │
          └── bio_pages
                ├── page_settings
                ├── page_themes
                ├── page_blocks
                └── social_links
```

## Tabelas

### 1. `profiles`

Armazena informações básicas do usuário.

- Referencia `auth.users(id)`
- Contém username, display_name, bio, avatar, etc.
- Cada usuário tem exatamente um perfil

### 2. `bio_pages`

Páginas de bio dos usuários.

- Referencia `profiles(id)`
- Cada usuário pode ter múltiplas páginas (embora no MVP seja 1:1)
- Contém status (draft/published/archived)
- Controla visibilidade pública

### 3. `page_settings`

Configurações de exibição da página.

- Referencia `bio_pages(id)`
- Controla o que é mostrado (avatar, nome, bio, etc.)
- Configurações de SEO
- CSS customizado

### 4. `page_themes`

Aparência visual da página.

- Referencia `bio_pages(id)`
- Cores, fontes, estilos de botão
- Background (color/gradient/image/video)
- Temas customizados via JSONB

### 5. `page_blocks`

**Esta é a tabela mais importante e flexível.**

Em vez de tabelas separadas para cada tipo de conteúdo (links, images, videos, etc.), usamos uma única tabela com:

- `type`: enum que define o tipo do bloco
- `data`: JSONB com dados específicos do tipo
- `style`: JSONB com estilos customizados
- `position`: ordem de exibição
- `visibility`: visible/hidden/scheduled

#### Exemplos de `data` por tipo:

**Link:**

```json
{
  "url": "https://instagram.com/meuusuario",
  "icon": "instagram",
  "open_new_tab": true
}
```

**Vídeo:**

```json
{
  "video_url": "https://youtube.com/watch?v=...",
  "thumbnail_url": "https://...",
  "autoplay": false,
  "platform": "youtube"
}
```

**Booking (Agendamento):**

```json
{
  "booking_service_id": "uuid-do-servico",
  "show_price": true,
  "show_duration": true
}
```

**Produto:**

```json
{
  "product_id": "uuid-do-produto",
  "name": "Meu Produto",
  "price": 99.9,
  "image": "https://..."
}
```

### 6. `social_links`

Links de redes sociais separados (para perfis públicos).

- Referencia `bio_pages(id)`
- Links estáticos para redes sociais
- Diferente de blocos do tipo 'link' que são dinâmicos

## Vantagens desta Arquitetura

### 1. **Escalabilidade**

- Uma única tabela `page_blocks` handle todos os tipos de conteúdo
- Adicionar novos tipos de bloco é simples: adicionar ao enum e ao TypeScript
- Não precisa criar novas tabelas para cada tipo

### 2. **Flexibilidade**

- JSONB permite estruturas de dados diferentes por tipo
- Estilos customizados por bloco
- Fácil adicionar novos campos sem migrations

### 3. **Separação de Responsabilidades**

- Cada tabela tem uma responsabilidade clara
- Fácil estender com novos módulos (Agendamentos, Produtos, etc.)
- O bloco `booking` apenas aponta para o sistema de agendamento

### 4. **Performance**

- Índices otimizados para queries comuns
- GIN index em `page_blocks.data` para JSONB searches
- Separar settings/theme/blocks permite otimizar cada parte

## Arquitetura Futura da PandaBio

```
PANDA BIO
│
├── Usuários
│   └── profiles
│
├── Minha Página (IMPLEMENTADO)
│   ├── bio_pages
│   ├── page_settings
│   ├── page_themes
│   ├── page_blocks
│   └── social_links
│
├── Agendamentos (PRÓXIMO MÓDULO)
│   ├── services
│   ├── professionals
│   ├── availability
│   ├── clients
│   ├── bookings
│   └── blocks
│
├── Produtos
│
├── Analytics
│
├── Pagamentos
│
└── Assinatura
```

## Como Implementar no Frontend

### 1. Atualizar Tipos TypeScript

- Usar `types_minha_pagina.ts` em vez de `types.ts`
- Adicionar novos tipos conforme necessário

### 2. Criar Serviços Supabase

- `pageService.ts` - gerenciar `bio_pages`
- `blockService.ts` - gerenciar `page_blocks`
- `themeService.ts` - gerenciar `page_themes`
- `settingsService.ts` - gerenciar `page_settings`

### 3. Atualizar Componentes

- `PageEditor.tsx` - usar nova estrutura
- Cada seção do editor gerencia sua respectiva tabela
- Blocos usar o serviço `blockService`

### 4. Migração de Dados

- Converter dados existentes para nova estrutura
- Criar função de migração se necessário

## Próximos Passos

1.  Definir arquitetura do banco de dados
2.  Criar schema SQL de produção
3.  Definir tipos TypeScript
4.  ⏳ Executar schema no Supabase
5.  ⏳ Criar serviços Supabase para as novas tabelas
6.  ⏳ Adaptar frontend para usar nova estrutura
7.  ⏳ Testar fluxo completo
8.  ⏳ Planejar módulo de Agendamentos

## Notas Importantes

### Sobre Agendamentos

O bloco `booking` em `page_blocks` **não** contém todo o sistema de agendamento. Ele apenas:

- Aponta para um `booking_service_id`
- Define configurações de exibição (show_price, show_duration)

O sistema real de agendamentos será um módulo separado com suas próprias tabelas.

### Sobre Page Blocks

A decisão de usar uma única tabela com JSONB é intencional:

- Torna a arquitetura mais extensível
- Facilita adicionar novos tipos de bloco
- Permite estruturas de dados flexíveis
- Melhor performance para operações CRUD de blocos

### Sobre Múltiplas Páginas

Embora o MVP seja 1 usuário = 1 página, a arquitetura suporta:

- Múltiplas páginas por usuário
- A/B testing
- Páginas temporárias
- Versões diferentes

## Referências

- Schema SQL: `src/database/schema_minha_pagina.sql`
- Tipos TypeScript: `src/types_minha_pagina.ts`
- Documentação Supabase: https://supabase.com/docs
