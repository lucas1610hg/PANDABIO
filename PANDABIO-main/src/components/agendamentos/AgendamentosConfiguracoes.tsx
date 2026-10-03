import React, { useState, useEffect, useCallback } from 'react';
import { Settings, Save, RefreshCw } from 'lucide-react';
import { SettingsService } from '../../supabase/services/agendamentoService';
import { BookingSettings, BookingWorkspace } from '../../types_agendamentos';

interface AgendamentosConfiguracoesProps {
  workspace: BookingWorkspace | null;
}

export const AgendamentosConfiguracoes: React.FC<AgendamentosConfiguracoesProps> = ({ workspace }) => {
  const [settings, setSettings] = useState<BookingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    default_slot_duration: 30,
    min_advance_booking: 0,
    max_advance_booking: 90,
    allow_cancellations: true,
    cancellation_hours: 24,
    cancellation_policy: '',
    require_deposit: false,
    deposit_percentage: 10,
    deposit_fixed_amount: 0,
    payment_methods: ['cash', 'card'],
    enable_reminders: true,
    reminder_hours: [24],
    reminder_template: '',
    enable_auto_confirm: false,
    require_phone: true,
    require_email: true,
    buffer_time: 0,
    max_daily_bookings: null as number | null,
    max_weekly_bookings: null as number | null,
    no_show_limit: 3,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!workspace) {
        setSettings(null);
        setLoading(false);
        return;
      }

      // Buscar configurações
      const settingsData = await SettingsService.getSettings(workspace.id);
      if (settingsData) {
        setSettings(settingsData);
        setFormData({
          default_slot_duration: settingsData.default_slot_duration,
          min_advance_booking: settingsData.min_advance_booking,
          max_advance_booking: settingsData.max_advance_booking,
          allow_cancellations: settingsData.allow_cancellations,
          cancellation_hours: settingsData.cancellation_hours,
          cancellation_policy: settingsData.cancellation_policy || '',
          require_deposit: settingsData.require_deposit,
          deposit_percentage: settingsData.deposit_percentage,
          deposit_fixed_amount: settingsData.deposit_fixed_amount || 0,
          payment_methods: settingsData.payment_methods,
          enable_reminders: settingsData.enable_reminders,
          reminder_hours: settingsData.reminder_hours,
          reminder_template: settingsData.reminder_template || '',
          enable_auto_confirm: settingsData.enable_auto_confirm,
          require_phone: settingsData.require_phone,
          require_email: settingsData.require_email,
          buffer_time: settingsData.buffer_time,
          max_daily_bookings: settingsData.max_daily_bookings,
          max_weekly_bookings: settingsData.max_weekly_bookings,
          no_show_limit: settingsData.no_show_limit,
        });
      }
    } catch (err) {
      setError('Erro ao carregar configurações');
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const success = await SettingsService.updateSettings(workspace.id, formData);
      if (!success) {
        throw new Error('Erro ao salvar configurações');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      await loadData();
    } catch (err) {
      setError('Erro ao salvar configurações');
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePaymentMethodToggle = (method: string) => {
    setFormData({
      ...formData,
      payment_methods: formData.payment_methods.includes(method)
        ? formData.payment_methods.filter((m) => m !== method)
        : [...formData.payment_methods, method],
    });
  };

  const handleReminderHoursToggle = (hours: number) => {
    setFormData({
      ...formData,
      reminder_hours: formData.reminder_hours.includes(hours)
        ? formData.reminder_hours.filter((h) => h !== hours)
        : [...formData.reminder_hours, hours],
    });
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
        <Settings className="w-12 h-12 text-gray-400" />
        <p className="text-sm text-gray-600">Nenhum workspace configurado</p>
        <p className="text-xs text-gray-400">Execute os dados de teste para criar um workspace automaticamente</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#131b2e]">Configurações</h2>
          <p className="text-sm text-gray-500 mt-1">
            Configure políticas e regras do sistema
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Recarregar
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <p className="text-sm text-emerald-600">Configurações salvas com sucesso!</p>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Agendamento */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-[#131b2e] mb-4">Agendamento</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Duração Padrão (min)</label>
              <input
                type="number"
                min="5"
                step="5"
                value={formData.default_slot_duration}
                onChange={(e) => setFormData({ ...formData, default_slot_duration: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Antecedência Mínima (dias)</label>
              <input
                type="number"
                min="0"
                value={formData.min_advance_booking}
                onChange={(e) => setFormData({ ...formData, min_advance_booking: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Antecedência Máxima (dias)</label>
              <input
                type="number"
                min="0"
                value={formData.max_advance_booking}
                onChange={(e) => setFormData({ ...formData, max_advance_booking: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tempo de Buffer (min)</label>
              <input
                type="number"
                min="0"
                value={formData.buffer_time}
                onChange={(e) => setFormData({ ...formData, buffer_time: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Máximo Diário</label>
              <input
                type="number"
                min="0"
                value={formData.max_daily_bookings || ''}
                onChange={(e) => setFormData({ ...formData, max_daily_bookings: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                placeholder="Ilimitado"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Máximo Semanal</label>
              <input
                type="number"
                min="0"
                value={formData.max_weekly_bookings || ''}
                onChange={(e) => setFormData({ ...formData, max_weekly_bookings: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                placeholder="Ilimitado"
              />
            </div>
          </div>
        </div>

        {/* Cancelamento */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-[#131b2e] mb-4">Cancelamento</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[#131b2e]">Permitir Cancelamentos</label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, allow_cancellations: !formData.allow_cancellations })}
                className={`w-12 h-6 rounded-full relative transition-colors ${
                  formData.allow_cancellations ? 'bg-[#FF7A00]' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    formData.allow_cancellations ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {formData.allow_cancellations && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Horas de Antecedência</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.cancellation_hours}
                    onChange={(e) => setFormData({ ...formData, cancellation_hours: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Política de Cancelamento</label>
                  <textarea
                    value={formData.cancellation_policy}
                    onChange={(e) => setFormData({ ...formData, cancellation_policy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00] resize-none"
                    rows={3}
                    placeholder="Descreva a política de cancelamento"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Depósito */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-[#131b2e] mb-4">Depósito</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[#131b2e]">Requerir Depósito</label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, require_deposit: !formData.require_deposit })}
                className={`w-12 h-6 rounded-full relative transition-colors ${
                  formData.require_deposit ? 'bg-[#FF7A00]' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    formData.require_deposit ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {formData.require_deposit && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Porcentagem (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.deposit_percentage}
                    onChange={(e) => setFormData({ ...formData, deposit_percentage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Valor Fixo (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.deposit_fixed_amount}
                    onChange={(e) => setFormData({ ...formData, deposit_fixed_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pagamento */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-[#131b2e] mb-4">Formas de Pagamento</h3>
          <div className="flex flex-wrap gap-2">
            {['cash', 'card', 'pix', 'transfer'].map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => handlePaymentMethodToggle(method)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.payment_methods.includes(method)
                    ? 'bg-[#3525cd] text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {method === 'cash' && 'Dinheiro'}
                {method === 'card' && 'Cartão'}
                {method === 'pix' && 'PIX'}
                {method === 'transfer' && 'Transferência'}
              </button>
            ))}
          </div>
        </div>

        {/* Requisitos */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-[#131b2e] mb-4">Requisitos do Cliente</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[#131b2e]">Requerir Telefone</label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, require_phone: !formData.require_phone })}
                className={`w-12 h-6 rounded-full relative transition-colors ${
                  formData.require_phone ? 'bg-[#FF7A00]' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    formData.require_phone ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[#131b2e]">Requerir Email</label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, require_email: !formData.require_email })}
                className={`w-12 h-6 rounded-full relative transition-colors ${
                  formData.require_email ? 'bg-[#FF7A00]' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    formData.require_email ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Lembretes */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-[#131b2e] mb-4">Lembretes</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[#131b2e]">Habilitar Lembretes</label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, enable_reminders: !formData.enable_reminders })}
                className={`w-12 h-6 rounded-full relative transition-colors ${
                  formData.enable_reminders ? 'bg-[#FF7A00]' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    formData.enable_reminders ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {formData.enable_reminders && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Horas Antes do Agendamento</label>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 4, 8, 12, 24, 48].map((hours) => (
                      <button
                        key={hours}
                        type="button"
                        onClick={() => handleReminderHoursToggle(hours)}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                          formData.reminder_hours.includes(hours)
                            ? 'bg-[#3525cd] text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {hours}h
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Template de Mensagem</label>
                  <textarea
                    value={formData.reminder_template}
                    onChange={(e) => setFormData({ ...formData, reminder_template: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00] resize-none"
                    rows={3}
                    placeholder="Template para mensagem de lembrete"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Auto Confirmação */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-[#131b2e] mb-4">Auto Confirmação</h3>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[#131b2e]">Confirmar Automaticamente</label>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, enable_auto_confirm: !formData.enable_auto_confirm })}
              className={`w-12 h-6 rounded-full relative transition-colors ${
                formData.enable_auto_confirm ? 'bg-[#FF7A00]' : 'bg-gray-200'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  formData.enable_auto_confirm ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* No-Show */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-[#131b2e] mb-4">Limite de No-Show</h3>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Número Máximo Antes de Bloquear</label>
            <input
              type="number"
              min="0"
              value={formData.no_show_limit}
              onChange={(e) => setFormData({ ...formData, no_show_limit: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-[#FF7A00] text-white rounded-lg text-sm font-semibold disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </form>
    </div>
  );
};
