import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AgendamentosAgenda } from '../../components/agendamentos/AgendamentosAgenda';
import {
  AvailabilityService,
  AppointmentService,
  ProfessionalService,
  SettingsService,
  ServiceService,
} from '../../supabase/services/agendamentoService';
import {
  BookingAppointment,
  BookingAvailability,
  BookingProfessional,
  BookingService,
  BookingSettings,
  BookingWorkspace,
} from '../../types_agendamentos';

vi.mock('../../supabase/services/agendamentoService', () => ({
  AppointmentService: {
    getAppointments: vi.fn(),
    confirmBooking: vi.fn(),
    createBooking: vi.fn(),
  },
  AvailabilityService: {
    getAvailability: vi.fn(),
  },
  ProfessionalService: {
    getProfessionals: vi.fn(),
  },
  SettingsService: {
    getSettings: vi.fn(),
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

const professional: BookingProfessional = {
  id: 'professional-1',
  workspace_id: workspace.id,
  profile_id: workspace.profile_id,
  name: 'Ana',
  specializations: [],
  active: true,
  color: '#FF7A00',
  metadata: {},
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z',
};

const service: BookingService = {
  id: 'service-1',
  workspace_id: workspace.id,
  profile_id: workspace.profile_id,
  name: 'Consulta',
  color: '#FF7A00',
  duration: 30,
  price: 50,
  price_display_type: 'fixed',
  active: true,
  requires_deposit: false,
  advance_booking_days: 90,
  cancellation_hours: 24,
  metadata: {},
  sort_order: 0,
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z',
};

const settings: BookingSettings = {
  id: 'settings-1',
  workspace_id: workspace.id,
  profile_id: workspace.profile_id,
  default_slot_duration: 60,
  min_advance_booking: 0,
  max_advance_booking: 90,
  allow_cancellations: true,
  cancellation_hours: 24,
  require_deposit: false,
  deposit_percentage: 0,
  payment_methods: ['cash'],
  enable_reminders: false,
  reminder_hours: [],
  enable_auto_confirm: false,
  require_phone: false,
  require_email: false,
  buffer_time: 0,
  no_show_limit: 3,
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z',
};

const fridayAvailability: BookingAvailability = {
  id: 'availability-1',
  professional_id: professional.id,
  workspace_id: workspace.id,
  profile_id: workspace.profile_id,
  day_of_week: 5,
  start_time: '07:00',
  end_time: '11:00',
  break_start_time: '08:00',
  break_end_time: '09:00',
  active: true,
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z',
};

const appointment: BookingAppointment = {
  id: 'booking-1',
  workspace_id: workspace.id,
  profile_id: workspace.profile_id,
  client_id: null,
  professional_id: professional.id,
  service_id: service.id,
  date: '2025-01-31',
  start_time: '07:00',
  end_time: '07:30',
  timezone: workspace.timezone,
  service_name: service.name,
  service_duration: service.duration,
  service_price: service.price,
  professional_name: professional.name,
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

describe('AgendamentosAgenda', () => {
  const flushAgendaLoad = async () => {
    await act(async () => {
      for (let index = 0; index < 8; index += 1) {
        await Promise.resolve();
      }
    });
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-31T12:00:00.000Z'));
    vi.mocked(AppointmentService.getAppointments).mockResolvedValue([]);
    vi.mocked(ProfessionalService.getProfessionals).mockResolvedValue([]);
    vi.mocked(ServiceService.getServices).mockResolvedValue([]);
    vi.mocked(AvailabilityService.getAvailability).mockResolvedValue([]);
    vi.mocked(SettingsService.getSettings).mockResolvedValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('avança para o próximo mês sem pular fevereiro ao partir do dia 31', async () => {
    render(<AgendamentosAgenda workspace={workspace} />);

    await flushAgendaLoad();
    fireEvent.click(screen.getByRole('button', { name: 'Mês' }));
    await flushAgendaLoad();

    fireEvent.click(screen.getByRole('button', { name: 'Próximo período' }));
    await flushAgendaLoad();

    expect(AppointmentService.getAppointments).toHaveBeenLastCalledWith(
      workspace.id,
      expect.objectContaining({
        start_date: '2025-02-01',
        end_date: '2025-02-28',
      }),
    );
  });

  it('volta para fevereiro sem permanecer em março ao partir do dia 31', async () => {
    vi.setSystemTime(new Date('2025-03-31T12:00:00.000Z'));
    render(<AgendamentosAgenda workspace={workspace} />);

    await flushAgendaLoad();
    fireEvent.click(screen.getByRole('button', { name: 'Mês' }));
    await flushAgendaLoad();

    fireEvent.click(screen.getByRole('button', { name: 'Período anterior' }));
    await flushAgendaLoad();

    expect(AppointmentService.getAppointments).toHaveBeenLastCalledWith(
      workspace.id,
      expect.objectContaining({
        start_date: '2025-02-01',
        end_date: '2025-02-28',
      }),
    );
  });

  it('gera horários conforme a disponibilidade, duração configurada e pausa', async () => {
    vi.mocked(ProfessionalService.getProfessionals).mockResolvedValue([professional]);
    vi.mocked(AvailabilityService.getAvailability).mockResolvedValue([fridayAvailability]);
    vi.mocked(SettingsService.getSettings).mockResolvedValue(settings);
    render(<AgendamentosAgenda workspace={workspace} />);

    await flushAgendaLoad();

    expect(screen.getByText('07:00')).toBeTruthy();
    expect(screen.getByText('09:00')).toBeTruthy();
    expect(screen.getByText('10:00')).toBeTruthy();
    expect(screen.queryByText('08:00')).toBeNull();
    expect(screen.queryByText('08:30')).toBeNull();
    expect(screen.queryByText('11:00')).toBeNull();
  });

  it('aplica os filtros selecionados ao carregar a agenda', async () => {
    vi.mocked(ProfessionalService.getProfessionals).mockResolvedValue([professional]);
    render(<AgendamentosAgenda workspace={workspace} />);

    await flushAgendaLoad();
    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }));
    fireEvent.change(screen.getByLabelText('Profissional'), {
      target: { value: professional.id },
    });
    await flushAgendaLoad();
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'pending' } });
    await flushAgendaLoad();

    expect(AppointmentService.getAppointments).toHaveBeenLastCalledWith(
      workspace.id,
      expect.objectContaining({
        professional_id: professional.id,
        status: ['pending'],
      }),
    );
  });

  it('confirma uma reserva e atualiza o status exibido', async () => {
    vi.mocked(AppointmentService.getAppointments)
      .mockResolvedValueOnce([appointment])
      .mockResolvedValueOnce([{ ...appointment, status: 'confirmed' }]);
    vi.mocked(AppointmentService.confirmBooking).mockResolvedValue(true);
    render(<AgendamentosAgenda workspace={workspace} />);

    await flushAgendaLoad();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    await flushAgendaLoad();

    expect(AppointmentService.confirmBooking).toHaveBeenCalledWith(appointment.id);
    expect(screen.getByRole('button', { name: 'Iniciar' })).toBeTruthy();
  });

  it('cria uma reserva pelo formulário acessível da agenda', async () => {
    vi.mocked(ProfessionalService.getProfessionals).mockResolvedValue([professional]);
    vi.mocked(ServiceService.getServices).mockResolvedValue([service]);
    vi.mocked(AppointmentService.createBooking).mockResolvedValue(appointment);
    render(<AgendamentosAgenda workspace={workspace} />);

    await flushAgendaLoad();
    fireEvent.click(screen.getByRole('button', { name: 'Nova Reserva' }));
    expect(screen.getByRole('dialog', { name: 'Nova Reserva' })).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Serviço *'), { target: { value: service.id } });
    fireEvent.change(screen.getByLabelText('Profissional *'), {
      target: { value: professional.id },
    });
    fireEvent.change(screen.getByLabelText('Nome do Cliente *'), {
      target: { value: 'Cliente de teste' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'Criar Reserva' }).closest('form')!);
    await flushAgendaLoad();

    expect(AppointmentService.createBooking).toHaveBeenCalledWith(
      workspace.slug,
      expect.objectContaining({
        client_name: 'Cliente de teste',
        service_id: service.id,
        professional_id: professional.id,
      }),
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('exibe falha de carregamento e permite recarregar a agenda', async () => {
    vi.mocked(AppointmentService.getAppointments)
      .mockRejectedValueOnce(new Error('Falha temporária'))
      .mockResolvedValueOnce([]);
    render(<AgendamentosAgenda workspace={workspace} />);

    await flushAgendaLoad();
    expect(screen.getByRole('alert').textContent).toContain('Erro ao carregar agenda');

    fireEvent.click(screen.getByRole('button', { name: 'Recarregar dados' }));
    await flushAgendaLoad();

    expect(screen.queryByRole('alert')).toBeNull();
    expect(AppointmentService.getAppointments).toHaveBeenCalledTimes(2);
  });
});
