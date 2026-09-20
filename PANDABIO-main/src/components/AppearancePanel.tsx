import React, { useEffect, useState } from 'react';
import { X, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageTheme, ThemeType, CategoryPresetId } from '../types';
import {
  FONT_OPTIONS,
  GRADIENT_PRESET_LIST,
  CATEGORY_PRESETS,
  BUTTON_VARIANTS,
  BUTTON_STYLE_OPTIONS,
  BUTTON_SIZES,
  TEXT_SIZES,
  ANIMATION_OPTIONS,
  ANIMATION_CLASS,
  CARD_ANIMATION_OPTIONS,
  ANIMATION_SPEEDS,
  applyCategoryPreset,
  defaultPageTheme,
  resetResidualFields,
} from '../theme/presets';
import { loadGoogleFont } from '../theme/loadFont';
import { StorageService } from '../supabase/services/storageService';
import { buttonFxColors } from '../theme/effectColors';

interface AppearancePanelProps {
  theme: PageTheme;
  onThemeUpdate: (updates: Partial<PageTheme>) => void;
}

const SECTION_TITLE = 'block text-sm font-semibold text-gray-700 mb-2';
const SECTION_HINT = 'block text-xs text-gray-400 mb-2.5';
const FIELD_LABEL = 'block text-xs text-gray-500 mb-1.5';
const INPUT_BASE =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5E00] focus:border-transparent text-sm bg-white';
const SEGMENT_ACTIVE = 'bg-[#FF5E00] text-white border-[#FF5E00]';
const SEGMENT_IDLE = 'border-gray-300 hover:border-gray-400 text-gray-700';

const CATEGORY_COLORS: Record<CategoryPresetId, string> = {
  padrao: '#FF7A00',
  beleza: '#EC4899',
  fitness: '#22c55e',
  comida: '#f97316',
  'salao-masculino': '#f59e0b',
  'salao-feminino': '#a855f7',
  eletronicos: '#06b6d4',
  'panda-men': '#0c0e14',
  'panda-girl': '#db2777',
};

const ColorRow: React.FC<{
  label: string;
  value: string | undefined;
  placeholder?: string;
  onChange: (v: string) => void;
}> = ({ label, value, placeholder, onChange }) => (
  <div>
    <span id={`label-${label.replace(/\W+/g, '-')}`} className={FIELD_LABEL}>
      {label}
    </span>
    <div className="flex items-center gap-2">
      <input
        type="color"
        aria-label={label}
        value={value || placeholder || '#000000'}
        onChange={(e) => onChange(e.target.value)}
        className="w-10 h-9 rounded cursor-pointer border border-gray-200 shrink-0"
      />
      <input
        type="text"
        aria-labelledby={`label-${label.replace(/\W+/g, '-')}`}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={INPUT_BASE}
      />
    </div>
  </div>
);

const Toggle: React.FC<{
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, checked, onChange }) => (
  <label className="flex items-center justify-between gap-2 px-3.5 py-2.5 border border-gray-200 rounded-xl bg-white cursor-pointer">
    <span className="text-sm text-gray-700">{label}</span>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onChange(!checked);
        }
      }}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer ${checked ? 'bg-[#FF5E00]' : 'bg-gray-300'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-0.5'}`}
      />
    </button>
  </label>
);

const Segmented: React.FC<{
  value: string | undefined;
  options: { id: string; label: string }[];
  onSelect: (id: string) => void;
}> = ({ value, options, onSelect }) => (
  <div role="group" className="flex flex-wrap gap-2">
    {options.map((opt) => (
      <button
        key={opt.id}
        type="button"
        aria-pressed={value === opt.id}
        onClick={() => onSelect(opt.id)}
        className={`px-3.5 py-2 border rounded-lg text-sm transition-colors cursor-pointer ${
          value === opt.id ? SEGMENT_ACTIVE : SEGMENT_IDLE
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

export const AppearancePanel: React.FC<AppearancePanelProps> = ({ theme, onThemeUpdate }) => {
  const [editMode, setEditMode] = useState<'claro' | 'escuro'>(
    theme.theme === 'dark' ? 'escuro' : 'claro',
  );

  // Mantém a aba de edição sincronizada com o modo selecionado/preset aplicado
  useEffect(() => {
    setEditMode(theme.theme === 'dark' ? 'escuro' : 'claro');
  }, [theme.theme]);

  useEffect(() => {
    loadGoogleFont(theme.fontFamily);
  }, [theme.fontFamily]);

  const applyPreset = (id: CategoryPresetId) => {
    onThemeUpdate(applyCategoryPreset(theme, id));
  };

  const gradientFrom = theme.customGradientFrom || theme.backgroundColorGradient?.from || '#FF7A00';
  const gradientTo = theme.customGradientTo || theme.backgroundColorGradient?.to || '#FF2E63';
  // Fonte única para o gradiente personalizado (evita o ângulo/cores "sumirem"
  // ao editar apenas um lado).
  const gradientBase = theme.backgroundColorGradient || {
    from: gradientFrom,
    to: gradientTo,
    angle: 135,
  };

  const effectFx = buttonFxColors('#ffffff', theme.customButtonColor || '#FF5E00');
  const effectFxVars = {
    '--ac': effectFx.ac,
    '--ac-fill': effectFx.fill,
    '--ac-text': effectFx.text,
  } as React.CSSProperties;

  return (
    <div className="space-y-6">
      {/* Temas prontos por categoria */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className={SECTION_TITLE + ' mb-0'}>Modelo por categoria</h3>
          <button
            onClick={() => onThemeUpdate({ ...defaultPageTheme(), ...resetResidualFields() })}
            title="Restaurar configuração padrão"
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#FF5E00] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Restaurar padrão
          </button>
        </div>
        <p className={SECTION_HINT}>Aplique um visual pronto para o seu segmento</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {CATEGORY_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const active = theme.categoryPreset === preset.id;
            const color = CATEGORY_COLORS[preset.id];
            return (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.id)}
                aria-pressed={active}
                title={preset.description}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                  active
                    ? 'border-[#FF5E00] bg-[#FFF3E6] shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 bg-white'
                }`}
              >
                <span
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${color}1a`, color }}
                >
                  <Icon className="w-4.5 h-4.5" />
                </span>
                <span
                  className={`text-[11px] font-semibold leading-tight text-center ${active ? 'text-[#FF5E00]' : 'text-gray-700'}`}
                >
                  {preset.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tema claro/escuro */}
      <div>
        <h3 className={SECTION_TITLE}>Modo de exibição</h3>
        <Segmented
          value={theme.theme}
          options={[
            { id: 'light', label: 'Claro' },
            { id: 'dark', label: 'Escuro' },
            { id: 'auto', label: 'Auto' },
          ]}
          onSelect={(id) => onThemeUpdate({ theme: id as ThemeType })}
        />
        <p className="text-[11px] text-gray-400 mt-1.5">
          Em cores personalizadas, o modo define qual conjunto de cores (claras ou escuras) é
          exibido no preview.
        </p>
      </div>

      {/* Cores por tema */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700">Cores por tema</h3>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            {(['claro', 'escuro'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setEditMode(mode)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${editMode === mode ? 'bg-white shadow-sm text-[#FF5E00]' : 'text-gray-500'}`}
              >
                {mode === 'claro' ? 'Claro' : 'Escuro'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {editMode === 'claro' ? (
            <ColorRow
              label="Cor do texto (claro)"
              value={theme.textColor}
              placeholder="#131b2e"
              onChange={(v) => onThemeUpdate({ textColor: v })}
            />
          ) : (
            <ColorRow
              label="Cor do texto (escuro)"
              value={theme.textColorDark}
              placeholder="#ffffff"
              onChange={(v) => onThemeUpdate({ textColorDark: v })}
            />
          )}
        </div>
      </div>

      {/* Fundo */}
      <div>
        <h3 className={SECTION_TITLE}>Fundo</h3>
        <div className="flex gap-2 mb-3">
          <select
            value={theme.backgroundType}
            onChange={(e) =>
              onThemeUpdate({ backgroundType: e.target.value as 'color' | 'gradient' | 'image' })
            }
            className={`${INPUT_BASE} w-auto`}
          >
            <option value="color">Cor</option>
            <option value="gradient">Gradiente</option>
            <option value="image">Imagem</option>
          </select>
        </div>

        {theme.backgroundType === 'gradient' && (
          <div className="space-y-3">
            <div>
              <span className={FIELD_LABEL}>Gradientes prontos</span>
              <div className="grid grid-cols-4 gap-2">
                {GRADIENT_PRESET_LIST.map((g) => {
                  const isSelected =
                    (theme.customGradientFrom === g.from && theme.customGradientTo === g.to) ||
                    (!theme.customGradientFrom &&
                      theme.backgroundColorGradient?.from === g.from &&
                      theme.backgroundColorGradient?.to === g.to);
                  return (
                    <button
                      key={g.key}
                      onClick={() =>
                        onThemeUpdate({
                          customGradientFrom: undefined,
                          customGradientTo: undefined,
                          backgroundColorGradient: {
                            from: g.from,
                            to: g.to,
                            angle: gradientBase.angle,
                          },
                        })
                      }
                      title={g.label}
                      className={`h-11 rounded-xl border-2 transition-all cursor-pointer ${isSelected ? 'border-[#FF5E00] scale-[0.97]' : 'border-transparent hover:scale-[0.96]'}`}
                      style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
                      aria-label={`Gradiente ${g.label}`}
                    />
                  );
                })}
              </div>
            </div>
            <div>
              <span className={FIELD_LABEL}>Gradiente personalizado</span>
              <div className="grid grid-cols-2 gap-2">
                <ColorRow
                  label="Cor inicial"
                  value={gradientFrom}
                  onChange={(v) =>
                    onThemeUpdate({
                      customGradientFrom: undefined,
                      customGradientTo: undefined,
                      backgroundColorGradient: { ...gradientBase, from: v },
                    })
                  }
                />
                <ColorRow
                  label="Cor final"
                  value={gradientTo}
                  onChange={(v) =>
                    onThemeUpdate({
                      customGradientFrom: undefined,
                      customGradientTo: undefined,
                      backgroundColorGradient: { ...gradientBase, to: v },
                    })
                  }
                />
              </div>
            </div>
            <div>
              <span className="block text-xs text-gray-500 mb-1.5">
                Ângulo: {gradientBase.angle ?? 135}°
              </span>
              <input
                type="range"
                min={0}
                max={360}
                value={gradientBase.angle ?? 135}
                onChange={(e) =>
                  onThemeUpdate({
                    customGradientFrom: undefined,
                    customGradientTo: undefined,
                    backgroundColorGradient: { ...gradientBase, angle: Number(e.target.value) },
                  })
                }
                className="w-full accent-[#FF5E00]"
              />
            </div>
          </div>
        )}

        {theme.backgroundType === 'color' && (
          <ColorRow
            label={editMode === 'claro' ? 'Cor de fundo (claro)' : 'Cor de fundo (escuro)'}
            value={
              editMode === 'claro' ? theme.backgroundColor : theme.backgroundColorDark || undefined
            }
            placeholder={editMode === 'claro' ? '#ffffff' : '#0f172a'}
            onChange={(v) =>
              editMode === 'claro'
                ? onThemeUpdate({ backgroundColor: v })
                : onThemeUpdate({ backgroundColorDark: v })
            }
          />
        )}

        {theme.backgroundType === 'image' && (
          <div className="space-y-2">
            <input
              type="text"
              value={theme.backgroundImage || ''}
              onChange={(e) => onThemeUpdate({ backgroundImage: e.target.value })}
              placeholder="Colar URL de uma imagem de fundo"
              className={INPUT_BASE}
            />
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (!file.type.startsWith('image/')) {
                    toast.error('Formato de imagem inválido');
                    return;
                  }
                  const previousUrl = theme.backgroundImage;
                  const result = await StorageService.uploadImage(file, 'background', {
                    maxDim: 1600,
                    quality: 0.82,
                  });
                  e.target.value = '';
                  if (!result.success || !result.url) {
                    toast.error(result.error || 'Não foi possível processar a imagem');
                    return;
                  }
                  onThemeUpdate({ backgroundImage: result.url });
                  if (result.path) StorageService.deleteByUrl(previousUrl);
                }}
                className="text-xs text-gray-500 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-[#f2f3ff] file:text-[#FF5E00] file:text-xs file:font-semibold cursor-pointer"
              />
              {theme.backgroundImage && (
                <button
                  onClick={() => {
                    StorageService.deleteByUrl(theme.backgroundImage);
                    onThemeUpdate({ backgroundImage: undefined });
                  }}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Remover
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Capa */}
      <div>
        <h3 className={SECTION_TITLE}>Capa</h3>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className={FIELD_LABEL + ' mb-0'}>Altura da capa</span>
              <span className="text-xs font-semibold text-gray-500">
                {Math.max(128, Math.min(340, theme.coverHeight ?? 200))}px
              </span>
            </div>
            <input
              type="range"
              min={128}
              max={340}
              step={8}
              aria-label="Altura da capa"
              aria-valuetext={`${Math.max(128, Math.min(340, theme.coverHeight ?? 200))} pixels`}
              value={Math.max(128, Math.min(340, theme.coverHeight ?? 200))}
              onChange={(e) => onThemeUpdate({ coverHeight: Number(e.target.value) })}
              className="w-full accent-[#FF5E00] cursor-pointer"
            />
            <p className={SECTION_HINT + ' mt-1'}>
              A capa vira o fundo do cabeçalho, com foto e informações por cima.
            </p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className={FIELD_LABEL + ' mb-0'}>Intensidade do degradê</span>
              <span className="text-xs font-semibold text-gray-500">
                {Math.max(0, Math.min(100, theme.coverFadeIntensity ?? 60))}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              aria-label="Intensidade do degradê da capa"
              aria-valuetext={`${Math.max(0, Math.min(100, theme.coverFadeIntensity ?? 60))} por cento`}
              value={Math.max(0, Math.min(100, theme.coverFadeIntensity ?? 60))}
              onChange={(e) => onThemeUpdate({ coverFadeIntensity: Number(e.target.value) })}
              className="w-full accent-[#FF5E00] cursor-pointer"
            />
            <p className={SECTION_HINT + ' mt-1'}>
              Controla o escurecimento e a fusão da capa com o fundo da página.
            </p>
          </div>
        </div>
      </div>

      {/* Botão */}
      <div>
        <h3 className={SECTION_TITLE}>Botão</h3>
        <div className="space-y-3">
          <div>
            <span className={FIELD_LABEL}>Formato</span>
            <Segmented
              value={theme.buttonStyle}
              options={BUTTON_STYLE_OPTIONS.map((s) => ({ id: s.id, label: s.label }))}
              onSelect={(id) => onThemeUpdate({ buttonStyle: id as PageTheme['buttonStyle'] })}
            />
          </div>
          <div>
            <span className={FIELD_LABEL}>Estilo</span>
            <Segmented
              value={theme.buttonVariant}
              options={BUTTON_VARIANTS.map((v) => ({ id: v.id, label: v.label }))}
              onSelect={(id) => onThemeUpdate({ buttonVariant: id as PageTheme['buttonVariant'] })}
            />
          </div>
          <div>
            <span className={FIELD_LABEL}>Tamanho</span>
            <Segmented
              value={theme.buttonSize}
              options={BUTTON_SIZES.map((s) => ({ id: s.id, label: s.label }))}
              onSelect={(id) => onThemeUpdate({ buttonSize: id as PageTheme['buttonSize'] })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ColorRow
              label="Cor do botão"
              value={theme.customButtonColor}
              placeholder="#FF5E00"
              onChange={(v) => onThemeUpdate({ customButtonColor: v })}
            />
            <ColorRow
              label="Texto do botão"
              value={theme.customButtonTextColor}
              placeholder="#ffffff"
              onChange={(v) => onThemeUpdate({ customButtonTextColor: v })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Toggle
              label="Sombra no botão"
              checked={theme.buttonShadow !== false}
              onChange={(v) => onThemeUpdate({ buttonShadow: v })}
            />
            <Toggle
              label="Brilho no botão"
              checked={theme.buttonGlow === true}
              onChange={(v) => onThemeUpdate({ buttonGlow: v })}
            />
          </div>
        </div>
      </div>

      {/* Fonte */}
      <div>
        <h3 className={SECTION_TITLE}>Fonte e tamanho</h3>
        <div className="space-y-3">
          <div>
            <span className={FIELD_LABEL}>Fonte</span>
            <select
              value={theme.fontFamily}
              onChange={(e) => onThemeUpdate({ fontFamily: e.target.value })}
              style={{ fontFamily: `'${theme.fontFamily}', sans-serif` }}
              className={INPUT_BASE}
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.name} value={f.name} style={{ fontFamily: f.css }}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className={FIELD_LABEL}>Tamanho do texto</span>
            <Segmented
              value={theme.textSize}
              options={TEXT_SIZES.map((s) => ({ id: s.id, label: s.label }))}
              onSelect={(id) => onThemeUpdate({ textSize: id as PageTheme['textSize'] })}
            />
          </div>
        </div>
      </div>

      {/* Animações */}
      <div>
        <h3 className={SECTION_TITLE}>Animações</h3>
        <Toggle
          label="Ativar animações"
          checked={theme.animationsEnabled !== false}
          onChange={(v) => onThemeUpdate({ animationsEnabled: v })}
        />

        {theme.animationsEnabled !== false && (
          <div className="space-y-4 mt-4">
            <div>
              <span className={FIELD_LABEL}>Ao passar o mouse</span>
              <div className="flex flex-wrap gap-2">
                {ANIMATION_OPTIONS.map((a) => {
                  const active = theme.animationEffect === a.id;
                  return (
                    <button
                      key={a.id}
                      onClick={() => onThemeUpdate({ animationEffect: a.id })}
                      style={effectFxVars}
                      className={`px-3.5 py-2 border rounded-lg text-sm transition-all cursor-pointer ${
                        active ? SEGMENT_ACTIVE : SEGMENT_IDLE
                      } ${active ? '' : ANIMATION_CLASS[a.id]}`}
                    >
                      {a.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className={FIELD_LABEL}>Entrada dos cards</span>
              <div className="flex flex-wrap gap-2">
                {CARD_ANIMATION_OPTIONS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onThemeUpdate({ cardAnimation: a.id })}
                    className={`px-3.5 py-2 border rounded-lg text-sm transition-colors cursor-pointer ${theme.cardAnimation === a.id ? SEGMENT_ACTIVE : SEGMENT_IDLE}`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className={FIELD_LABEL}>Velocidade</span>
              <Segmented
                value={theme.animationSpeed}
                options={ANIMATION_SPEEDS.map((s) => ({ id: s.id, label: s.label }))}
                onSelect={(id) =>
                  onThemeUpdate({ animationSpeed: id as PageTheme['animationSpeed'] })
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
