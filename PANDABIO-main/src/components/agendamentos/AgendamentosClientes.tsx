import React, { useState, useEffect, useCallback } from 'react';
import { UserCog, Plus, Edit2, Trash2, Search, Filter, Calendar, DollarSign, Mail, Phone } from 'lucide-react';
import { ClientService } from '../../supabase/services/agendamentoService';
import { BookingClient, BookingWorkspace, CreateClientData } from '../../types_agendamentos';

interface AgendamentosClientesProps {
  workspace: BookingWorkspace | null;
}

export const AgendamentosClientes: React.FC<AgendamentosClientesProps> = ({ workspace }) => {
  const [clients, setClients] = useState<BookingClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<BookingClient | null>(null);
  const [formData, setFormData] = useState<CreateClientData>({
    name: '',
    email: '',
    phone: '',
    avatar_url: '',
    notes: '',
    consent_marketing: false,
    consent_data_processing: false,
  });
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!workspace) {
        setClients([]);
        setLoading(false);
        return;
      }

      // Buscar clientes
      const clientsData = await ClientService.getClients(workspace.id);
      setClients(clientsData);
    } catch (err) {
      setError('Erro ao carregar clientes');
      console.error('Error loading clients:', err);
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenModal = (client?: BookingClient) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        email: client.email || '',
        phone: client.phone || '',
        avatar_url: client.avatar_url || '',
        notes: client.notes || '',
        consent_marketing: client.consent_marketing,
        consent_data_processing: client.consent_data_processing,
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        avatar_url: '',
        notes: '',
        consent_marketing: false,
        consent_data_processing: false,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClient(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      avatar_url: '',
      notes: '',
      consent_marketing: false,
      consent_data_processing: false,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace) return;

    try {
      setSaving(true);
      setError(null);

      if (editingClient) {
        // Atualizar cliente existente
        const success = await ClientService.updateClient(editingClient.id, formData);
        if (!success) {
          throw new Error('Erro ao atualizar cliente');
        }
      } else {
        // Criar novo cliente
        const newClient = await ClientService.createClient(workspace.id, formData);
        if (!newClient) {
          throw new Error('Erro ao criar cliente');
        }
      }

      handleCloseModal();
      await loadData();
    } catch (err) {
      setError('Erro ao salvar cliente');
      console.error('Error saving client:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (clientId: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;

    try {
      const success = await ClientService.deleteClient(clientId);
      if (!success) {
        throw new Error('Erro ao excluir cliente');
      }
      await loadData();
    } catch (err) {
      setError('Erro ao excluir cliente');
      console.error('Error deleting client:', err);
    }
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.phone && client.phone.includes(searchTerm));
    return matchesSearch;
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
        <UserCog className="w-12 h-12 text-gray-400" />
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
          <h2 className="text-lg font-bold text-[#131b2e]">Clientes</h2>
          <p className="text-sm text-gray-500 mt-1">
            {clients.length} cliente(s) cadastrado(s)
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-[#FF7A00] text-white rounded-lg text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Clients List */}
      {filteredClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 bg-white rounded-2xl border border-gray-200">
          <UserCog className="w-12 h-12 text-gray-400" />
          <p className="text-sm text-gray-600">
            {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Contato</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600">Agendamentos</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600">Total Gasto</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600">No-Show</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                        style={{ backgroundColor: '#3525cd' }}
                      >
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#131b2e]">{client.name}</p>
                        {client.last_booking_date && (
                          <p className="text-xs text-gray-500">
                            Último: {new Date(client.last_booking_date).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {client.email && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Mail className="w-3 h-3" />
                          {client.email}
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Phone className="w-3 h-3" />
                          {client.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-semibold text-[#131b2e]">{client.total_bookings}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-semibold text-[#131b2e]">
                      R$ {client.total_spent.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-sm font-semibold ${client.no_show_count > 2 ? 'text-red-500' : 'text-[#131b2e]'}`}>
                      {client.no_show_count}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenModal(client)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(client.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-[#131b2e]">
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
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
                  placeholder="Maria Silva"
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
                    placeholder="maria@email.com"
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
                <label className="block text-sm font-medium text-[#131b2e] mb-1">Notas</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00] resize-none"
                  rows={3}
                  placeholder="Observações sobre o cliente"
                />
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#131b2e]">Consentimento Marketing</label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, consent_marketing: !formData.consent_marketing })}
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      formData.consent_marketing ? 'bg-[#FF7A00]' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        formData.consent_marketing ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#131b2e]">Consentimento Processamento de Dados</label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, consent_data_processing: !formData.consent_data_processing })}
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      formData.consent_data_processing ? 'bg-[#FF7A00]' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        formData.consent_data_processing ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
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
                  {saving ? 'Salvando...' : editingClient ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
