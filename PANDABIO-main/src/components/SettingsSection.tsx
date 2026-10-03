import React, { useMemo, useState } from 'react';
import {
  Bell,
  BarChart3,
  Check,
  ChevronRight,
  CircleHelp,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Globe2,
  KeyRound,
  Languages,
  Link2,
  LockKeyhole,
  Mail,
  MessageCircle,
  Monitor,
  Moon,
  PlugZap,
  RefreshCw,
  Save,
  Server,
  ShieldCheck,
  Smartphone,
  Sun,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { UserProfile } from '../types';
import { AuthService } from '../supabase/services/authService';
import { isSupabaseConfigured } from '../supabase/client';

type SettingsTab =
  'geral' | 'dominio' | 'seguranca' | 'notificacoes' | 'preferencias' | 'privacidade' | 'avancado';
type Language = 'pt-BR' | 'en-US' | 'es-ES';
type ThemePreference = 'light' | 'dark' | 'system';
type DomainStatus = 'not-configured' | 'pending' | 'connected';

interface SettingsState {
  customDomain: string;
  customDomainEnabled: boolean;
  redirectToCustomDomain: boolean;
  emailNotifications: boolean;
  emailMarketing: boolean;
  whatsappNotifications: boolean;
  whatsappSecurity: boolean;
  whatsappNumber: string;
  language: Language;
  theme: ThemePreference;
  timezone: string;
  dateFormat: 'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd';
  profileVisible: boolean;
  analyticsEnabled: boolean;
  contactMessages: boolean;
  googleAnalyticsId: string;
  metaPixelId: string;
  leadWebhookUrl: string;
}

const defaultSettings: SettingsState = {
  customDomain: '',
  customDomainEnabled: true,
  redirectToCustomDomain: false,
  emailNotifications: true,
  emailMarketing: false,
  whatsappNotifications: false,
  whatsappSecurity: true,
  whatsappNumber: '',
  language: 'pt-BR',
  theme: 'light',
  timezone: 'America/Sao_Paulo',
  dateFormat: 'dd/MM/yyyy',
  profileVisible: true,
  analyticsEnabled: true,
  contactMessages: true,
  googleAnalyticsId: '',
  metaPixelId: '',
  leadWebhookUrl: '',
};

const tabs: Array<{
  id: SettingsTab;
  label: string;
  description: string;
  icon: React.ElementType;
}> = [
  { id: 'geral', label: 'Geral', description: 'Conta e acesso', icon: Globe2 },
  { id: 'dominio', label: 'Domínio', description: 'URL personalizada', icon: Link2 },
  { id: 'seguranca', label: 'Segurança', description: 'Senha e proteção', icon: ShieldCheck },
  { id: 'notificacoes', label: 'Notificações', description: 'E-mail e WhatsApp', icon: Bell },
  { id: 'preferencias', label: 'Preferências', description: 'Idioma e visual', icon: Languages },
  { id: 'privacidade', label: 'Privacidade', description: 'Dados e visibilidade', icon: Eye },
  { id: 'avancado', label: 'Avançado', description: 'Integrações e conta', icon: PlugZap },
];

const inputClassName =
  'w-full rounded-xl border border-[#dfe3f4] bg-white px-3.5 py-2.5 text-sm text-[#131b2e] outline-none transition placeholder:text-[#a1a5b5] focus:border-[#ff7a00] focus:ring-4 focus:ring-[#ff7a00]/10';

const getStorageKey = (user: UserProfile) =>
  `pandabio.settings.${user.email || user.username || 'account'}`;

const loadSettings = (user: UserProfile): SettingsState => {
  if (typeof window === 'undefined') return { ...defaultSettings };
  try {
    const savedSettings = window.localStorage.getItem(getStorageKey(user));
    const parsedSettings = savedSettings ? JSON.parse(savedSettings) : {};
    return {
      ...defaultSettings,
      ...parsedSettings,
      customDomain: parsedSettings.customDomain ?? user.customDomain ?? '',
    };
  } catch {
    return { ...defaultSettings };
  }
};

const saveSettings = (user: UserProfile, settings: SettingsState) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(getStorageKey(user), JSON.stringify(settings));
  }
};

const normalizeDomain = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .replace(/\.$/, '');

const isValidDomain = (value: string) =>
  /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(value);

const getDomainStatusLabel = (status: DomainStatus) => {
  if (status === 'connected') return 'Conectado';
  if (status === 'pending') return 'Aguardando DNS';
  return 'Não configurado';
};

const customDomainTarget = import.meta.env.VITE_CUSTOM_DOMAIN_TARGET || '';

const FieldLabel: React.FC<{ children: React.ReactNode; htmlFor?: string }> = ({
  children,
  htmlFor,
}) => (
  <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-bold text-[#464555]">
    {children}
  </label>
);

const SectionCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, description, icon, children }) => (
  <section className="overflow-hidden rounded-2xl border border-[#e6e7f2] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
    <div className="flex items-start gap-3 border-b border-[#f0f0f5] px-5 py-5 sm:px-6">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff3e6] text-[#ff6600]">
        {icon}
      </div>
      <div>
        <h2 className="text-base font-bold text-[#131b2e]">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-[#777587]">{description}</p>
      </div>
    </div>
    <div className="space-y-4 px-5 py-5 sm:px-6">{children}</div>
  </section>
);

const Toggle: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description: string;
}> = ({ checked, onChange, label, description }) => (
  <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-[#eaedff] bg-[#faf8ff] px-4 py-3.5 transition-colors hover:border-[#d9dcf1]">
    <span className="min-w-0">
      <span className="block text-sm font-semibold text-[#131b2e]">{label}</span>
      <span className="mt-0.5 block text-xs leading-5 text-[#777587]">{description}</span>
    </span>
    <span className="relative shrink-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span className="block h-6 w-11 rounded-full bg-[#c7c4d8] transition-colors peer-checked:bg-[#ff6600] peer-focus-visible:ring-4 peer-focus-visible:ring-[#ff6600]/20" />
      <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
    </span>
  </label>
);

const PasswordField: React.FC<{
  id: string;
  label: string;
  value: string;
  visible: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
}> = ({ id, label, value, visible, onChange, onToggle }) => (
  <div>
    <FieldLabel htmlFor={id}>{label}</FieldLabel>
    <div className="relative">
      <LockKeyhole className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-[#969cb0]" />
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        className={`${inputClassName} pr-11 pl-10`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={id === 'current-password' ? 'current-password' : 'new-password'}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-2 top-1.5 rounded-lg p-1.5 text-[#969cb0] transition hover:bg-[#f2f3ff] hover:text-[#464555]"
        aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Exibir ${label.toLowerCase()}`}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  </div>
);

const ThemeOption: React.FC<{
  icon: React.ReactNode;
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}> = ({ icon, label, description, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative flex items-center gap-3 rounded-xl border p-3 text-left transition ${
      selected
        ? 'border-[#ff6600] bg-[#fffaf5] text-[#ff6600] ring-2 ring-[#ff6600]/10'
        : 'border-[#e6e7f2] text-[#777587] hover:border-[#c7c4d8] hover:bg-[#faf8ff]'
    }`}
  >
    <span
      className={`flex h-9 w-9 items-center justify-center rounded-lg ${selected ? 'bg-[#ffe3c7]' : 'bg-[#f2f3ff]'}`}
    >
      {icon}
    </span>
    <span>
      <span className="block text-sm font-bold text-[#131b2e]">{label}</span>
      <span className="block text-[11px] text-[#969cb0]">{description}</span>
    </span>
    {selected && <Check className="absolute right-2.5 top-2.5 h-4 w-4 text-[#ff6600]" />}
  </button>
);

export const SettingsSection: React.FC<{
  user: UserProfile;
  onUpdateUser?: (updates: Partial<UserProfile>) => void | Promise<unknown>;
}> = ({ user, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('geral');
  const [settings, setSettings] = useState<SettingsState>(() => loadSettings(user));
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingDomain, setIsSavingDomain] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [visiblePasswords, setVisiblePasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [domainInput, setDomainInput] = useState(user.customDomain || '');
  const [domainStatus, setDomainStatus] = useState<DomainStatus>(
    user.customDomain ? (user.customDomainVerified ? 'connected' : 'pending') : 'not-configured',
  );

  const selectedTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTab) || tabs[0],
    [activeTab],
  );
  const SelectedTabIcon = selectedTab.icon;
  const updateSetting = <Key extends keyof SettingsState>(key: Key, value: SettingsState[Key]) => {
    setSettings((previous) => ({ ...previous, [key]: value }));
  };

  const persistProfile = async (updates: Partial<UserProfile>) => {
    if (!isSupabaseConfigured()) return true;
    if (!onUpdateUser) return false;
    const result = await onUpdateUser(updates);
    if (result && typeof result === 'object' && 'success' in result) {
      return result.success !== false;
    }
    return true;
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    await new Promise((resolve) => setTimeout(resolve, 350));
    saveSettings(user, settings);
    setLastSavedAt(new Date());
    setIsSavingSettings(false);
    toast.success('Configurações salvas com sucesso.');
  };

  const handleSaveDomain = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedDomain = normalizeDomain(domainInput);

    if (!normalizedDomain) {
      setDomainInput('');
      setDomainStatus('not-configured');
      setSettings((previous) => ({ ...previous, customDomain: '' }));
      saveSettings(user, { ...settings, customDomain: '' });
      if (!(await persistProfile({ customDomain: '', customDomainVerified: false }))) {
        toast.error('Não foi possível remover domínio do perfil.');
        return;
      }
      toast.success('Domínio personalizado removido.');
      return;
    }

    if (!isValidDomain(normalizedDomain)) {
      toast.error('Informe um domínio válido, como suaempresa.com.br.');
      return;
    }

    setIsSavingDomain(true);
    setDomainInput(normalizedDomain);
    setDomainStatus('pending');
    setSettings((previous) => ({ ...previous, customDomain: normalizedDomain }));

    if (!(await persistProfile({ customDomain: normalizedDomain, customDomainVerified: false }))) {
      setIsSavingDomain(false);
      setDomainStatus('not-configured');
      toast.error('Não foi possível salvar domínio no perfil. Aplique migration do banco.');
      return;
    }

    saveSettings(user, { ...settings, customDomain: normalizedDomain });
    await new Promise((resolve) => setTimeout(resolve, 350));
    setIsSavingDomain(false);
    toast.success('Domínio salvo. Agora configure o DNS indicado abaixo.');
  };

  const handleCheckDomain = () => {
    if (!domainInput) {
      toast.error('Salve um domínio antes de verificar.');
      return;
    }
    setDomainStatus('pending');
    toast('DNS ainda não detectado. Aguarde a propagação e tente novamente.', { icon: '⌛' });
  };

  const handleCopyValue = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copiado.`);
    } catch {
      toast.error('Não foi possível copiar automaticamente.');
    }
  };

  const handleExportData = () => {
    const payload = JSON.stringify({ profile: user, settings }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pandabio-dados-${user.username || 'conta'}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Exportação iniciada.');
  };

  const handleResetSettings = () => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(getStorageKey(user));
    setSettings({ ...defaultSettings, customDomain: user.customDomain || '' });
    toast.success('Preferências restauradas para o padrão.');
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!passwordData.currentPassword) return void toast.error('Informe sua senha atual.');
    if (passwordData.newPassword.length < 8)
      return void toast.error('A nova senha deve ter pelo menos 8 caracteres.');
    if (passwordData.newPassword !== passwordData.confirmPassword)
      return void toast.error('As novas senhas não coincidem.');
    if (!isSupabaseConfigured())
      return void toast.error(
        'Supabase não configurado. A troca de senha está indisponível neste ambiente.',
      );

    setIsSavingPassword(true);
    const verification = await AuthService.signIn(user.email, passwordData.currentPassword);
    if (!verification.success) {
      setIsSavingPassword(false);
      return void toast.error(verification.error || 'Senha atual inválida.');
    }
    const result = await AuthService.updatePassword(passwordData.newPassword);
    setIsSavingPassword(false);
    if (!result.success)
      return void toast.error(result.error || 'Não foi possível atualizar sua senha.');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    toast.success('Senha atualizada com sucesso.');
  };

  const togglePasswordVisibility = (field: keyof typeof visiblePasswords) => {
    setVisiblePasswords((previous) => ({ ...previous, [field]: !previous[field] }));
  };

  return (
    <div className="mx-auto w-full max-w-6xl animate-fade-in px-3.5 py-6 pb-24 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#ff6600]">
            <span className="inline-flex h-2 w-2 rounded-full bg-[#ff6600]" />
            Painel da conta
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#131b2e] sm:text-3xl">
            Configurações
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#777587]">
            Controle segurança, notificações e preferências da sua experiência no PandaBio.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastSavedAt && (
            <span className="hidden items-center gap-1.5 text-xs font-semibold text-[#10b981] sm:flex">
              <Check className="h-3.5 w-3.5" />
              Salvo às{' '}
              {lastSavedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            type="button"
            onClick={() => void handleSaveSettings()}
            disabled={isSavingSettings}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff6600] px-4 py-2.5 text-sm font-bold text-white shadow-[0_5px_14px_rgba(255,102,0,0.2)] transition hover:bg-[#ff5500] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {isSavingSettings ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
        <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-[#e6e7f2] bg-white p-2 shadow-[0_1px_3px_rgba(15,23,42,0.04)] lg:sticky lg:top-24 lg:flex-col">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`group flex min-w-[145px] items-center gap-3 rounded-xl px-3 py-3 text-left transition lg:min-w-0 ${isActive ? 'bg-[#fff3e6] text-[#ff6600]' : 'text-[#777587] hover:bg-[#faf8ff] hover:text-[#464555]'}`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={isActive ? 2.4 : 2} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">{tab.label}</span>
                  <span className="hidden truncate text-[11px] text-[#969cb0] lg:block">
                    {tab.description}
                  </span>
                </span>
                <ChevronRight className="hidden h-4 w-4 shrink-0 lg:block" />
              </button>
            );
          })}
        </nav>

        <div className="min-w-0 space-y-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#969cb0]">
            <SelectedTabIcon className="h-4 w-4 text-[#ff6600]" />
            <span>Configurações / {selectedTab.label}</span>
          </div>

          {activeTab === 'geral' && (
            <div className="space-y-5">
              <SectionCard
                title="Conta PandaBio"
                description="Dados principais usados para identificar sua conta e acessar o painel."
                icon={<Globe2 className="h-5 w-5" />}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="settings-name">Nome</FieldLabel>
                    <input
                      id="settings-name"
                      className={inputClassName}
                      value={user.name}
                      readOnly
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="settings-username">Nome de usuário</FieldLabel>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-2.5 text-sm text-[#969cb0]">
                        @
                      </span>
                      <input
                        id="settings-username"
                        className={`${inputClassName} pl-7`}
                        value={user.username}
                        readOnly
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <FieldLabel htmlFor="settings-email">E-mail da conta</FieldLabel>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-[#969cb0]" />
                    <input
                      id="settings-email"
                      className={`${inputClassName} pl-10`}
                      value={user.email}
                      readOnly
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-[#969cb0]">
                    Para alterar seu e-mail, fale com o suporte PandaBio.
                  </p>
                </div>
              </SectionCard>
              <SectionCard
                title="Status da conta"
                description="Acompanhe proteção e plano ativos neste momento."
                icon={<ShieldCheck className="h-5 w-5" />}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-xl border border-[#d7f5e9] bg-[#f2fdf8] p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d7f5e9] text-[#10b981]">
                      <Check className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#131b2e]">Conta ativa</p>
                      <p className="text-xs text-[#777587]">Acesso ao painel liberado</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-[#ffe3c7] bg-[#fffaf5] p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ffe3c7] text-[#ff6600]">
                      <KeyRound className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#131b2e]">Plano {user.plan}</p>
                      <p className="text-xs text-[#777587]">Gerencie seu plano na seção Plano</p>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {activeTab === 'dominio' && (
            <div className="space-y-5">
              <SectionCard
                title="Domínio personalizado"
                description="Use seu próprio endereço para transmitir mais confiança e fortalecer sua marca."
                icon={<Link2 className="h-5 w-5" />}
              >
                <div className="rounded-xl border border-[#ffe3c7] bg-[#fffaf5] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ffe3c7] text-[#ff6600]">
                        {domainStatus === 'connected' ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Globe2 className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#131b2e]">
                          {domainInput || 'pandabio.com/' + user.username}
                        </p>
                        <p className="mt-0.5 text-xs text-[#777587]">
                          Status: {getDomainStatusLabel(domainStatus)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        domainStatus === 'connected'
                          ? 'bg-[#d7f5e9] text-[#087f5b]'
                          : domainStatus === 'pending'
                            ? 'bg-[#ffe3c7] text-[#b84a00]'
                            : 'bg-[#f2f3ff] text-[#777587]'
                      }`}
                    >
                      {getDomainStatusLabel(domainStatus)}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSaveDomain} className="space-y-4">
                  <div>
                    <FieldLabel htmlFor="custom-domain">Seu domínio</FieldLabel>
                    <div className="relative">
                      <Globe2 className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-[#969cb0]" />
                      <input
                        id="custom-domain"
                        className={`${inputClassName} pl-10`}
                        placeholder="suaempresa.com.br"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        value={domainInput}
                        onChange={(event) => setDomainInput(event.target.value)}
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-[#969cb0]">
                      Informe somente o domínio, sem https://, www ou caminho.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={handleCheckDomain}
                      disabled={!domainInput || isSavingDomain}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#dfe3f4] px-4 py-2.5 text-sm font-bold text-[#464555] transition hover:bg-[#faf8ff] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Verificar conexão
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingDomain}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff6600] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#ff5500] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Save className="h-4 w-4" />
                      {isSavingDomain ? 'Salvando...' : 'Salvar domínio'}
                    </button>
                  </div>
                </form>
              </SectionCard>

              <SectionCard
                title="Configuração de DNS"
                description="Crie este registro no painel da empresa onde comprou seu domínio."
                icon={<Server className="h-5 w-5" />}
              >
                <div className="space-y-3">
                  <div className="grid gap-3 rounded-xl border border-[#e6e7f2] bg-[#faf8ff] p-4 sm:grid-cols-[100px_1fr_auto] sm:items-center">
                    <span className="text-xs font-bold uppercase tracking-wide text-[#969cb0]">
                      Tipo
                    </span>
                    <div>
                      <p className="text-sm font-bold text-[#131b2e]">CNAME</p>
                      <p className="text-xs text-[#777587]">Aponta subdomínios para o PandaBio</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleCopyValue('CNAME', 'Tipo')}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold text-[#ff6600] hover:bg-[#fff3e6]"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copiar
                    </button>
                  </div>
                  <div className="grid gap-3 rounded-xl border border-[#e6e7f2] bg-[#faf8ff] p-4 sm:grid-cols-[100px_1fr_auto] sm:items-center">
                    <span className="text-xs font-bold uppercase tracking-wide text-[#969cb0]">
                      Destino
                    </span>
                    <div>
                      <p className="break-all text-sm font-bold text-[#131b2e]">
                        {customDomainTarget || 'Destino não configurado'}
                      </p>
                      <p className="text-xs text-[#777587]">Valor de destino do registro CNAME</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleCopyValue(customDomainTarget, 'Destino')}
                      disabled={!customDomainTarget}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold text-[#ff6600] hover:bg-[#fff3e6] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copiar
                    </button>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-xl border border-[#dfe3f4] bg-[#faf8ff] px-3.5 py-3 text-xs leading-5 text-[#777587]">
                  <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-[#ff6600]" />
                  <span>
                    A propagação pode levar até 48 horas. O PandaBio só marcará domínio como
                    conectado após validação do DNS.
                  </span>
                </div>
              </SectionCard>

              <SectionCard
                title="Comportamento da página"
                description="Escolha como sua página deve responder quando o domínio estiver conectado."
                icon={<ExternalLink className="h-5 w-5" />}
              >
                <Toggle
                  checked={settings.customDomainEnabled}
                  onChange={(checked) => updateSetting('customDomainEnabled', checked)}
                  label="Ativar domínio personalizado"
                  description="Permite que o endereço configurado seja usado na sua página pública."
                />
                <Toggle
                  checked={settings.redirectToCustomDomain}
                  onChange={(checked) => updateSetting('redirectToCustomDomain', checked)}
                  label="Redirecionar endereço PandaBio"
                  description="Envia visitantes de pandabio.com para seu domínio personalizado quando ativo."
                />
              </SectionCard>
            </div>
          )}

          {activeTab === 'seguranca' && (
            <div className="space-y-5">
              <SectionCard
                title="Alterar senha"
                description="Use uma senha forte, exclusiva e com pelo menos 8 caracteres."
                icon={<LockKeyhole className="h-5 w-5" />}
              >
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <PasswordField
                    id="current-password"
                    label="Senha atual"
                    value={passwordData.currentPassword}
                    visible={visiblePasswords.currentPassword}
                    onChange={(value) =>
                      setPasswordData((previous) => ({ ...previous, currentPassword: value }))
                    }
                    onToggle={() => togglePasswordVisibility('currentPassword')}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <PasswordField
                      id="new-password"
                      label="Nova senha"
                      value={passwordData.newPassword}
                      visible={visiblePasswords.newPassword}
                      onChange={(value) =>
                        setPasswordData((previous) => ({ ...previous, newPassword: value }))
                      }
                      onToggle={() => togglePasswordVisibility('newPassword')}
                    />
                    <PasswordField
                      id="confirm-password"
                      label="Confirmar nova senha"
                      value={passwordData.confirmPassword}
                      visible={visiblePasswords.confirmPassword}
                      onChange={(value) =>
                        setPasswordData((previous) => ({ ...previous, confirmPassword: value }))
                      }
                      onToggle={() => togglePasswordVisibility('confirmPassword')}
                    />
                  </div>
                  <div className="flex flex-col justify-between gap-3 border-t border-[#f0f0f5] pt-4 sm:flex-row sm:items-center">
                    <p className="text-xs leading-5 text-[#777587]">
                      A sessão pode ser renovada depois da troca para proteger sua conta.
                    </p>
                    <button
                      type="submit"
                      disabled={isSavingPassword}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#ff6600] px-4 py-2.5 text-sm font-bold text-[#ff6600] transition hover:bg-[#fff3e6] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <KeyRound className="h-4 w-4" />
                      {isSavingPassword ? 'Atualizando...' : 'Atualizar senha'}
                    </button>
                  </div>
                </form>
              </SectionCard>
              <SectionCard
                title="Proteção da conta"
                description="Boas práticas para manter seus dados e sua página protegidos."
                icon={<ShieldCheck className="h-5 w-5" />}
              >
                <div className="space-y-3">
                  {[
                    ['Senha forte', 'Sua senha deve misturar letras, números e símbolos.'],
                    ['E-mail protegido', 'Use um e-mail ao qual somente você tenha acesso.'],
                    ['Sessões seguras', 'Evite acessar sua conta em computadores compartilhados.'],
                  ].map(([title, description]) => (
                    <div
                      key={title}
                      className="flex items-start gap-3 rounded-xl bg-[#faf8ff] px-4 py-3"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#10b981]" />
                      <div>
                        <p className="text-sm font-semibold text-[#131b2e]">{title}</p>
                        <p className="mt-0.5 text-xs leading-5 text-[#777587]">{description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          )}

          {activeTab === 'notificacoes' && (
            <div className="space-y-5">
              <SectionCard
                title="Notificações por e-mail"
                description="Receba atualizações importantes e acompanhe sua página sem perder novidades."
                icon={<Mail className="h-5 w-5" />}
              >
                <div className="space-y-3">
                  <Toggle
                    checked={settings.emailNotifications}
                    onChange={(checked) => updateSetting('emailNotifications', checked)}
                    label="Atualizações da conta"
                    description="Alertas sobre acessos, atividades e mudanças importantes."
                  />
                  <Toggle
                    checked={settings.emailMarketing}
                    onChange={(checked) => updateSetting('emailMarketing', checked)}
                    label="Novidades e dicas PandaBio"
                    description="Conteúdos, recursos novos e dicas para melhorar sua bio."
                  />
                </div>
              </SectionCard>
              <SectionCard
                title="Notificações por WhatsApp"
                description="Configure um número para receber alertas rápidos sobre sua operação."
                icon={<MessageCircle className="h-5 w-5" />}
              >
                <div>
                  <FieldLabel htmlFor="whatsapp-number">Número do WhatsApp</FieldLabel>
                  <div className="relative">
                    <Smartphone className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-[#969cb0]" />
                    <input
                      id="whatsapp-number"
                      className={`${inputClassName} pl-10`}
                      inputMode="tel"
                      placeholder="(11) 99999-9999"
                      value={settings.whatsappNumber}
                      onChange={(event) => updateSetting('whatsappNumber', event.target.value)}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-[#969cb0]">
                    Inclua DDD para validar seu número.
                  </p>
                </div>
                <div className="space-y-3">
                  <Toggle
                    checked={settings.whatsappNotifications}
                    onChange={(checked) => updateSetting('whatsappNotifications', checked)}
                    label="Alertas operacionais"
                    description="Novos leads, vendas e eventos importantes da sua página."
                  />
                  <Toggle
                    checked={settings.whatsappSecurity}
                    onChange={(checked) => updateSetting('whatsappSecurity', checked)}
                    label="Alertas de segurança"
                    description="Avisos de login e atividades que precisam da sua atenção."
                  />
                </div>
                <div className="flex items-start gap-2 rounded-xl border border-[#ffe3c7] bg-[#fffaf5] px-3.5 py-3 text-xs leading-5 text-[#777587]">
                  <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#ff6600]" />
                  <span>
                    As preferências ficam salvas nesta conta. A ativação do envio depende da
                    integração de WhatsApp.
                  </span>
                </div>
              </SectionCard>
            </div>
          )}

          {activeTab === 'preferencias' && (
            <div className="space-y-5">
              <SectionCard
                title="Idioma e região"
                description="Defina como o PandaBio deve exibir textos, datas e horários."
                icon={<Languages className="h-5 w-5" />}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="settings-language">Idioma da plataforma</FieldLabel>
                    <select
                      id="settings-language"
                      className={inputClassName}
                      value={settings.language}
                      onChange={(event) =>
                        updateSetting('language', event.target.value as Language)
                      }
                    >
                      <option value="pt-BR">Português (Brasil)</option>
                      <option value="en-US">English (United States)</option>
                      <option value="es-ES">Español (España)</option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel htmlFor="settings-timezone">Fuso horário</FieldLabel>
                    <select
                      id="settings-timezone"
                      className={inputClassName}
                      value={settings.timezone}
                      onChange={(event) => updateSetting('timezone', event.target.value)}
                    >
                      <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                      <option value="America/New_York">Nova York (GMT-4)</option>
                      <option value="Europe/Lisbon">Lisboa (GMT+1)</option>
                      <option value="UTC">UTC (GMT+0)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <FieldLabel htmlFor="settings-date-format">Formato de data</FieldLabel>
                  <select
                    id="settings-date-format"
                    className={inputClassName}
                    value={settings.dateFormat}
                    onChange={(event) =>
                      updateSetting('dateFormat', event.target.value as SettingsState['dateFormat'])
                    }
                  >
                    <option value="dd/MM/yyyy">31/12/2026 (dia/mês/ano)</option>
                    <option value="MM/dd/yyyy">12/31/2026 (mês/dia/ano)</option>
                    <option value="yyyy-MM-dd">2026-12-31 (ano-mês-dia)</option>
                  </select>
                </div>
              </SectionCard>
              <SectionCard
                title="Aparência do painel"
                description="Escolha o visual mais confortável para trabalhar no PandaBio."
                icon={<Monitor className="h-5 w-5" />}
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  <ThemeOption
                    icon={<Sun className="h-5 w-5" />}
                    label="Claro"
                    description="Visual claro"
                    selected={settings.theme === 'light'}
                    onClick={() => updateSetting('theme', 'light')}
                  />
                  <ThemeOption
                    icon={<Moon className="h-5 w-5" />}
                    label="Escuro"
                    description="Visual escuro"
                    selected={settings.theme === 'dark'}
                    onClick={() => updateSetting('theme', 'dark')}
                  />
                  <ThemeOption
                    icon={<Monitor className="h-5 w-5" />}
                    label="Automático"
                    description="Segue seu sistema"
                    selected={settings.theme === 'system'}
                    onClick={() => updateSetting('theme', 'system')}
                  />
                </div>
                <div className="flex items-start gap-2 rounded-xl bg-[#faf8ff] px-3.5 py-3 text-xs leading-5 text-[#777587]">
                  <Monitor className="mt-0.5 h-4 w-4 shrink-0 text-[#969cb0]" />
                  <span>
                    As opções de idioma e aparência ficam preparadas para aplicação global no
                    painel.
                  </span>
                </div>
              </SectionCard>
            </div>
          )}

          {activeTab === 'privacidade' && (
            <div className="space-y-5">
              <SectionCard
                title="Visibilidade da página"
                description="Defina como visitantes e mecanismos de busca podem encontrar sua página."
                icon={<Eye className="h-5 w-5" />}
              >
                <Toggle
                  checked={settings.profileVisible}
                  onChange={(checked) => updateSetting('profileVisible', checked)}
                  label="Página pública ativa"
                  description="Permite que sua página seja acessada pelo endereço público do PandaBio."
                />
                <Toggle
                  checked={settings.contactMessages}
                  onChange={(checked) => updateSetting('contactMessages', checked)}
                  label="Permitir mensagens de contato"
                  description="Exibe canais de contato para que visitantes possam falar com você."
                />
              </SectionCard>
              <SectionCard
                title="Analytics e dados"
                description="Controle coleta de métricas e uso dos dados para melhorar seu painel."
                icon={<BarChart3 className="h-5 w-5" />}
              >
                <Toggle
                  checked={settings.analyticsEnabled}
                  onChange={(checked) => updateSetting('analyticsEnabled', checked)}
                  label="Métricas da página"
                  description="Registra visitas, cliques e conversões para seus relatórios."
                />
                <div className="flex items-start gap-2 rounded-xl border border-[#dfe3f4] bg-[#faf8ff] px-3.5 py-3 text-xs leading-5 text-[#777587]">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#10b981]" />
                  <span>
                    Dados de analytics ficam vinculados ao seu perfil e não exibem informações
                    pessoais de visitantes.
                  </span>
                </div>
              </SectionCard>
            </div>
          )}

          {activeTab === 'avancado' && (
            <div className="space-y-5">
              <SectionCard
                title="Integrações"
                description="Conecte ferramentas externas para medir campanhas e automatizar seus leads."
                icon={<PlugZap className="h-5 w-5" />}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="google-analytics-id">Google Analytics</FieldLabel>
                    <input
                      id="google-analytics-id"
                      className={inputClassName}
                      placeholder="G-XXXXXXXXXX"
                      value={settings.googleAnalyticsId}
                      onChange={(event) => updateSetting('googleAnalyticsId', event.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="meta-pixel-id">Meta Pixel</FieldLabel>
                    <input
                      id="meta-pixel-id"
                      className={inputClassName}
                      placeholder="ID do pixel"
                      value={settings.metaPixelId}
                      onChange={(event) => updateSetting('metaPixelId', event.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel htmlFor="lead-webhook-url">Webhook de leads</FieldLabel>
                  <div className="relative">
                    <Link2 className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-[#969cb0]" />
                    <input
                      id="lead-webhook-url"
                      className={`${inputClassName} pl-10`}
                      type="url"
                      placeholder="https://sua-integracao.com/webhook"
                      value={settings.leadWebhookUrl}
                      onChange={(event) => updateSetting('leadWebhookUrl', event.target.value)}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-[#969cb0]">
                    Use URL HTTPS para receber novos leads automaticamente.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    toast('Salve suas integrações para poder testá-las.', { icon: 'ℹ️' })
                  }
                  className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#dfe3f4] px-4 py-2.5 text-sm font-bold text-[#464555] transition hover:bg-[#faf8ff]"
                >
                  <PlugZap className="h-4 w-4" />
                  Testar integração
                </button>
              </SectionCard>
              <SectionCard
                title="Dados da conta"
                description="Exporte uma cópia das suas configurações ou restaure preferências locais."
                icon={<Save className="h-5 w-5" />}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="flex items-center gap-3 rounded-xl border border-[#e6e7f2] bg-[#faf8ff] p-4 text-left transition hover:border-[#c7c4d8]"
                  >
                    <Save className="h-5 w-5 shrink-0 text-[#ff6600]" />
                    <span>
                      <span className="block text-sm font-bold text-[#131b2e]">
                        Exportar meus dados
                      </span>
                      <span className="mt-0.5 block text-xs text-[#777587]">
                        Baixe perfil e preferências em JSON.
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetSettings}
                    className="flex items-center gap-3 rounded-xl border border-[#e6e7f2] bg-[#faf8ff] p-4 text-left transition hover:border-[#c7c4d8]"
                  >
                    <RefreshCw className="h-5 w-5 shrink-0 text-[#ff6600]" />
                    <span>
                      <span className="block text-sm font-bold text-[#131b2e]">
                        Restaurar preferências
                      </span>
                      <span className="mt-0.5 block text-xs text-[#777587]">
                        Volte opções locais ao padrão.
                      </span>
                    </span>
                  </button>
                </div>
              </SectionCard>
              <SectionCard
                title="Zona de risco"
                description="Ações irreversíveis exigem atendimento do suporte PandaBio."
                icon={<Trash2 className="h-5 w-5" />}
              >
                <div className="flex flex-col gap-3 rounded-xl border border-[#ffd8d8] bg-[#fff7f7] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#9b1c1c]">Excluir conta</p>
                    <p className="mt-0.5 text-xs leading-5 text-[#777587]">
                      Solicite exclusão permanente de perfil, links, produtos e analytics.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#efb4b4] px-4 py-2.5 text-sm font-bold text-[#b34a4a] opacity-60"
                  >
                    <Trash2 className="h-4 w-4" />
                    Falar com suporte
                  </button>
                </div>
              </SectionCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
