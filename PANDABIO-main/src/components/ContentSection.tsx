import React, { memo, useState } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Video,
  FileText,
  Search,
  Filter,
  MoreVertical,
  Trash2,
  Copy,
  ExternalLink,
  FolderOpen
} from 'lucide-react';

interface MediaItem {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document';
  url: string;
  size: string;
  createdAt: string;
}

const MOCK_MEDIA: MediaItem[] = [
  {
    id: '1',
    name: 'capa-perfil-nova.jpg',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop',
    size: '1.2 MB',
    createdAt: 'Hoje, 14:30',
  },
  {
    id: '2',
    name: 'video-apresentacao.mp4',
    type: 'video',
    url: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?q=80&w=2000&auto=format&fit=crop',
    size: '15.4 MB',
    createdAt: 'Ontem, 09:15',
  },
  {
    id: '3',
    name: 'ebook-guia-vendas.pdf',
    type: 'document',
    url: '',
    size: '3.8 MB',
    createdAt: '15 Mai, 11:20',
  },
  {
    id: '4',
    name: 'logo-oficial-transparente.png',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?q=80&w=2000&auto=format&fit=crop',
    size: '845 KB',
    createdAt: '12 Mai, 16:45',
  }
];

type FilterType = 'all' | 'image' | 'video' | 'document';

export const ContentSection: React.FC = memo(() => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [mediaList, setMediaList] = useState<MediaItem[]>(MOCK_MEDIA);

  const filteredMedia = mediaList.filter((item) => {
    if (filter !== 'all' && item.type !== filter) return false;
    if (search.trim() && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleDelete = (id: string) => {
    setMediaList((prev) => prev.filter((item) => item.id !== id));
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon aria-hidden="true" className="w-5 h-5 text-blue-500" />;
      case 'video':
        return <Video aria-hidden="true" className="w-5 h-5 text-purple-500" />;
      case 'document':
        return <FileText aria-hidden="true" className="w-5 h-5 text-emerald-500" />;
      default:
        return <ImageIcon aria-hidden="true" className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-6 sm:py-10 px-4 sm:px-6 lg:px-8 pb-24 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#131b2e] tracking-tight">
            Conteúdo e Mídias
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie imagens, vídeos e arquivos usados na sua página.
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 px-5 py-2.5 bg-[#131b2e] hover:bg-gray-900 text-white rounded-xl text-sm font-bold shadow-sm transition-all hover:-translate-y-0.5 self-start sm:self-auto shrink-0"
        >
          <Upload aria-hidden="true" className="w-4 h-4" />
          Fazer Upload
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total de arquivos', value: mediaList.length, color: 'text-[#131b2e]' },
          { label: 'Imagens', value: mediaList.filter(m => m.type === 'image').length, color: 'text-blue-600' },
          { label: 'Vídeos', value: mediaList.filter(m => m.type === 'video').length, color: 'text-purple-600' },
          { label: 'Espaço usado', value: '21.2 MB', color: 'text-emerald-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className={`text-xl sm:text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
            <p className="text-[11px] sm:text-xs font-medium text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          />
          <input
            type="search"
            placeholder="Buscar arquivo por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto pb-1 sm:pb-0">
          <Filter aria-hidden="true" className="w-4 h-4 text-gray-400 mr-1 shrink-0" />
          {(['all', 'image', 'video', 'document'] as FilterType[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors capitalize ${
                filter === f
                  ? 'bg-[#131b2e] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'image' ? 'Imagens' : f === 'video' ? 'Vídeos' : 'Documentos'}
            </button>
          ))}
        </div>
      </div>

      {/* Media Grid */}
      {filteredMedia.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              className="group bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col transition-all hover:shadow-md"
            >
              {/* Thumbnail */}
              <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden flex items-center justify-center">
                {item.type !== 'document' && item.url ? (
                  <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-white/50 flex items-center justify-center backdrop-blur-sm shadow-sm">
                    {getIconForType(item.type)}
                  </div>
                )}
                
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button type="button" className="w-10 h-10 rounded-full bg-white text-gray-700 flex items-center justify-center hover:bg-gray-100 hover:text-blue-600 transition-colors shadow-sm" title="Visualizar">
                    <ExternalLink aria-hidden="true" className="w-5 h-5" />
                  </button>
                  <button type="button" className="w-10 h-10 rounded-full bg-white text-gray-700 flex items-center justify-center hover:bg-gray-100 hover:text-[#10B981] transition-colors shadow-sm" title="Copiar Link">
                    <Copy aria-hidden="true" className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Type badge */}
                <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg flex items-center gap-1.5 text-white shadow-sm">
                  {item.type === 'image' ? <ImageIcon className="w-3 h-3" /> : item.type === 'video' ? <Video className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                  <span className="text-[10px] font-bold uppercase tracking-wider">{item.type}</span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-bold text-[#131b2e] line-clamp-2" title={item.name}>
                    {item.name}
                  </h3>
                  <div className="relative shrink-0">
                    <button type="button" className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
                      <MoreVertical aria-hidden="true" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-auto flex items-center justify-between text-xs text-gray-500">
                  <span className="font-medium">{item.size}</span>
                  <span>{item.createdAt}</span>
                </div>
              </div>

              {/* Quick Actions Footer */}
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 aria-hidden="true" className="w-3.5 h-3.5" />
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 py-20 flex flex-col items-center justify-center gap-4 text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
            <FolderOpen aria-hidden="true" className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <p className="text-base font-bold text-[#131b2e]">
              {search || filter !== 'all' ? 'Nenhuma mídia encontrada' : 'Sua galeria está vazia'}
            </p>
            <p className="text-sm text-gray-500 mt-1 max-w-sm">
              {search || filter !== 'all'
                ? 'Tente ajustar os filtros ou a busca.'
                : 'Faça upload de imagens e vídeos para usar em seus blocos de conteúdo e produtos.'}
            </p>
          </div>
          {!search && filter === 'all' && (
            <button
              type="button"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl text-sm font-bold shadow-sm shadow-[#10B981]/30 transition-all hover:-translate-y-0.5 mt-2"
            >
              <Upload aria-hidden="true" className="w-4 h-4" />
              Fazer primeiro upload
            </button>
          )}
        </div>
      )}
    </div>
  );
});

ContentSection.displayName = 'ContentSection';
