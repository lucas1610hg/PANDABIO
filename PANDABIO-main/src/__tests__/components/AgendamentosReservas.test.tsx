import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AgendamentosReservas } from '../../components/agendamentos/AgendamentosReservas';
import {
  AppointmentService,
  ProfessionalService,
  ServiceService,
} from '../../supabase/services/agendamentoService';
import { BookingAppointment, BookingWorkspace } from '../../types_agendamentos';

vi.mock('../../supabase/services/agendamentoService', () => ({
  AppointmentService: {
    getAppointments: vi.fn(),
    confirmBooking: vi.fn(),
    cancelBooking: vi.fn(),
    startBooking: vi.fn(),
    markNoShow: vi.fn(),
    completeBooking: vi.fn(),
    createBooking: vi.fn(),
  },
  ProfessionalService: {
    getProfessionals: vi.fn(),
  },
  ServiceService: {
    getServices: vi.fn(),
  },
}));

const workspace: BookingWorkspace = {
  id: 'workspace-1',
  profile_id: 'profile-1',
  name: 'Estúdio Panda',
  slug: 'estudio-panda',
  timezone: 'America/Sao_Paulo',
  currency: 'BRL',
  language: 'pt-BR',
  active: true,
  settings: {},
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z',
};

const appointment: BookingAppointment = {
  id: 'booking-1',
  workspace_id: workspace.id,
  profile_id: workspace.profile_id,
  client_id: null,
  professional_id: 'professional-1',
  service_id: 'service-1',
  date: '2025-05-01',
  start_time: '10:00',
  end_time: '10:30',
  timezone: workspace.timezone,
  service_name: 'Consulta',
  service_duration: 30,
  service_price: 50,
  professional_name: 'Ana',
  status: 'pending',
  payment_status: 'pending',
  deposit_paid: false,
  metadata: {},
  confirmation_code: 'ABC123',
  reminder_sent: false,
  reminder_count: 0,
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z',
};

describe('AgendamentosReservas', () => {
  beforeEach(() => {
    vi.mocked(AppointmentService.getAppointments).mockResolvedValue([appointment]);
    vi.mocked(ProfessionalService.getProfessionals).mockResolvedValue([]);
    vi.mocked(ServiceService.getServices).mockResolvedValue([]);
  });

  it('disponibiliza a lista em uma região acessível e o formulário em um diálogo acessível', async () => {
    const user = userEvent.setup();
    render(<AgendamentosReservas workspace={workspace} />);

    expect(await screen.findByRole('region', { name: 'Lista de reservas' })).toBeTruthy();
    expect(screen.getByRole('table', { name: 'Reservas cadastradas' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Nova Reserva' }));
    expect(screen.getByRole('dialog', { name: 'Nova Reserva' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Fechar janela' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('mostra erro de carregamento e permite recarregar as reservas', async () => {
    const user = userEvent.setup();
    vi.mocked(AppointmentService.getAppointments)
      .mockRejectedValueOnce(new Error('Falha temporária'))
      .mockResolvedValueOnce([]);
    render(<AgendamentosReservas workspace={workspace} />);

    expect((await screen.findByRole('alert')).textContent).toContain('Erro ao carregar reservas');
    await user.click(screen.getByRole('button', { name: 'Recarregar dados' }));

    expect(await screen.findByText('Nenhuma reserva cadastrada')).toBeTruthy();
    expect(AppointmentService.getAppointments).toHaveBeenCalledTimes(2);
  });
});
