import React, { memo, useState } from 'react';
import {
  Palette,
  Type,
  Layout,
  Monitor,
  Moon,
  Sun,
  CheckCircle2,
  Sparkles,
  MousePointerClick
} from 'lucide-react';

export const AppearanceSection: React.FC = memo(() => {
  const [activeTheme, setActiveTheme] = useState<'light' | 'dark' | 'auto'>('auto');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [buttonStyle, setButtonStyle] = useState('rounded');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
    }, 800);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 sm:py-10 px-4 sm:px-6 lg:px-8 pb-24 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#131b2e] tracking-tight">
            Aparência
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Personalize a identidade visual e o estilo global da sua página.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#10B981] hover:bg-[#059669] disabled:bg-[#10B981]/70 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-sm shadow-[#10B981]/30 transition-all hover:-translate-y-0.5 self-start sm:self-auto shrink-0 w-full sm:w-auto"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <CheckCircle2 aria-hidden="true" className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Theme Mode */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Palette aria-hidden="true" className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#131b2e]">Tema Principal</h2>
                <p className="text-sm text-gray-500">Escolha o modo de cores da sua página.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {[
                { id: 'light', label: 'Claro', icon: Sun },
                { id: 'dark', label: 'Escuro', icon: Moon },
                { id: 'auto', label: 'Automático', icon: Monitor },
              ].map((theme) => {
                const Icon = theme.icon;
                const isActive = activeTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setActiveTheme(theme.id as any)}
                    className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      isActive
                        ? 'border-[#10B981] bg-emerald-50/50'
                        : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <Icon
                      aria-hidden="true"
                      className={`w-6 h-6 ${isActive ? 'text-[#10B981]' : 'text-gray-400'}`}
                    />
                    <span
                      className={`text-sm font-bold ${isActive ? 'text-[#10B981]' : 'text-gray-600'}`}
                    >
                      {theme.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Typography */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                <Type aria-hidden="true" className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#131b2e]">Tipografia</h2>
                <p className="text-sm text-gray-500">Defina a fonte principal dos textos.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {['Inter', 'Roboto', 'Poppins', 'Montserrat', 'Playfair Display', 'Oswald'].map(
                (font) => {
                  const isActive = fontFamily === font;
                  return (
                    <button
                      key={font}
                      type="button"
                      onClick={() => setFontFamily(font)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                        isActive
                          ? 'border-[#10B981] bg-emerald-50/50 text-[#10B981]'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <span className="text-sm font-bold truncate" style={{ fontFamily: font }}>
                        {font}
                      </span>
                      {isActive && <CheckCircle2 aria-hidden="true" className="w-4 h-4 shrink-0" />}
                    </button>
                  );
                }
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          {/* Button Styles */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                <MousePointerClick aria-hidden="true" className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#131b2e]">Botões</h2>
                <p className="text-sm text-gray-500">Estilo dos links e ações.</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              {[
                { id: 'square', label: 'Quadrado', class: 'rounded-none' },
                { id: 'rounded', label: 'Arredondado', class: 'rounded-xl' },
                { id: 'pill', label: 'Pílula', class: 'rounded-full' },
              ].map((style) => {
                const isActive = buttonStyle === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setButtonStyle(style.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      isActive
                        ? 'border-[#10B981] bg-emerald-50/50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className={`w-12 h-6 bg-gray-900 shrink-0 ${style.class}`}
                      aria-hidden="true"
                    />
                    <span
                      className={`text-sm font-bold flex-1 text-left ${isActive ? 'text-[#10B981]' : 'text-gray-700'}`}
                    >
                      {style.label}
                    </span>
                    {isActive && <CheckCircle2 aria-hidden="true" className="w-4 h-4 text-[#10B981]" />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Preset Banners */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-sm relative overflow-hidden">
            <Sparkles aria-hidden="true" className="absolute top-4 right-4 w-12 h-12 text-white/10" />
            <h3 className="text-lg font-bold mb-2 relative z-10">Desbloqueie Temas PRO</h3>
            <p className="text-indigo-100 text-sm mb-4 relative z-10">
              Tenha acesso a mais de 50 temas premium e personalização avançada de CSS.
            </p>
            <button
              type="button"
              className="w-full py-2.5 bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl text-sm font-bold transition-colors relative z-10"
            >
              Fazer Upgrade
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

AppearanceSection.displayName = 'AppearanceSection';
