import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsSection } from '../../components/SettingsSection';
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

describe('SettingsSection', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('navega entre abas e salva domínio válido nas preferências da conta', async () => {
    const userEventController = userEvent.setup();
    const onUpdateUser = vi.fn();
    render(<SettingsSection user={user} onUpdateUser={onUpdateUser} />);

    await userEventController.click(screen.getByRole('button', { name: /Domínio/i }));
    expect(screen.getByRole('heading', { name: 'Domínio personalizado' })).toBeTruthy();

    const domainInput = screen.getByLabelText('Seu domínio');
    await userEventController.type(domainInput, 'https://www.minhaempresa.com.br/pagina');
    await userEventController.click(screen.getByRole('button', { name: 'Salvar domínio' }));

    await waitFor(() => {
      expect(screen.getByText('Aguardando DNS')).toBeTruthy();
    });
    expect(onUpdateUser).toHaveBeenCalledWith({
      customDomain: 'minhaempresa.com.br',
      customDomainVerified: false,
    });

    const savedSettings = JSON.parse(
      window.localStorage.getItem('pandabio.settings.ana@example.com') || '{}',
    );
    expect(savedSettings.customDomain).toBe('minhaempresa.com.br');
  });

  it('rejeita domínio inválido sem substituir valor salvo', async () => {
    const userEventController = userEvent.setup();
    window.localStorage.setItem(
      'pandabio.settings.ana@example.com',
      JSON.stringify({ customDomain: 'minhaempresa.com.br' }),
    );
    render(<SettingsSection user={user} />);

    await userEventController.click(screen.getByRole('button', { name: /Domínio/i }));
    const domainInput = screen.getByLabelText('Seu domínio');
    await userEventController.clear(domainInput);
    await userEventController.type(domainInput, 'dominio invalido');
    await userEventController.click(screen.getByRole('button', { name: 'Salvar domínio' }));

    expect(screen.getByText('Domínio personalizado')).toBeTruthy();
    const savedSettings = JSON.parse(
      window.localStorage.getItem('pandabio.settings.ana@example.com') || '{}',
    );
    expect(savedSettings.customDomain).toBe('minhaempresa.com.br');
  });

  it('exibe e salva integrações no painel avançado', async () => {
    const userEventController = userEvent.setup();
    render(<SettingsSection user={user} />);

    await userEventController.click(screen.getByRole('button', { name: /Avançado/i }));
    expect(screen.getByRole('heading', { name: 'Integrações' })).toBeTruthy();

    await userEventController.type(screen.getByLabelText('Google Analytics'), 'G-ABC123');
    await userEventController.type(screen.getByLabelText('Meta Pixel'), '123456789');
    await userEventController.type(
      screen.getByLabelText('Webhook de leads'),
      'https://hooks.example.com/leads',
    );
    await userEventController.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => {
      const savedSettings = JSON.parse(
        window.localStorage.getItem('pandabio.settings.ana@example.com') || '{}',
      );
      expect(savedSettings.googleAnalyticsId).toBe('G-ABC123');
      expect(savedSettings.metaPixelId).toBe('123456789');
      expect(savedSettings.leadWebhookUrl).toBe('https://hooks.example.com/leads');
    });
  });
});
