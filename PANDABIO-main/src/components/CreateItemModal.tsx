import React, { useRef, useState } from 'react';
import { X, Link as LinkIcon, Package } from 'lucide-react';
import { BioLink, ProductItem } from '../types';
import { linkSchema, productSchema, LinkFormData, ProductFormData } from '../schemas/linkSchema';
import { Modal } from './Modal';
import toast from 'react-hot-toast';

interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLink: (link: BioLink) => void;
  onAddProduct: (prod: ProductItem) => void;
}

export const CreateItemModal: React.FC<CreateItemModalProps> = ({
  isOpen,
  onClose,
  onAddLink,
  onAddProduct,
}) => {
  const [activeTab, setActiveTab] = useState<'link' | 'product'>('link');

  // Link form state
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkType, setLinkType] = useState<
    'social' | 'whatsapp' | 'portfolio' | 'store' | 'custom'
  >('custom');

  // Product form state
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');

  const linkTitleRef = useRef<HTMLInputElement>(null);
  const prodNameRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const formData: LinkFormData = {
        title: linkTitle,
        url: linkUrl,
        type: linkType,
      };

      const validatedData = linkSchema.parse(formData);

      const formattedUrl = validatedData.url.startsWith('http')
        ? validatedData.url
        : `https://${validatedData.url}`;
      const newLink: BioLink = {
        id: `link-${Date.now()}`,
        title: validatedData.title,
        url: formattedUrl,
        clicks: 0,
        leads: 0,
        active: true,
        icon: validatedData.type,
        type: validatedData.type as 'social' | 'whatsapp' | 'portfolio' | 'store' | 'custom',
      };

      onAddLink(newLink);
      setLinkTitle('');
      setLinkUrl('');
      onClose();
      toast.success('Link adicionado com sucesso!');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Erro ao validar formulário');
      }
    }
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const formData: ProductFormData = {
        name: prodName,
        price: parseFloat(prodPrice) || 0,
      };

      const validatedData = productSchema.parse(formData);

      const newProd: ProductItem = {
        id: `prod-${Date.now()}`,
        name: validatedData.name,
        price: validatedData.price,
        salesCount: 0,
        status: 'active' as const,
      };

      onAddProduct(newProd);
      setProdName('');
      setProdPrice('');
      onClose();
      toast.success('Produto adicionado com sucesso!');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Erro ao validar formulário');
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      titleId="create-item-title"
      size="sm"
      initialFocusRef={activeTab === 'link' ? linkTitleRef : prodNameRef}
    >
      <div className="flex flex-col overflow-y-auto p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FFF3E6] flex items-center justify-center text-[#FF7A00]">
              {activeTab === 'link' ? (
                <LinkIcon className="w-4 h-4" />
              ) : (
                <Package className="w-4 h-4" />
              )}
            </div>
            <h3 id="create-item-title" className="font-bold text-base text-[#131b2e]">
              Criar Novo Item
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div
          role="tablist"
          aria-label="Tipo de item"
          className="flex bg-[#f2f3ff] p-1 rounded-xl my-4 text-xs font-semibold"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'link'}
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'link'
                ? 'bg-white text-[#131b2e] shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Novo Link
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'product'}
            onClick={() => setActiveTab('product')}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'product'
                ? 'bg-white text-[#131b2e] shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Novo Produto
          </button>
        </div>

        {/* Link Form */}
        {activeTab === 'link' ? (
          <form onSubmit={handleLinkSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Título do Link
              </label>
              <input
                type="text"
                required
                ref={linkTitleRef}
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="Ex: Agende no WhatsApp, Meu Canal, E-book..."
                className="w-full px-3.5 py-2.5 bg-[#f2f3ff] border-0 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#FF7A00] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                URL de Destino
              </label>
              <input
                type="text"
                required
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://exemplo.com/pagina"
                className="w-full px-3.5 py-2.5 bg-[#f2f3ff] border-0 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#FF7A00] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Categoria / Ícone
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(
                  [
                    { id: 'whatsapp', label: 'WhatsApp' },
                    { id: 'social', label: 'Redes' },
                    { id: 'store', label: 'Loja' },
                    { id: 'portfolio', label: 'Portfólio' },
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    aria-pressed={linkType === cat.id}
                    onClick={() => setLinkType(cat.id)}
                    className={`py-2 px-2 text-center rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                      linkType === cat.id
                        ? 'border-[#FF7A00] bg-[#FFF3E6] text-[#FF7A00] font-bold'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-[#FF7A00] to-[#FF5500] hover:brightness-110 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer mt-2"
            >
              Publicar Link na Bio
            </button>
          </form>
        ) : (
          /* Product Form */
          <form onSubmit={handleProductSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Nome do Produto ou Serviço
              </label>
              <input
                type="text"
                required
                ref={prodNameRef}
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                placeholder="Ex: Consultoria VIP, E-book..."
                className="w-full px-3.5 py-2.5 bg-[#f2f3ff] border-0 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#FF7A00] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Preço (R$)</label>
              <input
                type="number"
                step="0.01"
                required
                value={prodPrice}
                onChange={(e) => setProdPrice(e.target.value)}
                placeholder="89.90"
                className="w-full px-3.5 py-2.5 bg-[#f2f3ff] border-0 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#FF7A00] outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-[#FF7A00] to-[#FF5500] hover:brightness-110 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer mt-2"
            >
              Adicionar Produto
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
};
