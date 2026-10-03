import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Copy, Plus, Save, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomForm, CustomFormField, CustomFormFieldType, PageData, UserProfile } from '../types';
import { PageService } from '../supabase/services/pageService';
import { ProfileService } from '../supabase/services/profileService';
import { createDefaultCustomForm, normalizeForms, normalizePageData } from '../utils/pageData';

interface FormsSectionProps {
  user: UserProfile;
}

const inputClass =
  'w-full rounded-xl border border-[#e6e8f0] bg-[#fafbff] px-3 py-2.5 text-sm text-[#131b2e] outline-none transition focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/15';

const createFieldId = () =>
  typeof globalThis.crypto?.randomUUID === 'function'
    ? `field-${globalThis.crypto.randomUUID()}`
    : `field-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

function fieldTypeLabel(type: CustomFormFieldType): string {
  return { text: 'Texto', email: 'E-mail', phone: 'WhatsApp', textarea: 'Texto longo' }[type];
}

export const FormsSection: React.FC<FormsSectionProps> = ({ user }) => {
  const [forms, setForms] = useState<CustomForm[]>([]);
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [editing, setEditing] = useState<CustomForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      const id = await ProfileService.getCurrentProfileId();
      if (!mounted) return;
      setProfileId(id);
      if (!id) {
        setIsLoading(false);
        return;
      }
      const result = await PageService.loadPageData(id);
      if (!mounted) return;
      if (result.success) {
        const loaded = normalizePageData(result.pageData, user);
        setPageData(loaded);
        setForms(normalizeForms(loaded.forms));
      } else {
        toast.error(result.error || 'Não foi possível carregar formulários.');
      }
      setIsLoading(false);
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [user]);

  const saveForms = async (nextForms: CustomForm[]) => {
    if (!profileId || !pageData) {
      toast.error('Perfil ainda não está disponível para salvar.');
      return false;
    }
    setIsSaving(true);
    const nextPageData = normalizePageData({ ...pageData, forms: nextForms }, user);
    const result = await PageService.savePageData(profileId, nextPageData);
    setIsSaving(false);
    if (!result.success) {
      toast.error(result.error || 'Não foi possível salvar o formulário.');
      return false;
    }
    setPageData(nextPageData);
    setForms(normalizeForms(nextPageData.forms));
    return true;
  };

  const startNew = () => setEditing(createDefaultCustomForm());

  const updateEditing = (updates: Partial<CustomForm>) => {
    setEditing((current) => (current ? { ...current, ...updates } : current));
  };

  const updateField = (fieldId: string, updates: Partial<CustomFormField>) => {
    setEditing((current) =>
      current
        ? { ...current, fields: current.fields.map((field) => (field.id === fieldId ? { ...field, ...updates } : field)) }
        : current,
    );
  };

  const addField = () => {
    setEditing((current) =>
      current
        ? {
            ...current,
            fields: [
              ...current.fields,
              {
                id: createFieldId(),
                label: 'Novo campo',
                type: 'text',
                placeholder: 'Digite uma resposta',
                required: false,
              },
            ],
          }
        : current,
    );
  };

  const removeField = (fieldId: string) => {
    if (fieldId === 'name' || fieldId === 'email') {
      toast.error('Nome e e-mail são obrigatórios para criar o lead.');
      return;
    }
    setEditing((current) =>
      current ? { ...current, fields: current.fields.filter((field) => field.id !== fieldId) } : current,
    );
  };

  const saveEditing = async () => {
    if (!editing?.name.trim() || !editing.title.trim()) {
      toast.error('Informe nome interno e título do formulário.');
      return;
    }
    if (!editing.fields.some((field) => field.id === 'name')) {
      toast.error('Formulário precisa ter campo Nome.');
      return;
    }
    if (!editing.fields.some((field) => field.id === 'email')) {
      toast.error('Formulário precisa ter campo E-mail.');
      return;
    }
    const next = {
      ...editing,
      updatedAt: new Date().toISOString(),
      fields: editing.fields.map((field) => ({ ...field, label: field.label.trim() || 'Campo' })),
    };
    const nextForms = forms.some((form) => form.id === next.id)
      ? forms.map((form) => (form.id === next.id ? next : form))
      : [next, ...forms];
    if (await saveForms(nextForms)) {
      setEditing(null);
      toast.success('Formulário salvo.');
    }
  };

  const duplicateForm = (form: CustomForm) => {
    const copy = {
      ...form,
      id:
        typeof globalThis.crypto?.randomUUID === 'function'
          ? globalThis.crypto.randomUUID()
          : `form-${Date.now()}`,
      name: `${form.name} (cópia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fields: form.fields.map((field) => ({ ...field })),
    };
    void saveForms([copy, ...forms]).then((success) => {
      if (success) toast.success('Formulário duplicado.');
    });
  };

  const deleteForm = (form: CustomForm) => {
    if (!window.confirm(`Excluir o formulário “${form.name}”?`)) return;
    void saveForms(forms.filter((item) => item.id !== form.id)).then((success) => {
      if (success) toast.success('Formulário excluído.');
    });
  };

  const formCountLabel = useMemo(
    () => `${forms.length} ${forms.length === 1 ? 'formulário criado' : 'formulários criados'}`,
    [forms.length],
  );

  if (isLoading) {
    return <div className="flex min-h-[420px] items-center justify-center text-sm text-[#667085]">Carregando formulários...</div>;
  }

  return (
    <section className="space-y-6" aria-labelledby="forms-section-title">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#ff7a00]">Captação</p>
          <h1 id="forms-section-title" className="mt-1 text-2xl font-extrabold tracking-tight text-[#131b2e]">Formulários</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#667085]">Crie formulários personalizados para captar clientes e acompanhe tudo em Leads.</p>
        </div>
        <button type="button" onClick={startNew} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff7a00] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-105">
          <Plus className="h-4 w-4" aria-hidden="true" /> Criar formulário
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#eceef5] bg-white p-5 shadow-sm"><p className="text-xs font-semibold text-[#667085]">Formulários</p><p className="mt-2 text-2xl font-extrabold text-[#131b2e]">{forms.length}</p></div>
        <div className="rounded-2xl border border-[#eceef5] bg-white p-5 shadow-sm"><p className="text-xs font-semibold text-[#667085]">Campos personalizados</p><p className="mt-2 text-2xl font-extrabold text-[#131b2e]">{forms.reduce((total, form) => total + form.fields.filter((field) => !['name', 'email', 'phone'].includes(field.id)).length, 0)}</p></div>
        <div className="rounded-2xl border border-[#eceef5] bg-white p-5 shadow-sm"><p className="text-xs font-semibold text-[#667085]">Status</p><p className="mt-2 text-sm font-extrabold text-emerald-600">{formCountLabel}</p></div>
      </div>

      {forms.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-[#dfe3ee] bg-white p-10 text-center shadow-sm">
          <ClipboardList className="mx-auto h-10 w-10 text-[#ff7a00]" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-extrabold text-[#131b2e]">Crie seu primeiro formulário</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#667085]">Defina campos, consentimento e mensagem de sucesso. Depois adicione o formulário em Minha Página &gt; Blocos.</p>
          <button type="button" onClick={startNew} className="mt-5 rounded-xl bg-[#131b2e] px-4 py-2.5 text-sm font-bold text-white">Começar</button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {forms.map((form) => (
            <article key={form.id} className="rounded-2xl border border-[#eceef5] bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><h2 className="truncate text-base font-extrabold text-[#131b2e]">{form.name}</h2><p className="mt-1 text-sm text-[#667085]">{form.title}</p></div>
                <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">Pronto</span>
              </div>
              <p className="mt-4 line-clamp-2 text-sm text-[#667085]">{form.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">{form.fields.map((field) => <span key={field.id} className="rounded-lg bg-[#f5f6fb] px-2.5 py-1 text-[11px] font-semibold text-[#667085]">{field.label}{field.required ? ' *' : ''}</span>)}</div>
              <div className="mt-5 flex flex-wrap gap-2 border-t border-[#f0f1f5] pt-4">
                <button type="button" onClick={() => setEditing({ ...form, fields: form.fields.map((field) => ({ ...field })) })} className="rounded-lg bg-[#131b2e] px-3 py-2 text-xs font-bold text-white">Editar</button>
                <button type="button" onClick={() => duplicateForm(form)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#e1e4ec] px-3 py-2 text-xs font-bold text-[#344054]"><Copy className="h-3.5 w-3.5" aria-hidden="true" /> Duplicar</button>
                <button type="button" onClick={() => deleteForm(form)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-xs font-bold text-red-600"><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Excluir</button>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && (
        <div className="rounded-3xl border border-[#e7e9f1] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-extrabold text-[#131b2e]">{forms.some((form) => form.id === editing.id) ? 'Editar formulário' : 'Novo formulário'}</h2><p className="mt-1 text-sm text-[#667085]">Campos Nome e E-mail identificam o lead. Os demais campos ficam disponíveis em detalhes.</p></div><button type="button" onClick={() => setEditing(null)} aria-label="Fechar editor" className="rounded-lg p-2 text-[#667085] hover:bg-[#f5f6fb]"><X className="h-5 w-5" aria-hidden="true" /></button></div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="text-xs font-bold text-[#344054]">Nome interno<input className={`${inputClass} mt-1.5`} value={editing.name} onChange={(event) => updateEditing({ name: event.target.value })} placeholder="Ex.: Captura de orçamento" /></label>
            <label className="text-xs font-bold text-[#344054]">Título público<input className={`${inputClass} mt-1.5`} value={editing.title} onChange={(event) => updateEditing({ title: event.target.value })} placeholder="Receba uma proposta" /></label>
            <label className="text-xs font-bold text-[#344054] md:col-span-2">Descrição<textarea className={`${inputClass} mt-1.5 min-h-20 resize-y`} value={editing.description || ''} onChange={(event) => updateEditing({ description: event.target.value })} /></label>
            <label className="text-xs font-bold text-[#344054]">Texto do botão<input className={`${inputClass} mt-1.5`} value={editing.buttonLabel} onChange={(event) => updateEditing({ buttonLabel: event.target.value })} /></label>
            <label className="text-xs font-bold text-[#344054]">Mensagem de sucesso<input className={`${inputClass} mt-1.5`} value={editing.successMessage} onChange={(event) => updateEditing({ successMessage: event.target.value })} /></label>
            <label className="text-xs font-bold text-[#344054] md:col-span-2">Texto de consentimento<input className={`${inputClass} mt-1.5`} value={editing.consentText} onChange={(event) => updateEditing({ consentText: event.target.value })} /></label>
          </div>

          <div className="mt-7 rounded-2xl border border-[#edf0f5] bg-[#fafbff] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-extrabold text-[#131b2e]">Campos do formulário</h3><p className="mt-1 text-xs text-[#667085]">Personalize rótulos, placeholders e obrigatoriedade.</p></div><button type="button" onClick={addField} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-[#ff7a00] shadow-sm ring-1 ring-[#ff7a00]/20"><Plus className="h-3.5 w-3.5" aria-hidden="true" /> Adicionar campo</button></div>
            <div className="mt-4 space-y-3">
              {editing.fields.map((field) => (
                <div key={field.id} className="grid gap-3 rounded-xl border border-[#e7eaf2] bg-white p-3 md:grid-cols-[1fr_150px_1fr_auto] md:items-end">
                  <label className="text-[11px] font-bold text-[#667085]">Rótulo<input className={`${inputClass} mt-1`} value={field.label} onChange={(event) => updateField(field.id, { label: event.target.value })} /></label>
                  <label className="text-[11px] font-bold text-[#667085]">Tipo<select className={`${inputClass} mt-1`} value={field.type} onChange={(event) => updateField(field.id, { type: event.target.value as CustomFormFieldType })}>{(['text', 'email', 'phone', 'textarea'] as CustomFormFieldType[]).map((type) => <option key={type} value={type}>{fieldTypeLabel(type)}</option>)}</select></label>
                  <label className="text-[11px] font-bold text-[#667085]">Placeholder<input className={`${inputClass} mt-1`} value={field.placeholder || ''} onChange={(event) => updateField(field.id, { placeholder: event.target.value })} /></label>
                  <div className="flex items-center justify-between gap-3 md:flex-col md:items-end"><label className="flex items-center gap-2 text-[11px] font-bold text-[#667085]"><input type="checkbox" checked={field.required} onChange={(event) => updateField(field.id, { required: event.target.checked })} className="h-4 w-4 accent-[#ff7a00]" /> Obrigatório</label><button type="button" onClick={() => removeField(field.id)} aria-label={`Excluir campo ${field.label}`} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" aria-hidden="true" /></button></div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-[#e1e4ec] px-4 py-2.5 text-sm font-bold text-[#344054]">Cancelar</button><button type="button" onClick={() => void saveEditing()} disabled={isSaving} className="inline-flex items-center gap-2 rounded-xl bg-[#ff7a00] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"><Save className="h-4 w-4" aria-hidden="true" /> {isSaving ? 'Salvando...' : 'Salvar formulário'}</button></div>
        </div>
      )}
    </section>
  );
};
