import React, { useEffect, useRef, useState } from 'react';
import {
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  Package,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BioLink, ProductItem } from '../types';
import { LinkFormData, linkSchema, ProductFormData, productSchema } from '../schemas/linkSchema';
import { importProductFromUrl } from '../utils/productImporter';
import { parsePriceInput } from '../utils/price';
import { StorageService } from '../supabase/services/storageService';
import { Modal } from './Modal';

interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLink: (link: BioLink) => void;
  onAddProduct: (product: ProductItem) => void;
  onUpdateProduct?: (product: ProductItem) => void;
  editingProduct?: ProductItem | null;
  initialTab?: 'link' | 'product';
}

const inputClass =
  'w-full rounded-xl border-0 bg-[#f2f3ff] px-3.5 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#ff7a00]';

export const CreateItemModal: React.FC<CreateItemModalProps> = ({
  isOpen,
  onClose,
  onAddLink,
  onAddProduct,
  onUpdateProduct,
  editingProduct,
  initialTab = 'link',
}) => {
  const [activeTab, setActiveTab] = useState<'link' | 'product'>(initialTab);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkType, setLinkType] = useState<
    'social' | 'whatsapp' | 'portfolio' | 'store' | 'custom'
  >('custom');
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodSourceUrl, setProdSourceUrl] = useState('');
  const [prodPurchaseUrl, setProdPurchaseUrl] = useState('');
  const [prodPurchaseType, setProdPurchaseType] = useState<'sales' | 'whatsapp'>('sales');
  const [isImportingProduct, setIsImportingProduct] = useState(false);
  const [isUploadingProductImage, setIsUploadingProductImage] = useState(false);
  const linkTitleRef = useRef<HTMLInputElement>(null);
  const prodNameRef = useRef<HTMLInputElement>(null);

  const resetProduct = () => {
    setProdName('');
    setProdPrice('');
    setProdDescription('');
    setProdImage('');
    setProdSourceUrl('');
    setProdPurchaseUrl('');
    setProdPurchaseType('sales');
  };

  useEffect(() => {
    if (!isOpen) return;

    setActiveTab(editingProduct ? 'product' : initialTab);
    if (editingProduct) {
      setProdName(editingProduct.name);
      setProdPrice(String(editingProduct.price));
      setProdDescription(editingProduct.description || '');
      setProdImage(editingProduct.image || '');
      setProdSourceUrl(editingProduct.sourceUrl || '');
      setProdPurchaseUrl(editingProduct.purchaseUrl || editingProduct.sourceUrl || '');
      setProdPurchaseType(editingProduct.purchaseType || 'sales');
    } else {
      resetProduct();
    }
  }, [editingProduct, initialTab, isOpen]);

  const handleLinkSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const validatedData: LinkFormData = linkSchema.parse({
        title: linkTitle,
        url: linkUrl,
        type: linkType,
      });
      const formattedUrl = validatedData.url.startsWith('http')
        ? validatedData.url
        : `https://${validatedData.url}`;
      onAddLink({
        id: `link-${Date.now()}`,
        title: validatedData.title,
        url: formattedUrl,
        clicks: 0,
        leads: 0,
        active: true,
        icon: validatedData.type,
        type: validatedData.type,
      });
      setLinkTitle('');
      setLinkUrl('');
      onClose();
      toast.success('Link adicionado com sucesso!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao validar formulário.');
    }
  };

  const handleImportProduct = async () => {
    if (!prodSourceUrl.trim()) {
      toast.error('Cole o link do produto primeiro.');
      return;
    }
    setIsImportingProduct(true);
    try {
      const imported = await importProductFromUrl(prodSourceUrl);
      setProdName(imported.name);
      setProdPrice(imported.price ? String(imported.price) : '');
      setProdDescription(imported.description);
      setProdImage(imported.image);
      setProdSourceUrl(imported.sourceUrl);
      setProdPurchaseUrl((current) => current.trim() || imported.sourceUrl);
      toast.success('Dados preenchidos. Revise antes de salvar.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível importar o produto.');
    } finally {
      setIsImportingProduct(false);
    }
  };

  const handleProductImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem válido.');
      return;
    }

    setIsUploadingProductImage(true);
    try {
      const result = await StorageService.uploadImage(file, 'product', {
        maxDim: 900,
        quality: 0.84,
      });
      if (!result.success || !result.url) {
        toast.error(result.error || 'Não foi possível processar a foto.');
        return;
      }
      await StorageService.deleteByUrl(prodImage);
      setProdImage(result.url);
      toast.success('Foto adicionada ao produto.');
    } finally {
      setIsUploadingProductImage(false);
    }
  };

  const removeProductImage = () => {
    void StorageService.deleteByUrl(prodImage);
    setProdImage('');
  };

  const handleProductSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const formData: ProductFormData = {
        name: prodName,
        price: parsePriceInput(prodPrice),
      };
      const validatedData = productSchema.parse(formData);
      const product: ProductItem = {
        id: editingProduct?.id || `prod-${Date.now()}`,
        name: validatedData.name,
        price: validatedData.price,
        description: prodDescription.trim() || undefined,
        image: prodImage || undefined,
        sourceUrl: prodSourceUrl.trim() || undefined,
        purchaseUrl: prodPurchaseUrl.trim() || undefined,
        purchaseType: prodPurchaseUrl.trim() ? prodPurchaseType : undefined,
        salesCount: editingProduct?.salesCount || 0,
        status: editingProduct?.status || 'active',
      };

      if (editingProduct && onUpdateProduct) {
        onUpdateProduct(product);
        toast.success('Produto atualizado!');
      } else {
        onAddProduct(product);
        toast.success('Produto adicionado ao catálogo!');
      }
      resetProduct();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao validar formulário.');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      titleId="create-item-title"
      size="sm"
      initialFocusRef={activeTab === 'link' ? linkTitleRef : prodNameRef}
    >
      <div className="flex flex-col overflow-y-auto p-5 sm:p-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fff3e6] text-[#ff7a00]">
              {activeTab === 'link' ? (
                <LinkIcon className="h-4 w-4" />
              ) : (
                <Package className="h-4 w-4" />
              )}
            </div>
            <h2 id="create-item-title" className="text-base font-bold text-[#131b2e]">
              {editingProduct ? 'Editar produto' : 'Criar novo item'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!editingProduct && (
          <div
            role="tablist"
            aria-label="Tipo de item"
            className="my-4 flex rounded-xl bg-[#f2f3ff] p-1 text-xs font-semibold"
          >
            {(['link', 'product'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-lg py-2 transition-all ${activeTab === tab ? 'bg-white text-[#131b2e] shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}
              >
                {tab === 'link' ? 'Novo link' : 'Novo produto'}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'link' ? (
          <form onSubmit={handleLinkSubmit} className="space-y-4">
            <label className="block text-xs font-semibold text-gray-700">
              Título do link
              <input
                ref={linkTitleRef}
                type="text"
                required
                value={linkTitle}
                onChange={(event) => setLinkTitle(event.target.value)}
                placeholder="Ex: Meu Instagram"
                className={`${inputClass} mt-1`}
              />
            </label>
            <label className="block text-xs font-semibold text-gray-700">
              URL de destino
              <input
                type="url"
                required
                value={linkUrl}
                onChange={(event) => setLinkUrl(event.target.value)}
                placeholder="https://exemplo.com/pagina"
                className={`${inputClass} mt-1`}
              />
            </label>
            <div>
              <span className="mb-1 block text-xs font-semibold text-gray-700">
                Categoria / ícone
              </span>
              <div className="grid grid-cols-4 gap-2">
                {(['whatsapp', 'social', 'store', 'portfolio'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={linkType === type}
                    onClick={() => setLinkType(type)}
                    className={`rounded-xl border px-2 py-2 text-center text-xs font-medium transition-colors ${linkType === type ? 'border-[#ff7a00] bg-[#fff3e6] font-bold text-[#ff7a00]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {type === 'whatsapp'
                      ? 'WhatsApp'
                      : type === 'social'
                        ? 'Redes'
                        : type === 'store'
                          ? 'Loja'
                          : 'Portfólio'}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#ff5500] py-3 text-sm font-bold text-white shadow-md transition-all hover:brightness-110"
            >
              Publicar link na bio
            </button>
          </form>
        ) : (
          <form onSubmit={handleProductSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">
                Link do produto (opcional)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={prodSourceUrl}
                  onChange={(event) => setProdSourceUrl(event.target.value)}
                  placeholder="https://loja.com/produto"
                  className={`${inputClass} min-w-0 flex-1`}
                />
                <button
                  type="button"
                  onClick={() => void handleImportProduct()}
                  disabled={isImportingProduct}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#fff3e6] px-3 text-xs font-bold text-[#ff7a00] transition-colors hover:bg-[#ffe5ce] disabled:cursor-wait disabled:opacity-60"
                >
                  {isImportingProduct ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LinkIcon className="h-4 w-4" />
                  )}
                  {isImportingProduct ? 'Buscando' : 'Puxar dados'}
                </button>
              </div>
              <p className="mt-1 text-[10px] text-gray-500">
                Nome, preço, descrição e imagem serão preenchidos quando disponíveis.
              </p>
            </div>
            <div>
              <span className="mb-1 block text-xs font-semibold text-gray-700">
                Destino do botão Comprar (opcional)
              </span>
              <div className="grid gap-2 sm:grid-cols-[150px_1fr]">
                <select
                  value={prodPurchaseType}
                  onChange={(event) =>
                    setProdPurchaseType(event.target.value as 'sales' | 'whatsapp')
                  }
                  className={inputClass}
                >
                  <option value="sales">Página de vendas</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
                <input
                  type="url"
                  value={prodPurchaseUrl}
                  onChange={(event) => setProdPurchaseUrl(event.target.value)}
                  placeholder={
                    prodPurchaseType === 'whatsapp'
                      ? 'https://wa.me/5511999999999'
                      : 'https://sua-pagina-de-vendas.com/produto'
                  }
                  className={inputClass}
                />
              </div>
              <p className="mt-1 text-[10px] text-gray-500">
                {prodPurchaseType === 'whatsapp'
                  ? 'Cliente será direcionado ao WhatsApp para concluir a compra.'
                  : 'Cliente será direcionado para sua página de vendas.'}
              </p>
            </div>
            <label className="block text-xs font-semibold text-gray-700">
              Nome do produto ou serviço
              <input
                ref={prodNameRef}
                type="text"
                required
                value={prodName}
                onChange={(event) => setProdName(event.target.value)}
                placeholder="Ex: Consultoria VIP, E-book..."
                className={`${inputClass} mt-1`}
              />
            </label>
            <label className="block text-xs font-semibold text-gray-700">
              Preço (R$)
              <input
                type="text"
                inputMode="decimal"
                aria-label="Preço (R$)"
                min="0.01"
                required
                value={prodPrice}
                onChange={(event) => setProdPrice(event.target.value)}
                placeholder="89,90"
                className={`${inputClass} mt-1`}
              />
            </label>
            <label className="block text-xs font-semibold text-gray-700">
              Descrição (opcional)
              <textarea
                rows={2}
                value={prodDescription}
                onChange={(event) => setProdDescription(event.target.value)}
                placeholder="Resumo do produto"
                className={`${inputClass} mt-1 resize-none`}
              />
            </label>
            <div>
              <span className="mb-1 block text-xs font-semibold text-gray-700">
                Foto do produto
              </span>
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-3">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                  {prodImage ? (
                    <img
                      src={prodImage}
                      alt="Prévia do produto"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div className="min-w-0 space-y-1.5">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#fff3e6] px-3 py-2 text-xs font-bold text-[#ff7a00] transition-colors hover:bg-[#ffe5ce]">
                    {isUploadingProductImage ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    {isUploadingProductImage
                      ? 'Processando...'
                      : prodImage
                        ? 'Trocar foto'
                        : 'Adicionar foto'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingProductImage}
                      onChange={(event) => void handleProductImageChange(event)}
                    />
                  </label>
                  {prodImage && (
                    <button
                      type="button"
                      onClick={removeProductImage}
                      className="ml-2 inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" /> Remover
                    </button>
                  )}
                  <p className="text-[10px] text-gray-500">
                    JPG, PNG ou WebP. A imagem será otimizada automaticamente.
                  </p>
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#ff5500] py-3 text-sm font-bold text-white shadow-md transition-all hover:brightness-110"
            >
              {editingProduct ? 'Salvar alterações' : 'Adicionar ao catálogo'}
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
};
