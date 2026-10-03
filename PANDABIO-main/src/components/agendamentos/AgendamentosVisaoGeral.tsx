import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Users, Clock, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { StatsService } from '../../supabase/services/agendamentoService';
import { AgendamentoSection, BookingStats, BookingWorkspace } from '../../types_agendamentos';

interface AgendamentosVisaoGeralProps {
  workspace: BookingWorkspace | null;
  onNavigate?: (section: AgendamentoSection) => void;
}

export const AgendamentosVisaoGeral: React.FC<AgendamentosVisaoGeralProps> = ({
  workspace,
  onNavigate,
}) => {
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!workspace) {
        setStats(null);
        setLoading(false);
        return;
      }

      // Buscar estatísticas
      const statsData = await StatsService.getWorkspaceStats(workspace.id);
      setStats(statsData);
    } catch (err) {
      setError('Erro ao carregar dados');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7A00]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-sm text-gray-600">{error}</p>
        <button
          type="button"
          onClick={loadData}
          className="px-4 py-2 bg-[#FF7A00] text-white rounded-lg text-sm font-semibold"
        >
          Tentar novamente
        </button>
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

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Calendar className="w-12 h-12 text-gray-400" />
        <p className="text-sm text-gray-600">Nenhuma estatística disponível</p>
      </div>
    );
  }

  const averageBookingValue =
    stats.total_appointments > 0 ? stats.total_revenue / stats.total_appointments : 0;

  const setupSteps = [
    {
      title: 'Cadastrar serviços',
      description: 'Defina nome, duração e preço.',
      section: 'servicos' as AgendamentoSection,
      done: stats.active_services > 0,
    },
    {
      title: 'Cadastrar profissionais',
      description: 'Monte sua equipe e especialidades.',
      section: 'profissionais' as AgendamentoSection,
      done: stats.active_professionals > 0,
    },
    {
      title: 'Configurar disponibilidade',
      description: 'Escolha dias, horários, pausas e bloqueios.',
      section: 'disponibilidade' as AgendamentoSection,
      done: false,
    },
    {
      title: 'Acompanhar agenda',
      description: 'Gerencie reservas e status dos atendimentos.',
      section: 'agenda' as AgendamentoSection,
      done: stats.total_appointments > 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#f2f3ff] flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#3525cd]" />
            </div>
            <span className="text-xs font-semibold text-gray-500">Total</span>
          </div>
          <p className="text-2xl font-extrabold text-[#131b2e]">{stats.total_appointments}</p>
          <p className="text-xs text-gray-500 mt-1">Agendamentos</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs font-semibold text-gray-500">Confirmados</span>
          </div>
          <p className="text-2xl font-extrabold text-[#131b2e]">{stats.confirmed_appointments}</p>
          <p className="text-xs text-gray-500 mt-1">{stats.pending_appointments} pendentes</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-[#FF7A00]" />
            </div>
            <span className="text-xs font-semibold text-gray-500">Receita</span>
          </div>
          <p className="text-2xl font-extrabold text-[#131b2e]">
            R$ {stats.total_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Média: R$ {averageBookingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-gray-500">Ocupação</span>
          </div>
          <p className="text-2xl font-extrabold text-[#131b2e]">
            {stats.occupancy_rate.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Taxa de cancelamento: {stats.cancellation_rate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-sm font-bold text-[#131b2e] mb-4">Status dos Agendamentos</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="text-sm text-gray-600">Pendentes</span>
              </div>
              <span className="text-sm font-semibold text-[#131b2e]">
                {stats.pending_appointments}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-sm text-gray-600">Confirmados</span>
              </div>
              <span className="text-sm font-semibold text-[#131b2e]">
                {stats.confirmed_appointments}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-gray-600">Concluídos</span>
              </div>
              <span className="text-sm font-semibold text-[#131b2e]">
                {stats.completed_appointments}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm text-gray-600">Cancelados</span>
              </div>
              <span className="text-sm font-semibold text-[#131b2e]">
                {stats.cancelled_appointments}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-sm font-bold text-[#131b2e] mb-4">Métricas de Desempenho</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Taxa de No-Show</span>
              </div>
              <span
                className={`text-sm font-semibold ${stats.no_show_rate > 10 ? 'text-red-500' : 'text-[#131b2e]'}`}
              >
                {stats.no_show_rate.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Taxa de Cancelamento</span>
              </div>
              <span
                className={`text-sm font-semibold ${stats.cancellation_rate > 15 ? 'text-red-500' : 'text-[#131b2e]'}`}
              >
                {stats.cancellation_rate.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Taxa de Ocupação</span>
              </div>
              <span className="text-sm font-semibold text-[#131b2e]">
                {stats.occupancy_rate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#3525cd]/20 bg-gradient-to-r from-[#f2f3ff] to-[#eaedff] p-6">
        <div className="mb-5 flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3525cd]">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#131b2e]">Configure sua operação</h3>
            <p className="mt-1 text-xs text-gray-600">
              Complete estas etapas para começar a receber reservas sem conflito de horários.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {setupSteps.map((step, index) => (
            <button
              key={step.section}
              type="button"
              onClick={() => onNavigate?.(step.section)}
              className="flex items-start gap-3 rounded-xl border border-white/80 bg-white/80 p-4 text-left transition-colors hover:bg-white"
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  step.done ? 'bg-emerald-100 text-emerald-700' : 'bg-[#3525cd] text-white'
                }`}
              >
                {step.done ? '✓' : index + 1}
              </span>
              <span>
                <span className="block text-xs font-bold text-[#131b2e]">{step.title}</span>
                <span className="mt-1 block text-xs text-gray-500">{step.description}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
