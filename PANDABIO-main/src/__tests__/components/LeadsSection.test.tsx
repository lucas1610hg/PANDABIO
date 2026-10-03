import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LeadsSection } from '../../components/LeadsSection';
import { LeadItem } from '../../types';

const leads: LeadItem[] = [
  {
    id: 'lead-1',
    name: 'Maria Silva',
    email: 'maria@example.com',
    phone: '(38) 99999-9999',
    channel: 'Instagram',
    source: 'Instagram',
    campaign: 'bio_outubro',
    relatedType: 'service',
    relatedName: 'Design de unhas',
    status: 'new',
    score: 70,
    visitorId: 'visitor-1',
    createdAt: '2026-10-01T14:32:00.000Z',
  },
  {
    id: 'lead-2',
    name: 'João Pereira',
    email: 'joao@example.com',
    phone: '',
    channel: 'TikTok',
    source: 'TikTok',
    relatedType: 'product',
    relatedName: 'Kit personalizado',
    status: 'contacted',
    score: 50,
    createdAt: '2026-09-30T18:42:00.000Z',
  },
];

const analytics = {
  visits: 1284,
  clicks: 326,
  uniqueVisitors: 1284,
  events: [
    {
      eventType: 'view' as const,
      targetId: null,
      deviceType: 'mobile' as const,
      referrer: 'https://instagram.com/',
      visitorId: 'visitor-1',
      createdAt: '2026-10-01T14:25:00.000Z',
    },
    {
      eventType: 'whatsapp_click' as const,
      targetId: 'whatsapp',
      deviceType: 'mobile' as const,
      referrer: 'https://instagram.com/',
      visitorId: 'visitor-1',
      createdAt: '2026-10-01T14:35:00.000Z',
    },
  ],
  sales: [],
  salesAvailable: false,
};

describe('LeadsSection', () => {
  it('exibe dashboard, origem, funil e taxa de conversão', () => {
    render(<LeadsSection leads={leads} links={[]} products={[]} analytics={analytics} />);

    expect(screen.getByRole('heading', { name: 'Leads' })).toBeTruthy();
    expect(screen.getAllByText('1.284').length).toBeGreaterThan(0);
    expect(screen.getByText('2 leads / 1.284 visitantes = 0,16%')).toBeTruthy();
    expect(screen.getByText('Instagram')).toBeTruthy();
    expect(screen.getByText('Funil de conversão')).toBeTruthy();
    expect(screen.queryByText('Identidade do visitante:')).toBeNull();
  });

  it('filtra leads e abre detalhe com histórico de comportamento', async () => {
    const user = userEvent.setup();
    render(<LeadsSection leads={leads} links={[]} products={[]} analytics={analytics} />);

    await user.click(screen.getByRole('button', { name: 'Todos os leads' }));
    await user.type(screen.getByRole('textbox', { name: 'Buscar lead' }), 'Maria');

    expect(screen.getByText('Maria Silva')).toBeTruthy();
    expect(screen.queryByText('João Pereira')).toBeNull();

    await user.click(screen.getByRole('button', { name: /Maria Silva/ }));
    expect(screen.getByText('Comportamento')).toBeTruthy();
    expect(screen.getByText('Clicou em WhatsApp')).toBeTruthy();
    expect(screen.getByText(/associada por consentimento/)).toBeTruthy();
  });

  it('altera status do lead e chama callback', async () => {
    const user = userEvent.setup();
    const onUpdateLeadStatus = vi.fn().mockResolvedValue({ success: true });
    render(
      <LeadsSection
        leads={leads}
        links={[]}
        products={[]}
        analytics={analytics}
        onUpdateLeadStatus={onUpdateLeadStatus}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Todos os leads' }));
    await user.click(screen.getByRole('button', { name: /Maria Silva/ }));
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Status do lead' }),
      'interested',
    );

    await waitFor(() => {
      expect(onUpdateLeadStatus).toHaveBeenCalledWith('lead-1', 'interested');
    });
    expect(screen.getAllByText('Interessado').length).toBeGreaterThan(0);
  });
});
