import React, { useState, useEffect, useCallback } from 'react';
import { Ban, Check, Clock, Edit2, Plus, Trash2 } from 'lucide-react';
import {
  AvailabilityService,
  ProfessionalService,
} from '../../supabase/services/agendamentoService';
import {
  BookingAvailability,
  BookingBlockedSlot,
  BookingProfessional,
  BookingWorkspace,
} from '../../types_agendamentos';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
];

interface AgendamentosDisponibilidadeProps {
  workspace: BookingWorkspace | null;
}

export const AgendamentosDisponibilidade: React.FC<AgendamentosDisponibilidadeProps> = ({ workspace }) => {
  const [professionals, setProfessionals] = useState<BookingProfessional[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [availability, setAvailability] = useState<BookingAvailability[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BookingBlockedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState<BookingAvailability | null>(null);
  const [editingBlocked, setEditingBlocked] = useState<BookingBlockedSlot | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([1]);

  const [availabilityForm, setAvailabilityForm] = useState({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '18:00',
    break_start_time: '',
    break_end_time: '',
    active: true,
  });

  const [blockedForm, setBlockedForm] = useState({
    professional_id: '' as string | null,
    start_date: '',
    end_date: '',
    reason: '',
    blocked_type: 'vacation' as 'vacation' | 'holiday' | 'maintenance' | 'custom',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!workspace) {
        setProfessionals([]);
        setLoading(false);
        return;
      }

      // Buscar profissionais
      const professionalsData = await ProfessionalService.getProfessionals(workspace.id);
      setProfessionals(professionalsData);

      if (!selectedProfessional && professionalsData.length > 0) {
        setSelectedProfessional(professionalsData[0].id);
        return;
      }

      // Buscar disponibilidade e bloqueios se profissional selecionado
      if (selectedProfessional) {
        const [availabilityData, blockedData] = await Promise.all([
          AvailabilityService.getAvailability(selectedProfessional),
          AvailabilityService.getBlockedSlots(selectedProfessional),
        ]);
        setAvailability(availabilityData);
        setBlockedSlots(blockedData);
      } else {
        setAvailability([]);
        setBlockedSlots([]);
      }
    } catch (err) {
      setError('Erro ao carregar disponibilidade');
      console.error('Error loading availability:', err);
    } finally {
      setLoading(false);
    }
  }, [workspace, selectedProfessional]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAvailabilityModal = (avail?: BookingAvailability) => {
    if (avail) {
      setEditingAvailability(avail);
      setAvailabilityForm({
        day_of_week: avail.day_of_week,
        start_time: avail.start_time,
        end_time: avail.end_time,
        break_start_time: avail.break_start_time || '',
        break_end_time: avail.break_end_time || '',
        active: avail.active,
      });
      setSelectedDays([avail.day_of_week]);
    } else {
      setEditingAvailability(null);
      setAvailabilityForm({
        day_of_week: 1,
        start_time: '09:00',
        end_time: '18:00',
        break_start_time: '',
        break_end_time: '',
        active: true,
      });
      setSelectedDays([1]);
    }
    setShowAvailabilityModal(true);
  };

  const handleCloseAvailabilityModal = () => {
    setShowAvailabilityModal(false);
    setEditingAvailability(null);
    setAvailabilityForm({
      day_of_week: 1,
      start_time: '09:00',
      end_time: '18:00',
      break_start_time: '',
      break_end_time: '',
      active: true,
    });
    setSelectedDays([1]);
  };

  const handleDayToggle = (dayOfWeek: number) => {
    if (editingAvailability) {
      setAvailabilityForm((current) => ({ ...current, day_of_week: dayOfWeek }));
      setSelectedDays([dayOfWeek]);
      return;
    }

    setSelectedDays((current) =>
      current.includes(dayOfWeek)
        ? current.filter((day) => day !== dayOfWeek)
        : [...current, dayOfWeek].sort((first, second) => first - second),
    );
  };

  const handleSaveAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace || !selectedProfessional) return;
    setError(null);

    const { start_time, end_time, break_start_time, break_end_time } = availabilityForm;
    if (start_time >= end_time) {
      setError('Horário final deve ser depois do horário inicial.');
      return;
    }

    const hasBreakStart = Boolean(break_start_time);
    const hasBreakEnd = Boolean(break_end_time);
    if (hasBreakStart !== hasBreakEnd) {
      setError('Informe início e fim da pausa.');
      return;
    }

    if (
      hasBreakStart &&
      (!break_start_time ||
        !break_end_time ||
        break_start_time >= break_end_time ||
        break_start_time <= start_time ||
        break_end_time >= end_time)
    ) {
      setError('Pausa deve ficar dentro do horário de trabalho.');
      return;
    }

    if (!editingAvailability && selectedDays.length === 0) {
      setError('Selecione pelo menos um dia da semana.');
      return;
    }

    if (
      editingAvailability &&
      availability.some(
        (item) =>
          item.id !== editingAvailability.id && item.day_of_week === availabilityForm.day_of_week,
      )
    ) {
      setError('Já existe um horário configurado para este dia.');
      return;
    }

    const normalizedAvailabilityForm = {
      ...availabilityForm,
      break_start_time: availabilityForm.break_start_time || null,
      break_end_time: availabilityForm.break_end_time || null,
    };

    try {
      if (editingAvailability) {
        const success = await AvailabilityService.updateAvailability(
          editingAvailability.id,
          normalizedAvailabilityForm,
        );
        if (!success) throw new Error('Erro ao atualizar disponibilidade');
      } else {
        for (const dayOfWeek of selectedDays) {
          const existingAvailability = availability.find((item) => item.day_of_week === dayOfWeek);
          const dayAvailability = { ...normalizedAvailabilityForm, day_of_week: dayOfWeek };

          if (existingAvailability) {
            const success = await AvailabilityService.updateAvailability(
              existingAvailability.id,
              dayAvailability,
            );
            if (!success) throw new Error(`Erro ao atualizar ${DAYS_OF_WEEK[dayOfWeek].label}`);
          } else {
            const newAvailability = await AvailabilityService.createAvailability({
              professional_id: selectedProfessional,
              workspace_id: workspace.id,
              profile_id: workspace.profile_id,
              ...dayAvailability,
            });
            if (!newAvailability) throw new Error(`Erro ao criar ${DAYS_OF_WEEK[dayOfWeek].label}`);
          }
        }
      }
      handleCloseAvailabilityModal();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar disponibilidade');
      console.error('Error saving availability:', err);
    }
  };

  const handleDeleteAvailability = async (availabilityId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta disponibilidade?')) return;

    try {
      const success = await AvailabilityService.deleteAvailability(availabilityId);
      if (!success) throw new Error('Erro ao excluir disponibilidade');
      await loadData();
    } catch (err) {
      setError('Erro ao excluir disponibilidade');
      console.error('Error deleting availability:', err);
    }
  };

  const handleOpenBlockedModal = (blocked?: BookingBlockedSlot) => {
    if (blocked) {
      setEditingBlocked(blocked);
      setBlockedForm({
        professional_id: blocked.professional_id,
        start_date: blocked.start_date,
        end_date: blocked.end_date,
        reason: blocked.reason || '',
        blocked_type: blocked.blocked_type,
      });
    } else {
      setEditingBlocked(null);
      setBlockedForm({
        professional_id: selectedProfessional,
        start_date: '',
        end_date: '',
        reason: '',
        blocked_type: 'vacation',
      });
    }
    setShowBlockedModal(true);
  };

  const handleCloseBlockedModal = () => {
    setShowBlockedModal(false);
    setEditingBlocked(null);
    setBlockedForm({
      professional_id: selectedProfessional,
      start_date: '',
      end_date: '',
      reason: '',
      blocked_type: 'vacation',
    });
  };

  const handleSaveBlocked = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace) return;

    try {
      if (editingBlocked) {
        const success = await AvailabilityService.deleteBlockedSlot(editingBlocked.id);
        if (!success) throw new Error('Erro ao atualizar bloqueio');
      }

      const newBlocked = await AvailabilityService.createBlockedSlot({
        professional_id: blockedForm.professional_id,
        workspace_id: workspace.id,
        profile_id: workspace.profile_id,
        start_date: blockedForm.start_date,
        end_date: blockedForm.end_date,
        reason: blockedForm.reason,
        blocked_type: blockedForm.blocked_type,
      });

      if (!newBlocked) throw new Error('Erro ao criar bloqueio');
      handleCloseBlockedModal();
      await loadData();
    } catch (err) {
      setError('Erro ao salvar bloqueio');
      console.error('Error saving blocked:', err);
    }
  };

  const handleDeleteBlocked = async (blockedId: string) => {
    if (!confirm('Tem certeza que deseja excluir este bloqueio?')) return;

    try {
      const success = await AvailabilityService.deleteBlockedSlot(blockedId);
      if (!success) throw new Error('Erro ao excluir bloqueio');
      await loadData();
    } catch (err) {
      setError('Erro ao excluir bloqueio');
      console.error('Error deleting blocked:', err);
    }
  };

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
        <Clock className="w-12 h-12 text-gray-400" />
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
          <h2 className="text-lg font-bold text-[#131b2e]">Disponibilidade</h2>
          <p className="text-sm text-gray-500 mt-1">Configure horários e bloqueios</p>
        </div>
      </div>

      {/* Professional Selector */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <label className="block text-sm font-medium text-[#131b2e] mb-2">Profissional</label>
        <select
          value={selectedProfessional || ''}
          onChange={(e) => setSelectedProfessional(e.target.value || null)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
        >
          <option value="">Selecione um profissional</option>
          {professionals.map((prof) => (
            <option key={prof.id} value={prof.id}>
              {prof.name}
            </option>
          ))}
        </select>
      </div>

      {selectedProfessional && (
        <>
          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Recurring Availability */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#131b2e]">Horários Recorrentes</h3>
              <button
                type="button"
                onClick={() => handleOpenAvailabilityModal()}
                className="flex items-center gap-2 px-3 py-2 bg-[#FF7A00] text-white rounded-lg text-sm font-semibold"
              >
                <Plus className="w-4 h-4" />
                Adicionar Horário
              </button>
            </div>

            {availability.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Nenhum horário configurado</p>
            ) : (
              <div className="space-y-2">
                {availability.map((avail) => (
                  <div
                    key={avail.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      avail.active
                        ? 'border-gray-200 bg-white'
                        : 'border-gray-200 bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-[#131b2e] w-24">
                        {DAYS_OF_WEEK.find((d) => d.value === avail.day_of_week)?.label}
                      </span>
                      <span className="text-sm text-gray-600">
                        {avail.start_time} - {avail.end_time}
                      </span>
                      {avail.break_start_time && avail.break_end_time && (
                        <span className="text-xs text-gray-500">
                          Pausa: {avail.break_start_time} - {avail.break_end_time}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenAvailabilityModal(avail)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAvailability(avail.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Blocked Slots */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#131b2e]">Bloqueios e Ausências</h3>
              <button
                type="button"
                onClick={() => handleOpenBlockedModal()}
                className="flex items-center gap-2 px-3 py-2 bg-[#3525cd] text-white rounded-lg text-sm font-semibold"
              >
                <Plus className="w-4 h-4" />
                Adicionar Bloqueio
              </button>
            </div>

            {blockedSlots.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Nenhum bloqueio configurado</p>
            ) : (
              <div className="space-y-2">
                {blockedSlots.map((blocked) => (
                  <div
                    key={blocked.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white"
                  >
                    <div className="flex items-center gap-4">
                      <Ban className="w-4 h-4 text-red-500" />
                      <div>
                        <p className="text-sm font-medium text-[#131b2e]">
                          {new Date(blocked.start_date).toLocaleDateString('pt-BR')} -{' '}
                          {new Date(blocked.end_date).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {blocked.blocked_type === 'vacation' && 'Férias'}
                          {blocked.blocked_type === 'holiday' && 'Feriado'}
                          {blocked.blocked_type === 'maintenance' && 'Manutenção'}
                          {blocked.blocked_type === 'custom' && 'Personalizado'}
                          {blocked.reason && ` - ${blocked.reason}`}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteBlocked(blocked.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Availability Modal */}
      {showAvailabilityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-[#131b2e]">
                {editingAvailability ? 'Editar Horário' : 'Novo Horário'}
              </h3>
            </div>

            <form onSubmit={handleSaveAvailability} className="p-6 space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-[#131b2e]">
                    Dias de trabalho
                  </label>
                  {!editingAvailability && (
                    <span className="text-xs text-gray-400">Selecione um ou mais</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {DAYS_OF_WEEK.map((day) => {
                    const selected = selectedDays.includes(day.value);

                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => handleDayToggle(day.value)}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-colors ${
                          selected
                            ? 'border-[#FF7A00] bg-orange-50 text-[#c75f00]'
                            : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span>{day.label}</span>
                        {selected && <Check className="h-4 w-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#131b2e] mb-1">Início</label>
                  <input
                    type="time"
                    required
                    value={availabilityForm.start_time}
                    onChange={(e) =>
                      setAvailabilityForm({ ...availabilityForm, start_time: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#131b2e] mb-1">Fim</label>
                  <input
                    type="time"
                    required
                    value={availabilityForm.end_time}
                    onChange={(e) =>
                      setAvailabilityForm({ ...availabilityForm, end_time: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#131b2e] mb-1">
                    Início Pausa
                  </label>
                  <input
                    type="time"
                    value={availabilityForm.break_start_time}
                    onChange={(e) =>
                      setAvailabilityForm({ ...availabilityForm, break_start_time: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#131b2e] mb-1">Fim Pausa</label>
                  <input
                    type="time"
                    value={availabilityForm.break_end_time}
                    onChange={(e) =>
                      setAvailabilityForm({ ...availabilityForm, break_end_time: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[#131b2e]">Ativo</label>
                <button
                  type="button"
                  onClick={() =>
                    setAvailabilityForm({ ...availabilityForm, active: !availabilityForm.active })
                  }
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    availabilityForm.active ? 'bg-[#FF7A00]' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      availabilityForm.active ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseAvailabilityModal}
                  className="flex-1 px-4 py-2 bg-white text-[#131b2e] rounded-lg text-sm font-semibold border border-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#FF7A00] text-white rounded-lg text-sm font-semibold"
                >
                  {editingAvailability ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Blocked Modal */}
      {showBlockedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-[#131b2e]">
                {editingBlocked ? 'Editar Bloqueio' : 'Novo Bloqueio'}
              </h3>
            </div>

            <form onSubmit={handleSaveBlocked} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#131b2e] mb-1">Tipo</label>
                <select
                  value={blockedForm.blocked_type}
                  onChange={(e) =>
                    setBlockedForm({
                      ...blockedForm,
                      blocked_type: e.target.value as
                        'vacation' | 'holiday' | 'maintenance' | 'custom',
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                >
                  <option value="vacation">Férias</option>
                  <option value="holiday">Feriado</option>
                  <option value="maintenance">Manutenção</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#131b2e] mb-1">
                    Data Início
                  </label>
                  <input
                    type="date"
                    required
                    value={blockedForm.start_date}
                    onChange={(e) => setBlockedForm({ ...blockedForm, start_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#131b2e] mb-1">Data Fim</label>
                  <input
                    type="date"
                    required
                    value={blockedForm.end_date}
                    onChange={(e) => setBlockedForm({ ...blockedForm, end_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#131b2e] mb-1">Motivo</label>
                <input
                  type="text"
                  value={blockedForm.reason}
                  onChange={(e) => setBlockedForm({ ...blockedForm, reason: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                  placeholder="Descrição do bloqueio"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseBlockedModal}
                  className="flex-1 px-4 py-2 bg-white text-[#131b2e] rounded-lg text-sm font-semibold border border-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#3525cd] text-white rounded-lg text-sm font-semibold"
                >
                  {editingBlocked ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
