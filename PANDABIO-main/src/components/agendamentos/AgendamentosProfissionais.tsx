import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Edit2, Trash2, Eye, EyeOff, Search, Filter, Mail, Phone } from 'lucide-react';
import {
  ProfessionalService,
  ServiceService,
} from '../../supabase/services/agendamentoService';
import {
  BookingProfessional,
  BookingService,
  BookingWorkspace,
  CreateProfessionalData,
} from '../../types_agendamentos';

interface AgendamentosProfissionaisProps {
  workspace: BookingWorkspace | null;
}

export const AgendamentosProfissionais: React.FC<AgendamentosProfissionaisProps> = ({ workspace }) => {
  const [professionals, setProfessionals] = useState<BookingProfessional[]>([]);
  const [services, setServices] = useState<BookingService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<BookingProfessional | null>(null);
  const [formData, setFormData] = useState<CreateProfessionalData>({
    name: '',
    email: '',
    phone: '',
    avatar_url: '',
    bio: '',
    specializations: [],
    color: '#3525cd',
  });
  const [saving, setSaving] = useState(false);
  const [specializationInput, setSpecializationInput] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!workspace) {
        setProfessionals([]);
        setLoading(false);
        return;
      }

      const [professionalsData, servicesData] = await Promise.all([
        ProfessionalService.getProfessionals(workspace.id),
        ServiceService.getServices(workspace.id),
      ]);
      setProfessionals(professionalsData);
      setServices(servicesData.filter((service) => service.active));
    } catch (err) {
      setError('Erro ao carregar profissionais');
      console.error('Error loading professionals:', err);
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenModal = async (professional?: BookingProfessional) => {
    setError(null);
    setServicesLoading(Boolean(professional));

    if (professional) {
      setEditingProfessional(professional);
      setFormData({
        name: professional.name,
        email: professional.email || '',
        phone: professional.phone || '',
        avatar_url: professional.avatar_url || '',
        bio: professional.bio || '',
        specializations: professional.specializations || [],
        color: professional.color,
      });
      setSelectedServiceIds([]);
      const professionalServices = await ProfessionalService.getProfessionalServices(
        professional.id,
      );
      setSelectedServiceIds(professionalServices.map((service) => service.service_id));
    } else {
      setEditingProfessional(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        avatar_url: '',
        bio: '',
        specializations: [],
        color: '#3525cd',
      });
      setSelectedServiceIds([]);
    }
    setShowModal(true);
    setServicesLoading(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProfessional(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      avatar_url: '',
      bio: '',
      specializations: [],
      color: '#3525cd',
    });
    setSpecializationInput('');
    setSelectedServiceIds([]);
    setServicesLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace) return;

    try {
      setSaving(true);
      setError(null);

      if (editingProfessional) {
        // Atualizar profissional existente
        const success = await ProfessionalService.updateProfessional(
          editingProfessional.id,
          formData,
        );
        if (!success) {
          throw new Error('Erro ao atualizar profissional');
        }
        const servicesSynced = await ProfessionalService.syncProfessionalServices(
          editingProfessional.id,
          workspace.id,
          workspace.profile_id,
          selectedServiceIds,
        );
        if (!servicesSynced) throw new Error('Erro ao atualizar serviços do profissional');
      } else {
        // Criar novo profissional
        const newProfessional = await ProfessionalService.createProfessional(
          workspace.id,
          formData,
        );
        if (!newProfessional) {
          throw new Error('Erro ao criar profissional');
        }
        const servicesSynced = await ProfessionalService.syncProfessionalServices(
          newProfessional.id,
          workspace.id,
          workspace.profile_id,
          selectedServiceIds,
        );
        if (!servicesSynced) throw new Error('Erro ao vincular serviços ao profissional');
      }

      handleCloseModal();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar profissional');
      console.error('Error saving professional:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (professionalId: string) => {
    if (!confirm('Tem certeza que deseja excluir este profissional?')) return;

    try {
      const success = await ProfessionalService.deleteProfessional(professionalId);
      if (!success) {
        throw new Error('Erro ao excluir profissional');
      }
      await loadData();
    } catch (err) {
      setError('Erro ao excluir profissional');
      console.error('Error deleting professional:', err);
    }
  };

  const handleToggleActive = async (professional: BookingProfessional) => {
    try {
      const success = await ProfessionalService.updateProfessional(professional.id, {
        active: !professional.active,
      });
      if (!success) {
        throw new Error('Erro ao atualizar profissional');
      }
      await loadData();
    } catch (err) {
      setError('Erro ao atualizar profissional');
      console.error('Error toggling professional:', err);
    }
  };

  const handleAddSpecialization = () => {
    if (
      specializationInput.trim() &&
      !formData.specializations.includes(specializationInput.trim())
    ) {
      setFormData({
        ...formData,
        specializations: [...formData.specializations, specializationInput.trim()],
      });
      setSpecializationInput('');
    }
  };

  const handleRemoveSpecialization = (specialization: string) => {
    setFormData({
      ...formData,
      specializations: formData.specializations.filter((s) => s !== specialization),
    });
  };

  const filteredProfessionals = professionals.filter((professional) => {
    const matchesSearch =
      professional.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (professional.email && professional.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (professional.specializations &&
        professional.specializations.some((s) =>
          s.toLowerCase().includes(searchTerm.toLowerCase()),
        ));
    const matchesActive = showInactive || professional.active;
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
        <Users className="w-12 h-12 text-gray-400" />
        <p className="text-sm text-gray-600">Nenhum workspace configurado</p>
        <p className="text-xs text-gray-400">
          Execute os dados de teste para criar um workspace automaticamente
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#131b2e]">Profissionais</h2>
          <p className="text-sm text-gray-500 mt-1">
            {professionals.length} profissional(is) cadastrado(s)
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-[#FF7A00] text-white rounded-lg text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          Novo Profissional
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar profissionais..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowInactive(!showInactive)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
            showInactive
              ? 'bg-[#3525cd] text-white'
              : 'bg-white text-gray-600 border border-gray-200'
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

      {/* Professionals List */}
      {filteredProfessionals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 bg-white rounded-2xl border border-gray-200">
          <Users className="w-12 h-12 text-gray-400" />
          <p className="text-sm text-gray-600">
            {searchTerm ? 'Nenhum profissional encontrado' : 'Nenhum profissional cadastrado'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProfessionals.map((professional) => (
            <div
              key={professional.id}
              className={`bg-white rounded-2xl border p-5 ${
                professional.active ? 'border-gray-200' : 'border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: professional.color }}
                >
                  {professional.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(professional)}
                    className="p-1 hover:bg-gray-100 rounded"
                    title={professional.active ? 'Desativar' : 'Ativar'}
                  >
                    {professional.active ? (
                      <Eye className="w-4 h-4 text-gray-400" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleOpenModal(professional)}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(professional.id)}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              <h3 className="text-sm font-bold text-[#131b2e] mb-1">{professional.name}</h3>

              {professional.email && (
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                  <Mail className="w-3 h-3" />
                  {professional.email}
                </div>
              )}

              {professional.phone && (
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                  <Phone className="w-3 h-3" />
                  {professional.phone}
                </div>
              )}

              {professional.bio && (
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{professional.bio}</p>
              )}

              {professional.specializations && professional.specializations.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {professional.specializations.slice(0, 3).map((spec) => (
                    <span
                      key={spec}
                      className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                    >
                      {spec}
                    </span>
                  ))}
                  {professional.specializations.length > 3 && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                      +{professional.specializations.length - 3}
                    </span>
                  )}
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
                {editingProfessional ? 'Editar Profissional' : 'Novo Profissional'}
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
                  placeholder="João Silva"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#131b2e] mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                    placeholder="joao@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#131b2e] mb-1">Telefone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#131b2e] mb-1">Avatar URL</label>
                <input
                  type="url"
                  value={formData.avatar_url}
                  onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#131b2e] mb-1">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00] resize-none"
                  rows={3}
                  placeholder="Descrição do profissional"
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
                    placeholder="#3525cd"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#131b2e] mb-1">
                  Especializações
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={specializationInput}
                    onChange={(e) => setSpecializationInput(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === 'Enter' && (e.preventDefault(), handleAddSpecialization())
                    }
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                    placeholder="Adicionar especialização"
                  />
                  <button
                    type="button"
                    onClick={handleAddSpecialization}
                    className="px-4 py-2 bg-[#3525cd] text-white rounded-lg text-sm font-medium"
                  >
                    Adicionar
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {formData.specializations.map((spec) => (
                    <span
                      key={spec}
                      className="px-2 py-1 bg-[#3525cd]/10 text-[#3525cd] rounded-md text-xs flex items-center gap-1"
                    >
                      {spec}
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecialization(spec)}
                        className="hover:text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-[#131b2e]">
                    Serviços atendidos
                  </label>
                  <span className="text-xs text-gray-400">
                    {selectedServiceIds.length} selecionado(s)
                  </span>
                </div>
                {servicesLoading ? (
                  <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
                    Carregando serviços...
                  </p>
                ) : services.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-gray-300 p-3 text-xs text-gray-500">
                    Cadastre serviços primeiro. Depois edite este profissional para vincular os
                    serviços.
                  </p>
                ) : (
                  <div className="grid max-h-40 gap-2 overflow-y-auto sm:grid-cols-2">
                    {services.map((service) => {
                      const selected = selectedServiceIds.includes(service.id);

                      return (
                        <label
                          key={service.id}
                          className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
                            selected
                              ? 'border-[#FF7A00] bg-orange-50 text-[#c75f00]'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() =>
                              setSelectedServiceIds((current) =>
                                selected
                                  ? current.filter((id) => id !== service.id)
                                  : [...current, service.id],
                              )
                            }
                            className="h-4 w-4 accent-[#FF7A00]"
                          />
                          <span className="truncate">{service.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
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
                  {saving ? 'Salvando...' : editingProfessional ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
