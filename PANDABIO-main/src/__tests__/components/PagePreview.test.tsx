import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PagePreview } from '../../components/PagePreview';
import { defaultPageTheme } from '../../theme/presets';
import { createDefaultCustomForm, createPageBlock } from '../../utils/pageData';
import { BioLink, UserProfile } from '../../types';

const profile: UserProfile = {
  name: 'Ana',
  username: 'ana',
  email: 'ana@example.com',
  plan: 'Gratuito',
  bioUrl: 'pandabio.com/ana',
  pageTitle: 'Ana',
  bioDescription: 'Bio',
  avatarUrl: 'avatar.png',
};

const link = (overrides: Partial<BioLink>): BioLink => ({
  id: 'link-1',
  title: 'Link',
  url: 'example.com',
  clicks: 0,
  leads: 0,
  active: true,
  icon: 'custom',
  type: 'custom',
  ...overrides,
});

describe('PagePreview', () => {
  it('lets the mobile builder select and reveal hidden blocks for editing', async () => {
    const user = userEvent.setup();
    const onSelectBlock = vi.fn();
    const hiddenBlock = {
      ...createPageBlock('text', 0),
      title: 'Bloco oculto',
      active: false,
    };

    render(
      <PagePreview
        profile={profile}
        theme={defaultPageTheme()}
        blocks={[hiddenBlock]}
        device="mobile"
        editable
        onSelectBlock={onSelectBlock}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Selecionar bloco: Bloco oculto' }));

    expect(onSelectBlock).toHaveBeenCalledWith(hiddenBlock);
    expect(screen.getByText('Oculto')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Arrastar para reorganizar Bloco oculto' }),
    ).toBeTruthy();
  });

  it('renders active links from Links section and ignores inactive links', () => {
    const block = { ...createPageBlock('link', 0), title: 'Links da bio' };

    render(
      <PagePreview
        profile={profile}
        theme={defaultPageTheme()}
        blocks={[block]}
        links={[
          link({ id: 'portfolio', title: 'Portfólio', url: 'https://portfolio.example.com' }),
          link({ id: 'inactive', title: 'Link inativo', active: false }),
        ]}
        device="mobile"
        interactive
      />,
    );

    expect(screen.getByRole('link', { name: /Portfólio/i }).getAttribute('href')).toBe(
      'https://portfolio.example.com/',
    );
    expect(screen.queryByText('Link inativo')).toBeNull();
  });

  it('keeps long link titles inside responsive button content', () => {
    const longTitle = 'Título de link muito longo que precisa quebrar sem sair do cartão';
    const block = { ...createPageBlock('link', 0), title: 'Links da bio' };

    render(
      <PagePreview
        profile={profile}
        theme={defaultPageTheme()}
        blocks={[block]}
        links={[link({ title: longTitle })]}
        device="mobile"
      />,
    );

    const titleElement = screen.getByText(longTitle);
    expect(titleElement.className).toContain('min-w-0');
    expect(titleElement.className).toContain('break-words');
  });

  it('renders only the link selected in block configuration', () => {
    const block = { ...createPageBlock('link', 0), linkIds: ['selected-link'] };

    render(
      <PagePreview
        profile={profile}
        theme={defaultPageTheme()}
        blocks={[block]}
        links={[
          link({ id: 'selected-link', title: 'Link selecionado' }),
          link({ id: 'other-link', title: 'Outro link' }),
        ]}
        device="mobile"
        interactive
      />,
    );

    expect(screen.getByRole('link', { name: /Link selecionado/i })).toBeTruthy();
    expect(screen.queryByText('Outro link')).toBeNull();
  });

  it('attributes clicks on each bio link to that individual link id', async () => {
    const user = userEvent.setup();
    const onInteractiveClick = vi.fn();
    const block = { ...createPageBlock('link', 0), title: 'Links da bio' };

    render(
      <PagePreview
        profile={profile}
        theme={defaultPageTheme()}
        blocks={[block]}
        links={[link({ id: 'instagram-link', title: 'Instagram' })]}
        device="mobile"
        interactive
        onInteractiveClick={onInteractiveClick}
      />,
    );

    await user.click(screen.getByRole('link', { name: /Instagram/i }));

    expect(onInteractiveClick).toHaveBeenCalledWith(block, 'instagram-link');
  });

  it('exposes interactive actions for booking and products without a URL', async () => {
    const user = userEvent.setup();
    const onInteractiveClick = vi.fn();

    render(
      <PagePreview
        profile={profile}
        theme={defaultPageTheme()}
        blocks={[createPageBlock('agendamento', 0), createPageBlock('produto', 1)]}
        device="mobile"
        interactive
        onInteractiveClick={onInteractiveClick}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Ver agenda e horários' }));
    await user.click(screen.getByRole('button', { name: 'Comprar' }));

    expect(onInteractiveClick).toHaveBeenCalledTimes(2);
  });

  it('opens Shopee catalog links in the same tab so mobile app links can be handled', () => {
    const block = {
      ...createPageBlock('produto', 0),
      products: [
        {
          id: 'shopee-product',
          name: 'Produto Shopee',
          link: 'https://shopee.com.br/product/811034337/22096069216',
        },
      ],
    };

    render(
      <PagePreview
        profile={profile}
        theme={defaultPageTheme()}
        blocks={[block]}
        device="mobile"
        interactive
      />,
    );

    const buyLink = screen.getByRole('link', { name: 'Comprar' });
    expect(buyLink.getAttribute('href')).toBe(
      'https://shopee.com.br/product/811034337/22096069216',
    );
    expect(buyLink.hasAttribute('target')).toBe(false);
    expect(buyLink.className).toContain('min-h-11');
  });

  it('keeps non-Shopee product links opening in a new tab', () => {
    const block = {
      ...createPageBlock('produto', 0),
      url: 'https://loja.example.com/produto',
      productName: 'Produto externo',
    };

    render(
      <PagePreview
        profile={profile}
        theme={defaultPageTheme()}
        blocks={[block]}
        device="mobile"
        interactive
      />,
    );

    expect(screen.getByRole('link', { name: 'Comprar' }).getAttribute('target')).toBe('_blank');
  });

  it('submits custom forms through preview callback', async () => {
    const user = userEvent.setup();
    const form = createDefaultCustomForm();
    const onLeadCapture = vi.fn().mockResolvedValue(true);
    const block = { ...createPageBlock('form', 0), formId: form.id };

    render(
      <PagePreview
        profile={profile}
        theme={defaultPageTheme()}
        blocks={[block]}
        forms={[form]}
        device="mobile"
        interactive
        onLeadCapture={onLeadCapture}
      />,
    );

    await user.type(screen.getByRole('textbox', { name: /Nome/ }), 'Maria');
    await user.type(screen.getByRole('textbox', { name: /E-mail/ }), 'maria@example.com');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: form.buttonLabel }));

    await waitFor(() => expect(onLeadCapture).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(form.successMessage)).toBeTruthy();
    expect(onLeadCapture.mock.calls[0][1]).toMatchObject({
      name: 'Maria',
      email: 'maria@example.com',
      consent: true,
    });
  });

  it('keeps form block unavailable when public form definition is missing', () => {
    const block = { ...createPageBlock('form', 0), formId: 'missing-form' };

    render(
      <PagePreview
        profile={profile}
        theme={defaultPageTheme()}
        blocks={[block]}
        forms={[]}
        device="mobile"
        interactive
        onLeadCapture={vi.fn().mockResolvedValue(true)}
      />,
    );

    expect(screen.getByText('Formulário não configurado')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Enviar dados' })).toBeNull();
  });
});
