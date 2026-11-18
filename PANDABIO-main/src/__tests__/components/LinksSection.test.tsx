import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LinksSection } from '../../components/LinksSection';
import { BioLink } from '../../types';

const links: BioLink[] = [
  {
    id: 'active-link',
    title: 'Instagram',
    url: 'https://instagram.com/pandabio',
    clicks: 4,
    leads: 1,
    active: true,
    icon: 'instagram',
    type: 'social',
  },
  {
    id: 'inactive-link',
    title: 'Portfólio',
    url: 'https://example.com/portfolio',
    clicks: 2,
    leads: 0,
    active: false,
    icon: 'custom',
    type: 'custom',
  },
];

const renderLinksSection = () =>
  render(
    <LinksSection links={links} onToggleLink={vi.fn()} onAddLink={vi.fn()} onReorder={vi.fn()} />,
  );

describe('LinksSection', () => {
  it('disables reordering while the list is filtered or searched', async () => {
    const user = userEvent.setup();
    renderLinksSection();

    const reorderButton = screen.getByRole('button', { name: 'Reordenar' });
    expect(reorderButton.hasAttribute('disabled')).toBe(false);

    await user.click(screen.getByRole('button', { name: 'Ativos (1)' }));
    expect(reorderButton.hasAttribute('disabled')).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Todos (2)' }));
    await user.type(
      screen.getByRole('searchbox', { name: 'Buscar links por título ou URL' }),
      'Instagram',
    );
    expect(reorderButton.hasAttribute('disabled')).toBe(true);
  });

  it('exits reorder mode when a search is started', async () => {
    const user = userEvent.setup();
    renderLinksSection();

    await user.click(screen.getByRole('button', { name: 'Reordenar' }));
    expect(
      screen.getByText('Arraste os links para definir a ordem de exibição na sua bio.'),
    ).toBeTruthy();

    await user.type(
      screen.getByRole('searchbox', { name: 'Buscar links por título ou URL' }),
      'Instagram',
    );

    expect(
      screen.queryByText('Arraste os links para definir a ordem de exibição na sua bio.'),
    ).toBeNull();
  });

  it('keeps per-link click and lead counts available in the compact row', () => {
    renderLinksSection();

    const stats = screen.getByRole('group', { name: 'Estatísticas do link Instagram' });
    expect(stats.textContent).toContain('4 cliques');
    expect(stats.textContent).toContain('1 lead');
  });
});
