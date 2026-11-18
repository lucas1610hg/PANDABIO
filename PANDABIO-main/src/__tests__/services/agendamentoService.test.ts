import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AppointmentService,
  AvailabilityService,
  ProfessionalService,
  ServiceService,
  SettingsService,
} from '../../supabase/services/agendamentoService';

const mocks = vi.hoisted(() => {
  let queryResult: Promise<unknown> = Promise.resolve({ data: [], error: null });
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    gte: vi.fn(() => query),
    lte: vi.fn(() => query),
    maybeSingle: vi.fn(() => query),
    then: (
      onFulfilled?: ((value: unknown) => unknown) | null,
      onRejected?: ((reason: unknown) => unknown) | null,
    ) => queryResult.then(onFulfilled, onRejected),
  };

  return {
    isSupabaseConfigured: vi.fn(() => true),
    from: vi.fn(() => query),
    setQueryResult: (result: Promise<unknown>) => {
      queryResult = result;
    },
  };
});

vi.mock('../../supabase/client', () => ({
  isSupabaseConfigured: mocks.isSupabaseConfigured,
  supabase: { from: mocks.from },
}));

describe('agendamentoService read operations', () => {
  beforeEach(() => {
    mocks.isSupabaseConfigured.mockReturnValue(true);
    mocks.from.mockClear();
    mocks.setQueryResult(Promise.resolve({ data: [], error: null }));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['reservas', () => AppointmentService.getAppointments('appointments-workspace')],
    ['profissionais', () => ProfessionalService.getProfessionals('professionals-workspace')],
    ['serviços', () => ServiceService.getServices('services-workspace')],
    ['disponibilidade', () => AvailabilityService.getAvailability('professional-1')],
    ['configurações', () => SettingsService.getSettings('settings-workspace')],
  ])('propaga erros ao carregar %s', async (_resource, load) => {
    const databaseError = new Error('Falha de conexão');
    mocks.setQueryResult(Promise.reject(databaseError));

    await expect(load()).rejects.toBe(databaseError);
  });

  it('retorna null quando ainda não existe uma configuração para o workspace', async () => {
    mocks.setQueryResult(Promise.resolve({ data: null, error: null }));

    await expect(SettingsService.getSettings('workspace-without-settings')).resolves.toBeNull();
  });
});
