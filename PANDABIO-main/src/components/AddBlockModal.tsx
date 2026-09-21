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
      setSelectedType(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} titleId="add-block-title" size="lg">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 id="add-block-title" className="text-xl font-bold text-[#131b2e]">
          Adicionar Bloco
        </h2>
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <X aria-hidden="true" className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Block Types Grid */}
      <div className="p-6 overflow-y-auto max-h-[60vh]">
        <div
          className="grid grid-cols-2 md:grid-cols-3 gap-4"
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
                className={`p-4 rounded-xl border-2 transition-all text-left cursor-pointer ${
                  selectedType === block.type
                    ? 'border-[#FF5E00] bg-[#FF5E00]/5'
                    : 'border-gray-200 hover:border-[#FF5E00] hover:bg-[#FF5E00]/5'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <span className="font-semibold text-[#131b2e]">{block.label}</span>
                </div>
                <p className="text-xs text-gray-500">{block.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
        <button
          onClick={onClose}
          className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
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
