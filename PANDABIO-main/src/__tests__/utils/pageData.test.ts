import { describe, expect, it } from 'vitest';
import {
  createDefaultPageData,
  createDefaultCustomForm,
  createPageBlock,
  duplicatePageBlock,
  movePageBlock,
  normalizePageData,
  normalizeForms,
  reorderPageBlocks,
} from '../../utils/pageData';

describe('page data utilities', () => {
  it('creates complete default data and preserves user profile', () => {
    const pageData = createDefaultPageData({
      name: 'Ana',
      username: 'ana',
      email: 'ana@example.com',
      plan: 'PRO',
      bioUrl: 'pandabio.com/ana',
      pageTitle: 'Ana',
      bioDescription: '',
      avatarUrl: '',
    });

    expect(pageData.profile.name).toBe('Ana');
    expect(pageData.theme.backgroundColor).toBe('#ffffff');
    expect(pageData.blocks).toEqual([]);
    expect(pageData.forms).toEqual([]);
    expect(pageData.published).toBe(false);
  });

  it('creates and normalizes custom forms with safe defaults', () => {
    const form = createDefaultCustomForm();
    const normalized = normalizeForms([
      {
        ...form,
        fields: [{ id: 'name', label: '', type: 'invalid', required: true }],
      },
    ]);

    expect(normalized).toHaveLength(1);
    expect(normalized[0].fields[0].type).toBe('text');
    expect(normalized[0].fields[0].label).toBe('Campo 1');
    expect(normalized[0].buttonLabel).toBe(form.buttonLabel);
  });

  it('embeds selected form definitions inside form blocks for public fallback rendering', () => {
    const form = createDefaultCustomForm();
    const pageData = normalizePageData({
      forms: [form],
      blocks: [{ ...createPageBlock('form', 0), formId: form.id }],
    });

    expect(pageData.blocks[0].form).toMatchObject({ id: form.id, title: form.title });
  });

  it('normalizes missing theme, block order, ids and null profile fields', () => {
    const fallbackProfile = {
      name: 'Base',
      username: 'base',
      email: 'base@example.com',
      plan: 'Gratuito' as const,
      bioUrl: 'pandabio.com/base',
      pageTitle: 'Base',
      bioDescription: '',
      avatarUrl: '',
    };
    const pageData = normalizePageData(
      {
        profile: { ...fallbackProfile, name: 'Salvo', username: null as never },
        blocks: [
          { id: 'second', type: 'text', order: 99, active: false },
          { id: '', type: 'link', order: 0 },
        ],
      },
      fallbackProfile,
    );

    expect(pageData.profile.name).toBe('Salvo');
    expect(pageData.profile.username).toBe('base');
    expect(pageData.theme.buttonStyle).toBe('rounded');
    expect(pageData.blocks.map((block) => block.order)).toEqual([0, 1]);
    expect(pageData.blocks[0].active).toBe(false);
    expect(pageData.blocks[1].id).toEqual(expect.any(String));
  });

  it('duplicates nested block data without sharing mutable references', () => {
    const source = {
      ...createPageBlock('produto', 0),
      gallery: { layout: 'grid' as const, images: [{ id: 'image-1', url: 'image.jpg' }] },
      products: [{ id: 'product-1', name: 'Produto' }],
    };
    const copy = duplicatePageBlock(source, 1);

    expect(copy.id).not.toBe(source.id);
    expect(copy.order).toBe(1);
    expect(copy.gallery).not.toBe(source.gallery);
    expect(copy.products).not.toBe(source.products);
    expect(copy.gallery?.images[0]).not.toBe(source.gallery?.images[0]);
  });

  it('moves blocks and keeps order contiguous', () => {
    const blocks = [createPageBlock('text', 0), createPageBlock('link', 1)];
    const moved = movePageBlock(blocks, blocks[1].id, 'up');

    expect(moved.map((block) => block.type)).toEqual(['link', 'text']);
    expect(moved.map((block) => block.order)).toEqual([0, 1]);
    expect(movePageBlock(moved, moved[0].id, 'up')).toBe(moved);
    expect(reorderPageBlocks(moved).map((block) => block.order)).toEqual([0, 1]);
  });
});
