import React, { useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  Clock3,
  Cog,
  ContactRound,
  Scissors,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { AgendamentoSection } from '../../types_agendamentos';
import { BookingWorkspace } from '../../types_agendamentos';
import { WorkspaceService } from '../../supabase/services/agendamentoService';
import { AgendamentosVisaoGeral } from './AgendamentosVisaoGeral';
import { AgendamentosAgenda } from './AgendamentosAgenda';
import { AgendamentosServicos } from './AgendamentosServicos';
import { AgendamentosProfissionais } from './AgendamentosProfissionais';
import { AgendamentosDisponibilidade } from './AgendamentosDisponibilidade';
import { AgendamentosClientes } from './AgendamentosClientes';
import { AgendamentosReservas } from './AgendamentosReservas';
import { AgendamentosConfiguracoes } from './AgendamentosConfiguracoes';

export const AgendamentosSection: React.FC = () => {
  const [activeSubSection, setActiveSubSection] = useState<AgendamentoSection>('visao-geral');
  const [workspace, setWorkspace] = useState<BookingWorkspace | null>(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);

  const handleSectionChange = (section: AgendamentoSection) => {
    setActiveSubSection(section);
  };

  const loadWorkspace = useCallback(async () => {
    try {
      setWorkspaceLoading(true);
      setWorkspaceError(null);
      const workspaces = await WorkspaceService.getWorkspaces();
      setWorkspace(workspaces[0] || null);
    } catch (error) {
      console.error('Error loading booking workspace:', error);
      setWorkspaceError('Erro ao carregar agendamentos');
    } finally {
      setWorkspaceLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const subSections = [
    {
      id: 'visao-geral' as AgendamentoSection,
      label: 'Visão geral',
      description: 'Resumo e próximos passos',
      icon: BarChart3,
    },
    {
      id: 'agenda' as AgendamentoSection,
      label: 'Agenda',
      description: 'Visualize seus horários',
      icon: CalendarDays,
    },
    {
      id: 'servicos' as AgendamentoSection,
      label: 'Serviços',
      description: 'Catálogo e preços',
      icon: Scissors,
    },
    {
      id: 'profissionais' as AgendamentoSection,
      label: 'Profissionais',
      description: 'Equipe e especialidades',
      icon: UserRound,
    },
    {
      id: 'disponibilidade' as AgendamentoSection,
      label: 'Disponibilidade',
      description: 'Dias, horários e bloqueios',
      icon: Clock3,
    },
    {
      id: 'clientes' as AgendamentoSection,
      label: 'Clientes',
      description: 'Cadastro e histórico',
      icon: ContactRound,
    },
    {
      id: 'reservas' as AgendamentoSection,
      label: 'Reservas',
      description: 'Status e pagamentos',
      icon: UsersRound,
    },
    {
      id: 'configuracoes' as AgendamentoSection,
      label: 'Configurações',
      description: 'Regras e preferências',
      icon: Cog,
    },
  ];

  const renderActiveContent = () => {
    if (workspaceLoading) {
      return (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-gray-200 bg-white">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#FF7A00]" />
        </div>
      );
    }

    if (workspaceError) {
      return (
        <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 rounded-2xl border border-red-100 bg-white">
          <p className="text-sm text-red-600">{workspaceError}</p>
          <button
            type="button"
            onClick={loadWorkspace}
            className="rounded-lg bg-[#FF7A00] px-4 py-2 text-sm font-semibold text-white"
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    switch (activeSubSection) {
      case 'agenda':
        return <AgendamentosAgenda workspace={workspace} />;
      case 'servicos':
        return <AgendamentosServicos workspace={workspace} />;
      case 'profissionais':
        return <AgendamentosProfissionais workspace={workspace} />;
      case 'disponibilidade':
        return <AgendamentosDisponibilidade workspace={workspace} />;
      case 'clientes':
        return <AgendamentosClientes workspace={workspace} />;
      case 'reservas':
        return <AgendamentosReservas workspace={workspace} />;
      case 'configuracoes':
        return <AgendamentosConfiguracoes workspace={workspace} />;
      case 'visao-geral':
      default:
        return <AgendamentosVisaoGeral workspace={workspace} onNavigate={handleSectionChange} />;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-6 sm:py-10 px-4 sm:px-6 lg:px-8 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#131b2e] tracking-tight">
            Agendamentos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie serviços, profissionais e reservas de agendamentos.
          </p>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="bg-white rounded-2xl border border-gray-200 p-2 mb-6 shadow-sm">
        <nav
          className="grid grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-8"
          aria-label="Seções de agendamentos"
        >
          {subSections.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSectionChange(item.id)}
                aria-current={activeSubSection === item.id ? 'page' : undefined}
                className={`group flex min-h-[68px] items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors ${
                  activeSubSection === item.id
                    ? 'bg-[#FF7A00] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-bold">{item.label}</span>
                  <span
                    className={`mt-0.5 block truncate text-[10px] ${
                      activeSubSection === item.id ? 'text-white/80' : 'text-gray-400'
                    }`}
                  >
                    {item.description}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div>{renderActiveContent()}</div>
    </div>
  );
};
