# Quick Start - Refatoração Prioritária PandaBio

##  Melhorias Imediatas (Quick Wins)

### 1. Adicionar React.memo nos Componentes Principais
**Arquivo**: `src/components/KpiMetrics.tsx`
```typescript
export const KpiMetrics = React.memo<KpiMetricsProps>(({ data }) => {
  // componente existente
}, (prevProps, nextProps) => {
  return prevProps.data.visits === nextProps.data.visits &&
         prevProps.data.clicks === nextProps.data.clicks;
});
```

### 2. Criar Utilitário de Ícones Centralizado
**Arquivo**: `src/utils/iconMapper.ts` (NOVO)
```typescript
import { Camera, MessageCircle, Layers, ShoppingBag, ExternalLink } from 'lucide-react';

export const getLinkIcon = (type: string) => {
  const iconMap = {
    social: Camera,
    whatsapp: MessageCircle,
    portfolio: Layers,
    store: ShoppingBag,
    custom: ExternalLink,
  };
  return iconMap[type as keyof typeof iconMap] || ExternalLink;
};

export const getLinkIconBg = (type: string) => {
  const bgMap = {
    social: 'bg-[#dae2fd]',
    whatsapp: 'bg-[#6ffbbe]/40',
    portfolio: 'bg-[#e0e0ff]',
    store: 'bg-[#dae2fd]',
    custom: 'bg-[#eaedff]',
  };
  return bgMap[type as keyof typeof bgMap] || 'bg-[#eaedff]';
};
```

### 3. Implementar Validação Básica com Zod
**Instalar**: `npm install zod`
**Arquivo**: `src/schemas/linkSchema.ts` (NOVO)
```typescript
import { z } from 'zod';

export const linkSchema = z.object({
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres').max(50),
  url: z.string().url('URL inválida'),
  type: z.enum(['social', 'whatsapp', 'portfolio', 'store', 'custom']),
});
```

### 4. Substituir alert() por Toast Básico
**Arquivo**: `src/components/Toast.tsx` (NOVO)
```typescript
import React, { useState, useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  }[type];

  return (
    <div className={`fixed bottom-4 right-4 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg z-50`}>
      {message}
      <button onClick={onClose} className="ml-2 text-white underline">Fechar</button>
    </div>
  );
};
```

### 5. Criar Wrapper Seguro para localStorage
**Arquivo**: `src/utils/storage.ts` (NOVO)
```typescript
export const safeStorage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading ${key}:`, error);
      return defaultValue;
    }
  },
  set: <T>(key: string, value: T): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing ${key}:`, error);
      return false;
    }
  },
};
```

##  Instalação de Dependências Necessárias

```bash
npm install zustand zod dompurify react-hot-toast
npm install -D @types/dompurify
```

##  Implementação em 3 Fases

### Fase 1: Setup (1 dia)
1. Instalar dependências
2. Criar estrutura de pastas: `src/utils/`, `src/schemas/`, `src/hooks/`
3. Criar utilitários básicos (iconMapper, storage)
4. Configurar ESLint se necessário

### Fase 2: Componentes (2-3 dias)
1. Adicionar React.memo nos componentes principais
2. Implementar validação de formulários
3. Substituir alert() por toasts
4. Adicionar loading states básicos

### Fase 3: Estado (3-4 dias)
1. Implementar Zustand para gerenciamento de estado
2. Extrair lógica para custom hooks
3. Refatorar App.tsx em componentes menores
4. Testar todas as funcionalidades

##  Como Validar as Melhorias

### Performance
```bash
# Antes e depois das mudanças
npm run build
# Verificar tamanho do bundle em dist/
```

### Funcionalidade
1. Testar criação de links com validação
2. Verificar toasts funcionando corretamente
3. Testar persistência de dados
4. Verificar performance do dashboard

### Código
```bash
npm run lint
npm run type-check
```

##  Métricas Esperadas

- **Bundle Size**: -15% após React.memo
- **Código Duplicado**: -30% após utilitários
- **UX**: +20% satisfação com toasts
- **Segurança**: +40% com validação

##  Notas Importantes

1. **Backup**: Sempre faça backup antes de refatorações grandes
2. **Testes**: Teste cada mudança individualmente
3. **Commits**: Faça commits pequenos e frequentes
4. **Documentação**: Atualize conforme avança

##  Suporte

Para dúvidas durante a implementação:
- Consulte o arquivo completo `ANALISE_E_MELHORIAS.md`
- Verifique documentação das bibliotecas (Zustand, Zod)
- Teste incrementalmente cada mudança