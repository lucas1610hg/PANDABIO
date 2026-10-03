import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle,
  Plus,
  Search,
  Calendar,
  User,
  Scissors,
  CheckCircle,
  XCircle,
  Clock,
  X,
} from 'lucide-react';
import {
  AppointmentService,
  ProfessionalService,
  ServiceService,
} from '../../supabase/services/agendamentoService';
import {
  BookingAppointment,
  BookingWorkspace,
  BookingProfessional,
  BookingService,
  BookingStatus,
  CreateBookingData,
} from '../../types_agendamentos';

interface AgendamentosReservasProps {
  workspace: BookingWorkspace | null;
}

export const AgendamentosReservas: React.FC<AgendamentosReservasProps> = ({ workspace }) => {
  const [appointments, setAppointments] = useState<BookingAppointment[]>([]);
  const [professionals, setProfessionals] = useState<BookingProfessional[]>([]);
  const [services, setServices] = useState<BookingService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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
        setLoading(false);
        return;
      }

      // Buscar dados em paralelo
      const [appointmentsData, professionalsData, servicesData] = await Promise.all([
        AppointmentService.getAppointments(workspace.id, {
          professional_id: selectedProfessional || undefined,
          service_id: selectedService || undefined,
          status: selectedStatus ? [selectedStatus] : undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        }),
        ProfessionalService.getProfessionals(workspace.id),
        ServiceService.getServices(workspace.id),
      ]);

      setAppointments(appointmentsData);
      setProfessionals(professionalsData);
      setServices(servicesData);
    } catch (err) {
      setError('Erro ao carregar reservas');
      console.error('Error loading appointments:', err);
    } finally {
      setLoading(false);
    }
  }, [workspace, selectedProfessional, selectedService, selectedStatus, startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const handleOpenBookingModal = () => {
    setBookingForm({
      client_name: '',
      client_email: '',
      client_phone: '',
      service_id: '',
      professional_id: selectedProfessional || '',
      date: startDate || new Date().toISOString().split('T')[0],
      start_time: '09:00',
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
      case 'expired':
        return 'bg-gray-100 text-gray-700 border-gray-200';
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
      case 'expired':
        return 'Expirado';
      default:
        return status;
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      appointment.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (appointment.professional_name &&
        appointment.professional_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (appointment.client &&
        appointment.client.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
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
        <AlertCircle className="w-12 h-12 text-gray-400" />
        <p className="text-sm text-gray-600">Nenhum workspace configurado</p>
        <p className="text-xs text-gray-400">
          Execute os dados de teste para criar um workspace automaticamente
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#131b2e]">Reservas</h2>
          <p className="text-sm text-gray-500 mt-1">{appointments.length} reserva(s)</p>
        </div>
        <button
          type="button"
          onClick={handleOpenBookingModal}
          className="flex items-center gap-2 px-4 py-2 bg-[#FF7A00] text-white rounded-lg text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          Nova Reserva
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar reservas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedProfessional(null);
              setSelectedService(null);
              setSelectedStatus(null);
              setStartDate('');
              setEndDate('');
            }}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium"
          >
            Limpar Filtros
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Profissional</label>
            <select
              value={selectedProfessional || ''}
              onChange={(e) => setSelectedProfessional(e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
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
            <label className="block text-xs font-medium text-gray-500 mb-1">Serviço</label>
            <select
              value={selectedService || ''}
              onChange={(e) => setSelectedService(e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
            >
              <option value="">Todos</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={selectedStatus || ''}
              onChange={(e) => setSelectedStatus((e.target.value || null) as BookingStatus | null)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
            >
              <option value="">Todos</option>
              <option value="pending">Pendente</option>
              <option value="confirmed">Confirmado</option>
              <option value="in_progress">Em Atendimento</option>
              <option value="completed">Concluído</option>
              <option value="cancelled">Cancelado</option>
              <option value="no_show">Não Compareceu</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Data Início</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Data Fim</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 bg-white rounded-2xl border border-gray-200">
          <AlertCircle className="w-12 h-12 text-gray-400" />
          <p className="text-sm text-gray-600">
            {searchTerm || selectedProfessional || selectedService || selectedStatus
              ? 'Nenhuma reserva encontrada'
              : 'Nenhuma reserva cadastrada'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                  Data/Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Serviço</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                  Profissional
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAppointments.map((appointment) => (
                <tr key={appointment.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-[#131b2e]">
                          {new Date(appointment.date).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-xs text-gray-500">{appointment.start_time}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-[#131b2e]">
                        {appointment.client?.name || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Scissors className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-[#131b2e]">{appointment.service_name}</p>
                        <p className="text-xs text-gray-500">{appointment.service_duration} min</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-[#131b2e]">{appointment.professional_name}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(appointment.status)}`}
                    >
                      {getStatusLabel(appointment.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {appointment.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                            className="p-1 hover:bg-emerald-100 rounded"
                            title="Confirmar"
                          >
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                            className="p-1 hover:bg-red-100 rounded"
                            title="Cancelar"
                          >
                            <XCircle className="w-4 h-4 text-red-500" />
                          </button>
                        </>
                      )}
                      {appointment.status === 'confirmed' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(appointment.id, 'in_progress')}
                            className="p-1 hover:bg-blue-100 rounded"
                            title="Iniciar"
                          >
                            <Clock className="w-4 h-4 text-blue-500" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                            className="p-1 hover:bg-red-100 rounded"
                            title="Cancelar"
                          >
                            <XCircle className="w-4 h-4 text-red-500" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(appointment.id, 'no_show')}
                            className="p-1 hover:bg-orange-100 rounded"
                            title="Não compareceu"
                          >
                            <AlertCircle className="w-4 h-4 text-orange-500" />
                          </button>
                        </>
                      )}
                      {appointment.status === 'in_progress' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(appointment.id, 'completed')}
                            className="p-1 hover:bg-purple-100 rounded"
                            title="Concluir"
                          >
                            <CheckCircle className="w-4 h-4 text-purple-500" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(appointment.id, 'no_show')}
                            className="p-1 hover:bg-orange-100 rounded"
                            title="Não compareceu"
                          >
                            <AlertCircle className="w-4 h-4 text-orange-500" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#131b2e]">Nova Reserva</h3>
              <button
                type="button"
                onClick={handleCloseBookingModal}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#131b2e] mb-1">Data e Hora</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    required
                    value={bookingForm.date}
                    onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                  />
                  <input
                    type="time"
                    required
                    value={bookingForm.start_time}
                    onChange={(e) => setBookingForm({ ...bookingForm, start_time: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#131b2e] mb-1">Serviço *</label>
                <select
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
                <label className="block text-sm font-medium text-[#131b2e] mb-1">
                  Profissional *
                </label>
                <select
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
                <label className="block text-sm font-medium text-[#131b2e] mb-1">
                  Nome do Cliente *
                </label>
                <input
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
                  <label className="block text-sm font-medium text-[#131b2e] mb-1">Email</label>
                  <input
                    type="email"
                    value={bookingForm.client_email}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, client_email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#131b2e] mb-1">Telefone</label>
                  <input
                    type="tel"
                    value={bookingForm.client_phone}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, client_phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#131b2e] mb-1">Observações</label>
                <textarea
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
        </div>
      )}
    </div>
  );
};
