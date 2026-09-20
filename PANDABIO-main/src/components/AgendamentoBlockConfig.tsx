import React from 'react';
import { Calendar, Clock, CreditCard, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { PageBlock } from '../types';

interface AgendamentoBlockConfigProps {
  block: PageBlock;
  onUpdate: (updates: Partial<PageBlock>) => void;
  onDelete: () => void;
}

export const AgendamentoBlockConfig: React.FC<AgendamentoBlockConfigProps> = ({ block, onUpdate, onDelete }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#FF5E00]" />
          <h3 className="text-lg font-bold text-[#131b2e]">Configurar Agendamento</h3>
        </div>
        <button
          onClick={onDelete}
          className="p-2 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Título */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
          <input
            type="text"
            value={block.appointmentTitle || ''}
            onChange={(e) => onUpdate({ appointmentTitle: e.target.value })}
            placeholder="Agende seu horário"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5E00] focus:border-transparent"
          />
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
          <textarea
            value={block.appointmentDescription || ''}
            onChange={(e) => onUpdate({ appointmentDescription: e.target.value })}
            placeholder="Escolha o melhor horário para você"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5E00] focus:border-transparent resize-none"
            rows={3}
          />
        </div>

        {/* Serviço */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Serviço</label>
          <select
            value={block.service || ''}
            onChange={(e) => onUpdate({ service: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5E00] focus:border-transparent"
          >
            <option value="">Selecione um serviço</option>
            <option>Corte de cabelo</option>
            <option>Barbearia</option>
            <option>Consultoria</option>
            <option>Aula particular</option>
            <option>Sessão fotográfica</option>
            <option>Outro</option>
          </select>
        </div>

        {/* Botão */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Texto do botão</label>
          <input
            type="text"
            value={block.content || 'Agendar agora'}
            onChange={(e) => onUpdate({ content: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5E00] focus:border-transparent"
          />
        </div>

        {/* Opções adicionais */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">Mostrar preço</span>
            </div>
            <button
              onClick={() => onUpdate({ showPrice: !block.showPrice })}
              className={`w-12 h-6 rounded-full transition-colors ${
                block.showPrice ? 'bg-[#FF5E00]' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  block.showPrice ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">Mostrar duração</span>
            </div>
            <button
              onClick={() => onUpdate({ showDuration: !block.showDuration })}
              className={`w-12 h-6 rounded-full transition-colors ${
                block.showDuration ? 'bg-[#FF5E00]' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  block.showDuration ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Preview do bloco */}
        <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Preview:</p>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-[#FF5E00]" />
              <span className="font-semibold text-[#131b2e]">{block.appointmentTitle || 'Agende seu horário'}</span>
            </div>
            {block.appointmentDescription && (
              <p className="text-sm text-gray-600 mb-3">{block.appointmentDescription}</p>
            )}
            {block.service && (
              <p className="text-xs text-gray-500 mb-3">Serviço: {block.service}</p>
            )}
            <button className="w-full py-2 bg-[#FF5E00] text-white rounded-lg font-medium hover:bg-[#E55300] transition-colors">
              {block.content || 'Agendar agora'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};