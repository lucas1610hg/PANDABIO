import React, { useState, useEffect, useCallback } from 'react';
import { Scissors, Plus, Edit2, Trash2, Eye, EyeOff, Search, Filter } from 'lucide-react';
import { ServiceService } from '../../supabase/services/agendamentoService';
import { BookingService, BookingWorkspace, CreateServiceData } from '../../types_agendamentos';

interface AgendamentosServicosProps {
  workspace: BookingWorkspace | null;
}

export const AgendamentosServicos: React.FC<AgendamentosServicosProps> = ({ workspace }) => {
  const [services, setServices] = useState<BookingService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<BookingService | null>(null);
  const [formData, setFormData] = useState<CreateServiceData>({
    name: '',
    description: '',
    category: '',
    color: '#FF7A00',
    duration: 30,
    price: 0,
    price_display_type: 'fixed',
    requires_deposit: false,
    deposit_amount: 0,
    advance_booking_days: 0,
    cancellation_hours: 24,
  });
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!workspace) {
        setServices([]);
        setLoading(false);
        return;
      }

      // Buscar serviços
      const servicesData = await ServiceService.getServices(workspace.id);
      setServices(servicesData);
    } catch (err) {
      setError('Erro ao carregar serviços');
      console.error('Error loading services:', err);
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenModal = (service?: BookingService) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description || '',
        category: service.category || '',
        color: service.color,
        duration: service.duration,
        price: service.price,
        price_display_type: service.price_display_type,
        requires_deposit: service.requires_deposit,
        deposit_amount: service.deposit_amount || 0,
        advance_booking_days: service.advance_booking_days,
        cancellation_hours: service.cancellation_hours,
      });
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        description: '',
        category: '',
        color: '#FF7A00',
        duration: 30,
        price: 0,
        price_display_type: 'fixed',
        requires_deposit: false,
        deposit_amount: 0,
        advance_booking_days: 0,
        cancellation_hours: 24,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      category: '',
      color: '#FF7A00',
      duration: 30,
      price: 0,
      price_display_type: 'fixed',
      requires_deposit: false,
      deposit_amount: 0,
      advance_booking_days: 0,
      cancellation_hours: 24,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace) return;

    try {
      setSaving(true);
      setError(null);

      if (editingService) {
        // Atualizar serviço existente
        const success = await ServiceService.updateService(editingService.id, formData);
        if (!success) {
          throw new Error('Erro ao atualizar serviço');
        }
      } else {
        // Criar novo serviço
        const newService = await ServiceService.createService(workspace.id, formData);
        if (!newService) {
          throw new Error('Erro ao criar serviço');
        }
      }

      handleCloseModal();
      await loadData();
    } catch (err) {
      setError('Erro ao salvar serviço');
      console.error('Error saving service:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;

    try {
      const success = await ServiceService.deleteService(serviceId);
      if (!success) {
        throw new Error('Erro ao excluir serviço');
      }
      await loadData();
    } catch (err) {
      setError('Erro ao excluir serviço');
      console.error('Error deleting service:', err);
    }
  };

  const handleToggleActive = async (service: BookingService) => {
    try {
      const success = await ServiceService.updateService(service.id, { active: !service.active });
      if (!success) {
        throw new Error('Erro ao atualizar serviço');
      }
      await loadData();
    } catch (err) {
      setError('Erro ao atualizar serviço');
      console.error('Error toggling service:', err);
    }
  };

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (service.category && service.category.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesActive = showInactive || service.active;
    return matchesSearch && matchesActive;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7A00]" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Scissors className="w-12 h-12 text-gray-400" />
        <p className="text-sm text-gray-600">Nenhum workspace configurado</p>
        <p className="text-xs text-gray-400">Execute os dados de teste para criar um workspace automaticamente</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#131b2e]">Serviços</h2>
          <p className="text-sm text-gray-500 mt-1">
            {services.length} serviço(s) cadastrado(s)
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-[#FF7A00] text-white rounded-lg text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          Novo Serviço
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar serviços..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowInactive(!showInactive)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
            showInactive ? 'bg-[#3525cd] text-white' : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          <Filter className="w-4 h-4" />
          {showInactive ? 'Todos' : 'Ativos'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Services List */}
      {filteredServices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 bg-white rounded-2xl border border-gray-200">
          <Scissors className="w-12 h-12 text-gray-400" />
          <p className="text-sm text-gray-600">
            {searchTerm ? 'Nenhum serviço encontrado' : 'Nenhum serviço cadastrado'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className={`bg-white rounded-2xl border p-5 ${
                service.active ? 'border-gray-200' : 'border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${service.color}20` }}
                >
                  <Scissors className="w-5 h-5" style={{ color: service.color }} />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(service)}
                    className="p-1 hover:bg-gray-100 rounded"
                    title={service.active ? 'Desativar' : 'Ativar'}
                  >
                    {service.active ? (
                      <Eye className="w-4 h-4 text-gray-400" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenModal(service)}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(service.id)}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              <h3 className="text-sm font-bold text-[#131b2e] mb-1">{service.name}</h3>
              {service.description && (
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{service.description}</p>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Duração</span>
                  <span className="text-xs font-semibold text-[#131b2e]">{service.duration} min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Preço</span>
                  <span className="text-xs font-semibold text-[#131b2e]">
                    R$ {service.price.toFixed(2)}
                  </span>
                </div>
                {service.category && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Categoria</span>
                    <span className="text-xs font-semibold text-[#131b2e]">{service.category}</span>
                  </div>
                )}
              </div>

              {service.requires_deposit && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-orange-600">
                    Requer depósito: R$ {service.deposit_amount?.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-[#131b2e]">
                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#131b2e] mb-1">Nome *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                  placeholder="Corte Masculino"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#131b2e] mb-1">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00] resize-none"
                  rows={3}
                  placeholder="Descrição do serviço"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#131b2e] mb-1">Categoria</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                    placeholder="Cabelo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#131b2e] mb-1">Cor</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                      placeholder="#FF7A00"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#131b2e] mb-1">Duração (min) *</label>
                  <input
                    type="number"
                    required
                    min="5"
                    step="5"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                    placeholder="30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#131b2e] mb-1">Preço (R$) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                    placeholder="50.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#131b2e] mb-1">Tipo de Preço</label>
                <select
                  value={formData.price_display_type}
                  onChange={(e) => setFormData({ ...formData, price_display_type: e.target.value as 'fixed' | 'variable' | 'consultation' })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                >
                  <option value="fixed">Fixo</option>
                  <option value="variable">Variável</option>
                  <option value="consultation">Consultação</option>
                </select>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#131b2e]">Requer Depósito</label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, requires_deposit: !formData.requires_deposit })}
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      formData.requires_deposit ? 'bg-[#FF7A00]' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        formData.requires_deposit ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {formData.requires_deposit && (
                  <div>
                    <label className="block text-sm font-medium text-[#131b2e] mb-1">Valor do Depósito (R$)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.deposit_amount}
                      onChange={(e) => setFormData({ ...formData, deposit_amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                      placeholder="20.00"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#131b2e] mb-1">Antecedência (dias)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.advance_booking_days}
                      onChange={(e) => setFormData({ ...formData, advance_booking_days: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#131b2e] mb-1">Cancelamento (horas)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.cancellation_hours}
                      onChange={(e) => setFormData({ ...formData, cancellation_hours: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                      placeholder="24"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 bg-white text-[#131b2e] rounded-lg text-sm font-semibold border border-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-[#FF7A00] text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : editingService ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
