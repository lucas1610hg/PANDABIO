import React, { memo, useState, useMemo } from 'react';
import {
  Plus,
  Search,
  GripVertical,
  Link2,
  MousePointerClick,
  Users,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BioLink } from '../types';
import { getLinkIcon, getLinkIconBg } from '../utils/iconMapper';

interface LinksSectionProps {
  links: BioLink[];
  onToggleLink: (id: string) => void;
  onAddLink: () => void;
  onReorder?: (reordered: BioLink[]) => void;
}

type FilterType = 'all' | 'active' | 'inactive';

export const LinksSection: React.FC<LinksSectionProps> = memo(
  ({ links, onToggleLink, onAddLink, onReorder }) => {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<FilterType>('all');
    const [reorderMode, setReorderMode] = useState(false);
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [overIndex, setOverIndex] = useState<number | null>(null);

    /* ── Stats ── */
    const totalClicks = links.reduce((s, l) => s + l.clicks, 0);
    const totalLeads = links.reduce((s, l) => s + l.leads, 0);
    const activeCount = links.filter((l) => l.active).length;

    /* ── Filtered / searched list ── */
    const displayLinks = useMemo(() => {
      let list = links;
      if (filter === 'active') list = list.filter((l) => l.active);
      if (filter === 'inactive') list = list.filter((l) => !l.active);
      if (search.trim()) {
        const q = search.toLowerCase();
        list = list.filter(
          (l) => l.title.toLowerCase().includes(q) || l.url.toLowerCase().includes(q),
        );
      }
      return list;
    }, [links, filter, search]);

    /* ── Drag & drop ── */
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
      <div className="w-full max-w-4xl mx-auto py-6 sm:py-10 px-4 sm:px-6 lg:px-8 pb-24 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#131b2e] tracking-tight">
              Gerenciar Links
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Adicione, organize e acompanhe o desempenho dos seus links.
            </p>
          </div>
          <button
            type="button"
            onClick={onAddLink}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#FF7A00] hover:bg-[#E56E00] text-white rounded-xl text-sm font-bold shadow-sm shadow-[#FF7A00]/30 transition-all hover:-translate-y-0.5 self-start sm:self-auto shrink-0"
          >
            <Plus aria-hidden="true" className="w-4 h-4" />
            Novo Link
          </button>
        </div>

        {/* KPI Summary Bar */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[
            {
              label: 'Total de links',
              value: links.length,
              icon: <Link2 aria-hidden="true" className="w-4 h-4 text-[#3525cd]" />,
              bg: 'bg-[#f2f3ff]',
              text: 'text-[#3525cd]',
            },
            {
              label: 'Total de cliques',
              value: totalClicks.toLocaleString('pt-BR'),
              icon: <MousePointerClick aria-hidden="true" className="w-4 h-4 text-[#FF7A00]" />,
              bg: 'bg-orange-50',
              text: 'text-[#FF7A00]',
            },
            {
              label: 'Total de leads',
              value: totalLeads.toLocaleString('pt-BR'),
              icon: <Users aria-hidden="true" className="w-4 h-4 text-emerald-600" />,
              bg: 'bg-emerald-50',
              text: 'text-emerald-600',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col gap-2"
            >
              <div className={`w-8 h-8 rounded-xl ${stat.bg} flex items-center justify-center`}>
                {stat.icon}
              </div>
              <div>
                <p className={`text-xl font-extrabold ${stat.text}`}>{stat.value}</p>
                <p className="text-[11px] text-gray-500 font-medium">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Filter toolbar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            />
            <input
              type="search"
              placeholder="Buscar por título ou URL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/20 focus:border-[#FF7A00] transition-all"
            />
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Filter aria-hidden="true" className="w-4 h-4 text-gray-400 mr-1" />
            {(['all', 'active', 'inactive'] as FilterType[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filter === f
                    ? 'bg-[#131b2e] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'all'
                  ? `Todos (${links.length})`
                  : f === 'active'
                    ? `Ativos (${activeCount})`
                    : `Inativos (${links.length - activeCount})`}
              </button>
            ))}

            {links.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  setReorderMode(!reorderMode);
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                className={`ml-2 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  reorderMode
                    ? 'bg-[#3525cd] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <GripVertical aria-hidden="true" className="w-3.5 h-3.5" />
                {reorderMode ? 'Concluir' : 'Reordenar'}
              </button>
            )}
          </div>
        </div>

        {/* Links list */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {displayLinks.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {displayLinks.map((link, index) => {
                const Icon = getLinkIcon(link.type);
                const isDragging = dragIndex === index;
                const isOver = overIndex === index && dragIndex !== index && reorderMode;

                return (
                  <li
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
                    className={`flex items-center gap-3 px-4 py-3.5 transition-all ${
                      isDragging ? 'opacity-40' : ''
                    } ${isOver ? 'bg-[#f2f3ff] ring-inset ring-2 ring-[#3525cd]' : 'hover:bg-gray-50'} ${
                      reorderMode ? 'cursor-grab active:cursor-grabbing' : ''
                    } ${!link.active ? 'opacity-60' : ''}`}
                  >
                    {/* Drag Handle */}
                    {reorderMode && (
                      <GripVertical aria-hidden="true" className="w-5 h-5 text-gray-400 shrink-0" />
                    )}

                    {/* Icon */}
                    <div
                      className={`w-10 h-10 rounded-xl ${getLinkIconBg(link.type)} flex items-center justify-center shrink-0`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#131b2e] truncate">{link.title}</p>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-500 hover:text-[#FF7A00] truncate flex items-center gap-1 group transition-colors max-w-xs sm:max-w-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="truncate">{link.url.replace(/^https?:\/\//, '')}</span>
                        <ExternalLink
                          aria-hidden="true"
                          className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        />
                      </a>
                    </div>

                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-4 shrink-0">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <MousePointerClick
                          aria-hidden="true"
                          className="w-3.5 h-3.5 text-[#FF7A00]"
                        />
                        <span className="font-semibold text-[#131b2e]">
                          {link.clicks.toLocaleString('pt-BR')}
                        </span>
                        <span>cliques</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Users aria-hidden="true" className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="font-semibold text-[#131b2e]">
                          {link.leads.toLocaleString('pt-BR')}
                        </span>
                        <span>leads</span>
                      </div>
                    </div>

                    {/* Toggle */}
                    <button
                      type="button"
                      onClick={() => onToggleLink(link.id)}
                      className="flex items-center gap-1.5 shrink-0 cursor-pointer"
                      aria-label={
                        link.active ? `Desativar link ${link.title}` : `Ativar link ${link.title}`
                      }
                      role="switch"
                      aria-checked={link.active}
                    >
                      {link.active ? (
                        <ToggleRight aria-hidden="true" className="w-8 h-8 text-[#3525cd]" />
                      ) : (
                        <ToggleLeft aria-hidden="true" className="w-8 h-8 text-gray-300" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="py-16 flex flex-col items-center justify-center gap-4 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-[#f2f3ff] flex items-center justify-center">
                <Link2 aria-hidden="true" className="w-7 h-7 text-[#3525cd]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#131b2e]">
                  {search || filter !== 'all' ? 'Nenhum link encontrado' : 'Nenhum link ainda'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {search || filter !== 'all'
                    ? 'Tente ajustar os filtros ou a busca.'
                    : 'Comece adicionando seu primeiro link abaixo.'}
                </p>
              </div>
              {!search && filter === 'all' && (
                <button
                  type="button"
                  onClick={onAddLink}
                  className="flex items-center gap-2 px-4 py-2 bg-[#f2f3ff] hover:bg-[#eaedff] text-[#3525cd] rounded-xl text-sm font-bold transition-colors"
                >
                  <Plus aria-hidden="true" className="w-4 h-4" />
                  Adicionar primeiro link
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer hint when reorder active */}
        {reorderMode && (
          <p className="text-xs text-center text-gray-500">
            Arraste os links para definir a ordem de exibição na sua bio.
          </p>
        )}
      </div>
    );
  },
);

LinksSection.displayName = 'LinksSection';
