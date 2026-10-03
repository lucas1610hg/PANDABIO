import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Camera, Save, KeyRound, ShieldAlert, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { StorageService } from '../supabase/services/storageService';
import { PANDABIO_ASSETS } from '../constants/assets';

interface ProfileSectionProps {
  user: UserProfile;
  onUpdateUser: (u: Partial<UserProfile>) => void;
  onLogout?: () => void;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({ user, onUpdateUser, onLogout }) => {
  const [formData, setFormData] = useState({
    name: user.name || '',
    username: user.username || '',
    email: user.email || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida.');
      return;
    }

    const previousUrl = user.avatarUrl;
    toast.loading('Fazendo upload da foto...', { id: 'avatar-upload' });

    const result = await StorageService.uploadImage(file, 'avatar', { maxDim: 512, quality: 0.85 });
    e.target.value = ''; // Reset input

    if (!result.success || !result.url) {
      toast.error(result.error || 'Erro ao fazer upload da foto', { id: 'avatar-upload' });
      return;
    }

    onUpdateUser({ avatarUrl: result.url });
    if (result.path && previousUrl) {
      StorageService.deleteByUrl(previousUrl);
    }

    toast.success('Foto de perfil atualizada!', { id: 'avatar-upload' });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // Simula validação e salvamento
    await new Promise((resolve) => setTimeout(resolve, 800));

    onUpdateUser({
      name: formData.name,
      username: formData.username,
      email: formData.email,
    });

    toast.success('Perfil atualizado com sucesso!');
    setIsSaving(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('As novas senhas não coincidem');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsChangingPassword(true);

    // Simula uma chamada de API para alterar a senha (pronto para Supabase auth.updateUser)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success('Senha alterada com sucesso!');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setIsChangingPassword(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 sm:py-10 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in pb-24">
      {/* Cabeçalho da Seção */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#131b2e] tracking-tight">
          Configurações da Conta
        </h1>
        <p className="text-sm text-gray-500">
          Gerencie suas informações pessoais, segurança e plano de assinatura.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna Principal: Informações e Senha */}
        <div className="lg:col-span-2 space-y-8">
          {/* Card: Informações Pessoais */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#131b2e]">Informações Pessoais</h2>
              <p className="text-xs text-gray-500 mt-1">
                Esses dados são usados para sua conta PandaBio e acesso ao painel.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-6">
              {/* Avatar Uploader */}
              <div className="flex items-center gap-6">
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border border-gray-200 bg-gray-50">
                    <img
                      src={user.avatarUrl || PANDABIO_ASSETS.logoMini}
                      alt="Avatar da Conta"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                    <Camera aria-hidden="true" className="w-6 h-6 text-white mb-1" />
                    <span className="text-[10px] text-white font-medium">Trocar</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#131b2e]">Foto do Perfil</h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs">
                    Recomendamos uma imagem quadrada de no mínimo 500x500px (JPG ou PNG).
                  </p>
                </div>
              </div>

              {/* Formulário */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-700">Nome Completo</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/20 focus:border-[#FF7A00] transition-all"
                    placeholder="Seu nome"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Nome de Usuário</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 font-medium pointer-events-none">
                      @
                    </span>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/20 focus:border-[#FF7A00] transition-all"
                      placeholder="seunome"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">E-mail</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/20 focus:border-[#FF7A00] transition-all"
                    placeholder="voce@exemplo.com"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#131b2e] hover:bg-[#1f2937] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <Save aria-hidden="true" className="w-4 h-4" />
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>

          {/* Card: Alterar Senha */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                <KeyRound aria-hidden="true" className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#131b2e]">Segurança</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Atualize sua senha para manter sua conta protegida.
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Senha Atual</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Nova Senha</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={
                    isChangingPassword || !passwordData.currentPassword || !passwordData.newPassword
                  }
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isChangingPassword ? 'Atualizando...' : 'Atualizar Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Coluna Lateral: Plano e Danger Zone */}
        <div className="space-y-8">
          {/* Card: Plano Atual */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF7A00]/10 rounded-full blur-xl pointer-events-none" />
            <div className="p-6 relative z-10">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                Seu Plano
              </h2>

              <div className="flex flex-col items-center justify-center py-4 space-y-3">
                <div
                  className={`px-4 py-1.5 rounded-full text-sm font-extrabold tracking-widest uppercase border-2 ${
                    user.plan === 'PRO'
                      ? 'border-[#FF7A00] bg-[#FF7A00] text-white'
                      : 'border-gray-200 text-gray-600 bg-gray-50'
                  }`}
                >
                  {user.plan}
                </div>

                <p className="text-xs text-center text-gray-500 px-2">
                  {user.plan === 'PRO'
                    ? 'Você possui acesso total a todos os recursos da PandaBio.'
                    : 'Você está usando os recursos básicos. Evolua para ter domínio próprio e mais ferramentas.'}
                </p>
              </div>

              {user.plan === 'Gratuito' && (
                <button className="w-full mt-4 py-2.5 bg-gradient-to-r from-[#FF7A00] to-[#FF5E00] hover:to-[#E65500] text-white rounded-xl text-sm font-bold shadow-sm shadow-[#FF7A00]/20 transition-all hover:-translate-y-0.5">
                  Fazer Upgrade Agora
                </button>
              )}
            </div>
          </div>

          {/* Card: Danger Zone */}
          <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
            <div className="p-5 border-b border-red-50 bg-red-50/30">
              <div className="flex items-center gap-2">
                <ShieldAlert aria-hidden="true" className="w-4 h-4 text-red-500" />
                <h2 className="text-sm font-bold text-red-600 uppercase tracking-wider">
                  Zona de Perigo
                </h2>
              </div>
            </div>
            <div className="p-5 space-y-4">
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
                >
                  <LogOut aria-hidden="true" className="w-4 h-4" />
                  Sair da Conta
                </button>
              )}

              <div className="pt-2 border-t border-gray-100">
                <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">
                  Ao excluir sua conta, todos os seus dados, links e métricas serão apagados
                  permanentemente. Esta ação não pode ser desfeita.
                </p>
                <button className="w-full px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-colors border border-red-100">
                  Excluir Conta Permanentemente
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
