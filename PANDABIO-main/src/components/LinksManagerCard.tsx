import React, { memo, useState } from 'react';
import toast from 'react-hot-toast';
import { ListFilter, GripVertical, Plus } from 'lucide-react';
import { BioLink } from '../types';
import { getLinkIcon, getLinkIconBg } from '../utils/iconMapper';
import { Card } from './Card';

interface LinksManagerCardProps {
  links: BioLink[];
  onToggleLink: (id: string) => void;
  onAddLink: () => void;
  onReorder?: (reordered: BioLink[]) => void;
}

export const LinksManagerCard = memo<LinksManagerCardProps>(
  ({ links, onToggleLink, onAddLink, onReorder }) => {
    const [reorderMode, setReorderMode] = useState(false);
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [overIndex, setOverIndex] = useState<number | null>(null);

    const handleDrop = () => {
      if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex && onReorder) {
        const reordered = [...links];
        const [moved] = reordered.splice(dragIndex, 1);
        reordered.splice(overIndex, 0, moved);
        onReorder(reordered);
        toast.success('Ordem dos links atualizada');
      }
      setDragIndex(null);
      setOverIndex(null);
      setReorderMode(false);
    };

    return (
      <Card
        id="card-user-links"
        icon={<ListFilter aria-hidden="true" className="w-4 h-4" />}
        title="Seus links"
        subtitle="Links que você compartilha"
        headerClassName="pb-3"
        headerRight={
          <span className="px-2 py-0.5 rounded-full bg-[#f2f3ff] text-[#464555] text-[10px] font-bold">
            {links.filter((l) => l.active).length} ativos
          </span>
        }
        bodyClassName="mt-1"
        footer={
          <>
            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={onAddLink}
                className="flex-1 py-2 px-3 rounded-xl bg-[#f2f3ff] hover:bg-[#eaedff] text-[#3525cd] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus aria-hidden="true" className="w-3.5 h-3.5" />
                <span>Adicionar link</span>
              </button>
              {links.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setReorderMode(!reorderMode);
                    setDragIndex(null);
                    setOverIndex(null);
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                    reorderMode
                      ? 'bg-[#3525cd] text-white'
                      : 'bg-[#f2f3ff] hover:bg-[#eaedff] text-[#464555]'
                  }`}
                  title={reorderMode ? 'Concluir reordenação' : 'Arraste para reordenar'}
                >
                  <GripVertical aria-hidden="true" className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{reorderMode ? 'Concluir' : 'Reordenar'}</span>
                </button>
              )}
            </div>
            {reorderMode && (
              <p className="text-[10px] text-[#777587] mt-2 text-center">
                Arraste os links para definir a ordem de exibição na bio.
              </p>
            )}
          </>
        }
      >
        <div className="flex flex-col gap-2">
          {links.length > 0 ? (
            links.map((link, index) => {
              const Icon = getLinkIcon(link.type);
              return (
                <div
                  key={link.id}
                  draggable={reorderMode}
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => {
                    if (reorderMode) {
                      e.preventDefault();
                      setOverIndex(index);
                    }
                  }}
                  onDrop={handleDrop}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setOverIndex(null);
                  }}
                  className={`flex items-center justify-between p-2 rounded-xl transition-all ${
                    link.active ? 'bg-[#f2f3ff] hover:bg-[#eaedff]' : 'bg-gray-50 opacity-60'
                  } ${reorderMode ? 'cursor-grab active:cursor-grabbing' : ''} ${
                    dragIndex === index ? 'opacity-40' : ''
                  } ${
                    overIndex === index && dragIndex !== index && reorderMode
                      ? 'ring-2 ring-[#3525cd]'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {reorderMode && (
                      <GripVertical
                        aria-hidden="true"
                        className="w-4 h-4 text-[#c7c4d8] shrink-0"
                      />
                    )}
                    <div
                      className={`w-7 h-7 rounded-lg ${getLinkIconBg(
                        link.type,
                      )} flex items-center justify-center shrink-0`}
                    >
                      <Icon className="w-4 h-4" />
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

                    <button
                      type="button"
                      onClick={() => onToggleLink(link.id)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        link.active ? 'bg-[#3525cd]' : 'bg-[#c7c4d8]'
                      }`}
                      title={link.active ? 'Desativar link' : 'Ativar link'}
                      aria-label={
                        link.active ? `Desativar link ${link.title}` : `Ativar link ${link.title}`
                      }
                      role="switch"
                      aria-checked={link.active}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          link.active ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })
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
      </Card>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.links.length === nextProps.links.length &&
      prevProps.links.every((link, i) => {
        const next = nextProps.links[i];
        return (
          !!next &&
          link.id === next.id &&
          link.active === next.active &&
          link.title === next.title &&
          link.url === next.url &&
          link.clicks === next.clicks &&
          link.leads === next.leads
        );
      })
    );
  },
);
