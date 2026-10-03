import React, { memo, useMemo, useState } from 'react';
import {
  Check,
  ExternalLink,
  Filter,
  Image as ImageIcon,
  Link2,
  Loader2,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  Tag,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ProductItem } from '../types';
import { ImportedProductData, importProductFromUrl } from '../utils/productImporter';
import { parsePriceInput } from '../utils/price';

interface ProductsSectionProps {
  products: ProductItem[];
  onToggleProduct: (id: string) => void;
  onCreateProduct: () => void;
  onAddProduct: (product: ProductItem) => void;
  onEditProduct: (product: ProductItem) => void;
}

type FilterType = 'all' | 'active' | 'draft';

const formatPrice = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const ProductsSection: React.FC<ProductsSectionProps> = memo(
  ({ products, onToggleProduct, onCreateProduct, onAddProduct, onEditProduct }) => {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<FilterType>('all');
    const [showImporter, setShowImporter] = useState(false);
    const [sourceUrl, setSourceUrl] = useState('');
    const [imported, setImported] = useState<ImportedProductData | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    const totalSales = products.reduce((sum, product) => sum + product.salesCount, 0);
    const totalRevenue = products.reduce(
      (sum, product) => sum + product.price * product.salesCount,
      0,
    );
    const activeCount = products.filter((product) => product.status === 'active').length;

    const displayProducts = useMemo(() => {
      let list = products;
      if (filter === 'active') list = list.filter((product) => product.status === 'active');
      if (filter === 'draft') list = list.filter((product) => product.status === 'draft');
      if (search.trim()) {
        const query = search.toLowerCase();
        list = list.filter(
          (product) =>
            product.name.toLowerCase().includes(query) ||
            product.sourceUrl?.toLowerCase().includes(query),
        );
      }
      return list;
    }, [filter, products, search]);

    const openImporter = () => {
      setShowImporter(true);
      setImported(null);
      setSourceUrl('');
    };

    const closeImporter = () => {
      if (isImporting) return;
      setShowImporter(false);
      setImported(null);
      setSourceUrl('');
    };

    const handleImport = async (event: React.FormEvent) => {
      event.preventDefault();
      if (!sourceUrl.trim()) return;
      setIsImporting(true);
      try {
        const product = await importProductFromUrl(sourceUrl);
        setImported(product);
        toast.success('Informações encontradas. Revise antes de salvar.');
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Não foi possível importar o produto.',
        );
      } finally {
        setIsImporting(false);
      }
    };

    const handleConfirmImport = () => {
      if (!imported) return;
      const price = imported.price ?? 0;
      if (!imported.name.trim()) {
        toast.error('Informe nome do produto.');
        return;
      }
      if (price <= 0) {
        toast.error('Informe preço válido antes de salvar.');
        return;
      }

      onAddProduct({
        id: `prod-${Date.now()}`,
        name: imported.name.trim(),
        price,
        description: imported.description.trim(),
        image: imported.image || undefined,
        sourceUrl: imported.sourceUrl,
        purchaseUrl: imported.sourceUrl,
        purchaseType: 'sales',
        salesCount: 0,
        status: 'active',
      });
      closeImporter();
      toast.success('Produto importado para seu catálogo.');
    };

    return (
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 pb-24 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#131b2e] sm:text-3xl">
              Catálogo de produtos
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Cadastre produtos uma vez e reutilize todas as informações no bloco Produto da sua
              página.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={openImporter}
              className="flex items-center gap-2 rounded-xl border border-[#ff7a00] bg-white px-4 py-2.5 text-sm font-bold text-[#ff7a00] transition-colors hover:bg-[#fff3e6]"
            >
              <Link2 className="h-4 w-4" />
              Importar por link
            </button>
            <button
              type="button"
              onClick={onCreateProduct}
              className="flex items-center gap-2 rounded-xl bg-[#10b981] px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-[#10b981]/30 transition-all hover:-translate-y-0.5 hover:bg-[#059669]"
            >
              <Plus className="h-4 w-4" />
              Cadastrar produto
            </button>
          </div>
        </div>

        {showImporter && (
          <div className="rounded-2xl border border-[#ffcfaa] bg-gradient-to-br from-[#fffaf5] to-white p-4 shadow-[0_8px_30px_rgba(255,122,0,0.08)] sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff3e6] text-[#ff7a00]">
                    <Link2 className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-extrabold text-[#131b2e]">
                    Importar produto por link
                  </h2>
                </div>
                <p className="mt-2 text-xs text-[#777587]">
                  Cole página do produto. Nome, preço, descrição e imagem serão preenchidos
                  automaticamente quando disponíveis.
                </p>
              </div>
              <button
                type="button"
                onClick={closeImporter}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Fechar importação"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleImport} className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                type="url"
                required
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                placeholder="https://loja.com/produto"
                className="min-w-0 flex-1 rounded-xl border-0 bg-[#f2f3ff] px-3.5 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#ff7a00]"
              />
              <button
                type="submit"
                disabled={isImporting}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#ff7a00] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#e56e00] disabled:cursor-wait disabled:opacity-70"
              >
                {isImporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {isImporting ? 'Buscando...' : 'Buscar informações'}
              </button>
            </form>

            {imported && (
              <div className="mt-4 grid gap-4 rounded-xl border border-[#eaedff] bg-white p-3 sm:grid-cols-[92px_1fr] sm:p-4">
                <div className="flex h-24 w-full items-center justify-center overflow-hidden rounded-xl bg-[#f6f7fc] sm:h-[92px]">
                  {imported.image ? (
                    <img
                      src={imported.image}
                      alt="Prévia do produto"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div className="space-y-2.5">
                  <div className="grid gap-2 sm:grid-cols-[1fr_150px]">
                    <input
                      value={imported.name}
                      onChange={(event) => setImported({ ...imported, name: event.target.value })}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold outline-none focus:border-[#ff7a00]"
                      placeholder="Nome do produto"
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      aria-label="Preço importado"
                      min="0.01"
                      value={imported.price ?? ''}
                      onChange={(event) =>
                        setImported({
                          ...imported,
                          price: parsePriceInput(event.target.value) || null,
                        })
                      }
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold outline-none focus:border-[#ff7a00]"
                      placeholder="Preço (R$)"
                    />
                  </div>
                  <textarea
                    value={imported.description}
                    onChange={(event) =>
                      setImported({ ...imported, description: event.target.value })
                    }
                    rows={2}
                    className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-[#ff7a00]"
                    placeholder="Descrição do produto"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="max-w-full truncate text-[10px] text-gray-400">
                      {imported.sourceUrl}
                    </span>
                    <button
                      type="button"
                      onClick={handleConfirmImport}
                      className="flex items-center gap-1.5 rounded-lg bg-[#10b981] px-3 py-2 text-xs font-bold text-white hover:bg-[#059669]"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Salvar no catálogo
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {[
            {
              label: 'Produtos',
              value: products.length,
              icon: <ShoppingBag className="h-4 w-4 text-[#131b2e]" />,
              bg: 'bg-gray-100',
              text: 'text-[#131b2e]',
            },
            {
              label: 'Ativos',
              value: activeCount,
              icon: <Check className="h-4 w-4 text-[#10b981]" />,
              bg: 'bg-emerald-50',
              text: 'text-[#10b981]',
            },
            {
              label: 'Vendas',
              value: totalSales.toLocaleString('pt-BR'),
              icon: <Tag className="h-4 w-4 text-[#3525cd]" />,
              bg: 'bg-[#f2f3ff]',
              text: 'text-[#3525cd]',
            },
            {
              label: 'Faturamento',
              value: formatPrice(totalRevenue),
              icon: <TrendingUp className="h-4 w-4 text-[#ff7a00]" />,
              bg: 'bg-[#fff3e6]',
              text: 'text-[#ff7a00]',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-4"
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${stat.bg}`}>
                {stat.icon}
              </div>
              <div>
                <p className={`truncate text-lg font-extrabold sm:text-xl ${stat.text}`}>
                  {stat.value}
                </p>
                <p className="text-[11px] font-medium text-gray-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Buscar por nome ou link..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none transition-all focus:border-[#10b981] focus:bg-white focus:ring-2 focus:ring-[#10b981]/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            {(['all', 'active', 'draft'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${filter === option ? 'bg-[#131b2e] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {option === 'all' ? 'Todos' : option === 'active' ? 'Ativos' : 'Rascunhos'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {displayProducts.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {displayProducts.map((product) => {
                const isActive = product.status === 'active';
                return (
                  <li
                    key={product.id}
                    className={`flex flex-col gap-3 p-4 transition-all sm:flex-row sm:items-center ${!isActive ? 'opacity-70' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-100 sm:h-20 sm:w-20">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-bold text-[#131b2e] sm:text-base">
                          {product.name}
                        </p>
                        {product.sourceUrl && (
                          <span className="rounded bg-[#fff3e6] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#ff7a00]">
                            Importado
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm font-bold text-[#10b981]">
                        {formatPrice(product.price)}
                      </p>
                      {product.description && (
                        <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                          {product.description}
                        </p>
                      )}
                      {product.sourceUrl && (
                        <a
                          href={product.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-[11px] text-gray-400 hover:text-[#ff7a00]"
                        >
                          <span className="truncate">{product.sourceUrl}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Tag className="h-3.5 w-3.5 text-[#3525cd]" />
                        <span className="font-semibold text-[#131b2e]">
                          {product.salesCount.toLocaleString('pt-BR')}
                        </span>
                        <span>vendas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onEditProduct(product)}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold text-[#ff7a00] transition-colors hover:bg-[#fff3e6]"
                          aria-label={`Editar produto ${product.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" /> Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleProduct(product.id)}
                          className="flex cursor-pointer items-center gap-1.5"
                          aria-label={
                            isActive
                              ? `Desativar produto ${product.name}`
                              : `Ativar produto ${product.name}`
                          }
                          role="switch"
                          aria-checked={isActive}
                        >
                          {isActive ? (
                            <ToggleRight className="h-8 w-8 text-[#10b981]" />
                          ) : (
                            <ToggleLeft className="h-8 w-8 text-gray-300" />
                          )}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
                <ShoppingBag className="h-7 w-7 text-[#10b981]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#131b2e]">
                  {search || filter !== 'all'
                    ? 'Nenhum produto encontrado'
                    : 'Nenhum produto cadastrado'}
                </p>
                <p className="mt-1 max-w-sm text-xs text-gray-500">
                  {search || filter !== 'all'
                    ? 'Tente ajustar os filtros ou a busca.'
                    : 'Cadastre manualmente ou importe um link para criar seu catálogo.'}
                </p>
              </div>
              {!search && filter === 'all' && (
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={onCreateProduct}
                    className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-[#10b981] transition-colors hover:bg-emerald-100"
                  >
                    <Plus className="h-4 w-4" />
                    Cadastrar manualmente
                  </button>
                  <button
                    type="button"
                    onClick={openImporter}
                    className="flex items-center gap-2 rounded-xl bg-[#fff3e6] px-4 py-2 text-sm font-bold text-[#ff7a00] transition-colors hover:bg-[#ffe5ce]"
                  >
                    <Link2 className="h-4 w-4" />
                    Importar link
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  },
);

ProductsSection.displayName = 'ProductsSection';
