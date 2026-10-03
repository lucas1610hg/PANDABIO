import React from 'react';
import { X, TrendingUp, CheckCircle2 } from 'lucide-react';
import { PANDABIO_ASSETS } from '../constants/assets';
import { BioLink, LeadItem } from '../types';
import { Modal } from './Modal';

interface DetailedReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  links?: BioLink[];
  leads?: LeadItem[];
}

export const DetailedReportModal: React.FC<DetailedReportModalProps> = ({
  isOpen,
  onClose,
  links = [],
  leads = [],
}) => {
  if (!isOpen) return null;

  const totalClicks = links.reduce((sum, l) => sum + (l.clicks || 0), 0);
  const totalLeads = leads.length;
  const activeLinks = links.filter((l) => l.active).length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} titleId="report-modal-title" size="lg">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#faf8ff]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFF3E6] text-[#FF7A00] flex items-center justify-center">
            <TrendingUp aria-hidden="true" className="w-5 h-5" />
          </div>
          <div>
            <h2 id="report-modal-title" className="font-bold text-lg text-[#131b2e]">
              Relatório de Desempenho PandaBio
            </h2>
            <p className="text-xs text-[#464555]">
              Análise de tráfego, cliques e conversões da sua página
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X aria-hidden="true" className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 overflow-y-auto space-y-6">
        {/* Summary Banner with Mascot */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-[#FFF3E6] to-[#f2f3ff] border border-[#FF7A00]/20">
          <img
            src={PANDABIO_ASSETS.mascot3D}
            alt="Mascote 3D"
            className="w-16 h-16 object-contain shrink-0 drop-shadow-sm"
          />
          <div>
            <span className="text-xs font-bold text-[#FF7A00] uppercase tracking-wider">
              Status dos Dados
            </span>
            <h3 className="text-sm sm:text-base font-extrabold text-[#131b2e] leading-snug">
              {totalClicks > 0
                ? `Sua página registrou ${totalClicks} cliques e ${totalLeads} leads reais.`
                : 'Sua página está pronta para receber tráfego e registrar cliques.'}
            </h3>
            <p className="text-xs text-[#464555] mt-0.5">
              Os dados são atualizados conforme seus seguidores interagem com sua bio oficial.
            </p>
          </div>
        </div>

        {/* Stats Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-[#f2f3ff] text-center">
            <span className="text-[11px] text-[#777587] block uppercase font-semibold">
              Links Ativos
            </span>
            <span className="text-xl font-bold text-[#131b2e] mt-1 block">{activeLinks}</span>
            <span className="text-[10px] text-[#464555] font-semibold">
              de {links.length} links
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#f2f3ff] text-center">
            <span className="text-[11px] text-[#777587] block uppercase font-semibold">
              Total de Cliques
            </span>
            <span className="text-xl font-bold text-[#131b2e] mt-1 block">{totalClicks}</span>
            <span className="text-[10px] text-[#464555] font-semibold">Tempo real</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#f2f3ff] text-center">
            <span className="text-[11px] text-[#777587] block uppercase font-semibold">
              Leads Capturados
            </span>
            <span className="text-xl font-bold text-[#131b2e] mt-1 block">{totalLeads}</span>
            <span className="text-[10px] text-[#464555] font-semibold">Contatos recebidos</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#f2f3ff] text-center">
            <span className="text-[11px] text-[#777587] block uppercase font-semibold">
              Dispositivo Principal
            </span>
            <span className="text-xl font-bold text-[#131b2e] mt-1 block">—</span>
            <span className="text-[10px] text-[#464555] font-semibold">
              Sem dados de dispositivo
            </span>
          </div>
        </div>

        {/* Top Recommendations */}
        <div>
          <h3 className="font-bold text-sm text-[#131b2e] mb-2.5">
            Dicas para potencializar sua bio
          </h3>
          <div className="space-y-2">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 text-emerald-950 text-xs border border-emerald-100">
              <CheckCircle2
                aria-hidden="true"
                className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"
              />
              <span>
                Mantenha seu canal de contato principal (como WhatsApp ou direct) entre as primeiras
                opções do topo.
              </span>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 text-blue-950 text-xs border border-blue-100">
              <CheckCircle2 aria-hidden="true" className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Sua bio carrega de forma instantânea em redes sociais sem barreiras intermediárias
                de navegação.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex justify-end">
        <button
          onClick={onClose}
          className="px-5 py-2 bg-[#131b2e] hover:bg-black text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
        >
          Fechar Relatório
        </button>
      </div>
    </Modal>
  );
};
