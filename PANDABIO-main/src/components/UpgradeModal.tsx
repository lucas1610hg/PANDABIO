import React from 'react';
import { X, Check, Sparkles } from 'lucide-react';
import { PANDABIO_ASSETS } from '../constants/assets';
import { Modal } from './Modal';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgradeSuccess: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  onUpgradeSuccess,
}) => {
  if (!isOpen) return null;

  const features = [
    'Domínio próprio personalizado (ex: seunome.com.br)',
    'Links e botões ilimitados com animação de destaque',
    'Pixel do Meta (Facebook & Instagram) e Google Analytics integrados',
    'Captura de leads com exportação automática para CRM e WhatsApp',
    'Analytics detalhado de produtos e cliques',
    'Mascote 3D e temas exclusivos PandaBio',
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} titleId="upgrade-modal-title">
      {/* Top Header with Dark Panda Gradient */}
      <div
        className="p-6 text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0e1017 0%, #1a1b24 100%)',
        }}
      >
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#FF7A00]/25 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <img
              src={PANDABIO_ASSETS.logoDark}
              alt="PandaBio"
              className="h-7 w-auto object-contain"
            />
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase bg-[#FF7A00] text-white">
              PRO
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar modal de upgrade"
            className="p-1.5 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X aria-hidden="true" className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 relative z-10">
          <h2 id="upgrade-modal-title" className="text-2xl font-extrabold tracking-tight">
            Evolua sua Bio para o nível profissional
          </h2>
          <p className="text-xs text-gray-300 mt-1">
            Todas as ferramentas que você precisa para multiplicar suas conversões.
          </p>
        </div>
      </div>

      {/* Plan card & benefits */}
      <div className="p-6 space-y-5">
        <div className="p-4 rounded-2xl bg-[#FFF3E6] border border-[#FF7A00]/30 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#FF7A00] uppercase tracking-wider block">
              Plano Anual Especial
            </span>
            <span className="text-2xl font-black text-[#131b2e]">
              R$ 19,90 <span className="text-xs font-semibold text-gray-500">/mês</span>
            </span>
          </div>
          <span className="px-3 py-1 bg-[#FF7A00] text-white rounded-full text-xs font-bold shadow-xs">
            Economize 40%
          </span>
        </div>

        {/* Benefits list */}
        <div className="space-y-2.5">
          {features.map((f, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-700">
              <div className="w-4 h-4 rounded-full bg-[#10B981]/20 text-[#10B981] flex items-center justify-center shrink-0 mt-0.5">
                <Check aria-hidden="true" className="w-3 h-3" />
              </div>
              <span>{f}</span>
            </div>
          ))}
        </div>

        {/* Action button */}
        <button
          type="button"
          onClick={() => {
            onUpgradeSuccess();
            onClose();
          }}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#FF7A00] to-[#FF5500] hover:brightness-110 active:scale-[0.99] text-white text-sm font-bold shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Sparkles aria-hidden="true" className="w-4 h-4" />
          <span>Ativar PandaBio PRO Agora</span>
        </button>
      </div>
    </Modal>
  );
};
