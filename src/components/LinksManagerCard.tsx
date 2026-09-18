import React from 'react';
import {
  ListFilter,
  Camera,
  MessageCircle,
  Layers,
  ShoppingBag,
  GripVertical,
  Plus,
} from 'lucide-react';
import { BioLink } from '../types';

interface LinksManagerCardProps {
  links: BioLink[];
  onToggleLink: (id: string) => void;
  onAddLink: () => void;
  onReorder?: () => void;
}

export const LinksManagerCard: React.FC<LinksManagerCardProps> = ({
  links,
  onToggleLink,
  onAddLink,
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'social':
        return <Camera className="w-4 h-4 text-[#3525cd]" />;
      case 'whatsapp':
        return <MessageCircle className="w-4 h-4 text-[#006e4b]" />;
      case 'portfolio':
        return <Layers className="w-4 h-4 text-[#4953bc]" />;
      case 'store':
        return <ShoppingBag className="w-4 h-4 text-[#3525cd]" />;
      default:
        return <Camera className="w-4 h-4 text-[#3525cd]" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'social':
        return 'bg-[#dae2fd]';
      case 'whatsapp':
        return 'bg-[#6ffbbe]/40';
      case 'portfolio':
        return 'bg-[#e0e0ff]';
      case 'store':
        return 'bg-[#dae2fd]';
      default:
        return 'bg-[#eaedff]';
    }
  };

  return (
    <div
      id="card-user-links"
      className="flex flex-col justify-between bg-white rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] border border-[#eaedff]/60"
    >
      <div>
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#eaedff] text-[#3525cd] flex items-center justify-center">
              <ListFilter className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <h4 className="text-sm font-bold text-[#131b2e] leading-tight">
                Seus links
              </h4>
              <span className="text-[11px] text-[#464555]">
                Links que você compartilha
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-[#f2f3ff] text-[#464555] text-[10px] font-bold">
            {links.filter((l) => l.active).length} ativos
          </span>
        </div>

        {/* Links Stack */}
        <div className="flex flex-col gap-2 mt-1">
          {links.length > 0 ? (
            links.map((link) => (
              <div
                key={link.id}
                className={`flex items-center justify-between p-2 rounded-xl transition-all ${
                  link.active ? 'bg-[#f2f3ff] hover:bg-[#eaedff]' : 'bg-gray-50 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg ${getIconBg(
                      link.type
                    )} flex items-center justify-center shrink-0`}
                  >
                    {getIcon(link.type)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-[#131b2e] truncate">
                      {link.title}
                    </span>
                    <span className="text-[10px] text-[#777587] truncate max-w-[140px] sm:max-w-[170px]">
                      {link.url.replace(/^https?:\/\//, '')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-[#464555] font-semibold">
                    {link.clicks.toLocaleString('pt-BR')}
                  </span>

                  {/* Custom Styled Switch */}
                  <button
                    type="button"
                    onClick={() => onToggleLink(link.id)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      link.active ? 'bg-[#3525cd]' : 'bg-[#c7c4d8]'
                    }`}
                    title={link.active ? 'Desativar link' : 'Ativar link'}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        link.active ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center rounded-xl bg-[#faf8ff] border border-dashed border-[#eaedff] flex flex-col items-center">
              <span className="text-xs font-medium text-[#777587]">
                Nenhum link cadastrado ainda.
              </span>
              <button
                type="button"
                onClick={onAddLink}
                className="mt-2 text-xs font-bold text-[#3525cd] hover:underline cursor-pointer"
              >
                + Adicionar primeiro link
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-3">
        <button
          type="button"
          onClick={onAddLink}
          className="flex-1 py-2 px-3 rounded-xl bg-[#f2f3ff] hover:bg-[#eaedff] text-[#3525cd] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Adicionar link</span>
        </button>
        {links.length > 1 && (
          <button
            type="button"
            className="py-2 px-3 rounded-xl bg-[#f2f3ff] hover:bg-[#eaedff] text-[#464555] text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
            title="Arraste para reordenar"
          >
            <GripVertical className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reordenar</span>
          </button>
        )}
      </div>
    </div>
  );
};
