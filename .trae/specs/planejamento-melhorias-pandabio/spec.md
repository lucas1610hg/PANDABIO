# PandaBio - Planejamento de Melhorias e Correções - Product Requirements Document

## Overview

- **Summary**: Planejamento end-to-end para implementar 30+ ações sequenciais de correção, qualidade, segurança, acessibilidade, implementação funcional e tooling no projeto PandaBio. Cada etapa é executada uma de cada vez em branch dedicada, com validação prévia, testes de verificação pós-implementação e rollback estruturado.
- **Purpose**: Eliminar inconsistências críticas (FK naming mismatch, store duplicada, bug toggleLink), elevar qualidade de código (ESLint/Prettier/testes), completar seções funcionais faltantes (12/13 seções nav vazias), fechar lacunas de acessibilidade (WCAG 2.1 AA), e preparar deploy em produção.
- **Target Users**: Equipe de desenvolvimento PandaBio (Devs + Tech Lead + QA).

---

## Goals

1. **Corrigir 100% dos problemas críticos** identificados na análise: inconsistência `profile_id` vs `user_id`, store duplicada, `toggleLink` bug, LGPD de IP.
2. **Elevar qualidade** com ESLint, Prettier, Vitest, cobertura mínima de testes em camadas core.
3. **Implementar 12 seções de navegação** faltantes (atual: apenas dashboard + minha-pagina implementadas).
4. **Fechar acessibilidade WCAG 2.1 AA** nos fluxos principais (modais, headings semânticos, foco, ARIA).
5. **Aplicar tokens de design** de forma sistemática (eliminar 80%+ de HEX arbitrário hardcoded).
6. **Hardening segurança no Supabase**: senha forte, confirmação email, captcha.
7. **Estruturar deploy preparado** (limpeza deps, React Query, build otimizado validado).
8. **Zero regressão**: cada etapa só avança após validações `lint + typecheck + testes + build + smoke test` manual.

---

## Non-Goals

- **Fora de escopo**: Implementar backend server-side Express (a deps é residual e será removida); criar CMS separado; refatorar para Next.js.
- **Fora de escopo**: Integrações de pagamento reais (Stripe/Mercado Pago) e domínio customizado bio público — mantém apenas a estrutura existente com `panda.bio/<username>`.
- **Fora de escopo**: Migrar Motion v12 → outra lib; migrar Zustand → Redux; migrar Tailwind v4 → v3.
- **Fora de escopo**: Refatorar routing para React Router (mantém estado `activeSection` interno).
- **Fora de escopo**: Escrever testes e2e Playwright na etapa atual (deixar planejado para ciclo pós-MVP).

---

## Background & Context

Análise detalhada do projeto executada em 20/09/2026 identificou:
- 25 componentes React; 6 tabelas Postgres c/ RLS; Zustand multi-usuário + store singleton duplicada.
- Stack: React 19, TypeScript 7, Vite 8, Tailwind v4, Motion v12, Supabase ^2.116, Zustand ^5, Zod ^4.
- Problemas ALTO: (1) FK naming entre schema SQL vs types/services, (2) multiUserStore.ts e usePandaBioStore.ts duplicam lógica, (3) 12/13 seções vazias, (4) toggleLink sempre ativa.
- Problemas MÉDIO: Sem ESLint/Prettier, 0 testes, tokens não aplicados, LGPD, acessibilidade modais, segurança auth fraca.
- Documentação existente: 8 arquivos .md (ANALISE_E_MELHORIAS.md, SECURITY_AUDIT_REPORT.md, ARCHITECTURE_MINHA_PAGINA.md, etc).

---

## Functional Requirements

- **FR-1 (Sequencialidade Estrita)**: O planejamento define que apenas 1 tarefa pode estar `in_progress` a qualquer momento. Tarefas são processadas por ordem de prioridade e dependência declarada. Nenhuma etapa subsequente começa enquanto a anterior não está `completed` com todos os TR (Test Requirements) aprovados.
- **FR-2 (Versionamento Branches)**: Cada tarefa T-N tem sua própria branch `hotfix/TN-<slug>` (correções) ou `feature/TN-<slug>` (implementações), criada a partir de `main` atualizada. Merge é feito via PR squash → main após checklist de validação.
- **FR-3 (Validação Prévia por Etapa)**: Antes de iniciar T-N, rodar PRE-FLIGHT: `git status` (sem alterações pendentes), `git pull main`, `npm ci`, `tsc --noEmit`, `npm run build` (garante base limpa).
- **FR-4 (Validação Pós por Etapa)**: Após implementar T-N, rodar POST-FLIGHT: (a) lint/typecheck, (b) testes unitários que passam, (c) build sem warnings/erros, (d) smoke test navegacional manual checklist, (e) diff de arquivos revisado, (f) TRs assinalados.
- **FR-5 (Test Requirements por Tarefa)**: Cada T-N tem pelo menos 1 TR do tipo `rule` (condição binária observável) e, quando aplicável, TR `rubric` (avaliativo com escala + threshold).
- **FR-6 (Rollback Estruturado)**: Cada T-N define explicitamente 3 passos de rollback: (R1) `git stash && git checkout main`, (R2) apagar branch T-N, (R3) reverter migrations SQL via migration down caso T-N envolva banco — e indica o ponto de decisão `Ir para rollback` caso 2 tentativas de correção na mesma T-N não resolvam a falha.
- **FR-7 (Corrigir FK Naming)**: Unificar `profile_id` vs `user_id` em todo o código (types/services) para corresponder ao `schema.sql` que usa `profile_id` nas tabelas dependentes (links, products, leads, activities, analytics).
- **FR-8 (Remover Store Duplicada)**: Apagar `multiUserStore.ts` e quaisquer referências, mantendo apenas `usePandaBioStore.ts` (Zustand) como fonte única de verdade.
- **FR-9 (Corrigir toggleLink Bug)**: `LinkService.toggleLink(id)` deve inverter o estado atual (active ↔ inactive) em vez de sempre setar `active: true`.
- **FR-10 (Anonimizar IP)**: Campo `ip_address INET` na tabela analytics deve ser mascarado (armazenar /24 para IPv4 e /64 para IPv6) via trigger/função ou normalizado no serviço antes de inserir.
- **FR-11 (ESLint + Prettier)**: Adicionar ESLint (@typescript-eslint + react-hooks + a11y) + Prettier + scripts npm, integrar ao script `lint` existente.
- **FR-12 (Vitest + Testes Core)**: Instalar Vitest + Testing Library + primeiros 15+ testes unitários (store, utils/storage, Zod schemas, serviços puros).
- **FR-13 (Tokens Sistemáticos)**: Mapear e substituir HEX hardcoded por referências aos tokens de [tokens.ts](file:///c:/Users/lucas/Downloads/PANDABIO/PANDABIO-main/PANDABIO-main/src/theme/tokens.ts) via Tailwind theme extend ou variáveis CSS.
- **FR-14 (Hardening Supabase Auth)**: Configurar segurança mínima: senha ≥8, requisitos letras/números/símbolos, confirmação email, captcha toggle habilitado no config.toml.
- **FR-15 (12 Seções Implementadas)**: Implementar conteúdo mínimo funcional para 12 seções: `agendamentos`, `estatisticas`, `links`, `conteudo`, `produtos`, `aparencia`, `integracoes`, `configuracoes`, `plano`, `ajuda`, `perfil`, `conteudo` — via [SectionViews.tsx](file:///c:/Users/lucas/Downloads/PANDABIO/PANDABIO-main/PANDABIO-main/src/components/SectionViews.tsx).
- **FR-16 (Acessibilidade Modais WCAG)**: `Modal.tsx` (e derivadas) com `role=dialog`, `aria-modal`, trap foco, fechamento ESC, overlay dismiss, `aria-labelledby`.
- **FR-17 (Headings Semânticos + Alt)**: Estrutura h1-h6 hierárquica por página, `alt` em todas imagens `<img>` e logo.
- **FR-18 (React Query para Data Fetching)**: Adotar @tanstack/react-query para cache/estado assíncrono de serviços Supabase em vez de useEffect bruto + loading manual.
- **FR-19 (Limpar Deps Residuais)**: Remover `express` (não usada no frontend).
- **FR-20 (Migração de Banco Versionada)**: Toda mudança em tabelas deve ser arquivo SQL numerado em `src/database/` com passo UP e DOWN explícito.

---

## Non-Functional Requirements

- **NFR-1 (Zero Merge Conflito Crítico)**: Branches são pequenas (1 tarefa = 1 feature/hotfix), atualizadas de `main` antes de iniciar, com escopo isolado em arquivos.
- **NFR-2 (Build Idempotente)**: Qualquer commit em `main` após T-N concluída deve passar `npm ci && npm run build && tsc --noEmit` sem erros.
- **NFR-3 (Performance Build)**: Bundle após todas etapas ≤ tamanho atual (code splitting mantido). Não adicionar lib sem tree-shakeable.
- **NFR-4 (Observabilidade de Testes)**: `npm test` retorna código 0 em main; cobertura medida por arquivo em camadas core (store/utils/schemas) ≥ 70% ao final do ciclo.
- **NFR-5 (Acessibilidade Lint)**: ESLint-plugin-jsx-a11y no modo `error` para regras WCAG essenciais.
- **NFR-6 (Compatibilidade Navegadores)**: `target: esnext` mantido; nenhum polyfill extra exigido além do que Vite 8 provê.
- **NFR-7 (Documentação Rastreável)**: Cada T-N referencia os ACs que cobre. Cada AC é mapeado no tasks.md às tarefas.

---

## Constraints

- **Técnicas**:
  - Não refatorar Zustand para outra lib; não trocar Tailwind v4.
  - Manter routing interno por estado (`activeSection`); não introduzir React Router.
  - Tarefas de banco alteram APENAS `src/database/*.sql` e correspondentes `src/supabase/types.ts` e services. Nenhum DDL manual.
  - Rollback de SQL sempre por migration DOWN numérico, nunca por edição manual.
- **Negócio**:
  - Nenhuma alteração em tipos de bloco, categorias de preset ou design tokens existentes — apenas aplicar/consumir de forma consistente.
  - Seções novas devem manter mesma linguagem visual (paleta laranja/azul, card branco sombra leve).
- **Dependências**:
  - Node 22+ (por React 19 / Vite 8).
  - npm como gerenciador (package-lock.json existe).
  - Supabase CLI para migrations locais (config.toml já existe).

---

## Assumptions

- A1: Ambiente Windows PowerShell com git instalado e SSH/HTTPS configurado.
- A2: `main` é a branch base e está protegida contra push direto (requer PR squash).
- A3: Credenciais Supabase locais válidas para rodar smoke test (se não houver, modo fallback `VITE_SUPABASE_URL` vazio é aceitável e já existe fallback no client.ts).
- A4: Nenhuma outra pessoa altera `main` durante execução das tarefas (se houver, PRE-FLIGHT faz `git pull --rebase main` e resolve conflitos antes de seguir).
- A5: `npm install` inicial já funcionou; lockfile existente é confiável.

---

## Open Questions

- [ ] **Q1 (Cap. de Testes)**: O usuário autoriza criação de arquivos `__tests__/` dentro de cada domínio (store, utils, schemas)? Alternativa: criar `src/__tests__/` central. *(Pendente: padrão adotado será por domínio, p.ex. `src/store/__tests__/usePandaBioStore.test.ts`)*
- [ ] **Q2 (Captcha Provider)**: Qual captcha: `hcaptcha` (padrão) ou `turnstile` (Cloudflare)? *(Default: hcaptcha, deixe desativado com chave env placeholder).*
- [ ] **Q3 (LGPD IP Strategy)**: Mascará no SQL (trigger PL/pgSQL) ou no service (antes de INSERT)? *(Default: ambos, dupla garantia — service normaliza + trigger força truncate.)*
- [ ] **Q4 (Branch Prefix Convention)**: `hotfix/TN-` vs `fix/TN-`; `feature/TN-` vs `feat/TN-`? *(Default: `hotfix/TN-` para criticos e `feature/TN-` para o restante, conforme FR-2.)*
- [ ] **Q5 (Deploy Target)**: O usuário pretende Vercel ou Cloud Run? *(Fora de escopo atual; manter Vite build universal.)*

---

## Acceptance Criteria

### AC-1: Execução sequencial e versionamento sem conflitos
- **Type**: `rule`
- **Given**: Lista de tarefas com `Depends On` ordenado e branch por tarefa
- **When**: Toda T-N só começa após T-(N-1) = `completed` e merge em main
- **Then**: Nenhuma tarefa em paralelo que toque os mesmos arquivos; conflitos de merge na prática = 0.
- **Pass Condition**: Histórico de commits em main mostra squashes 1-por-tarefa, sem merge commits de feature cruzadas.
- **Evidence**: `git log --oneline main --first-parent` + `tasks.md` status.

### AC-2: Validações pré e pós por etapa executadas
- **Type**: `rule`
- **Given**: PRE-FLIGHT e POST-FLIGHT checklists para cada T-N
- **When**: Ao iniciar e ao finalizar T-N
- **Then**: Todos checks do checklist preenchidos com resultado observável (pass/fail); nenhum passo "skiado" sem justificativa.
- **Pass Condition**: Em `tasks.md`, cada tarefa completed tem sessão Completion Evidence com saída de comando (ou screenshot/observação) de PRE e POST.
- **Evidence**: Arquivo `tasks.md` atualizado + logs de comandos `tsc`, `vitest run`, `vite build`.

### AC-3: TRs por tarefa atendidos
- **Type**: `rule`
- **Given**: Cada T-N define ≥ 1 TR rule + (opcional) TR rubric
- **When**: Após implementação de T-N
- **Then**: Todos TR rules passam; TR rubrics ≥ threshold.
- **Pass Condition**: 100% TR rules = pass e 100% TR rubrics ≥ threshold no tasks.md.
- **Evidence**: Seção Completion Evidence por tarefa.

### AC-4: Rollback documentado e executável
- **Type**: `rule`
- **Given**: Rollback R1/R2/R3 por T-N
- **When**: Em caso de falha insolúvel após 2 iterações em T-N
- **Then**: Rollback deixa main em estado idêntico anterior a T-N; nenhum rastro de migration SQL pendente.
- **Pass Condition**: T-N marcada blocked/cancelled com razão e evidência de rollback (hash de commit confirmado).
- **Evidence**: `git log -1 main` comprovadamente igual ao pre-T-N; migrations.sql status reverso.

### AC-5: FK naming consistente (profile_id)
- **Type**: `rule`
- **Given**: `schema.sql` usa `profile_id` em tabelas dependentes
- **When**: Types + services + hooks atualizados
- **Then**: Busca textual por `user_id` em `src/supabase/types.ts` e `src/supabase/services/*.ts` (campos de tabela dependente) retorna 0 ocorrências (exceto `profiles.user_id` FK → auth.users que é intencional).
- **Pass Condition**: Grep vazio; `tsc --noEmit` ok; build ok.
- **Evidence**: `rg --files-with-matches user_id src/supabase/types.ts src/supabase/services/` vazio.

### AC-6: Store única (Zustand apenas)
- **Type**: `rule`
- **Given**: Existem `usePandaBioStore.ts` e `multiUserStore.ts`
- **When**: Remoção concluída
- **Then**: `multiUserStore.ts` não existe; 0 imports dele; `tsc --noEmit` passa.
- **Pass Condition**: Arquivo apagado + `rg "multiUserStore" src/` vazio.
- **Evidence**: `ls src/services/` + grep output.

### AC-7: toggleLink inverte estado
- **Type**: `rule`
- **Given**: Link de estado conhecido (active=true)
- **When**: Chamar `LinkService.toggleLink(id)` 2x (ou RPC que lê/atualiza)
- **Then**: Estado final == estado inicial (toggle par).
- **Pass Condition**: Teste unitário do serviço passa; smoke test manual UI toggle não "trava" em true.
- **Evidence**: Vitest `✓ LinkService toggleLink inverts state`; screenshot UI.

### AC-8: IP anônimo no analytics
- **Type**: `rule`
- **Given**: IP exemplo `203.0.113.45`
- **When**: Inserir registro em analytics
- **Then**: IP armazenado = `203.0.113.0/24` (IPv4 truncado).
- **Pass Condition**: Teste unitário normalizador + função SQL passam.
- **Evidence**: Test `normalizeIp` + SELECT SQL após INSERT.

### AC-9: ESLint + Prettier rodando zero erros
- **Type**: `rule`
- **Given**: Config instalada
- **When**: `npm run lint` (ESLint + tsc) e `npm run format:check`
- **Then**: Exit code 0 em ambos.
- **Pass Condition**: 0 erros lint; 0 arquivos não formatados.
- **Evidence**: Saída de comando + hook pre-commit opcional instalado.

### AC-10: Vitest 15+ testes passando
- **Type**: `rule`
- **Given**: Config Vitest
- **When**: `npm test -- --run`
- **Then**: N testes ≥ 15, 0 falham, 0 skip.
- **Pass Condition**: Test Summary `Test Files 0 failed | Tests 0 failed`.
- **Evidence**: Log do runner + cobertura ≥ 70% core.

### AC-11: Tokens de cor aplicados sistematicamente
- **Type**: `rubric`
- **Dimension**: Redução de cores hardcoded arbitrárias (fora de tokens)
- **Scale**: 1-5
- **Anchors**:
  - 1 = Nenhuma ação (todos HEX livres, como hoje)
  - 3 = Substituição parcial (50% dos HEX arbitrários em componentes principais removidos)
  - 5 = Eliminação quase total (≥80% classes `bg-[#...]` e `text-[#...]` substituídas por classes nomeadas via tokens extend + CSS vars; tokens.ts é a fonte única)
- **Pass Threshold**: ≥ 4
- **Evidence**: `rg -c 'bg-\[#[0-9a-fA-F]+\]|text-\[#[0-9a-fA-F]+\]' src/components/` antes vs depois, + Tailwind config extend mapeado.

### AC-12: Auth hardening no config.toml
- **Type**: `rule`
- **Given**: config.toml atual
- **When**: Validação de chaves
- **Then**: `minimum_password_length = 8`; `password_requirements = "lower_upper_letters_digits_symbols"`; `enable_confirmations = true`; `[auth.captcha] enabled = true` com provider.
- **Pass Condition**: grep das 4 linhas = true/valores corretos.
- **Evidence**: `rg -n "minimum_password_length|password_requirements|enable_confirmations|auth.captcha" supabase/config.toml`.

### AC-13: 12 seções com conteúdo mínimo funcional
- **Type**: `rule`
- **Given**: [SectionViews.tsx](file:///c:/Users/lucas/Downloads/PANDABIO/PANDABIO-main/PANDABIO-main/src/components/SectionViews.tsx) atual retorna `<div>` vazio para 12 seções
- **When**: Após implementação
- **Then**: Cada seção do NavSection (exceto as 2 já feitas) renderiza pelo menos: título, descrição, layout grid/card consistente com dashboard, dados vindos da store ou listagem vazia state + botão CTA.
- **Pass Condition**: Fumaça navegacional por 14 cliques (1 dashboard + 12 seções + perfil) renderiza sem erros console, sem crash.
- **Evidence**: Checklist manual + log console limpo (0 error, 0 warning relevantes).

### AC-14: Modais WCAG AA
- **Type**: `rule`
- **Given**: 5+ modais existentes
- **When**: Abrir cada modal
- **Then**: (1) foco vai para primeiro elemento focável, (2) TAB não escapa modal, (3) ESC fecha, (4) clique overlay fecha, (5) `role=dialog aria-modal=true aria-labelledby` presentes, (6) foco retorna ao trigger.
- **Pass Condition**: 6 checks × 5 modais = 30 checks = 100% pass.
- **Evidence**: eslint-plugin-jsx-a11y `autocomplete-valid` etc passa + script de teste DOM.

### AC-15: Headings + alt img consistentes
- **Type**: `rubric`
- **Dimension**: Estrutura semântica e alternativo de imagens
- **Scale**: 1-5
- **Anchors**:
  - 1 = h1 múltiplos, semântica bagunçada, faltando alt em maioria imagens
  - 3 = 1 h1 por tela, headings hierárquicos mas alguns pulos (h1→h4); alt em 50% imagens
  - 5 = 1 único h1 por view, hierarquia h1→h2→h3 sem pulos; 100% `<img>` possuem alt não vazio e decorativos usam `aria-hidden=true`
- **Pass Threshold**: ≥ 4
- **Evidence**: ESLint jsx-a11y `heading-has-content` + `img-redundant-alt` passam + inspeção manual sample.

### AC-16: React Query adotado
- **Type**: `rule`
- **Given**: Hooks/services com useEffect bruto para fetch Supabase
- **When**: Refatoração mínima de 3 serviços (auth profile, links, page)
- **Then**: Usam `useQuery/useMutation`; loading/error por estado; cache dedupe automático; menos `useState` locais para isLoading.
- **Pass Condition**: 3 hooks refatorados passam testes; build ok.
- **Evidence**: Diff de código remoção ≥ 30 linhas useEffect manual.

### AC-17: Express removido
- **Type**: `rule`
- **Given**: package.json lista `express: ^4.21.2` e `@types/express`
- **When**: Uninstall + build + tsc
- **Then**: 0 referências `from 'express'`; package.json sem express; build ok.
- **Pass Condition**: `rg "express" package.json src/` só aparece em package-lock se remoção for pura.
- **Evidence**: Diff package.json + grep vazio em src.

### AC-18: Migrations versionadas com UP/DOWN
- **Type**: `rule`
- **Given**: Tarefas de banco (T4, T14)
- **When**: Criar SQL
- **Then**: Arquivo `YYYYMMDDNN_<desc>.sql` com bloco `-- UP` e `-- DOWN` explícito; `schema.sql` atualizado reflete estado final.
- **Pass Condition**: Arquivo existe e UP e DOWN são idempotentes.
- **Evidence**: LS pasta database + comentários no arquivo.

### AC-19: Build sem regressão após ciclo completo
- **Type**: `rule`
- **Given**: Todas T-N concluídas
- **When**: `npm ci && npm run build && npm run preview`
- **Then**: Build exit 0, chunk sizes aceitáveis (≤ atual), preview abre sem erros rede 404.
- **Pass Condition**: Tamanho bundle total (gzip) ≤ baseline inicial * 1.1.
- **Evidence**: Saída do `vite build` com sizes e relatório.

### AC-20: Qualidade geral workflow
- **Type**: `rubric`
- **Dimension**: Fidelidade do workflow sequencial + qualidade documentação de tarefas
- **Scale**: 0-2 (conforme Spec Mode Gotchas)
- **Anchors**:
  - 0 = Fases puladas, sem review, evidências faltantes
  - 1 = Fluxo funciona com um desvio não crítico (ex: uma tarefa não tem rollback escrito)
  - 2 = Todos 5 passos (Specify→Plan→Approve→Implement→Review) seguidos exatamente; limites de artefato respeitados
- **Pass Threshold**: ≥ 2
- **Evidence**: Artefatos atualizados em ordem e review ao final.
