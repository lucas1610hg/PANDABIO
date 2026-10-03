import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Eye,
  Copy,
  Smartphone,
  Monitor,
  Check,
  Loader2,
  Plus,
  User,
  Settings,
  Link2,
  Type,
  Image,
  Video,
  Calendar,
  ShoppingBag,
  Mail,
  ClipboardList,
  Music,
  MapPin,
  Package,
  ArrowUp,
  ArrowDown,
  Trash2,
  CopyPlus,
  Power,
  ImagePlus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import {
  BioLink,
  BlockType,
  PageBlock,
  PageData,
  PageTheme,
  ProductItem,
  UserProfile,
} from '../types';
import { AddBlockModal } from './AddBlockModal';
import { BlockConfigModal } from './BlockConfigModal';
import { PagePreview } from './PagePreview';
import { AppearancePanel } from './AppearancePanel';
import { PageService } from '../supabase/services/pageService';
import { ProfileService } from '../supabase/services/profileService';
import { StorageService } from '../supabase/services/storageService';
import { supabase } from '../supabase/client';
import { getPageUrl } from '../utils/pageUrl';
import {
  PublicAvailabilityService,
  WorkspaceService,
} from '../supabase/services/agendamentoService';
import { PublicBookingAvailability } from '../types_agendamentos';
import {
  createDefaultPageData,
  createDefaultCustomForm,
  createPageBlock,
  duplicatePageBlock,
  movePageBlock,
  normalizePageData,
  reorderPageBlocks,
  touchPageData,
} from '../utils/pageData';

interface PageEditorProps {
  user: UserProfile;
  links?: BioLink[];
  products?: ProductItem[];
}

export const PageEditor: React.FC<PageEditorProps> = ({ user, links = [], products = [] }) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [copySuccess, setCopySuccess] = useState(false);
  const [isAddBlockModalOpen, setIsAddBlockModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<PageBlock | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const hasLoadedRef = useRef(false);
  const bookingPreviewLoadedRef = useRef(false);
  const [pageData, setPageData] = useState<PageData>(() => createDefaultPageData(user));
  const [bookingAvailability, setBookingAvailability] = useState<PublicBookingAvailability[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const pageDataRef = useRef(pageData);
  const profileIdRef = useRef<string | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const saveInFlightRef = useRef(false);
  const queuedPageDataRef = useRef<typeof pageData | null>(null);
  const flushPageSaveRef = useRef<() => Promise<boolean>>(async () => false);
  const loadFailedRef = useRef(false);
  const skipNextSaveRef = useRef(false);
  const userSnapshotRef = useRef(JSON.stringify(user));

  useEffect(() => {
    pageDataRef.current = pageData;
  }, [pageData]);

  // Resolve o id da linha do perfil no banco; cria a linha se ainda não existir
  // (fallback caso o trigger handle_new_user não tenha criado o registro).
  const getOrCreateProfileId = useCallback(async (): Promise<string | null> => {
    if (!supabase) return null;

    if (profileIdRef.current) return profileIdRef.current;

    const profileId = await ProfileService.ensureCurrentProfileId(pageDataRef.current.profile);
    if (profileId) profileIdRef.current = profileId;
    return profileId;
  }, []);

  const flushPageSave = useCallback(async (): Promise<boolean> => {
    if (!hasLoadedRef.current || loadFailedRef.current || saveInFlightRef.current) return false;

    const dataToSave = queuedPageDataRef.current;
    if (!dataToSave) return true;
    queuedPageDataRef.current = null;
    saveInFlightRef.current = true;
    setSaveStatus('saving');

    try {
      const profileId = await getOrCreateProfileId();
      if (!profileId) {
        setSaveStatus('error');
        console.error('Auto-save page data error: perfil não encontrado');
        return false;
      }

      const result = await PageService.savePageData(profileId, dataToSave);
      if (!result.success) {
        setSaveStatus('error');
        console.error('Auto-save page data error:', result.error);
        return false;
      } else {
        setSaveStatus('saved');
        return true;
      }
    } catch (error) {
      setSaveStatus('error');
      console.error('Auto-save page data error:', error);
      return false;
    } finally {
      saveInFlightRef.current = false;
      if (queuedPageDataRef.current) {
        saveTimerRef.current = window.setTimeout(() => {
          void flushPageSaveRef.current();
        }, 250);
      }
    }
  }, [getOrCreateProfileId]);

  useEffect(() => {
    flushPageSaveRef.current = flushPageSave;
  }, [flushPageSave]);

  // Auto-save com debounce e fila única para impedir updates concorrentes no mesmo perfil.
  useEffect(() => {
    if (!hasLoadedRef.current || loadFailedRef.current) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    queuedPageDataRef.current = pageData;
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      void flushPageSave();
    }, 1200);

    return () => {
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    };
  }, [pageData, flushPageSave]);

  // Carregar dados da página ao montar
  useEffect(() => {
    const loadPageData = async () => {
      if (hasLoadedRef.current) return;

      try {
        const profileId = await getOrCreateProfileId();
        if (!profileId) {
          throw new Error('perfil não encontrado');
        }

        const result = await PageService.loadPageData(profileId);
        if (!result.success) {
          throw new Error(result.error || 'erro ao carregar página');
        }

        if (result.pageData) {
          skipNextSaveRef.current = true;
          setPageData(normalizePageData(result.pageData, user));
        }
      } catch (error) {
        loadFailedRef.current = true;
        setSaveStatus('error');
        console.error('Load page data error:', error);
      } finally {
        hasLoadedRef.current = true;
        setIsLoadingPage(false);
      }
    };

    void loadPageData();
  }, [user, getOrCreateProfileId]);

  useEffect(() => {
    let mounted = true;

    const loadBookingPreview = async () => {
      if (
        bookingPreviewLoadedRef.current ||
        !pageData.blocks.some((block) => block.type === 'agendamento')
      ) {
        return;
      }

      try {
        if (!supabase) return;

        const workspace = (await WorkspaceService.getWorkspaces())[0];
        if (!workspace) return;

        const availability = await PublicAvailabilityService.getPublicAvailability(workspace.slug);
        if (mounted) setBookingAvailability(availability);
      } catch (error) {
        console.error('Booking preview load error:', error);
      } finally {
        bookingPreviewLoadedRef.current = true;
      }
    };

    void loadBookingPreview();
    return () => {
      mounted = false;
    };
  }, [pageData.blocks]);

  // Sincronizar o perfil editado no pageData (evita salvar perfil desatualizado),
  // preservando campos do banco que ainda não existem no contexto.
  // O usuário (fonte de edição) tem prioridade; campos do banco ainda ausentes
  // no contexto (undefined/null) são mantidos de prev.profile.
  useEffect(() => {
    const nextUserSnapshot = JSON.stringify(user);
    const userChanged = nextUserSnapshot !== userSnapshotRef.current;
    userSnapshotRef.current = nextUserSnapshot;

    if (!hasLoadedRef.current || !userChanged) return;

    setPageData((prev) => {
      const editedFields = Object.fromEntries(
        Object.entries(user).filter(([, value]) => value !== undefined && value !== null),
      );
      const currentProfile = (prev.profile || {}) as Record<string, unknown>;
      const profileChanged = Object.entries(editedFields).some(
        ([key, value]) => currentProfile[key] !== value,
      );
      if (!profileChanged) return prev;

      return {
        ...touchPageData(prev, {
          profile: {
            ...(prev.profile || {}),
            ...editedFields,
          } as UserProfile,
        }),
      };
    });
  }, [user]);

  const updatePageProfile = (updates: Partial<UserProfile>) => {
    setPageData((previous) =>
      touchPageData(previous, { profile: { ...previous.profile, ...updates } }),
    );
  };

  const handleCopyLink = async () => {
    const url = getPageUrl(pageData.profile.bioUrl, pageData.profile.username);
    if (!navigator.clipboard?.writeText) {
      toast.error('Seu navegador não permite copiar o link');
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      toast.success('Link copiado!');
    } catch {
      toast.error('Não foi possível copiar o link');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem válido');
      return;
    }
    const previousUrl = pageData.profile.avatarUrl;
    const result = await StorageService.uploadImage(file, 'avatar', { maxDim: 512, quality: 0.85 });
    e.target.value = '';
    if (!result.success || !result.url) {
      toast.error(result.error || 'Não foi possível processar a imagem');
      return;
    }
    updatePageProfile({ avatarUrl: result.url });
    if (result.path) StorageService.deleteByUrl(previousUrl);
    toast.success('Foto de perfil atualizada');
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem válido');
      return;
    }
    const previousUrl = pageData.profile.coverUrl;
    const result = await StorageService.uploadImage(file, 'cover', { maxDim: 1400, quality: 0.82 });
    e.target.value = '';
    if (!result.success || !result.url) {
      toast.error(result.error || 'Não foi possível processar a imagem');
      return;
    }
    updatePageProfile({ coverUrl: result.url });
    if (result.path) StorageService.deleteByUrl(previousUrl);
    toast.success('Capa atualizada');
  };

  const handleRemoveCover = () => {
    StorageService.deleteByUrl(pageData.profile.coverUrl);
    updatePageProfile({ coverUrl: '' });
    toast.success('Capa removida');
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const profileId = await getOrCreateProfileId();
      if (!profileId) {
        toast.error('Perfil não encontrado');
        return;
      }

      queuedPageDataRef.current = pageData;
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
      while (saveInFlightRef.current) {
        await new Promise((resolve) => window.setTimeout(resolve, 50));
      }
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
      const saved = await flushPageSave();
      if (!saved) {
        toast.error('Erro ao salvar antes de publicar');
        return;
      }
      const result = await PageService.publishPage(profileId);
      if (result.success) {
        setPageData((prev) => ({
          ...prev,
          published: true,
          lastUpdated: new Date().toISOString(),
        }));
        toast.success('Página publicada!');
      } else {
        toast.error(result.error || 'Erro ao publicar página');
      }
    } catch (error) {
      console.error('Error publishing page:', error);
      toast.error('Erro ao publicar página');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    setIsPublishing(true);
    try {
      const profileId = await getOrCreateProfileId();
      if (!profileId) {
        toast.error('Perfil não encontrado');
        return;
      }

      const result = await PageService.unpublishPage(profileId);
      if (!result.success) {
        toast.error(result.error || 'Erro ao retirar página do ar');
        return;
      }

      setPageData((previous) => ({
        ...previous,
        published: false,
        lastUpdated: new Date().toISOString(),
      }));
      toast.success('Página retirada do ar.');
    } catch (error) {
      console.error('Error unpublishing page:', error);
      toast.error('Erro ao retirar página do ar');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleAddBlock = (type: BlockType) => {
    setPageData((prev) => {
      const nextBlock = createPageBlock(type, prev.blocks.length);
      let forms = prev.forms || [];
      if (type === 'form') {
        const selectedForm = forms[0] || createDefaultCustomForm();
        if (!forms.some((form) => form.id === selectedForm.id)) forms = [selectedForm, ...forms];
        nextBlock.formId = selectedForm.id;
        nextBlock.title = selectedForm?.title || 'Formulário de contato';
      }
      return touchPageData(prev, {
        blocks: [...prev.blocks, nextBlock],
        forms,
      });
    });
  };

  const handleUpdateBlock = (blockId: string, updates: Partial<PageBlock>) => {
    setPageData((prev) => {
      if (!prev.blocks.some((block) => block.id === blockId)) return prev;
      return touchPageData(prev, {
        blocks: prev.blocks.map((block) =>
          block.id === blockId ? { ...block, ...updates } : block,
        ),
      });
    });
  };

  const handleDeleteBlock = (blockId: string) => {
    setPageData((prev) => {
      if (!prev.blocks.some((block) => block.id === blockId)) return prev;
      return touchPageData(prev, {
        blocks: reorderPageBlocks(prev.blocks.filter((block) => block.id !== blockId)),
      });
    });
  };

  const handleDuplicateBlock = (blockId: string) => {
    setPageData((prev) => {
      const source = prev.blocks.find((b) => b.id === blockId);
      if (!source) return prev;
      return touchPageData(prev, {
        blocks: [...prev.blocks, duplicatePageBlock(source, prev.blocks.length)],
      });
    });
  };

  const handleToggleBlockActive = (blockId: string) => {
    setPageData((prev) => {
      if (!prev.blocks.some((block) => block.id === blockId)) return prev;
      return touchPageData(prev, {
        blocks: prev.blocks.map((block) =>
          block.id === blockId ? { ...block, active: !(block.active ?? true) } : block,
        ),
      });
    });
  };

  const handleMoveBlock = (blockId: string, direction: 'up' | 'down') => {
    setPageData((prev) => {
      const blocks = movePageBlock(prev.blocks, blockId, direction);
      if (blocks === prev.blocks) return prev;
      return touchPageData(prev, { blocks });
    });
  };

  const handlePreviewInteraction = (block: PageBlock) => {
    const labels: Partial<Record<BlockType, string>> = {
      link: 'link',
      video: 'vídeo',
      agendamento: 'agendamento',
      produto: 'produto',
      social: 'rede social',
      contact: 'contato',
      music: 'música',
      location: 'localização',
      form: 'formulário',
    };
    const label = labels[block.type] || 'bloco';
    toast.success(`Teste de ${label} acionado. A página continua em modo de edição.`);
  };

  const handlePreviewLeadCapture = async (block: PageBlock) => {
    const label = block.type === 'form' ? 'formulário' : 'captura de contato';
    toast.success(`Teste de ${label} concluído. Nenhum lead real foi criado.`);
    return true;
  };

  const handleThemeUpdate = (updates: Partial<PageTheme>) => {
    setPageData((prev) => touchPageData(prev, { theme: { ...prev.theme, ...updates } }));
  };

  return (
    <div className="relative flex flex-col h-[calc(100dvh-9rem)] min-h-[520px] bg-[#F6EFE9]">
      {isLoadingPage && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#F6EFE9]/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#464555] shadow-sm">
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin text-[#FF7A00]" />
            Carregando sua página...
          </div>
        </div>
      )}
      {/* Header do Editor */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-[#131b2e]">Minha Página</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Sua página:</span>
            <span className="font-mono text-[#FF5E00]">
              {getPageUrl(undefined, pageData.profile.username)}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                pageData.published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {pageData.published ? 'Publicado' : 'Rascunho'}
            </span>
            <button
              onClick={handleCopyLink}
              className="p-1.5 rounded hover:bg-gray-100 transition-colors"
              title="Copiar link"
            >
              {copySuccess ? (
                <Check aria-hidden="true" className="w-4 h-4 text-green-500" />
              ) : (
                <Copy aria-hidden="true" className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isPreviewMode
                ? 'bg-[#FF5E00] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Eye aria-hidden="true" className="w-4 h-4" />
            <span>{isPreviewMode ? 'Editar' : 'Visualizar'}</span>
          </button>
          {pageData.published && (
            <button
              onClick={handleUnpublish}
              disabled={isPublishing}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Retirar do ar
            </button>
          )}
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF5E00] text-white font-medium hover:bg-[#E55300] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPublishing ? (
              <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" />
            ) : (
              <Check aria-hidden="true" className="w-4 h-4" />
            )}
            <span>
              {isPublishing ? 'Salvando...' : pageData.published ? 'Atualizar' : 'Publicar'}
            </span>
          </button>
          <span className="text-[11px] text-gray-500">
            {saveStatus === 'saving' && 'Salvando alterações...'}
            {saveStatus === 'saved' && 'Alterações salvas'}
            {saveStatus === 'error' && 'Falha ao salvar'}
          </span>
        </div>
      </div>

      {/* Área Principal Dividida */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Área de Configurações */}
        <div className="flex-1 overflow-y-auto p-6 border-r border-gray-200 min-h-0 overscroll-contain">
          {!isPreviewMode && (
            <div className="space-y-6">
              {/* 1. Informações do Perfil */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-[#131b2e] mb-4">Perfil</h2>

                <div className="space-y-4">
                  {/* Foto de Perfil */}
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                      {pageData.profile.avatarUrl ? (
                        <img
                          src={pageData.profile.avatarUrl}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User aria-hidden="true" className="w-9 h-9 text-gray-500" />
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <Image aria-hidden="true" className="w-4 h-4 text-gray-500" />
                      Alterar foto
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>

                  {/* Capa da página (opcional) */}
                  <div className="flex items-center gap-4">
                    <div className="w-40 h-16 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                      {pageData.profile.coverUrl ? (
                        <img
                          src={pageData.profile.coverUrl}
                          alt="Capa"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImagePlus aria-hidden="true" className="w-6 h-6 text-gray-500" />
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => coverInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <Image aria-hidden="true" className="w-4 h-4 text-gray-500" />
                        {pageData.profile.coverUrl ? 'Alterar capa' : 'Adicionar capa'}
                      </button>
                      {pageData.profile.coverUrl && (
                        <button
                          onClick={handleRemoveCover}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 aria-hidden="true" className="w-4 h-4" />
                          Remover capa
                        </button>
                      )}
                    </div>
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverChange}
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 -mt-2">
                    Opcional. A capa aparecerá no topo da sua página com um degradê suave para o
                    fundo.
                  </p>

                  {/* Nome */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <input
                      type="text"
                      value={pageData.profile.name}
                      maxLength={50}
                      onChange={(e) => updatePageProfile({ name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5E00] focus:border-transparent"
                    />
                  </div>

                  {/* Usuário */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#FF5E00]">
                      <span className="bg-gray-50 px-3 py-2 text-sm text-gray-500 border-r border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
                        @
                      </span>
                      <input
                        type="text"
                        value={pageData.profile.username}
                        maxLength={20}
                        onChange={(e) => {
                          const username = e.target.value.replace(/\s+/g, '').toLowerCase();
                          updatePageProfile({
                            username,
                            bioUrl: `pandabio.com/${username}`,
                          });
                        }}
                        className="flex-1 px-4 py-2 outline-none"
                      />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Sua página:{' '}
                      <span className="font-mono text-[#FF5E00]">
                        {getPageUrl(undefined, pageData.profile.username)}
                      </span>
                    </p>
                  </div>

                  {/* Bio */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">Bio</label>
                      <span className="text-[10px] text-gray-500 font-medium">
                        {(pageData.profile.bioDescription || '').length}/200
                      </span>
                    </div>
                    <textarea
                      value={pageData.profile.bioDescription}
                      maxLength={200}
                      onChange={(e) => updatePageProfile({ bioDescription: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5E00] focus:border-transparent resize-none"
                      rows={3}
                      placeholder="Conte um pouco sobre você..."
                    />
                  </div>

                  {/* Categoria */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoria
                    </label>
                    <select
                      value={pageData.profile.category || ''}
                      onChange={(e) => updatePageProfile({ category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5E00] focus:border-transparent"
                    >
                      <option value="">Selecione...</option>
                      <option>Criador de conteúdo</option>
                      <option>Empreendedor</option>
                      <option>Artista</option>
                      <option>Músico</option>
                      <option>Desenvolvedor</option>
                      <option>Outro</option>
                    </select>
                  </div>

                  {/* Localização */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Localização
                    </label>
                    <input
                      type="text"
                      value={pageData.profile.location || ''}
                      maxLength={100}
                      onChange={(e) => updatePageProfile({ location: e.target.value })}
                      placeholder="São Paulo, Brasil"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5E00] focus:border-transparent"
                    />
                  </div>

                  {/* Link Personalizado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Link personalizado
                    </label>
                    <input
                      type="text"
                      value={pageData.profile.customLink || ''}
                      onChange={(e) => updatePageProfile({ customLink: e.target.value })}
                      placeholder="meusite.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5E00] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Blocos da Página */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-[#131b2e] mb-4">Blocos</h2>

                <button
                  onClick={() => setIsAddBlockModalOpen(true)}
                  className="w-full mb-4 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-[#FF5E00] hover:text-[#FF5E00] transition-colors font-medium flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus aria-hidden="true" className="w-4 h-4" />
                  Adicionar bloco
                </button>

                {pageData.blocks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">Nenhum bloco adicionado ainda</p>
                    <p className="text-xs mt-1">Adicione blocos para personalizar sua página</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pageData.blocks.map((block, index) => (
                      <div
                        key={block.id}
                        className={`flex items-center gap-2.5 p-3 bg-gray-50 rounded-lg border transition-opacity ${
                          block.active === false ? 'opacity-55' : 'border-gray-200'
                        }`}
                      >
                        <span className="w-9 h-9 rounded-xl bg-[#f2f3ff] flex items-center justify-center shrink-0 text-[#FF5E00]">
                          {getBlockIcon(block.type)}
                        </span>
                        <input
                          type="text"
                          value={block.title || getBlockPlaceholder(block.type)}
                          onChange={(e) => handleUpdateBlock(block.id, { title: e.target.value })}
                          className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5E00] focus:border-transparent text-sm"
                        />
                        {block.type === 'produto' && (block.products?.length ?? 0) > 0 && (
                          <span className="shrink-0 px-2 py-1 rounded-full bg-[#FF7A00]/10 text-[#FF7A00] text-[10px] font-bold whitespace-nowrap">
                            {block.products?.length ?? 0}{' '}
                            {block.products!.length === 1 ? 'produto' : 'produtos'}
                          </span>
                        )}
                        {block.type === 'image' && (block.gallery?.images.length ?? 0) > 0 && (
                          <span className="shrink-0 px-2 py-1 rounded-full bg-[#FF7A00]/10 text-[#FF7A00] text-[10px] font-bold whitespace-nowrap">
                            {block.gallery?.images.length ?? 0}{' '}
                            {block.gallery!.images.length === 1 ? 'imagem' : 'imagens'}
                          </span>
                        )}
                        {block.type === 'social' &&
                          (block.socialLinks?.filter((l) => l.url && l.url.trim()).length ?? 0) >
                            0 && (
                            <span className="shrink-0 px-2 py-1 rounded-full bg-[#FF7A00]/10 text-[#FF7A00] text-[10px] font-bold whitespace-nowrap">
                              {block.socialLinks!.filter((l) => l.url && l.url.trim()).length} redes
                            </span>
                          )}
                        {block.type === 'contact' &&
                          (block.contact?.whatsapp?.trim() || block.contact?.email?.trim() ? (
                            <span className="shrink-0 px-2 py-1 rounded-full bg-[#FF7A00]/10 text-[#FF7A00] text-[10px] font-bold whitespace-nowrap">
                              {block.contact?.whatsapp?.trim() && block.contact?.email?.trim()
                                ? 'WhatsApp + E-mail'
                                : block.contact?.whatsapp?.trim()
                                  ? 'WhatsApp'
                                  : 'E-mail'}
                            </span>
                          ) : null)}
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => handleToggleBlockActive(block.id)}
                            title={block.active === false ? 'Ativar bloco' : 'Desativar bloco'}
                            aria-label={block.active === false ? 'Ativar bloco' : 'Desativar bloco'}
                            className={`p-1.5 rounded transition-colors cursor-pointer ${
                              block.active === false
                                ? 'text-green-500 hover:bg-green-50'
                                : 'text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            <Power aria-hidden="true" className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingBlock(block)}
                            title="Configurar"
                            aria-label="Configurar bloco"
                            className="p-1.5 hover:bg-blue-100 text-blue-500 rounded transition-colors cursor-pointer"
                          >
                            <Settings aria-hidden="true" className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicateBlock(block.id)}
                            title="Duplicar"
                            aria-label="Duplicar bloco"
                            className="p-1.5 hover:bg-gray-200 text-gray-500 rounded transition-colors cursor-pointer"
                          >
                            <CopyPlus aria-hidden="true" className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleMoveBlock(block.id, 'up')}
                            disabled={index === 0}
                            title="Mover para cima"
                            aria-label="Mover bloco para cima"
                            className="p-1.5 hover:bg-gray-200 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <ArrowUp aria-hidden="true" className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleMoveBlock(block.id, 'down')}
                            disabled={index === pageData.blocks.length - 1}
                            title="Mover para baixo"
                            aria-label="Mover bloco para baixo"
                            className="p-1.5 hover:bg-gray-200 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <ArrowDown aria-hidden="true" className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBlock(block.id)}
                            title="Excluir"
                            aria-label="Excluir bloco"
                            className="p-1.5 hover:bg-red-100 text-red-500 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 aria-hidden="true" className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Aparência */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-[#131b2e] mb-4">Aparência</h2>
                <AppearancePanel
                  theme={pageData.theme}
                  onThemeUpdate={handleThemeUpdate}
                  hasCover={Boolean(pageData.profile.coverUrl)}
                />
              </div>
            </div>
          )}

          {/* Modo Preview - Todo tela é preview */}
          {isPreviewMode && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#131b2e]">Preview</h2>
                <div className="flex items-center gap-2">
                  <div className="flex bg-[#f2f3ff] p-1 rounded-xl text-xs font-semibold">
                    <button
                      onClick={() => setPreviewDevice('mobile')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        previewDevice === 'mobile'
                          ? 'bg-white text-[#131b2e] shadow-xs'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <Smartphone aria-hidden="true" className="w-3.5 h-3.5" /> Celular
                    </button>
                    <button
                      onClick={() => setPreviewDevice('desktop')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        previewDevice === 'desktop'
                          ? 'bg-white text-[#131b2e] shadow-xs'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <Monitor aria-hidden="true" className="w-3.5 h-3.5" /> Desktop
                    </button>
                  </div>
                  <button
                    onClick={() => setIsPreviewMode(false)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium cursor-pointer"
                  >
                    Voltar ao editor
                  </button>
                </div>
              </div>
              <motion.div
                key={previewDevice}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-8 flex justify-center"
              >
                <PagePreview
                  profile={pageData.profile}
                  theme={pageData.theme}
                  blocks={pageData.blocks}
                  forms={pageData.forms}
                  links={links}
                  device={previewDevice}
                  interactive
                  onInteractiveClick={handlePreviewInteraction}
                  onLeadCapture={handlePreviewLeadCapture}
                  bookingAvailability={bookingAvailability}
                />
              </motion.div>
            </div>
          )}
        </div>

        {/* Área de Preview (Direita) */}
        <div className="hidden md:flex flex-col w-[420px] shrink-0 bg-gray-100 p-5 min-h-0">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <div>
              <h3 className="text-sm font-bold text-[#131b2e]">Visualização ao vivo</h3>
              <p className="mt-0.5 text-[10px] text-gray-500">Clique nos botões para testar</p>
            </div>
            <div className="flex bg-[#f2f3ff] p-0.5 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setPreviewDevice('mobile')}
                title="Modo celular"
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  previewDevice === 'mobile'
                    ? 'bg-white text-[#131b2e] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Smartphone aria-hidden="true" className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPreviewDevice('desktop')}
                title="Modo desktop"
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  previewDevice === 'desktop'
                    ? 'bg-white text-[#131b2e] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Monitor aria-hidden="true" className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pb-1">
            <motion.div
              key={previewDevice}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="sticky top-2"
            >
              <PagePreview
                profile={pageData.profile}
                theme={pageData.theme}
                blocks={pageData.blocks}
                forms={pageData.forms}
                links={links}
                device={previewDevice}
                interactive
                onInteractiveClick={handlePreviewInteraction}
                onLeadCapture={handlePreviewLeadCapture}
                bookingAvailability={bookingAvailability}
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Modal para adicionar bloco */}
      <AddBlockModal
        isOpen={isAddBlockModalOpen}
        onClose={() => setIsAddBlockModalOpen(false)}
        onAddBlock={handleAddBlock}
      />

      {/* Configuração de bloco específico */}
      <BlockConfigModal
        block={editingBlock}
        onClose={() => setEditingBlock(null)}
        onUpdate={handleUpdateBlock}
        onDelete={handleDeleteBlock}
        links={links}
        catalogProducts={products}
        forms={pageData.forms}
      />
    </div>
  );
};

function getBlockIcon(type: BlockType): React.ReactNode {
  const icons: Record<string, React.ReactNode> = {
    link: <Link2 aria-hidden="true" className="w-5 h-5 text-gray-600" />,
    text: <Type aria-hidden="true" className="w-5 h-5 text-gray-600" />,
    image: <Image aria-hidden="true" className="w-5 h-5 text-gray-600" />,
    video: <Video aria-hidden="true" className="w-5 h-5 text-gray-600" />,
    agendamento: <Calendar aria-hidden="true" className="w-5 h-5 text-gray-600" />,
    produto: <ShoppingBag aria-hidden="true" className="w-5 h-5 text-gray-600" />,
    social: <Smartphone aria-hidden="true" className="w-5 h-5 text-gray-600" />,
    contact: <Mail aria-hidden="true" className="w-5 h-5 text-gray-600" />,
    form: <ClipboardList aria-hidden="true" className="w-5 h-5 text-gray-600" />,
    music: <Music aria-hidden="true" className="w-5 h-5 text-gray-600" />,
    location: <MapPin aria-hidden="true" className="w-5 h-5 text-gray-600" />,
  };
  return icons[type] || <Package aria-hidden="true" className="w-5 h-5 text-gray-600" />;
}

function getBlockPlaceholder(type: BlockType): string {
  const placeholders = {
    link: 'Instagram.com/...',
    text: 'Seu texto aqui',
    image: 'Sua imagem',
    video: 'Seu vídeo',
    agendamento: 'Agende seu horário',
    produto: 'Meus produtos',
    social: 'Minhas redes sociais',
    contact: 'Entre em contato',
    form: 'Formulário de contato',
    music: 'Minha música',
    location: 'Minha localização',
  };
  return placeholders[type] || 'Bloco';
}
