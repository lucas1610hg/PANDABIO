# 📅 Arquitetura do Banco de Dados - Módulo Agendamentos

## 🎯 Visão Geral

Este documento descreve a arquitetura completa do banco de dados para o módulo de agendamentos da PandaBio, projetado para produção com foco em segurança, escalabilidade e integridade dos dados.

## 📁 Arquivos de Migração

### 1. **2026092101_agendamentos_core_tables.sql**
Tabelas principais do sistema de agendamentos:
- `booking_workspaces` - Négocios/salões
- `booking_settings` - Configurações por workspace
- `booking_services` - Serviços oferecidos
- `booking_professionals` - Profissionais
- `booking_professional_services` - Relação profissional-serviço
- `booking_availability` - Horários recorrentes
- `booking_blocked_slots` - Bloqueios/férias
- `booking_clients` - Clientes
- `booking_appointments` - Agendamentos
- `booking_audit_log` - Histórico de alterações
- `booking_notifications` - Sistema de notificações

### 2. **2026092102_agendamentos_rls_policies.sql**
Políticas RLS e segurança:
- Funções auxiliares de autenticação
- Políticas RLS para todas as tabelas
- Views públicas para consulta externa
- Triggers para auditoria automática
- Validação de segurança

### 3. **2026092103_agendamentos_rpc_functions.sql**
Funções RPC para operações complexas:
- `create_booking` - Criar reserva pública
- `confirm_booking` - Confirmar agendamento
- `cancel_booking` - Cancelar agendamento
- `reschedule_booking` - Reagendar
- `get_available_slots` - Listar horários disponíveis
- `get_workspace_stats` - Estatísticas do workspace
- `mark_no_show` - Marcar não comparecimento
- `complete_booking` - Completar agendamento

### 4. **2026092104_agendamentos_seed_data.sql**
Dados de teste para desenvolvimento (NÃO usar em produção):
- Workspace de exemplo (Salão PandaBio)
- 8 serviços de exemplo
- 3 profissionais de exemplo
- Disponibilidade recorrente
- 3 clientes de exemplo
- 3 agendamentos de exemplo
- Bloqueio de férias
- Notificações de teste

## 🏗️ Arquitetura das Tabelas

### Relacionamento Principal

```
profiles (EXISTENTE)
    └── booking_workspaces
            ├── booking_settings
            ├── booking_services
            ├── booking_professionals
            │       └── booking_professional_services
            ├── booking_availability
            ├── booking_blocked_slots
            ├── booking_clients
            ├── booking_appointments
            ├── booking_audit_log
            └── booking_notifications
```

### Tabelas Principais

#### **booking_workspaces**
Representa cada negócio/salão com isolamento completo de dados.

**Campos principais:**
- `profile_id` - FK para profiles (dono do workspace)
- `slug` - URL única para o workspace
- `timezone` - Fuso horário do negócio
- `active` - Status do workspace

**Segurança:** Apenas o dono pode acessar seus workspaces.

#### **booking_services**
Serviços oferecidos pelo negócio (corte, barba, manicure, etc).

**Campos principais:**
- `workspace_id` - FK para workspace
- `name` - Nome do serviço
- `duration` - Duração em minutos
- `price` - Preço do serviço
- `category` - Categoria para organização
- `color` - Cor para UI

**Regras de negócio:**
- Duração e preço são preservados no momento da reserva
- Validação de valores positivos

#### **booking_professionals**
Profissionais que executam os serviços.

**Campos principais:**
- `workspace_id` - FK para workspace
- `name` - Nome do profissional
- `specializations` - Array de especialidades
- `active` - Status do profissional

#### **booking_professional_services**
Relação muitos-para-muitos entre profissionais e serviços.

**Campos principais:**
- `professional_id` - FK para profissional
- `service_id` - FK para serviço
- `custom_price` - Preço específico por profissional
- `custom_duration` - Duração específica por profissional

**Regras de negócio:**
- Um profissional pode executar vários serviços
- Um serviço pode ser executado por vários profissionais
- Preço/duração podem variar por profissional

#### **booking_availability**
Horários de trabalho recorrentes por profissional.

**Campos principais:**
- `professional_id` - FK para profissional
- `day_of_week` - Dia da semana (0-6)
- `start_time` / `end_time` - Horário de trabalho
- `break_start_time` / `break_end_time` - Pausas

**Regras de negócio:**
- Validação de ordem temporal
- Um profissional tem apenas um horário por dia da semana

#### **booking_blocked_slots**
Bloqueios temporários (férias, feriados, manutenção).

**Campos principais:**
- `professional_id` - FK para profissional (opcional)
- `start_date` / `end_date` - Período bloqueado
- `blocked_type` - Tipo de bloqueio

**Regras de negócio:**
- Reservas canceladas não bloqueiam novos horários
- Bloqueios sobrepõem disponibilidade recorrente

#### **booking_clients**
Clientes que fazem agendamentos.

**Campos principais:**
- `workspace_id` - FK para workspace
- `name` / `email` / `phone` - Dados de contato
- `total_bookings` - Contador de agendamentos
- `total_spent` - Valor total gasto
- `no_show_count` - Contador de não comparecimentos

**Privacidade (LGPD):**
- Consentimento de marketing
- Consentimento de processamento de dados

#### **booking_appointments**
Reservas de agendamento (tabela central).

**Campos principais:**
- `workspace_id` / `profile_id` - FKs de isolamento
- `client_id` / `professional_id` / `service_id` - FKs relacionais
- `date` / `start_time` / `end_time` - Data e hora
- `status` - Status do agendamento
- `payment_status` - Status de pagamento

**Snapshot de dados (preservação):**
- `service_name` / `service_duration` / `service_price` - Dados no momento da reserva
- `professional_name` - Nome do profissional no momento da reserva

**Status e transições:**
- `pending` → `confirmed` → `in_progress` → `completed`
- `pending` → `cancelled` / `expired`
- `confirmed` → `cancelled` / `no-show`

**Regras de negócio:**
- Validação de transições de status
- Preço e duração preservados no momento da reserva
- Controle de conflitos via RLS

#### **booking_audit_log**
Histórico de alterações importantes.

**Campos principais:**
- `entity_type` / `entity_id` - Entidade alterada
- `action` - Tipo de ação (created, updated, deleted, etc.)
- `old_values` / `new_values` - Snapshot antes/depois
- `changed_by` - Quem fez a alteração

**Auditoria:**
- Triggers automáticos para agendamentos
- Registro de alterações de status
- Rastreabilidade completa

#### **booking_notifications**
Sistema de notificações e lembretes.

**Campos principais:**
- `appointment_id` / `client_id` / `professional_id` - FKs
- `type` - Tipo de notificação
- `status` - Status de envio
- `channels` - Canais de envio (email, SMS, WhatsApp)

**Tipos de notificação:**
- `reminder` - Lembrete de agendamento
- `confirmation` - Confirmação de reserva
- `cancellation` - Cancelamento
- `reschedule` - Reagendamento
- `no_show` - Não comparecimento

## 🔒 Segurança e RLS

### Estratégia de Isolamento

1. **Workspace-based isolation:** Todas as tabelas têm `workspace_id` e `profile_id`
2. **Funções auxiliares:** `is_workspace_owner()` e `has_workspace_access()`
3. **Políticas RLS:** Verificam acesso antes de qualquer operação
4. **View pública:** `public_booking_availability` para consultas externas sem expor dados sensíveis

### Políticas RLS

Todas as tabelas têm RLS habilitado com políticas estritas:

- **SELECT:** Apenas usuários com acesso ao workspace
- **INSERT:** Apenas usuários com acesso ao workspace
- **UPDATE:** Apenas usuários com acesso ao workspace
- **DELETE:** Apenas usuários com acesso ao workspace

### Proteção Contra Conflitos

1. **RLS Policy:** Verifica conflito antes de INSERT em agendamentos
2. **Função `check_booking_conflict`:** Validação centralizada
3. **Trigger UPDATE:** Previne conflitos ao reagendar (exceto cancelados)
4. **Sempre considerar cancelados:** Reservas canceladas não bloqueiam novos horários

## ⚡ Índices de Performance

### Índices Criados

**Workspaces:**
- `idx_booking_workspaces_profile_id`
- `idx_booking_workspaces_slug`
- `idx_booking_workspaces_active`

**Serviços:**
- `idx_booking_services_workspace_id`
- `idx_booking_services_active`
- `idx_booking_services_category`

**Profissionais:**
- `idx_booking_professionals_workspace_id`
- `idx_booking_professionals_active`

**Agendamentos (CRÍTICOS):**
- `idx_booking_appointments_professional_date` - Para ver agenda de profissional
- `idx_booking_appointments_datetime` - Para consultas de período
- `idx_booking_appointments_status` - Para filtrar por status
- `idx_booking_appointments_confirmation_code` - Para busca por código

**Clientes:**
- `idx_booking_clients_email` / `idx_booking_clients_phone` - Para busca rápida
- `idx_booking_clients_name_search` - GIN index para busca textual

## 🔄 Estratégia de Concorrência

### Prevenção de Overbooking

1. **Verificação no INSERT:** Política RLS bloqueia inserts com conflito
2. **Verificação no UPDATE:** Política RLS bloqueia updates que criam conflito
3. **Exceção para cancelados:** Agendamentos cancelados não são considerados na verificação
4. **Snapshot de dados:** Dados são preservados no momento da reserva

### Transações Atômicas

As funções RPC usam transações para garantir atomicidade:
- `create_booking` - Verifica disponibilidade e cria reserva em uma transação
- `reschedule_booking` - Verifica conflito e atualiza em uma transação
- Todas as funções rollback em caso de erro

## 🌐 Timezone Management

### Estratégia

1. **Armazenamento:** Todos os horários são armazenados em UTC
2. **Timezone por workspace:** Cada workspace tem seu próprio timezone
3. **Conversão:** Frontend deve converter para o timezone do workspace
4. **Funções RPC:** Consideram timezone nas validações

### Implementação

- Campo `timezone` em `booking_workspaces`
- Campo `timezone` em `booking_appointments` (para preservação)
- Conversão feita no frontend via JavaScript

## 📋 Status de Agendamento

### Estados e Transições

```
pending → confirmed → in_progress → completed
    ↓           ↓           ↓
  expired    cancelled    no-show
```

### Regras de Transição

1. **pending → confirmed:** Apenas se dentro do limite de confirmação
2. **confirmed → completed:** Apenas se pagamento confirmado
3. **confirmed → cancelled:** Respeita política de cancelamento
4. **pending → expired:** Automaticamente após X horas sem confirmação
5. **completed / cancelled / no-show:** Estado final, não pode mudar

### Timestamps Automáticos

- `confirmed_at` - Definido automaticamente ao confirmar
- `completed_at` - Definido automaticamente ao completar
- `cancelled_at` - Definido automaticamente ao cancelar/no-show

## 🎯 Funções RPC

### Funções Públicas (Reservas)

**`create_booking`**
- Cria nova reserva pública
- Verifica disponibilidade, bloqueios e conflitos
- Cria cliente se não existir
- Gera código de confirmação único
- Preserva dados do serviço no momento da reserva

**`check_availability`**
- Verifica se um horário está disponível
- Considera disponibilidade recorrente
- Considera bloqueios temporários
- Considera agendamentos existentes

### Funções Internas (Gestão)

**`confirm_booking`**
- Confirma agendamento pendente
- Verifica permissões
- Cria notificação de confirmação
- Atualiza timestamp de confirmação

**`cancel_booking`**
- Cancela agendamento
- Verifica política de cancelamento
- Respeita horas mínimas de antecedência
- Cria notificação de cancelação
- Não bloqueia novos horários (regra de negócio)

**`reschedule_booking`**
- Reagenda agendamento para novo horário
- Verifica disponibilidade do novo horário
- Mantém dados originais (snapshot)
- Cria notificação de reagendamento
- Registra no audit log

**`get_available_slots`**
- Lista slots disponíveis em um período
- Gera slots de acordo com configuração
- Filtra por disponibilidade e bloqueios
- Verifica conflitos com agendamentos existentes

**`get_workspace_stats`**
- Calcula estatísticas do workspace
- Total de agendamentos por status
- Receita total e média
- Taxas de ocupação, cancelamento e no-show
- Número de clientes, serviços e profissionais

**`mark_no_show`**
- Marca agendamento como não compareceu
- Incrementa contador de no-show do cliente
- Verifica se status permite mudança
- Apenas para confirmados ou em progresso

**`complete_booking**
- Marca agendamento como concluído
- Atualiza timestamp de conclusão
- Trata pagamentos pendentes
- Verifica permissões

## 🧪 Plano de Testes e Validação

### Testes de Segurança RLS

1. **Teste de isolamento:** Usuário A não pode ver dados do usuário B
2. **Teste de permissão:** Usuário não-autenticado não pode acessar dados
3. **Teste de view pública:** View pública não expõe dados sensíveis
4. **Teste de políticas:** Políticas RLS bloqueiam acessos não autorizados

### Testes de Concorrência

1. **Teste de overbooking:** Tentar criar dois agendamentos no mesmo horário
2. **Teste de reagendamento:** Reagendar para horário ocupado deve falhar
3. **Teste de cancelamento:** Cancelar deve liberar o horário
4. **Teste de simultaneidade:** Múltiplas reservas simultâneas no mesmo horário

### Testes de Regras de Negócio

1. **Teste de preservação:** Preço/duração preservados no momento da reserva
2. **Teste de status:** Transições de status seguem as regras
3. **Teste de timezone:** Conversão correta de timezone
4. **Teste de bloqueios:** Bloqueios têm prioridade sobre disponibilidade

### Testes de Auditoria

1. **Teste de audit log:** Alterações importantes são registradas
2. **Teste de snapshots:** Dados antes/depois são capturados
3. **Teste de rastreabilidade:** É possível identificar quem fez cada alteração
4. **Teste de triggers:** Triggers funcionam automaticamente

## ⚠️ Riscos Técnicos e Decisões

### Riscos Identificados

1. **Concorrência em alta escala:** 
   - **Mitigação:** RLS com verificação de conflito + índices otimizados
   - **Monitoramento:** Observar deadlock em produção

2. **Timezone complexity:**
   - **Mitigação:** Timezone armazenado por workspace, conversão no frontend
   - **Validação:** Testes com diferentes timezones

3. **Performance em muitos agendamentos:**
   - **Mitigação:** Índices específicos para consultas comuns
   - **Monitoramento:** Observar queries lentas

4. **Dados sensíveis em view pública:**
   - **Mitigação:** View pública exclui dados pessoais e financeiros
   - **Validação:** Revisão periódica da view

### Decisões que Requerem Confirmação

1. **Política de expiração:** 
   - **Decisão:** Agendamentos pendentes expiram após X horas sem confirmação
   - **Padrão:** 24 horas
   - **Configurável:** Sim, via `booking_settings`

2. **Limites de no-show:**
   - **Decisão:** Clientes com muitos no-show podem ser bloqueados
   - **Padrão:** 3 no-shows = aviso, 5 = bloqueio temporário
   - **Configurável:** Sim, via `booking_settings`

3. **Cache de disponibilidade:**
   - **Decisão:** Implementar cache para disponibilidade?
   - **Recomendação:** Não inicialmente, considerar se performance for problema
   - **Risco:** Cache pode ficar desincronizado

4. **Sistema de filas para horários populares:**
   - **Decisão:** Implementar sistema de filas para horários disputados?
   - **Recomendação:** Não inicialmente, considerar se houver demanda
   - **Complexidade:** Alta, requer arquitetura adicional

## 📊 Estatísticas e Relatórios

### Métricas Disponíveis

1. **Ocupação:** Percentual de slots ocupados
2. **Taxa de cancelamento:** Percentual de cancelamentos
3. **Taxa de no-show:** Percentual de não comparecimentos
4. **Receita total:** Soma de pagamentos confirmados
5. **Ticket médio:** Receita total / agendamentos pagos
6. **Performance por profissional:** Comparativo entre profissionais
7. **Popularidade de serviços:** Mais e menos reservados

### Relatórios Sugeridos

1. **Relatório diário:** Agendamentos do dia, receita, ocupação
2. **Relatório semanal:** Tendências, comparação com semana anterior
3. **Relatório mensal:** Consolidado, métricas gerais
4. **Relatório por profissional:** Performance individual
5. **Relatório de no-show:** Clientes com alto índice

## 🚀 Próximos Passos

### Para Produção

1. **Criar as tabelas** no Supabase production
2. **Configurar Webhooks** para notificações
3. **Implementar integração** com gateway de pagamento
4. **Configurar backup** automático
5. **Monitorar performance** e ajustar índices conforme necessário

### Para Frontend

1. **Criar TypeScript types** baseados no schema
2. **Implementar hooks** para cada função RPC
3. **Criar componentes** para cada tela solicitada
4. **Implementar conversão de timezone** no frontend
5. **Adicionar validações** no frontend (além das do backend)

### Para Monitoramento

1. **Configurar alertas** para erros de banco
2. **Monitorar performance** das funções RPC
3. **Observar taxa de conflitos** (indica possível bug)
4. **Monitorar tempo de resposta** das APIs
5. **Revisar logs de auditoria** regularmente

## 📝 Considerações Importantes

### Não Duplicação

As tabelas de agendamentos foram projetadas para funcionar com o schema existente:
- Usam `profiles` existente como base
- Respeitam a estrutura de RLS já implementada
- Não interferem com tabelas existentes (links, products, etc.)

### Compatibilidade

O schema é compatível com:
- **Supabase Auth** (usa `auth.users`)
- **Supabase Storage** (pode ser usado para avatares)
- **Supabase Realtime** (pode ser usado para atualizações em tempo real)
- **Supabase Edge Functions** (pode ser usado para lógica adicional)

### Escalabilidade

A arquitetura suporta:
- **Múltiplos workspaces** por usuário
- **Múltiplos profissionais** por workspace
- **Milhares de agendamentos** (índices otimizados)
- **Alta concorrência** (RLS + transações)
- **Crescimento horizontal** (pode particionar por workspace no futuro)

---

**Documentação atualizada em:** 2026-09-21  
**Versão do schema:** 1.0  
**Status:** Pronto para implementação em produção