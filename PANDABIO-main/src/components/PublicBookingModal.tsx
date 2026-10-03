import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarDays, CheckCircle2, Clock3, Loader2, X } from 'lucide-react';
import {
  AppointmentService,
  PublicAvailabilityService,
} from '../supabase/services/agendamentoService';
import { PublicBookingAvailability, TimeSlot } from '../types_agendamentos';

interface PublicBookingModalProps {
  workspaceSlug?: string;
  title?: string;
  onClose: () => void;
}

function getLocalDate(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function formatSlot(time: string): string {
  return time.slice(0, 5);
}

const DAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

function getDayOfWeek(date: string): number {
  return new Date(`${date}T00:00:00`).getDay();
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : 'Não foi possível concluir a reserva.';
}

export function PublicBookingModal({
  workspaceSlug,
  title,
  onClose,
}: PublicBookingModalProps) {
  const [availability, setAvailability] = useState<PublicBookingAvailability[]>([]);
  const [serviceId, setServiceId] = useState('');
  const [professionalId, setProfessionalId] = useState('');
  const [date, setDate] = useState(getLocalDate());
  const [selectedSlot, setSelectedSlot] = useState('');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationCode, setConfirmationCode] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadAvailability = async () => {
      if (!workspaceSlug) {
        setLoadingAvailability(false);
        return;
      }

      setLoadingAvailability(true);
      const data = await PublicAvailabilityService.getPublicAvailability(workspaceSlug);
      if (!mounted) return;

      setAvailability(data);
      setServiceId(data[0]?.service_id || '');
      setLoadingAvailability(false);
    };

    void loadAvailability();
    return () => {
      mounted = false;
    };
  }, [workspaceSlug]);

  const services = useMemo(() => {
    const seen = new Set<string>();
    return availability.filter((item) => {
      if (seen.has(item.service_id)) return false;
      seen.add(item.service_id);
      return true;
    });
  }, [availability]);

  const professionals = useMemo(() => {
    const seen = new Set<string>();
    return availability
      .filter((item) => item.service_id === serviceId)
      .filter((item) => {
        if (seen.has(item.professional_id)) return false;
        seen.add(item.professional_id);
        return true;
      });
  }, [availability, serviceId]);

  const selectedService = services.find((service) => service.service_id === serviceId);

  const selectedAvailability = useMemo(
    () =>
      availability.filter(
        (item) => item.service_id === serviceId && item.professional_id === professionalId,
      ),
    [availability, professionalId, serviceId],
  );

  const configuredDays = useMemo(
    () => Array.from(new Set(selectedAvailability.map((item) => item.day_of_week))).sort(),
    [selectedAvailability],
  );

  useEffect(() => {
    if (!professionals.some((professional) => professional.professional_id === professionalId)) {
      setProfessionalId(professionals[0]?.professional_id || '');
    }
  }, [professionalId, professionals]);

  useEffect(() => {
    let mounted = true;

    const loadSlots = async () => {
      setSelectedSlot('');
      if (!workspaceSlug || !serviceId || !professionalId || !date) {
        setSlots([]);
        setLoadingSlots(false);
        return;
      }

      if (!selectedAvailability.some((item) => item.day_of_week === getDayOfWeek(date))) {
        setSlots([]);
        setLoadingSlots(false);
        return;
      }

      setLoadingSlots(true);
      const data = await AppointmentService.getAvailableSlots(
        workspaceSlug,
        serviceId,
        professionalId,
        date,
        date,
      );
      if (!mounted) return;

      setSlots(data.filter((slot) => slot.available));
      setLoadingSlots(false);
    };

    void loadSlots();
    return () => {
      mounted = false;
    };
  }, [date, professionalId, selectedAvailability, serviceId, workspaceSlug]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!workspaceSlug || !serviceId || !professionalId || !selectedSlot) {
      setError('Escolha serviço, profissional, data e horário.');
      return;
    }
    if (!clientName.trim() || (!clientEmail.trim() && !clientPhone.trim())) {
      setError('Informe seu nome e pelo menos um contato.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const appointment = await AppointmentService.createBooking(workspaceSlug, {
        client_name: clientName.trim(),
        client_email: clientEmail.trim() || undefined,
        client_phone: clientPhone.trim() || undefined,
        service_id: serviceId,
        professional_id: professionalId,
        date,
        start_time: selectedSlot,
        notes: notes.trim() || undefined,
      });

      if (!appointment) throw new Error('Não foi possível criar a reserva.');
      setConfirmationCode(appointment.confirmation_code);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#131b2e]/60 p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="public-booking-title"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#FF7A00]">
              Agendamento
            </p>
            <h2 id="public-booking-title" className="mt-1 text-xl font-extrabold text-[#131b2e]">
              {title || 'Agende seu horário'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-xl p-2 text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {confirmationCode ? (
          <div className="rounded-2xl bg-emerald-50 p-5 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
            <h3 className="mt-3 text-lg font-bold text-emerald-900">Reserva recebida</h3>
            <p className="mt-1 text-sm text-emerald-800">
              Guarde este código para consultar sua reserva:
            </p>
            <p className="mt-3 rounded-xl bg-white px-4 py-3 font-mono text-lg font-bold tracking-widest text-[#131b2e]">
              {confirmationCode}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 rounded-xl bg-[#131b2e] px-4 py-2.5 text-sm font-bold text-white"
            >
              Fechar
            </button>
          </div>
        ) : !workspaceSlug ? (
          <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
            Agendamento público ainda não configurado para esta página.
          </div>
        ) : loadingAvailability ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando horários...
          </div>
        ) : availability.length === 0 ? (
          <div className="rounded-2xl bg-gray-50 p-5 text-center text-sm text-gray-600">
            Nenhum horário disponível no momento.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold text-[#131b2e]">
                Serviço
                <select
                  value={serviceId}
                  onChange={(event) => setServiceId(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal"
                >
                  {services.map((service) => (
                    <option key={service.service_id} value={service.service_id}>
                      {service.service_name} · {service.service_duration} min ·{' '}
                      {service.service_price.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold text-[#131b2e]">
                Profissional
                <select
                  value={professionalId}
                  onChange={(event) => setProfessionalId(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal"
                >
                  {professionals.map((professional) => (
                    <option key={professional.professional_id} value={professional.professional_id}>
                      {professional.professional_name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block text-sm font-semibold text-[#131b2e]">
              Data
              <span className="relative mt-1 block">
                <CalendarDays className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  min={getLocalDate()}
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm font-normal"
                />
              </span>
              <span className="mt-1 block text-xs font-normal text-gray-500">
                Dias configurados: {configuredDays.map((day) => DAY_LABELS[day]).join(', ')}
              </span>
            </label>

            <div>
              <p className="text-sm font-semibold text-[#131b2e]">Horário</p>
              {loadingSlots ? (
                <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Buscando horários...
                </div>
              ) : slots.length === 0 ? (
                <p className="mt-2 rounded-xl bg-gray-50 p-3 text-sm text-gray-500">
                  {configuredDays.includes(getDayOfWeek(date))
                    ? 'Nenhum horário livre nessa data.'
                    : 'Esse dia não faz parte da agenda configurada.'}
                </p>
              ) : (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={`${slot.date}-${slot.start_time}`}
                      type="button"
                      onClick={() => setSelectedSlot(slot.start_time)}
                      className={`flex items-center justify-center gap-1 rounded-xl border px-2 py-2 text-sm font-semibold ${selectedSlot === slot.start_time ? 'border-[#FF7A00] bg-[#FF7A00] text-white' : 'border-gray-200 text-[#131b2e] hover:border-[#FF7A00]'}`}
                    >
                      <Clock3 className="h-3.5 w-3.5" /> {formatSlot(slot.start_time)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedService && (
              <p className="text-xs text-gray-500">
                Duração: {selectedService.service_duration} min ·{' '}
                {selectedService.service_price.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold text-[#131b2e] sm:col-span-2">
                Seu nome
                <input
                  required
                  value={clientName}
                  onChange={(event) => setClientName(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal"
                  placeholder="Nome completo"
                />
              </label>
              <label className="text-sm font-semibold text-[#131b2e]">
                E-mail
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(event) => setClientEmail(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal"
                  placeholder="voce@email.com"
                />
              </label>
              <label className="text-sm font-semibold text-[#131b2e]">
                Telefone
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(event) => setClientPhone(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal"
                  placeholder="(11) 99999-9999"
                />
              </label>
            </div>

            <label className="block text-sm font-semibold text-[#131b2e]">
              Observações
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={2}
                className="mt-1 w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal"
                placeholder="Opcional"
              />
            </label>

            <button
              type="submit"
              disabled={saving || loadingSlots || !selectedSlot}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF7A00] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Enviando...' : 'Confirmar reserva'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
