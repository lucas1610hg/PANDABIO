# PandaBio - Planejamento de Melhorias - Implementation Plan

> **Regra Geral de Execução Sequencial**: Apenas 1 tarefa pode estar `in_progress`. A tarefa T-N só inicia após T-(N-1) estar `completed` com merge em `main`.
> **Checklist Obligatoriedade**:
> - ✅ PRE-FLIGHT (antes de começar T-N): `git status` (limpo) → `git checkout main && git pull --rebase` → `git checkout -b <branch>` → `npm ci` → `tsc --noEmit` → `npm run build` (base ok).
> - ✅ IMPLEMENT (editar arquivos, commit parcial).
> - ✅ POST-FLIGHT: `tsc --noEmit` → `npm run lint` → `npm test -- --run` (se testes existirem) → `npm run build` → smoke test navegacional → merge squash em main → apagar branch remoto/local.
> - ✅ Se 2 tentativas de correção na mesma T-N não resolverem → disparar ROLLBACK.

---

## Regime de Branches (Versionamento Sem Conflitos)

| Nome | Uso | Origem | Merge Strategy |
|------|-----|--------|----------------|
| `main` | Branch protegida, sempre verde | - | Apenas via PR squash |
| `hotfix/TN-slug` | Correções críticas (segurança, tipo, bug) | `main` atualizado | Squash → `main` |
| `feature/TN-slug` | Funcionalidade nova / qualidade | `main` atualizado | Squash → `main` |

**Por que squash?** Histórico linear 1 commit = 1 tarefa. Elimina conflitos de merge commit e facilita bissect.

---

## Regime de Rollback (por Tarefa)

Cada tarefa traz Rollback de 3 níveis. Executar em ordem:

| Nível | Ação | Gatilho |
|-------|------|---------|
| **R1 - Desfaz alterações locais** | `git stash push -u -m "T-N rollback"` + `git checkout main` | Erros de tipo/lint/build leves sem saída rápida. |
| **R2 - Apaga branch T-N inteira** | `git branch -D <branch>` + remover remoto `git push origin :<branch>` | Após R1, se quiser abandonar a tarefa. |
| **R3 - Reverte migration SQL (se aplicável)** | Rodar bloco `-- DOWN` do último arquivo SQL aplicado em `src/database/` local e remoto Supabase (via Dashboard/SQL Editor). Confirmar `schema.sql` reflete estado prévio. | T-N envolve `ALTER TABLE` e alteração não pode continuar. |

**Regra de parada**: Se após **2 iterações** de tentativa de correção em T-N ainda há falhas → registrar `Blocked By` + `Unblock Condition` em tarefa; e executar R1/R2/R3 (tudo ou nada). Nenhuma próxima tarefa começa.

---

# FASE 1 — CORREÇÕES CRÍTICAS (01 a 06)

---

## Task 1: Baseline e snapshot inicial + proteger main
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Branch**: `hotfix/T1-baseline`
- **Description**:
  - Criar commit de baseline: registrar estado atual de `main` com snapshot de tipos e build.
  - Atualizar `.gitignore` se precisar (adicionar `.trae/specs/`? Não, manter versionado).
  - Tag `git tag v0.1.0-BASELINE` em main (marca o ponto "antes de qualquer correção").
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-19
- **Test Requirements**:
  - `rule` TR-1.1: Tag `v0.1.0-BASELINE` existe em `git tag -l`.
  - `rule` TR-1.2: Baseline `npm run build` executa sem erros no commit tagado.
  - `rule` TR-1.3: Documentação em tasks.md do hash baseline.
- **Rollback**: R1 (sem SQL) → `git tag -d v0.1.0-BASELINE`.
- **Notes**: Nenhum código alterado. Apenas tag + documentação.

---

## Task 2: Corrigir FK naming — supabase/types.ts (user_id → profile_id)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: T1
- **Branch**: `hotfix/T2-fk-types`
- **Description**:
  - Em [supabase/types.ts](file:///c:/Users/lucas/Downloads/PANDABIO/PANDABIO-main/PANDABIO-main/src/supabase/types.ts): renomear campos `user_id` para `profile_id` nas tabelas `links`, `products`, `leads`, `activities`, `analytics`.
  - Manter `profiles.user_id` intacto (é FK para auth.users).
  - Ajustar `Tables.X.Insert/Update` e `Row` correspondentes.
- **Acceptance Criteria Addressed**: AC-5
- **Test Requirements**:
  - `rule` TR-2.1: Busca `rg "user_id" src/supabase/types.ts` retorna ocorrências SOMENTE na tabela `profiles`.
  - `rule` TR-2.2: `tsc --noEmit` passa.
  - `rule` TR-2.3: `npm run build` passa sem warnings de tipo.
- **Rollback**: R1 + R2 (sem SQL, só tipos TypeScript).
- **Notes**: Só ajusta tipos. Tarefa T3 ajusta services.

---

## Task 3: Corrigir FK naming — Services + Hooks
- **Status**: `pending`
- **Priority**: high
- **Depends On**: T2
- **Branch**: `hotfix/T3-fk-services`
- **Description**:
  - Em [linkService.ts](file:///c:/Users/lucas/Downloads/PANDABIO/PANDABIO-main/PANDABIO-main/src/supabase/services/linkService.ts): trocar `.eq('user_id', ...)` por `.eq('profile_id', ...)` + objeto `.insert({ profile_id, ... })`.
  - Repetir para `profileService.ts`, `productService.ts`, `leadService.ts`, `activityService.ts`, `storageService.ts`, `pageService.ts`.
  - Em `useSupabaseData.ts` e `useSupabaseAuth.ts`: ajustar quaisquer queries que usem `user_id` incorretamente.
- **Acceptance Criteria Addressed**: AC-5
- **Test Requirements**:
  - `rule` TR-3.1: Busca `rg "user_id" src/supabase/services/` retorna vazio para campos que não são `profiles.user_id`.
  - `rule` TR-3.2: `tsc --noEmit` passa sem erros.
  - `rule` TR-3.3: Smoke test login flow fallback (sem Supabase credenciais ainda ok) sem erros console.
- **Rollback**: R1 + R2 (sem SQL).
- **Notes**: Não executar SQL ainda; só código. SQL é T14.

---

## Task 4: Corrigir Bug LinkService.toggleLink + migration RPC função
- **Status**: `pending`
- **Priority**: high
- **Depends On**: T3
- **Branch**: `hotfix/T4-toggleLink-bug`
- **Description**:
  - Criar `src/database/2026092001_toggle_link_status.sql` com:
    - `-- UP`: criar função RPC `toggle_link_status(link_id UUID) RETURNS BOOLEAN` que lê `active`, inverte, UPDATE; retorna novo estado.
    - `-- DOWN`: `DROP FUNCTION IF EXISTS toggle_link_status(UUID)`.
  - Em [linkService.ts](file:///c:/Users/lucas/Downloads/PANDABIO/PANDABIO-main/PANDABIO-main/src/supabase/services/linkService.ts): método `toggleLink(id)` chamar a RPC; fallback ler estado e atualizar corretamente (não hardcode `active: true`).
- **Acceptance Criteria Addressed**: AC-7, AC-18
- **Test Requirements**:
  - `rule` TR-4.1: `grep "active: true" src/supabase/services/linkService.ts` na função toggleLink retorna 0 (não mais hardcoded).
  - `rule` TR-4.2: Teste unitário Vitest (se testes já instalados; senão criar teste em `__tests__/linkService.toggle.test.ts`) com mock Supabase valida idempotência 2x toggles.
  - `rule` TR-4.3: Migration arquivo existe e UP/DOWN são sintaticamente corretos (validação: copiar bloco SQL e rodar `EXPLAIN` ou parser via `tsx` se possível; ou manual).
- **Rollback**: R1 + R2 + R3 executar DOWN do `2026092001_toggle_link_status.sql`.

---

## Task 5: Remover Store Duplicada multiUserStore.ts
- **Status**: `pending`
- **Priority**: high
- **Depends On**: T4
- **Branch**: `hotfix/T5-remove-duplicate-store`
- **Description**:
  - `rg "multiUserStore" src/` para listar imports.
  - Substituir referências por `usePandaBioStore` (Zustand) — em princípio 0 usos reais, confirmar.
  - Apagar arquivo [services/multiUserStore.ts](file:///c:/Users/lucas/Downloads/PANDABIO/PANDABIO-main/PANDABIO-main/src/services/multiUserStore.ts).
  - Apagar pasta `services/` se ficar vazia (verificar).
- **Acceptance Criteria Addressed**: AC-6
- **Test Requirements**:
  - `rule` TR-5.1: Arquivo `src/services/multiUserStore.ts` não existe.
  - `rule` TR-5.2: `rg "multiUserStore" src/` vazio (sem imports).
  - `rule` TR-5.3: `tsc --noEmit` passa; `npm run build` passa.
- **Rollback**: R1 + R2 (sem SQL).

---

## Task 6: Anonimizar IP no analytics — service + SQL trigger
- **Status**: `pending`
- **Priority**: high
- **Depends On**: T5
- **Branch**: `hotfix/T6-anon-ip`
- **Description**:
  - Criar `src/utils/normalizeIp.ts` com funções: `normalizeIpV4(ip)` → /24; `normalizeIpV6(ip)` → /64; `normalizeIp(ip)` detecta família e aplica.
  - Em `linkService.ts` → `registerClick()` → antes de INSERT, normalizar.
  - Criar `src/database/2026092002_anonimize_ip_trigger.sql`:
    - `-- UP`: função `truncate_ip_before_insert()` + trigger `BEFORE INSERT ON analytics FOR EACH ROW`.
    - `-- DOWN`: drop trigger + drop function.
- **Acceptance Criteria Addressed**: AC-8, AC-18
- **Test Requirements**:
  - `rule` TR-6.1: Função `normalizeIp('203.0.113.45')` retorna `203.0.113.0/24` (teste unitário).
  - `rule` TR-6.2: Função `normalizeIp('2001:db8::1')` retorna `2001:db8::/64`.
  - `rule` TR-6.3: Migration SQL sintaticamente válido; UP/DOWN escritos.
- **Rollback**: R1 + R2 + R3 (rodar `-- DOWN` da migration).

---

# FASE 2 — FERRAMENTAS E QUALIDADE (07 a 10)

---

## Task 7: Instalar e configurar ESLint + @typescript-eslint + React hooks + a11y
- **Status**: `pending`
- **Priority**: high
- **Depends On**: T6
- **Branch**: `feature/T7-eslint`
- **Description**:
  - Instalar devDeps: `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `eslint-plugin-jsx-a11y`, `globals` (formato flat config ESLint 9+).
  - Criar `eslint.config.js` na raiz com regras: erro para `@typescript-eslint/no-unused-vars`, `react-hooks/rules-of-hooks`, `jsx-a11y/alt-text`, `jsx-a11y/role-has-required-aria-props`, etc.
  - Atualizar `package.json` script `lint` → `"lint": "eslint . && tsc --noEmit"`.
- **Acceptance Criteria Addressed**: AC-9, NFR-5
- **Test Requirements**:
  - `rule` TR-7.1: `npm run lint` roda e retorna exit code (0 após aplicar fix iniciais).
  - `rule` TR-7.2: Arquivo `eslint.config.js` existe e importa plugins 5 acima.
  - `rule` TR-7.3: `npm run build` continua passando.
- **Rollback**: R1 + R2 → `git checkout main` (volta package.json e remove eslint.config.js).

---

## Task 8: Instalar e configurar Prettier + format:check script
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: T7
- **Branch**: `feature/T8-prettier`
- **Description**:
  - Instalar devDeps: `prettier`, `eslint-config-prettier`, `eslint-plugin-prettier`.
  - Criar `.prettierrc.json` (printWidth 100, singleQuote, trailingComma all, semi true).
  - Criar `.prettierignore` listando `dist`, `node_modules`, `.vite`, `supabase/config.toml`.
  - Em `eslint.config.js` adicionar `plugin:prettier/recommended` no final.
  - Scripts em package.json: `format`, `format:check`.
  - Rodar `npm run format` UMA vez para formatar tudo (único commit grande de formatação).
- **Acceptance Criteria Addressed**: AC-9
- **Test Requirements**:
  - `rule` TR-8.1: `npm run format:check` retorna 0.
  - `rule` TR-8.2: `.prettierrc.json` + `.prettierignore` existem.
  - `rule` TR-8.3: `npm run lint` passa sem conflitos prettier/eslint.
- **Rollback**: R1 + R2.

---

## Task 9: Instalar Vitest + Testing Library + primeiro lote de testes core
- **Status**: `pending`
- **Priority**: high
- **Depends On**: T8
- **Branch**: `feature/T9-vitest-core`
- **Description**:
  - Instalar devDeps: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`, `@vitest/coverage-v8`.
  - Criar `vitest.config.ts` com `environment: 'jsdom'`, globals, setup file `src/test/setup.ts` (import jest-dom), alias `@/*`.
  - Criar `src/__tests__/` com:
    1. `utils/storage.test.ts` → safeStorage get/set/remove/clear (4+ testes)
    2. `utils/normalizeIp.test.ts` → ipv4/ipv6 (4+ testes)
    3. `schemas/linkSchema.test.ts` → link válido/inválido (5+ testes)
    4. `store/usePandaBioStore.test.ts` → authenticate, toggleLink, addLink, upgradeToPro (6+ testes)
  - Script package.json: `test` = `vitest`, `test:run` = `vitest run`, `test:coverage` = `vitest run --coverage`.
- **Acceptance Criteria Addressed**: AC-10, NFR-4
- **Test Requirements**:
  - `rule` TR-9.1: `npm run test:run` → Total testes ≥ 15, 0 falhas, 0 skips.
  - `rule` TR-9.2: `npm run test:coverage` → cobertura nas camadas core (store, utils, schemas) ≥ 70%.
  - `rule` TR-9.3: Arquivo `vitest.config.ts` existe e é carregado.
- **Rollback**: R1 + R2.

---

## Task 10: Aplicar Tokens de Cor Sistematicamente — Tailwind extend + migrar components core
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: T9
- **Branch**: `feature/T10-tokens`
- **Description**:
  - Criar (ou atualizar) config Tailwind consumindo tokens de [tokens.ts](file:///c:/Users/lucas/Downloads/PANDABIO/PANDABIO-main/PANDABIO-main/src/theme/tokens.ts).
  - Opção: `tailwind.config.ts` que importa `colors` do `tokens.ts` e adiciona em `theme.extend.colors`.
  - Atualizar 4 components core (Header, Sidebar, Card, KpiMetrics) para usar `bg-primary-orange`, `text-neutral-dark` etc. ao invés de `bg-[#FF7A00]`.
  - Atualizar index.css body: usar variáveis se houver.
- **Acceptance Criteria Addressed**: AC-11
- **Test Requirements**:
  - `rule` TR-10.1: Arquivo tailwind.config existe e tem cores mapeadas.
  - `rule` TR-10.2: Antes/depois contagem `rg -c 'bg-\[#[0-9a-fA-F]+\]' src/components/Header.tsx src/components/Sidebar.tsx src/components/Card.tsx src/components/KpiMetrics.tsx` → depois = 0.
  - `rubric` TR-10.3 (AC-11): Redução geral de cores arbitrárias ≥ 40% em 4 components acima; escala 1-5, threshold ≥ 4.
  - `rule` TR-10.4: Build + smoke test UI visual não apresenta cores quebradas.
- **Rollback**: R1 + R2.

---

# FASE 3 — HARDENING SEGURANÇA + DADOS (11 a 14)

---

## Task 11: Hardening Supabase Auth no config.toml
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: T10
- **Branch**: `hotfix/T11-auth-hardening`
- **Description**:
  - Editar [supabase/config.toml](file:///c:/Users/lucas/Downloads/PANDABIO/PANDABIO-main/PANDABIO-main/supabase/config.toml):
    - `minimum_password_length = 8`
    - `password_requirements = "lower_upper_letters_digits_symbols"`
    - `enable_confirmations = true` (email)
    - Descomentar `[auth.captcha]`, `enabled = true`, provider `hcaptcha`, `secret = "env(SUPABASE_AUTH_CAPTCHA_SECRET)"`.
  - Atualizar `.env.example` adicionando `SUPABASE_AUTH_CAPTCHA_SECRET=` placeholder.
- **Acceptance Criteria Addressed**: AC-12
- **Test Requirements**:
  - `rule` TR-11.1: Busca exata `minimum_password_length = 8` no config.toml = encontrado.
  - `rule` TR-11.2: Busca `password_requirements = "lower_upper_letters_digits_symbols"` = encontrado.
  - `rule` TR-11.3: `enable_confirmations = true` e `[auth.captcha]` enabled presente.
  - `rule` TR-11.4: `.env.example` com nova chave adicionada.
- **Rollback**: R1 + R2 (sem SQL, apenas toml + env).

---

## Task 12: Remover dependência Express + @types/express
- **Status**: `pending`
- **Priority**: low
- **Depends On**: T11
- **Branch**: `hotfix/T12-remove-express`
- **Description**:
  - Buscar referências `from 'express'` em src: provavelmente 0.
  - `npm uninstall express @types/express`.
  - Confirmar lockfile atualizado.
- **Acceptance Criteria Addressed**: AC-17
- **Test Requirements**:
  - `rule` TR-12.1: `rg '"express"' package.json` vazio (não existe key express em dependencies/devDependencies).
  - `rule` TR-12.2: `rg "express" src/` vazio.
  - `rule` TR-12.3: `npm run build` passa; `tsc --noEmit` passa.
- **Rollback**: R1 + R2; ou reinstall manual `npm i -D @types/express && npm i express`.

---

## Task 13: Adotar React Query (@tanstack/react-query) nos hooks Supabase
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: T12
- **Branch**: `feature/T13-react-query`
- **Description**:
  - Instalar: `@tanstack/react-query` (produção) e `@tanstack/react-query-devtools` (opcional dev).
  - Em [main.tsx](file:///c:/Users/lucas/Downloads/PANDABIO/PANDABIO-main/PANDABIO-main/src/main.tsx): envolver `<QueryClientProvider client={queryClient}>` + `<ReactQueryDevtools initialIsOpen={false} />`.
  - Criar `src/hooks/useLinksQuery.ts` usando `useQuery(['links'], () => LinkService.getLinks())`; criar `useProfileQuery`; criar `usePageDataQuery`.
  - Refatorar App.tsx ou usePandaBioData para usar pelo menos 1 desses hooks (ex: links).
- **Acceptance Criteria Addressed**: AC-16
- **Test Requirements**:
  - `rule` TR-13.1: package.json tem `@tanstack/react-query`.
  - `rule` TR-13.2: 3 hooks de query criados; 1 hook integrado em componente ativo e usado.
  - `rule` TR-13.3: Build ok; DevTools carregam (se dev) sem warning console; `tsc --noEmit` ok.
- **Rollback**: R1 + R2.

---

## Task 14: Migrations SQL versionadas finais — atualizar schema principal e validar todas RLS
- **Status**: `pending`
- **Priority**: high
- **Depends On**: T13
- **Branch**: `hotfix/T14-final-migrations`
- **Description**:
  - Criar `src/database/2026092003_sync_profile_id_columns.sql` (UP/DOWN) para tornar explícita consistência entre tipos vs SQL (opcional: se banco real existir).
  - Criar `src/database/2026092004_add_storage_policy.sql` (UP/DOWN) para RLS em bucket storage se aplicável (storage.buckets + objects policies).
  - Atualizar `schema.sql` consolidado (linha a linha) garantindo que tabelas, FK, RLS, views, triggers estejam consistentes.
  - Validar final com bloco DO $$ do schema.sql rodar sem exception.
- **Acceptance Criteria Addressed**: AC-5, AC-18
- **Test Requirements**:
  - `rule` TR-14.1: 2 novas migrations numeradas com `-- UP` e `-- DOWN` explícitos existem.
  - `rule` TR-14.2: Bloco final de validação `RLS habilitado` de schema.sql ao ser executado (em ambiente separado) levanta NOTICE e não exception.
  - `rule` TR-14.3: `schema.sql` usa `profile_id` em tabelas dependentes (ver grep).
- **Rollback**: R1 + R2 + R3 rodar DOWN de `2026092003` e `2026092004`.

---

# FASE 4 — ACESSIBILIDADE WCAG 2.1 (15 a 18)

---

## Task 15: Refatorar Modal base — role=dialog, aria-modal, trap foco, ESC, overlay dismiss
- **Status**: `pending`
- **Priority**: high
- **Depends On**: T14
- **Branch**: `feature/T15-modal-a11y`
- **Description**:
  - Ler [components/Modal.tsx](file:///c:/Users/lucas/Downloads/PANDABIO/PANDABIO-main/PANDABIO-main/src/components/Modal.tsx).
  - Implementar ou adicionar:
    - Envelope `<div role="dialog" aria-modal="true" aria-labelledby={titleId}>`
    - Overlay `role="presentation"` com clique para fechar.
    - Hook `useTrapFocus` (criar `src/hooks/useTrapFocus.ts`) usando refs de focusable nodes.
    - Keydown ESC fecha.
    - Foco inicial: primeiro foco dentro do modal; ao fechar retorna foco ao trigger (parâmetro `returnFocusRef`).
  - Ajustar PhonePreviewModal, CreateItemModal, DetailedReportModal, UpgradeModal, BlockConfigModal, AddBlockModal para usar essas props novas.
- **Acceptance Criteria Addressed**: AC-14
- **Test Requirements**:
  - `rule` TR-15.1: Em `rg 'role="dialog"' src/components/Modal.tsx` encontrado.
  - `rule` TR-15.2: Trap foco + ESC funcionais em smoke test (abrir modal, TAB > 8x, foco não sai; ESC fecha).
  - `rule` TR-15.3: `eslint` a11y passa (alt-text, role rules) — 0 erros a11y em Modal.
- **Rollback**: R1 + R2.

---

## Task 16: Headings semânticos hierárquicos h1-h3
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: T15
- **Branch**: `feature/T16-headings`
- **Description**:
  - Em [App.tsx](file:///c:/Users/lucas/Downloads/PANDABIO/PANDABIO-main/PANDABIO-main/src/App.tsx): garantir EXATAMENTE 1 `<h1>` por view (dashboard e auth).
  - Em Sidebar e sections: trocar `<h4>`/`<h3>` por hierarquia lógica (h1 → h2 nas seções → h3 nos cards).
  - Usar ESLint rule `jsx-a11y/heading-has-content` e `jsx-a11y/no-noninteractive-tabindex`.
- **Acceptance Criteria Addressed**: AC-15
- **Test Requirements**:
  - `rule` TR-16.1: No dashboard renderizado: `document.querySelectorAll('h1').length === 1`.
  - `rule` TR-16.2: Nenhum pulo direto h1 → h4 sem h2/h3 no caminho (eslint a11y heading-level).
  - `rubric` TR-16.3 (AC-15): Estrutura por view; scale 1-5 threshold ≥ 4.
- **Rollback**: R1 + R2.

---

## Task 17: Imagens com alt + logo + icons decorativos aria-hidden
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: T16
- **Branch**: `feature/T17-img-alt`
- **Description**:
  - Adicionar `alt` no logo do Sidebar (mascote), avatar placeholders, imagens de produtos/usuários.
  - Marcar ícones puramente decorativos (apenas visual sem significado) com `aria-hidden="true"`.
  - Fixar ESLint jsx-a11y/alt-text passar zero erros.
- **Acceptance Criteria Addressed**: AC-15
- **Test Requirements**:
  - `rule` TR-17.1: `rg "<img" src/` encontra N `<img>`; `alt=""` NÃO vazio nas significativas; `aria-hidden="true"` nas decorativas se alt vazio.
  - `rule` TR-17.2: ESLint passa `jsx-a11y/alt-text` 0 erros.
  - `rubric` TR-17.3: Alt textos são descritivos e não redundantes ("foto de perfil de João" em vez de "image"); scale 1-5 threshold ≥ 4.
- **Rollback**: R1 + R2.

---

## Task 18: Cores e contraste — ajuste de presets com baixo contraste
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: T17
- **Branch**: `hotfix/T18-contrast`
- **Description**:
  - Percorrer [presets.ts](file:///c:/Users/lucas/Downloads/PANDABIO/PANDABIO-main/PANDABIO-main/src/theme/presets.ts) CATEGORY_PRESETS.
  - Para cada preset, calcular contraste entre `customButtonTextColor` e `customButtonColor` e entre `textColor`/`backgroundColorGradient` (função em effectColors ou nova).
  - Ajustar 2 presets que ficarem abaixo de 4.5:1 (WCAG AA texto normal).
- **Acceptance Criteria Addressed**: AC-15, NFR-5
- **Test Requirements**:
  - `rule` TR-18.1: Script/função `contrastRatio(bg, fg)` retorna ≥ 4.5 para todos presets em botão e texto principal.
  - `rule` TR-18.2: Nenhum preset é removido, apenas ajustadas cores se contraste baixo.
  - `rule` TR-18.3: Build + smoke UI visual presets não "quebram" a aparência.
- **Rollback**: R1 + R2.

---

# FASE 5 — SEÇÕES FALTANTES (19 a 29)

---

## Task 19: Implementar seção `perfil`
- **Status**: `pending`
- **Priority**: high
- **Depends On**: T18
- **Branch**: `feature/T19-section-perfil`
- **Description**:
  - Em [SectionViews.tsx](file:///c:/Users/lucas/Downloads/PANDABIO/PANDABIO-main/PANDABIO-main/src/components/SectionViews.tsx): caso `section === 'perfil'` renderizar form com nome/username/email/bio/avatar, usando dados de `user` e chamando `onUpdateUser`.
  - Validar com Zod userSchema em submit, toast sucesso/erro.
- **Acceptance Criteria Addressed**: AC-13
- **Test Requirements**:
  - `rule` TR-19.1: Section perfil renderiza com campos preenchidos.
  - `rule` TR-19.2: Submit atualiza store Zustand (verificar via `usePandaBioStore.getState()`).
  - `rule` TR-19.3: `tsc` + lint + build ok.
- **Rollback**: R1 + R2.

---

## Task 20: Implementar seção `links`
- **Status**: `pending`
- **Priority**: high
- **Depends On**: T19
- **Branch**: `feature/T20-section-links`
- **Description**:
  - Caso `section === 'links'` → lista completa de links (DataGrid), toggle, reorder drag-and-drop simples (HTML5 DnD ou state buttons up/down), add/edit/delete modal (reutilizar CreateItemModal ou novo BlockConfigModal).
  - Pesquisa e filtro por tipo/ativo.
- **Acceptance Criteria Addressed**: AC-13
- **Test Requirements**:
  - `rule` TR-20.1: Tabela lista ≥1 link; toggle status funciona.
  - `rule` TR-20.2: Novo link criado persiste em store Zustand e aparece no topo.
  - `rule` TR-20.3: 0 erros console em smoke.
- **Rollback**: R1 + R2.

---

## Task 21: Implementar seção `produtos`
- **Status**: `pending`
- **Priority**: high
- **Depends On**: T20
- **Branch**: `feature/T21-section-produtos`
- **Description**:
  - Grade/gallery de produtos: imagem, nome, preço, status (draft/active), vendas.
  - Criar/editar produto com validação `productSchema` (Zod).
  - Integração store addProduct toggle ativo.
- **Acceptance Criteria Addressed**: AC-13
- **Test Requirements**:
  - `rule` TR-21.1: Criação produto preenche campos, salva em store.
  - `rule` TR-21.2: Edição reflete em store após submit.
  - `rule` TR-21.3: Build ok.
- **Rollback**: R1 + R2.

---

## Task 22: Implementar seção `conteudo` (Blocks editor mini)
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: T21
- **Branch**: `feature/T22-section-conteudo`
- **Description**:
  - Lista de `PageBlock` existentes no `pageData.blocks`.
  - Botões adicionar bloco (AddBlockModal reutilizado).
  - Reorder up/down e editar block.
- **Acceptance Criteria Addressed**: AC-13
- **Test Requirements**:
  - `rule` TR-22.1: Adicionar bloco 'text' aparece na lista.
  - `rule` TR-22.2: Editar conteúdo de bloco reflete em state.
  - `rule` TR-22.3: 0 erros.
- **Rollback**: R1 + R2.

---

## Task 23: Implementar seção `aparencia` (chama AppearancePanel standalone)
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: T22
- **Branch**: `feature/T23-section-aparencia`
- **Description**:
  - Caso `section === 'aparencia'` → renderiza [AppearancePanel.tsx](file:///c:/Users/lucas/Downloads/PANDABIO/PANDABIO-main/PANDABIO-main/src/components/AppearancePanel.tsx) em modo tela cheia (não mais só no editor).
  - Salva tema no pageData e em storage local.
- **Acceptance Criteria Addressed**: AC-13
- **Test Requirements**:
  - `rule` TR-23.1: Categoria "Beleza" é selecionável; UI reflete cor do preset.
  - `rule` TR-23.2: Gradiente custom e fonte custom carregam.
  - `rule` TR-23.3: Build ok.
- **Rollback**: R1 + R2.

---

## Task 24: Implementar seção `estatisticas` (Analytics completo)
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: T23
- **Branch**: `feature/T24-section-estatisticas`
- **Description**:
  - Reunir VisitsChart, ClicksByLinkChart, ConversionFunnel, KpiMetrics numa única tela grande.
  - Filtro data: "Hoje / 7 dias / 30 dias / Todo período". Filtro altera state local (mesmo que dados ainda mock/cálculo sobre total).
- **Acceptance Criteria Addressed**: AC-13
- **Test Requirements**:
  - `rule` TR-24.1: Todos 4 componentes aparecem na tela.
  - `rule` TR-24.2: Filtros dropdown clicáveis sem crash.
  - `rule` TR-24.3: 0 erros console.
- **Rollback**: R1 + R2.

---

## Task 25: Implementar seção `agendamentos`
- **Status**: `pending`
- **Priority**: low
- **Depends On**: T24
- **Branch**: `feature/T25-section-agendamentos`
- **Description**:
  - Tela placeholder funcional: lista serviços (bloco agendamento), lista horários disponíveis (mock), lista "Meus horários" (vazia + CTA).
  - Integra `AgendamentoBlockConfig.tsx` existente.
- **Acceptance Criteria Addressed**: AC-13
- **Test Requirements**:
  - `rule` TR-25.1: Seção carrega, mostra layout 2 colunas (serviços + calendário).
  - `rule` TR-25.2: Modal config agendamento abre e fecha.
  - `rule` TR-25.3: Build ok.
- **Rollback**: R1 + R2.

---

## Task 26: Implementar seção `integracoes`
- **Status**: `pending`
- **Priority**: low
- **Depends On**: T25
- **Branch**: `feature/T26-section-integracoes`
- **Description**:
  - Cards com integrações: Google Analytics, Pixel Meta, Google Tag Manager, WhatsApp API, Google Calendar.
  - Cada card: logo integração, status "Conectar" toggle, modal com campos config (placeholder só UI).
- **Acceptance Criteria Addressed**: AC-13
- **Test Requirements**:
  - `rule` TR-26.1: 5+ cards aparecem; toggles trocam estado.
  - `rule` TR-26.2: "Conectar" abre modal, campos editáveis.
  - `rule` TR-26.3: Build ok.
- **Rollback**: R1 + R2.

---

## Task 27: Implementar seção `configuracoes`
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: T26
- **Branch**: `feature/T27-section-configuracoes`
- **Description**:
  - Aba Geral (domínio custom, idioma), Segurança (trocar senha, 2FA placeholder), Notificações (email toggles), Privacidade (LGPD, exportar dados, deletar conta).
  - Usar Segment UI de abas.
- **Acceptance Criteria Addressed**: AC-13
- **Test Requirements**:
  - `rule` TR-27.1: 4 abas, troca sem recarregar.
  - `rule` TR-27.2: Form de senha valida mínimo 8 caracteres.
  - `rule` TR-27.3: Build ok.
- **Rollback**: R1 + R2.

---

## Task 28: Implementar seção `plano` (Upgrade/Pro pricing)
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: T27
- **Branch**: `feature/T28-section-plano`
- **Description**:
  - Reutiliza [UpgradeModal.tsx](file:///c:/Users/lucas/Downloads/PANDABIO/PANDABIO-main/PANDABIO-main/src/components/UpgradeModal.tsx) como base, expandindo para tela full: 3 cards Gratuito / PRO / EMPRESA com features, tabela comparativa, botão upgrade chama `upgradeToPro()` store.
- **Acceptance Criteria Addressed**: AC-13
- **Test Requirements**:
  - `rule` TR-28.1: 3 planos renderizados; usuário vê seu plano atual com badge.
  - `rule` TR-28.2: Clique "Upgrade PRO" atualiza user.plan === 'PRO' na store.
  - `rule` TR-28.3: Build ok.
- **Rollback**: R1 + R2.

---

## Task 29: Implementar seção `ajuda` (FAQ + Suporte)
- **Status**: `pending`
- **Priority**: low
- **Depends On**: T28
- **Branch**: `feature/T29-section-ajuda`
- **Description**:
  - Accordion FAQ (8+ perguntas), contatos de suporte (email/WhatsApp placeholder), tutoriais linkados (cards).
- **Acceptance Criteria Addressed**: AC-13
- **Test Requirements**:
  - `rule` TR-29.1: Accordion abre/fecha cada item.
  - `rule` TR-29.2: Contatos renderizados com ícones certos.
  - `rule` TR-29.3: Build ok.
- **Rollback**: R1 + R2.

---

# FASE 6 — FINALIZAÇÃO E REGRESSÃO (30 a 32)

---

## Task 30: Finalização Tokens — migrar componentes restantes para tokens
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: T29
- **Branch**: `feature/T30-tokens-final`
- **Description**:
  - Expandir Task T10 para **todos** componentes restantes (25).
  - Substituir classes arbitrárias de cor por tokens.
- **Acceptance Criteria Addressed**: AC-11
- **Test Requirements**:
  - `rule` TR-30.1: Contagem HEX arbitrário cai ≥ 80% na média global `rg -c 'bg-\[#[0-9a-fA-F]+\]|text-\[#[0-9a-fA-F]+\]' src/components/ **/*.tsx` comparado baseline T1.
  - `rubric` TR-30.2 (AC-11 final): Tokens como fonte única; escala 1-5, threshold ≥ 4.
  - `rule` TR-30.3: Build + smoke visual sem quebra de cor.
- **Rollback**: R1 + R2.

---

## Task 31: Regressão global + suite testes expandida final
- **Status**: `pending`
- **Priority**: high
- **Depends On**: T30
- **Branch**: `hotfix/T31-regression`
- **Description**:
  - Expandir testes Vitest para:
    - `components/Card.test.tsx`, `components/Modal.a11y.test.tsx` (trap foco, ESC).
    - `store.toggleLink` integration test (2x idempotência).
    - NormalizeIp + Zod user schema.
  - Meta: bater ≥ 25 testes totais.
  - Rodar ciclo completo: `npm ci && npm run lint && npm run test:run && npm run build && npm run preview -- --port 4173` e validar carregamento.
- **Acceptance Criteria Addressed**: AC-10, AC-19
- **Test Requirements**:
  - `rule` TR-31.1: Total tests ≥ 25; 0 failed.
  - `rule` TR-31.2: Build sizes (total gzip) ≤ baseline * 1.1.
  - `rule` TR-31.3: Smoke checklist 14 telas (dashboard + 12 seções + auth) rodam sem crash.
- **Rollback**: R1 + R2.

---

## Task 32: Changelog, tags e Release v0.2.0-PÓS-MELHORIAS
- **Status**: `pending`
- **Priority**: low
- **Depends On**: T31
- **Branch**: `feature/T32-release`
- **Description**:
  - Criar CHANGELOG.md (1 entrada por tarefa com resumo).
  - Tag `v0.2.0-PÓS-MELHORIAS`.
  - Atualizar tasks.md com todos `Status: completed` e evidências finais.
- **Acceptance Criteria Addressed**: AC-20
- **Test Requirements**:
  - `rule` TR-32.1: CHANGELOG.md existe e tem 32 entradas.
  - `rule` TR-32.2: Tag v0.2.0 existe em `git tag -l`.
  - `rubric` TR-32.3 (AC-20): Workflow fidelity 0-2, threshold ≥ 2.
- **Rollback**: R1 + R2; apagar tag.

---

# MATRIZ DE COBERTURA: Tarefa → AC

| AC | Coberta por Tarefas |
|----|---------------------|
| AC-1 (Sequencial) | T1 → T32 ordem + regime branches |
| AC-2 (Pre/Post) | Todas T-N PRE-FLIGHT + POST-FLIGHT |
| AC-3 (TRs) | Todas T-N ≥ 1 TR |
| AC-4 (Rollback) | Todas T-N R1/R2 + R3 se SQL |
| AC-5 (FK naming) | T2, T3, T14 |
| AC-6 (Store única) | T5 |
| AC-7 (toggleLink) | T4 |
| AC-8 (IP anônimo) | T6 |
| AC-9 (ESLint/Prettier) | T7, T8 |
| AC-10 (Vitest ≥15) | T9, T31 |
| AC-11 (Tokens) | T10, T30 |
| AC-12 (Auth hardened) | T11 |
| AC-13 (12 Seções) | T19, T20, T21, T22, T23, T24, T25, T26, T27, T28, T29, (+perfil T19, +aparencia T23, +estatisticas T24 = > 12) |
| AC-14 (Modais a11y) | T15 |
| AC-15 (Headings+alt) | T16, T17, T18 |
| AC-16 (React Query) | T13 |
| AC-17 (Express removido) | T12 |
| AC-18 (Migrations UP/DOWN) | T4, T6, T14 |
| AC-19 (Build) | T31, T1 |
| AC-20 (Workflow) | T32 |
