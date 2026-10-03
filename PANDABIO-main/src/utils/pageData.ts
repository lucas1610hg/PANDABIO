import { defaultPageTheme } from '../theme/presets';
import {
  BlockType,
  CustomForm,
  CustomFormField,
  PageBlock,
  PageData,
  PageTheme,
  UserProfile,
} from '../types';

const EMPTY_PROFILE: UserProfile = {
  name: '',
  username: '',
  email: '',
  plan: 'Gratuito',
  bioUrl: '',
  pageTitle: '',
  bioDescription: '',
  avatarUrl: '',
};

const createId = (): string => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return `page-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const hasValue = (value: unknown): boolean => value !== null && value !== undefined;

export function normalizePageTheme(theme?: Partial<PageTheme> | null): PageTheme {
  return { ...defaultPageTheme(), ...(theme || {}) };
}

export function createDefaultPageData(profile: UserProfile = EMPTY_PROFILE): PageData {
  return {
    profile: { ...EMPTY_PROFILE, ...profile },
    blocks: [],
    forms: [],
    theme: normalizePageTheme(),
    published: false,
    lastUpdated: new Date().toISOString(),
  };
}

const createFormId = (): string => {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  return `form-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export function createDefaultCustomForm(): CustomForm {
  const now = new Date().toISOString();
  return {
    id: createFormId(),
    name: 'Novo formulário',
    title: 'Entre em contato',
    description: 'Preencha seus dados e entraremos em contato.',
    buttonLabel: 'Enviar dados',
    successMessage: 'Recebemos seus dados. Obrigado pelo contato!',
    consentText: 'Aceito receber contato sobre esta solicitação.',
    fields: [
      { id: 'name', label: 'Nome', type: 'text', placeholder: 'Seu nome', required: true },
      { id: 'email', label: 'E-mail', type: 'email', placeholder: 'voce@email.com', required: true },
      { id: 'phone', label: 'WhatsApp', type: 'phone', placeholder: '(00) 00000-0000', required: false },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

function normalizeFormField(field: unknown, index: number): CustomFormField {
  const source = field && typeof field === 'object' ? (field as Partial<CustomFormField>) : {};
  const type = ['text', 'email', 'phone', 'textarea'].includes(String(source.type))
    ? (source.type as CustomFormField['type'])
    : 'text';
  return {
    id: typeof source.id === 'string' && source.id ? source.id : `field-${index + 1}`,
    label: typeof source.label === 'string' && source.label ? source.label : `Campo ${index + 1}`,
    type,
    placeholder: typeof source.placeholder === 'string' ? source.placeholder : '',
    required: source.required !== false,
  };
}

export function normalizeForms(forms?: unknown): CustomForm[] {
  if (!Array.isArray(forms)) return [];
  return forms
    .filter((form): form is Record<string, unknown> => Boolean(form) && typeof form === 'object')
    .map((form, index) => {
      const fallback = createDefaultCustomForm();
      const fields = Array.isArray(form.fields)
        ? form.fields.map(normalizeFormField)
        : fallback.fields;
      return {
        ...fallback,
        ...form,
        id: typeof form.id === 'string' && form.id ? form.id : `form-${index + 1}`,
        name: typeof form.name === 'string' && form.name ? form.name : fallback.name,
        title: typeof form.title === 'string' && form.title ? form.title : fallback.title,
        description: typeof form.description === 'string' ? form.description : fallback.description,
        buttonLabel:
          typeof form.buttonLabel === 'string' && form.buttonLabel
            ? form.buttonLabel
            : fallback.buttonLabel,
        successMessage:
          typeof form.successMessage === 'string' && form.successMessage
            ? form.successMessage
            : fallback.successMessage,
        consentText:
          typeof form.consentText === 'string' && form.consentText
            ? form.consentText
            : fallback.consentText,
        fields,
        createdAt: typeof form.createdAt === 'string' ? form.createdAt : fallback.createdAt,
        updatedAt: typeof form.updatedAt === 'string' ? form.updatedAt : fallback.updatedAt,
      } satisfies CustomForm;
    });
}

export function normalizePageBlocks(blocks?: unknown): PageBlock[] {
  if (!Array.isArray(blocks)) return [];

  return blocks
    .filter((block): block is PageBlock => Boolean(block) && typeof block === 'object')
    .map((block, index) => ({
      ...block,
      id: typeof block.id === 'string' && block.id ? block.id : createId(),
      order: index,
      active: block.active !== false,
    }));
}

export function normalizePageData(
  pageData?: Partial<PageData> | null,
  profile?: UserProfile,
): PageData {
  const storedProfile = pageData?.profile || {};
  const base = createDefaultPageData(profile || EMPTY_PROFILE);
  const definedStoredProfile = Object.fromEntries(
    Object.entries(storedProfile).filter(([, value]) => hasValue(value)),
  );

  const forms = normalizeForms(pageData?.forms);
  const formById = new Map(forms.map((form) => [form.id, form]));
  const blocks = normalizePageBlocks(pageData?.blocks).map((block) => {
    if (block.type !== 'form') return block;

    const selectedForm = block.formId ? formById.get(block.formId) || block.form : block.form;
    return selectedForm ? { ...block, form: selectedForm } : block;
  });

  return {
    ...base,
    ...pageData,
    profile: { ...base.profile, ...definedStoredProfile },
    blocks,
    forms,
    theme: normalizePageTheme(pageData?.theme),
    published: pageData?.published === true,
    lastUpdated: pageData?.lastUpdated || base.lastUpdated,
  };
}

export function touchPageData(pageData: PageData, updates: Partial<PageData>): PageData {
  return {
    ...pageData,
    ...updates,
    lastUpdated: new Date().toISOString(),
  };
}

export function createPageBlock(type: BlockType, order: number): PageBlock {
  return {
    id: createId(),
    type,
    order,
    active: true,
  };
}

export function duplicatePageBlock(block: PageBlock, order: number): PageBlock {
  return {
    ...block,
    id: createId(),
    order,
    active: true,
    gallery: block.gallery
      ? { ...block.gallery, images: block.gallery.images.map((image) => ({ ...image })) }
      : undefined,
    products: block.products?.map((product) => ({ ...product })),
    socialLinks: block.socialLinks?.map((link) => ({ ...link })),
    contact: block.contact ? { ...block.contact } : undefined,
  };
}

export function reorderPageBlocks(blocks: PageBlock[]): PageBlock[] {
  return blocks.map((block, index) => ({ ...block, order: index }));
}

export function movePageBlock(
  blocks: PageBlock[],
  blockId: string,
  direction: 'up' | 'down',
): PageBlock[] {
  const currentIndex = blocks.findIndex((block) => block.id === blockId);
  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= blocks.length) return blocks;

  const nextBlocks = [...blocks];
  [nextBlocks[currentIndex], nextBlocks[targetIndex]] = [
    nextBlocks[targetIndex],
    nextBlocks[currentIndex],
  ];
  return reorderPageBlocks(nextBlocks);
}
