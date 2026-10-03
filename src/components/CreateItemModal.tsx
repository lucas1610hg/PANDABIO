import React, { useState } from 'react';
import { X, Link as LinkIcon, Package, UserPlus } from 'lucide-react';
import { BioLink, ProductItem } from '../types';

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
  const [linkType, setLinkType] = useState<'social' | 'whatsapp' | 'portfolio' | 'store' | 'custom'>('custom');

  // Product form state
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');

  if (!isOpen) return null;

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkTitle || !linkUrl) return;

    const formattedUrl = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
    const newLink: BioLink = {
      id: `link-${Date.now()}`,
      title: linkTitle,
      url: formattedUrl,
      clicks: 0,
      leads: 0,
      active: true,
      icon: linkType,
      type: linkType,
    };

    onAddLink(newLink);
    setLinkTitle('');
    setLinkUrl('');
    onClose();
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodPrice) return;

    const newProd: ProductItem = {
      id: `prod-${Date.now()}`,
      name: prodName,
      price: parseFloat(prodPrice) || 0,
      salesCount: 0,
      status: 'active',
    };

    onAddProduct(newProd);
    setProdName('');
    setProdPrice('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-y-auto border border-black/10 flex flex-col p-5 sm:p-6 max-h-[90vh]">
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
            <h3 className="font-bold text-base text-[#131b2e]">Criar Novo Item</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex bg-[#f2f3ff] p-1 rounded-xl my-4 text-xs font-semibold">
          <button
            type="button"
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
                {[
                  { id: 'whatsapp', label: 'WhatsApp' },
                  { id: 'social', label: 'Redes' },
                  { id: 'store', label: 'Loja' },
                  { id: 'portfolio', label: 'Portfólio' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setLinkType(cat.id as any)}
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
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                placeholder="Ex: Consultoria VIP, E-book..."
                className="w-full px-3.5 py-2.5 bg-[#f2f3ff] border-0 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#FF7A00] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Preço (R$)
              </label>
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
    </div>
  );
};
