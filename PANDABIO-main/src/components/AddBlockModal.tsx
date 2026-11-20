import React, { useState } from 'react';
import {
  X,
  Link as LinkIcon,
  FileText,
  Image as ImageIcon,
  Video,
  Calendar,
  Package,
  Smartphone,
  Mail,
  ClipboardList,
  Music,
  MapPin,
} from 'lucide-react';
import { BlockType } from '../types';
import { Modal } from './Modal';

interface AddBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBlock: (type: BlockType) => void;
}

export const AddBlockModal: React.FC<AddBlockModalProps> = ({ isOpen, onClose, onAddBlock }) => {
  const [selectedType, setSelectedType] = useState<BlockType | null>(null);

  const handleClose = () => {
    setSelectedType(null);
    onClose();
  };

  const blockTypes = [
    {
      type: 'link' as BlockType,
      icon: LinkIcon,
      label: 'Link',
      description: 'Adicione links para suas redes sociais',
    },
    {
      type: 'text' as BlockType,
      icon: FileText,
      label: 'Texto',
      description: 'Adicione textos informativos',
    },
    {
      type: 'image' as BlockType,
      icon: ImageIcon,
      label: 'Imagem',
      description: 'Adicione imagens e fotos',
    },
    {
      type: 'video' as BlockType,
      icon: Video,
      label: 'Vídeo',
      description: 'Adicione vídeos do YouTube',
    },
    {
      type: 'agendamento' as BlockType,
      icon: Calendar,
      label: 'Agendamento',
      description: 'Permita agendamentos',
    },
    {
      type: 'produto' as BlockType,
      icon: Package,
      label: 'Produto',
      description: 'Catálogo com vários produtos e links de afiliados',
    },
    {
      type: 'social' as BlockType,
      icon: Smartphone,
      label: 'Redes sociais',
      description: 'Suas redes sociais',
    },
    {
      type: 'form' as BlockType,
      icon: ClipboardList,
      label: 'Formulário',
      description: 'Capte clientes com campos personalizados',
    },
    {
      type: 'contact' as BlockType,
      icon: Mail,
      label: 'Contato',
      description: 'Formulário de contato',
    },
    { type: 'music' as BlockType, icon: Music, label: 'Música', description: 'Adicione músicas' },
    {
      type: 'location' as BlockType,
      icon: MapPin,
      label: 'Localização',
      description: 'Mostre sua localização',
    },
  ];

  const handleAdd = () => {
    if (selectedType) {
      onAddBlock(selectedType);
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} titleId="add-block-title" size="lg">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
        <div>
          <h2 id="add-block-title" className="text-lg font-bold text-[#131b2e]">
            Adicionar bloco
          </h2>
          <p className="mt-1 text-xs text-gray-500">Escolha o tipo de conteúdo para sua página.</p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Fechar"
          className="rounded-xl p-2 transition-colors hover:bg-gray-100 cursor-pointer"
        >
          <X aria-hidden="true" className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Block Types Grid */}
      <div className="max-h-[60vh] overflow-y-auto p-5 sm:p-6">
        <div
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3"
          role="radiogroup"
          aria-label="Tipos de bloco"
        >
          {blockTypes.map((block) => {
            const Icon = block.icon;
            return (
              <button
                key={block.type}
                type="button"
                role="radio"
                aria-checked={selectedType === block.type}
                onClick={() => setSelectedType(block.type)}
                className={`group rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5E00] focus-visible:ring-offset-2 cursor-pointer ${
                  selectedType === block.type
                    ? 'border-[#FF5E00] bg-[#FFF7F0] shadow-sm'
                    : 'border-gray-200 bg-white hover:border-[#FFB27A] hover:bg-[#FFFAF6]'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                      selectedType === block.type
                        ? 'bg-[#FF5E00] text-white'
                        : 'bg-[#FFF1E6] text-[#E55300] group-hover:bg-[#FFE5D1]'
                    }`}
                  >
                    <Icon aria-hidden="true" className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-[#131b2e]">{block.label}</span>
                </div>
                <p className="text-xs leading-5 text-gray-500">{block.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/80 px-5 py-4 sm:px-6">
        <button
          type="button"
          onClick={handleClose}
          className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!selectedType}
          className="px-6 py-2 rounded-lg bg-[#FF5E00] text-white hover:bg-[#E55300] disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer"
        >
          Adicionar
        </button>
      </div>
    </Modal>
  );
};
