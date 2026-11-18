import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Header } from '../../components/Header';
import { UserProfile } from '../../types';

const user: UserProfile = {
  name: 'Ana Panda',
  username: 'anapanda',
  email: 'ana@example.com',
  plan: 'PRO',
  bioUrl: 'pandabio.com/anapanda',
  pageTitle: 'Ana Panda',
  bioDescription: 'Bio de teste',
  avatarUrl: '',
};

const renderHeader = (activeSection: 'dashboard' | 'links' = 'dashboard') => {
  const onOpenProfile = vi.fn();
  render(
    <Header
      collapsed={false}
      onToggleCollapse={vi.fn()}
      activeSection={activeSection}
      user={user}
      searchQuery=""
      onSearchChange={vi.fn()}
      onOpenPhonePreview={vi.fn()}
      onOpenProfile={onOpenProfile}
    />,
  );
  return { onOpenProfile };
};

describe('Header', () => {
  it('abre o perfil pelo botão de conta acessível', async () => {
    const userEventController = userEvent.setup();
    const { onOpenProfile } = renderHeader();

    await userEventController.click(
      screen.getByRole('button', { name: 'Abrir perfil de Ana Panda' }),
    );

    expect(onOpenProfile).toHaveBeenCalledOnce();
    expect(screen.queryByText('Sua bio está 100% ativa e monitorada')).toBeNull();
  });

  it('mostra a busca apenas no dashboard onde ela filtra links', () => {
    const { rerender } = render(
      <Header
        collapsed={false}
        onToggleCollapse={vi.fn()}
        activeSection="links"
        user={user}
        searchQuery=""
        onSearchChange={vi.fn()}
        onOpenPhonePreview={vi.fn()}
        onOpenProfile={vi.fn()}
      />,
    );

    expect(screen.queryByRole('searchbox', { name: 'Buscar links no painel' })).toBeNull();

    rerender(
      <Header
        collapsed={false}
        onToggleCollapse={vi.fn()}
        activeSection="dashboard"
        user={user}
        searchQuery=""
        onSearchChange={vi.fn()}
        onOpenPhonePreview={vi.fn()}
        onOpenProfile={vi.fn()}
      />,
    );

    expect(screen.getByRole('searchbox', { name: 'Buscar links no painel' })).toBeTruthy();
  });
});
