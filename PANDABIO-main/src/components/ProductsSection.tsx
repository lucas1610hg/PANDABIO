import React, { memo, useState, useMemo } from 'react';
import {
  Plus,
  Search,
  ShoppingBag,
  TrendingUp,
  Tag,
  ToggleLeft,
  ToggleRight,
  Filter,
  Image as ImageIcon
} from 'lucide-react';
import { ProductItem } from '../types';

interface ProductsSectionProps {
  products: ProductItem[];
  onToggleProduct: (id: string) => void;
  onAddProduct: () => void;
}

type FilterType = 'all' | 'active' | 'draft';

export const ProductsSection: React.FC<ProductsSectionProps> = memo(
  ({ products, onToggleProduct, onAddProduct }) => {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<FilterType>('all');

    /* ── Stats ── */
    const totalSales = products.reduce((s, p) => s + p.salesCount, 0);
    const totalRevenue = products.reduce((s, p) => s + (p.price * p.salesCount), 0);
    const activeCount = products.filter((p) => p.status === 'active').length;

    /* ── Filtered / searched list ── */
    const displayProducts = useMemo(() => {
      let list = products;
      if (filter === 'active') list = list.filter((p) => p.status === 'active');
      if (filter === 'draft') list = list.filter((p) => p.status === 'draft');
      if (search.trim()) {
        const q = search.toLowerCase();
        list = list.filter((p) => p.name.toLowerCase().includes(q));
      }
      return list;
    }, [products, filter, search]);

    const formatPrice = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    };

    return (
      <div className="w-full max-w-4xl mx-auto py-6 sm:py-10 px-4 sm:px-6 lg:px-8 pb-24 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#131b2e] tracking-tight">
              Meus Produtos
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Gerencie os produtos da sua loja, preços e acompanhe as vendas.
            </p>
          </div>
          <button
            type="button"
            onClick={onAddProduct}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl text-sm font-bold shadow-sm shadow-[#10B981]/30 transition-all hover:-translate-y-0.5 self-start sm:self-auto shrink-0"
          >
            <Plus aria-hidden="true" className="w-4 h-4" />
            Novo Produto
          </button>
        </div>

        {/* KPI Summary Bar */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[
            {
              label: 'Total de produtos',
              value: products.length,
              icon: <ShoppingBag aria-hidden="true" className="w-4 h-4 text-[#131b2e]" />,
              bg: 'bg-gray-100',
              text: 'text-[#131b2e]',
            },
            {
              label: 'Vendas realizadas',
              value: totalSales.toLocaleString('pt-BR'),
              icon: <Tag aria-hidden="true" className="w-4 h-4 text-[#3525cd]" />,
              bg: 'bg-[#f2f3ff]',
              text: 'text-[#3525cd]',
            },
            {
              label: 'Faturamento bruto',
              value: formatPrice(totalRevenue),
              icon: <TrendingUp aria-hidden="true" className="w-4 h-4 text-[#10B981]" />,
              bg: 'bg-emerald-50',
              text: 'text-[#10B981]',
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
                <p className={`text-xl font-extrabold ${stat.text} truncate`}>{stat.value}</p>
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
              placeholder="Buscar produto por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all"
            />
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto pb-1 sm:pb-0">
            <Filter aria-hidden="true" className="w-4 h-4 text-gray-400 mr-1 shrink-0" />
            {(['all', 'active', 'draft'] as FilterType[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  filter === f
                    ? 'bg-[#131b2e] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? `Todos (${products.length})` : f === 'active' ? `Ativos (${activeCount})` : `Rascunhos (${products.length - activeCount})`}
              </button>
            ))}
          </div>
        </div>

        {/* Products list */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {displayProducts.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {displayProducts.map((product) => {
                const isActive = product.status === 'active';
                return (
                  <li
                    key={product.id}
                    className={`flex items-center gap-4 px-4 py-4 transition-all hover:bg-gray-50 ${!isActive ? 'opacity-70' : ''}`}
                  >
                    {/* Image */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon aria-hidden="true" className="w-6 h-6 text-gray-400" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm sm:text-base font-bold text-[#131b2e] truncate">{product.name}</p>
                        {!isActive && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-gray-200 text-gray-600">
                            Rascunho
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-[#10B981]">{formatPrice(product.price)}</p>
                    </div>

                    {/* Stats */}
                    <div className="hidden sm:flex flex-col items-end gap-1 shrink-0 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Tag aria-hidden="true" className="w-3.5 h-3.5 text-[#3525cd]" />
                        <span className="font-semibold text-[#131b2e]">
                          {product.salesCount.toLocaleString('pt-BR')}
                        </span>
                        <span>vendas</span>
                      </div>
                      <p className="text-[11px] font-medium text-gray-500">
                        Total: <span className="text-[#131b2e] font-bold">{formatPrice(product.price * product.salesCount)}</span>
                      </p>
                    </div>

                    {/* Toggle */}
                    <button
                      type="button"
                      onClick={() => onToggleProduct(product.id)}
                      className="flex items-center gap-1.5 shrink-0 cursor-pointer ml-2"
                      aria-label={
                        isActive ? `Desativar produto ${product.name}` : `Ativar produto ${product.name}`
                      }
                      role="switch"
                      aria-checked={isActive}
                    >
                      {isActive ? (
                        <ToggleRight aria-hidden="true" className="w-8 h-8 text-[#10B981]" />
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
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <ShoppingBag aria-hidden="true" className="w-7 h-7 text-[#10B981]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#131b2e]">
                  {search || filter !== 'all' ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
                </p>
                <p className="text-xs text-gray-500 mt-1 max-w-sm">
                  {search || filter !== 'all'
                    ? 'Tente ajustar os filtros ou a busca.'
                    : 'Adicione produtos físicos ou digitais para vender diretamente na sua página PandaBio.'}
                </p>
              </div>
              {!search && filter === 'all' && (
                <button
                  type="button"
                  onClick={onAddProduct}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#10B981] rounded-xl text-sm font-bold transition-colors mt-2"
                >
                  <Plus aria-hidden="true" className="w-4 h-4" />
                  Criar primeiro produto
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  },
);

ProductsSection.displayName = 'ProductsSection';
