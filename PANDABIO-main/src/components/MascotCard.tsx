import React from 'react';
import { PANDABIO_ASSETS } from '../constants/assets';
import { ArrowRight } from 'lucide-react';

interface MascotCardProps {
  onOpenReport: () => void;
  hasActivity?: boolean;
}

export const MascotCard: React.FC<MascotCardProps> = ({ onOpenReport, hasActivity = false }) => {
  return (
    <div
      id="card-mascot-performance"
      className="relative overflow-hidden bg-gradient-to-b from-white to-[#f2f3ff] rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] border border-[#eaedff]/60 flex flex-col justify-between"
    >
      <div className="flex flex-col items-center text-center">
        <div className="relative w-32 sm:w-36 h-32 sm:h-36 mb-2 flex items-center justify-center">
          <div className="absolute inset-0 bg-[#FF7A00]/20 rounded-full blur-xl transform scale-90 pointer-events-none" />
          <img
            src={PANDABIO_ASSETS.mascot3D}
            alt="Mascote 3D oficial PandaBio"
            className="relative z-10 w-full h-full object-contain filter drop-shadow-md hover:scale-105 transition-transform duration-300 pointer-events-none select-none"
          />
        </div>

        <h2 className="text-base font-bold text-[#131b2e] leading-tight">
          {hasActivity ? 'Sua página está no ar!' : 'Sua página está pronta!'}
        </h2>
        <p className="text-xs text-[#464555] mt-1.5 leading-snug">
          {hasActivity
            ? 'Acompanhe as métricas de cliques, leads e conversões nos relatórios.'
            : 'Adicione seus links oficiais e compartilhe sua bio para começar a captar leads e conversões.'}
        </p>
      </div>

      <div className="mt-4">
        <button
          type="button"
          id="btn-view-detailed-report"
          onClick={onOpenReport}
          className="w-full py-2.5 px-4 rounded-xl bg-[#FF7A00] hover:bg-[#e56e00] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-[0_4px_14px_0_rgba(255,122,0,0.3)] cursor-pointer"
        >
          <span>Ver relatório analítico</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
