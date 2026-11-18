import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  Scissors,
  Filter,
  X,
} from 'lucide-react';
import {
  AppointmentService,
  AvailabilityService,
  ProfessionalService,
  SettingsService,
  ServiceService,
} from '../../supabase/services/agendamentoService';
import {
  BookingAppointment,
  BookingAvailability,
  BookingProfessional,
  BookingService,
  BookingStatus,
  BookingWorkspace,
  CreateBookingData,
} from '../../types_agendamentos';
import { Modal } from '../Modal';

type ViewType = 'day' | 'week' | 'month';

interface AgendamentosAgendaProps {
  workspace: BookingWorkspace | null;
}

export const AgendamentosAgenda: React.FC<AgendamentosAgendaProps> = ({ workspace }) => {
  const [appointments, setAppointments] = useState<BookingAppointment[]>([]);
  const [professionals, setProfessionals] = useState<BookingProfessional[]>([]);
  const [services, setServices] = useState<BookingService[]>([]);
  const [availability, setAvailability] = useState<BookingAvailability[]>([]);
  const [slotDuration, setSlotDuration] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<ViewType>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingSaving, setBookingSaving] = useState(false);

  const [bookingForm, setBookingForm] = useState<CreateBookingData>({
    client_name: '',
    client_email: '',
    client_phone: '',
    service_id: '',
    professional_id: '',
    date: '',
    start_time: '',
    notes: '',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!workspace) {
        setAppointments([]);
        setProfessionals([]);
        setServices([]);
        setAvailability([]);
        setSlotDuration(30);
        setLoading(false);
        return;
      }

      const [appointmentsData, professionalsData, servicesData, settingsData] = await Promise.all([
        AppointmentService.getAppointments(workspace.id, {
          start_date: getStartDate(currentDate, viewType),
          end_date: getEndDate(currentDate, viewType),
          professional_id: selectedProfessional || undefined,
          status: selectedStatus ? [selectedStatus] : undefined,
        }),
        ProfessionalService.getProfessionals(workspace.id),
        ServiceService.getServices(workspace.id),
        SettingsService.getSettings(workspace.id),
      ]);

      const professionalIds = selectedProfessional
        ? [selectedProfessional]
        : professionalsData.filter((professional) => professional.active).map(({ id }) => id);
      const availabilityData = (
        await Promise.all(
          professionalIds.map((professionalId) =>
            AvailabilityService.getAvailability(professionalId),
          ),
        )
      ).flat();

      setAppointments(appointmentsData);
      setProfessionals(professionalsData);
      setServices(servicesData);
      setAvailability(availabilityData);
      setSlotDuration(settingsData?.default_slot_duration ?? 30);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao carregar agenda: ${errorMessage}`);
      console.error('Error loading agenda:', err);
    } finally {
      setLoading(false);
    }
  }, [workspace, currentDate, viewType, selectedProfessional, selectedStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewType === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewType === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(1);
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewType === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewType === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(1);
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleStatusChange = async (appointmentId: string, newStatus: BookingStatus) => {
    try {
      let success = true;
      if (newStatus === 'confirmed') {
        success = await AppointmentService.confirmBooking(appointmentId);
      } else if (newStatus === 'cancelled') {
        success = await AppointmentService.cancelBooking(appointmentId);
      } else if (newStatus === 'in_progress') {
        success = await AppointmentService.startBooking(appointmentId);
      } else if (newStatus === 'no_show') {
        success = await AppointmentService.markNoShow(appointmentId);
      } else if (newStatus === 'completed') {
        success = await AppointmentService.completeBooking(appointmentId);
      }
      if (!success) throw new Error('Operação recusada');
      await loadData();
    } catch (err) {
      setError('Erro ao atualizar status');
      console.error('Error updating status:', err);
    }
  };

  const handleOpenBookingModal = (date: string, time: string) => {
    setBookingForm({
      client_name: '',
      client_email: '',
      client_phone: '',
      service_id: '',
      professional_id: selectedProfessional || '',
      date,
      start_time: time,
      notes: '',
    });
    setShowBookingModal(true);
  };

  const handleCloseBookingModal = () => {
    setShowBookingModal(false);
    setBookingForm({
      client_name: '',
      client_email: '',
      client_phone: '',
      service_id: '',
      professional_id: '',
      date: '',
      start_time: '',
      notes: '',
    });
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace) return;

    try {
      setBookingSaving(true);
      setError(null);

      if (
        !bookingForm.service_id ||
        !bookingForm.professional_id ||
        !bookingForm.date ||
        !bookingForm.start_time
      ) {
        setError('Preencha todos os campos obrigatórios');
        setBookingSaving(false);
        return;
      }

      const newBooking = await AppointmentService.createBooking(workspace.slug, bookingForm);
      if (!newBooking) {
        throw new Error('Erro ao criar reserva');
      }

      handleCloseBookingModal();
      await loadData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao criar reserva: ${errorMessage}`);
      console.error('Error creating booking:', err);
    } finally {
      setBookingSaving(false);
    }
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'confirmed':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'completed':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'no_show':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: BookingStatus) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'confirmed':
        return 'Confirmado';
      case 'in_progress':
        return 'Em Atendimento';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      case 'no_show':
        return 'Não Compareceu';
      default:
        return status;
    }
  };

  const groupedAppointments = appointments.reduce(
    (acc, appointment) => {
      const date = appointment.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(appointment);
      return acc;
    },
    {} as Record<string, BookingAppointment[]>,
  );

  const sortedDates = Object.keys(groupedAppointments).sort();

  const dayAppointments = groupedAppointments[toDateKey(currentDate)] || [];
  const timeSlots = getDailyTimeSlots(
    availability,
    currentDate.getDay(),
    slotDuration,
    dayAppointments,
  );
  const getAppointmentAtTime = (time: string) =>
    dayAppointments.find((appointment) => {
      const start = appointment.start_time.slice(0, 5);
      const end = appointment.end_time.slice(0, 5);
      return start <= time && time < end;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7A00]" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Calendar className="w-12 h-12 text-gray-400" />
        <p className="text-sm text-gray-600">Nenhum workspace configurado</p>
        <p className="text-xs text-gray-400">
          Execute os dados de teste para criar um workspace automaticamente
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#131b2e]">Agenda</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-[#f2f3ff] px-2.5 py-1 font-bold text-[#3525cd]">
              {appointments.length} no período
            </span>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 font-bold text-amber-700">
              {appointments.filter((appointment) => appointment.status === 'pending').length}{' '}
              pendentes
            </span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700">
              {appointments.filter((appointment) => appointment.status === 'confirmed').length}{' '}
              confirmados
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleOpenBookingModal(toDateKey(currentDate), timeSlots[0] || '09:00')}
          className="flex items-center gap-2 px-4 py-2 bg-[#FF7A00] text-white rounded-lg text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          Nova Reserva
        </button>
      </div>

      <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevious}
            aria-label="Período anterior"
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button
            type="button"
            onClick={handleToday}
            className="px-4 py-2 bg-[#3525cd] text-white rounded-lg text-sm font-medium"
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Próximo período"
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-sm font-semibold text-[#131b2e] ml-2">
            {formatDateRange(currentDate, viewType)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {(['day', 'week', 'month'] as ViewType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setViewType(type)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  viewType === type ? 'bg-white text-[#131b2e] shadow' : 'text-gray-600'
                }`}
              >
                {type === 'day' ? 'Dia' : type === 'week' ? 'Semana' : 'Mês'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
              showFilters
                ? 'bg-[#3525cd] text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="agenda-filter-professional"
                className="block text-sm font-medium text-[#131b2e] mb-1"
              >
                Profissional
              </label>
              <select
                id="agenda-filter-professional"
                value={selectedProfessional || ''}
                onChange={(e) => setSelectedProfessional(e.target.value || null)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
              >
                <option value="">Todos</option>
                {professionals.map((prof) => (
                  <option key={prof.id} value={prof.id}>
                    {prof.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="agenda-filter-status"
                className="block text-sm font-medium text-[#131b2e] mb-1"
              >
                Status
              </label>
              <select
                id="agenda-filter-status"
                value={selectedStatus || ''}
                onChange={(e) =>
                  setSelectedStatus((e.target.value || null) as BookingStatus | null)
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
              >
                <option value="">Todos</option>
                <option value="pending">Pendente</option>
                <option value="confirmed">Confirmado</option>
                <option value="in_progress">Em Atendimento</option>
                <option value="completed">Concluído</option>
                <option value="cancelled">Cancelado</option>
                <option value="no_show">Não Compareceu</option>
                <option value="expired">Expirado</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedProfessional(null);
                setSelectedStatus(null);
              }}
              className="text-xs font-bold text-[#3525cd] hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => void loadData()}
            className="text-sm font-semibold text-red-700 underline"
          >
            Recarregar dados
          </button>
        </div>
      )}

      {viewType === 'day' ? (
        <div
          role="region"
          aria-label="Agenda diária"
          tabIndex={0}
          className="overflow-x-auto rounded-2xl border border-gray-200 bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF7A00]"
        >
          {timeSlots.length === 0 ? (
            <div className="flex min-h-48 items-center justify-center p-6 text-center text-sm text-gray-600">
              Nenhum horário configurado para este dia.
            </div>
          ) : (
            <div className="min-w-[640px]">
              <div className="grid grid-cols-[80px_minmax(560px,1fr)] min-h-[600px]">
                <div className="border-r border-gray-200">
                  <div className="h-12 border-b border-gray-200" />
                  {timeSlots.map((time) => (
                    <div
                      key={time}
                      className="h-16 border-b border-gray-100 flex items-center justify-center text-xs text-gray-500"
                    >
                      {time}
                    </div>
                  ))}
                </div>

                <div className="relative">
                  <div className="h-12 border-b border-gray-200 flex items-center px-4">
                    <span className="text-sm font-semibold text-[#131b2e]">
                      {new Date(currentDate).toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </span>
                  </div>

                  {timeSlots.map((time) => {
                    const slotAppointments = dayAppointments.filter(
                      (appointment) => appointment.start_time.slice(0, 5) === time,
                    );
                    const occupiedAppointment = getAppointmentAtTime(time);

                    return (
                      <div key={time} className="h-16 border-b border-gray-100 relative">
                        {slotAppointments.length > 0 ? (
                          <div className="absolute inset-0 p-1 space-y-1 overflow-auto">
                            {slotAppointments.map((appointment) => (
                              <div
                                key={appointment.id}
                                className={`p-2 rounded-lg text-xs border-l-4 ${getStatusColor(appointment.status)}`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-[#131b2e]">
                                    {appointment.service?.name || appointment.service_name}
                                  </span>
                                  <span className="text-[#131b2e]">
                                    R${' '}
                                    {(
                                      appointment.service?.price ?? appointment.service_price
                                    ).toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <User className="w-3 h-3" />
                                  <span>
                                    {appointment.professional?.name ||
                                      appointment.professional_name}
                                  </span>
                                  {appointment.client && <span>- {appointment.client.name}</span>}
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  {appointment.status === 'pending' && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleStatusChange(appointment.id, 'confirmed')
                                        }
                                        className="px-2 py-0.5 bg-emerald-500 text-white rounded text-xs"
                                      >
                                        Confirmar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleStatusChange(appointment.id, 'cancelled')
                                        }
                                        className="px-2 py-0.5 bg-red-500 text-white rounded text-xs"
                                      >
                                        Cancelar
                                      </button>
                                    </>
                                  )}
                                  {appointment.status === 'confirmed' && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleStatusChange(appointment.id, 'in_progress')
                                        }
                                        className="px-2 py-0.5 bg-blue-500 text-white rounded text-xs"
                                      >
                                        Iniciar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleStatusChange(appointment.id, 'cancelled')
                                        }
                                        className="px-2 py-0.5 bg-red-500 text-white rounded text-xs"
                                      >
                                        Cancelar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleStatusChange(appointment.id, 'no_show')
                                        }
                                        className="px-2 py-0.5 bg-orange-500 text-white rounded text-xs"
                                      >
                                        Não compareceu
                                      </button>
                                    </>
                                  )}
                                  {appointment.status === 'in_progress' && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleStatusChange(appointment.id, 'completed')
                                        }
                                        className="px-2 py-0.5 bg-purple-500 text-white rounded text-xs"
                                      >
                                        Concluir
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleStatusChange(appointment.id, 'no_show')
                                        }
                                        className="px-2 py-0.5 bg-orange-500 text-white rounded text-xs"
                                      >
                                        Não compareceu
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : occupiedAppointment ? (
                          <div className="flex h-full items-center justify-center bg-red-50/40 text-[11px] font-semibold text-red-400">
                            Horário ocupado
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenBookingModal(toDateKey(currentDate), time)}
                            aria-label={`Criar reserva às ${time}`}
                            className="w-full h-full hover:bg-gray-50 flex items-center justify-center transition-colors"
                          >
                            <Plus className="w-4 h-4 text-gray-300" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 bg-white rounded-2xl border border-gray-200">
              <Calendar className="w-12 h-12 text-gray-400" />
              <p className="text-sm text-gray-600">Nenhum agendamento neste período</p>
            </div>
          ) : (
            sortedDates.map((date) => (
              <div
                key={date}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
              >
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-[#131b2e]">{formatDate(date)}</h3>
                </div>

                <div className="divide-y divide-gray-100">
                  {groupedAppointments[date]
                    .sort((a, b) => a.start_time.localeCompare(b.start_time))
                    .map((appointment) => (
                      <div key={appointment.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col items-center gap-1 shrink-0">
                            <Clock className="w-5 h-5 text-[#FF7A00]" />
                            <span className="text-sm font-semibold text-[#131b2e]">
                              {appointment.start_time}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h4 className="text-sm font-semibold text-[#131b2e]">
                                  {appointment.service_name}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {appointment.professional_name}
                                  </span>
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Scissors className="w-3 h-3" />
                                    {appointment.service_duration} min
                                  </span>
                                </div>
                                {appointment.client && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    {appointment.client.name}
                                  </p>
                                )}
                              </div>

                              <div className="flex flex-col items-end gap-2 shrink-0">
                                <span
                                  className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(appointment.status)}`}
                                >
                                  {getStatusLabel(appointment.status)}
                                </span>
                                <span className="text-xs font-semibold text-[#131b2e]">
                                  R$ {appointment.service_price.toFixed(2)}
                                </span>
                              </div>
                            </div>

                            {appointment.notes && (
                              <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                                {appointment.notes}
                              </p>
                            )}

                            <div className="flex items-center gap-2 mt-3">
                              {appointment.status === 'pending' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                                    className="px-3 py-1 bg-emerald-500 text-white rounded-md text-xs font-medium hover:bg-emerald-600"
                                  >
                                    Confirmar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                                    className="px-3 py-1 bg-red-500 text-white rounded-md text-xs font-medium hover:bg-red-600"
                                  >
                                    Cancelar
                                  </button>
                                </>
                              )}
                              {appointment.status === 'confirmed' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleStatusChange(appointment.id, 'in_progress')
                                    }
                                    className="px-3 py-1 bg-blue-500 text-white rounded-md text-xs font-medium hover:bg-blue-600"
                                  >
                                    Iniciar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                                    className="px-3 py-1 bg-red-500 text-white rounded-md text-xs font-medium hover:bg-red-600"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(appointment.id, 'no_show')}
                                    className="px-3 py-1 bg-orange-500 text-white rounded-md text-xs font-medium hover:bg-orange-600"
                                  >
                                    Não compareceu
                                  </button>
                                </>
                              )}
                              {appointment.status === 'in_progress' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(appointment.id, 'completed')}
                                    className="px-3 py-1 bg-purple-500 text-white rounded-md text-xs font-medium hover:bg-purple-600"
                                  >
                                    Concluir
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(appointment.id, 'no_show')}
                                    className="px-3 py-1 bg-orange-500 text-white rounded-md text-xs font-medium hover:bg-orange-600"
                                  >
                                    Não compareceu
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <Modal
        isOpen={showBookingModal}
        onClose={handleCloseBookingModal}
        titleId="agenda-booking-title"
        size="sm"
      >
        <div className="flex min-h-0 flex-col">
          <div className="flex shrink-0 items-center justify-between border-b border-gray-200 p-5 sm:p-6">
            <h3 id="agenda-booking-title" className="text-lg font-bold text-[#131b2e]">
              Nova Reserva
            </h3>
            <button
              type="button"
              onClick={handleCloseBookingModal}
              aria-label="Fechar janela"
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <form
            onSubmit={handleCreateBooking}
            className="min-h-0 overflow-y-auto p-5 space-y-4 sm:p-6"
          >
            <div>
              <label
                htmlFor="agenda-booking-date"
                className="block text-sm font-medium text-[#131b2e] mb-1"
              >
                Data e Hora
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  id="agenda-booking-date"
                  required
                  value={bookingForm.date}
                  onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                />
                <input
                  type="time"
                  aria-label="Horário"
                  required
                  value={bookingForm.start_time}
                  onChange={(e) => setBookingForm({ ...bookingForm, start_time: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="agenda-booking-service"
                className="block text-sm font-medium text-[#131b2e] mb-1"
              >
                Serviço *
              </label>
              <select
                id="agenda-booking-service"
                required
                value={bookingForm.service_id}
                onChange={(e) => setBookingForm({ ...bookingForm, service_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
              >
                <option value="">Selecione um serviço</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} - {service.duration}min - R$ {service.price.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="agenda-booking-professional"
                className="block text-sm font-medium text-[#131b2e] mb-1"
              >
                Profissional *
              </label>
              <select
                id="agenda-booking-professional"
                required
                value={bookingForm.professional_id}
                onChange={(e) =>
                  setBookingForm({ ...bookingForm, professional_id: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
              >
                <option value="">Selecione um profissional</option>
                {professionals.map((prof) => (
                  <option key={prof.id} value={prof.id}>
                    {prof.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="agenda-booking-client-name"
                className="block text-sm font-medium text-[#131b2e] mb-1"
              >
                Nome do Cliente *
              </label>
              <input
                id="agenda-booking-client-name"
                type="text"
                required
                value={bookingForm.client_name}
                onChange={(e) => setBookingForm({ ...bookingForm, client_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                placeholder="Nome completo"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="agenda-booking-client-email"
                  className="block text-sm font-medium text-[#131b2e] mb-1"
                >
                  Email
                </label>
                <input
                  id="agenda-booking-client-email"
                  type="email"
                  value={bookingForm.client_email || ''}
                  onChange={(e) => setBookingForm({ ...bookingForm, client_email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <label
                  htmlFor="agenda-booking-client-phone"
                  className="block text-sm font-medium text-[#131b2e] mb-1"
                >
                  Telefone
                </label>
                <input
                  id="agenda-booking-client-phone"
                  type="tel"
                  value={bookingForm.client_phone || ''}
                  onChange={(e) => setBookingForm({ ...bookingForm, client_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="agenda-booking-notes"
                className="block text-sm font-medium text-[#131b2e] mb-1"
              >
                Observações
              </label>
              <textarea
                id="agenda-booking-notes"
                value={bookingForm.notes}
                onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00] resize-none"
                rows={3}
                placeholder="Observações sobre a reserva"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleCloseBookingModal}
                className="flex-1 px-4 py-2 bg-white text-[#131b2e] rounded-lg text-sm font-semibold border border-gray-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={bookingSaving}
                className="flex-1 px-4 py-2 bg-[#FF7A00] text-white rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                {bookingSaving ? 'Criando...' : 'Criar Reserva'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

function getDailyTimeSlots(
  availability: BookingAvailability[],
  dayOfWeek: number,
  slotDuration: number,
  appointments: BookingAppointment[],
): string[] {
  const parsedDuration = Math.floor(slotDuration);
  const step = Number.isFinite(parsedDuration) && parsedDuration > 0 ? parsedDuration : 30;
  const slots = new Set(appointments.map((appointment) => appointment.start_time.slice(0, 5)));

  availability.forEach((schedule) => {
    if (!schedule.active || schedule.day_of_week !== dayOfWeek) return;

    const start = parseTime(schedule.start_time);
    const end = parseTime(schedule.end_time);
    const breakStart = schedule.break_start_time ? parseTime(schedule.break_start_time) : null;
    const breakEnd = schedule.break_end_time ? parseTime(schedule.break_end_time) : null;
    if (start === null || end === null || start >= end) return;

    for (let time = start; time + step <= end; time += step) {
      const overlapsBreak =
        breakStart !== null && breakEnd !== null && time < breakEnd && time + step > breakStart;
      if (!overlapsBreak) slots.add(formatTime(time));
    }
  });

  return [...slots].sort();
}

function parseTime(value: string): number | null {
  const [hours, minutes] = value.slice(0, 5).split(':').map(Number);
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`;
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getStartDate(date: Date, viewType: ViewType): string {
  const d = new Date(date);
  if (viewType === 'day') {
    return toDateKey(d);
  } else if (viewType === 'week') {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return toDateKey(d);
  } else {
    d.setDate(1);
    return toDateKey(d);
  }
}

function getEndDate(date: Date, viewType: ViewType): string {
  const d = new Date(date);
  if (viewType === 'day') {
    return toDateKey(d);
  } else if (viewType === 'week') {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) + 6;
    d.setDate(diff);
    return toDateKey(d);
  } else {
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    return toDateKey(d);
  }
}

function formatDateRange(date: Date, viewType: ViewType): string {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long' };
  if (viewType === 'day') {
    options.day = 'numeric';
  } else if (viewType === 'week') {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    const end = new Date(start);
    end.setDate(diff + 6);
    return `${start.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }
  return date.toLocaleDateString('pt-BR', options);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}
