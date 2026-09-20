import React, { useState, useEffect, useRef } from 'react';
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
import { UserProfile, PageBlock, PageTheme, BlockType } from '../types';
import { AddBlockModal } from './AddBlockModal';
import { BlockConfigModal } from './BlockConfigModal';
import { PagePreview } from './PagePreview';
import { AppearancePanel } from './AppearancePanel';
import { PageService } from '../supabase/services/pageService';
import { StorageService } from '../supabase/services/storageService';
import { supabase } from '../supabase/client';
import { safeStorage } from '../utils/storage';
import { getPageUrl } from '../utils/pageUrl';
import { defaultPageTheme } from '../theme/presets';

const LOCAL_PAGE_STORAGE_KEY = 'pandabio_page_data_v1';

interface PageEditorProps {
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
}

export const PageEditor: React.FC<PageEditorProps> = ({ user, onUpdateUser }) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isAddBlockModalOpen, setIsAddBlockModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<PageBlock | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const hasLoadedRef = useRef(false);
  const [pageData, setPageData] = useState({
    profile: user,
    blocks: [] as PageBlock[],
    theme: defaultPageTheme() as PageTheme,
    published: false,
    lastUpdated: new Date().toISOString(),
  });

  // Resolve o id da linha do perfil no banco; cria a linha se ainda não existir
  // (fallback caso o trigger handle_new_user não tenha criado o registro).
  const getOrCreateProfileId = async (): Promise<string | null> => {
    if (!supabase) return null;

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) return null;

    const selectResult = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', authUser.id)
      .maybeSingle();

    if (selectResult.data?.id) return selectResult.data.id;

    if (selectResult.error) {
      console.error('Error looking up profile:', selectResult.error);
      return null;
    }

    const { data: created, error: insertError } = await supabase
      .from('profiles')
      .insert({
        user_id: authUser.id,
        email: authUser.email || '',
        name: (pageData.profile.name || (authUser.user_metadata?.name as string) || '').slice(
          0,
          100,
        ),
        username: pageData.profile.username || authUser.email?.split('@')[0] || 'usuario',
        bio_url:
          pageData.profile.bioUrl || `pandabio.com/${pageData.profile.username || 'usuario'}`,
        page_title: pageData.profile.pageTitle || 'Minha Página • Bio Oficial',
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating profile row:', insertError);
      // Corrida: outra requisição pode ter criado a linha; tenta buscar de novo.
      const retry = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', authUser.id)
        .maybeSingle();
      return retry.data?.id ?? null;
    }

    return created?.id ?? null;
  };

  // Auto-save com debounce (não salva antes do carregamento inicial)
  useEffect(() => {
    if (!hasLoadedRef.current) return;

    const timer = setTimeout(async () => {
      if (!supabase) {
        safeStorage.set(LOCAL_PAGE_STORAGE_KEY, pageData);
        return;
      }
      try {
        const profileId = await getOrCreateProfileId();
        if (!profileId) return;
        const result = await PageService.savePageData(profileId, pageData);
        if (!result.success) {
          console.error('Auto-save page data error:', result.error);
        }
      } catch (error) {
        console.error('Auto-save page data error:', error);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [pageData]);

  // Carregar dados da página ao montar
  useEffect(() => {
    const loadPageData = async () => {
      if (hasLoadedRef.current) return;

      if (!supabase) {
        const stored = safeStorage.get<typeof pageData | null>(LOCAL_PAGE_STORAGE_KEY, null);
        if (stored) {
          setPageData(() => ({
            ...stored,
            theme: { ...defaultPageTheme(), ...(stored.theme || {}) },
            profile: { ...user, ...(stored.profile || {}) },
          }));
        }
        hasLoadedRef.current = true;
        return;
      }

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', authUser.id)
          .maybeSingle();

        if (profile) {
          const { success, pageData: loadedPageData } = await PageService.loadPageData(profile.id);
          if (success && loadedPageData) {
            // Mescla o perfil do banco com o do contexto: campos salvos (cover,
            // categoria, localização, customLink...) têm prioridade sobre o mock.
            const savedProfile = (loadedPageData.profile || {}) as Partial<UserProfile>;
            setPageData(() => ({
              ...loadedPageData,
              theme: { ...defaultPageTheme(), ...(loadedPageData.theme || {}) },
              profile: {
                ...user,
                ...Object.fromEntries(
                  Object.entries(savedProfile).filter(([, v]) => v !== null && v !== undefined),
                ),
              } as UserProfile,
            }));
          }
        }
      }
      hasLoadedRef.current = true;
    };

    loadPageData();
  }, []);

  // Sincronizar o perfil editado no pageData (evita salvar perfil desatualizado),
  // preservando campos do banco que ainda não existem no contexto.
  // O usuário (fonte de edição) tem prioridade; campos do banco ainda ausentes
  // no contexto (undefined/null) são mantidos de prev.profile.
  useEffect(() => {
    setPageData((prev) => {
      const editedFields = Object.fromEntries(
        Object.entries(user).filter(([, value]) => value !== undefined && value !== null),
      );
      return {
        ...prev,
        profile: {
          ...(prev.profile || {}),
          ...editedFields,
        } as UserProfile,
        lastUpdated: new Date().toISOString(),
      };
    });
  }, [user]);

  const handleCopyLink = () => {
    const url = getPageUrl(user.bioUrl, user.username);
    navigator.clipboard
      ?.writeText(url)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
        toast.success('Link copiado!');
      })
      .catch(() => toast.error('Não foi possível copiar o link'));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem válido');
      return;
    }
    const previousUrl = user.avatarUrl;
    const result = await StorageService.uploadImage(file, 'avatar', { maxDim: 512, quality: 0.85 });
    e.target.value = '';
    if (!result.success || !result.url) {
      toast.error(result.error || 'Não foi possível processar a imagem');
      return;
    }
    onUpdateUser({ avatarUrl: result.url });
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
    const previousUrl = user.coverUrl;
    const result = await StorageService.uploadImage(file, 'cover', { maxDim: 1400, quality: 0.82 });
    e.target.value = '';
    if (!result.success || !result.url) {
      toast.error(result.error || 'Não foi possível processar a imagem');
      return;
    }
    onUpdateUser({ coverUrl: result.url });
    if (result.path) StorageService.deleteByUrl(previousUrl);
    toast.success('Capa atualizada');
  };

  const handleRemoveCover = () => {
    StorageService.deleteByUrl(user.coverUrl);
    onUpdateUser({ coverUrl: '' });
    toast.success('Capa removida');
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      if (!supabase) {
        const publishedData = {
          ...pageData,
          published: true,
          lastUpdated: new Date().toISOString(),
        };
        setPageData(publishedData);
        safeStorage.set(LOCAL_PAGE_STORAGE_KEY, publishedData);
        toast.success('Página publicada (modo local)');
        return;
      }

      const profileId = await getOrCreateProfileId();
      if (!profileId) {
        toast.error('Perfil não encontrado');
        return;
      }

      // Salvar as últimas edições antes de publicar
      const saveResult = await PageService.savePageData(profileId, pageData);
      if (!saveResult.success) {
        toast.error(saveResult.error || 'Erro ao salvar antes de publicar');
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

  const handleAddBlock = (type: BlockType) => {
    setPageData((prev) => {
      const newBlock: PageBlock = {
        id: crypto.randomUUID(),
        type,
        order: prev.blocks.length,
        active: true,
      };
      return {
        ...prev,
        blocks: [...prev.blocks, newBlock],
        lastUpdated: new Date().toISOString(),
      };
    });
  };

  const handleUpdateBlock = (blockId: string, updates: Partial<PageBlock>) => {
    setPageData((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block) => (block.id === blockId ? { ...block, ...updates } : block)),
      lastUpdated: new Date().toISOString(),
    }));
  };

  const handleDeleteBlock = (blockId: string) => {
    setPageData((prev) => ({
      ...prev,
      blocks: prev.blocks
        .filter((block) => block.id !== blockId)
        .map((block, i) => ({ ...block, order: i })),
      lastUpdated: new Date().toISOString(),
    }));
  };

  const handleDuplicateBlock = (blockId: string) => {
    setPageData((prev) => {
      const source = prev.blocks.find((b) => b.id === blockId);
      if (!source) return prev;
      const rest = { ...source };
      const copy: PageBlock = {
        ...rest,
        id: crypto.randomUUID(),
        order: prev.blocks.length,
        active: true,
      };
      return {
        ...prev,
        blocks: [...prev.blocks, copy],
        lastUpdated: new Date().toISOString(),
      };
    });
  };

  const handleToggleBlockActive = (blockId: string) => {
    setPageData((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block) =>
        block.id === blockId ? { ...block, active: !(block.active ?? true) } : block,
      ),
      lastUpdated: new Date().toISOString(),
    }));
  };

  const handleMoveBlock = (blockId: string, direction: 'up' | 'down') => {
    setPageData((prev) => {
      const blocks = [...prev.blocks];
      const index = blocks.findIndex((b) => b.id === blockId);

      if (direction === 'up' && index > 0) {
        [blocks[index], blocks[index - 1]] = [blocks[index - 1], blocks[index]];
      } else if (direction === 'down' && index < blocks.length - 1) {
        [blocks[index], blocks[index + 1]] = [blocks[index + 1], blocks[index]];
      }

      return {
        ...prev,
        blocks: blocks.map((block, i) => ({ ...block, order: i })),
        lastUpdated: new Date().toISOString(),
      };
    });
  };

  const handleThemeUpdate = (updates: Partial<PageTheme>) => {
    setPageData((prev) => ({
      ...prev,
      theme: { ...prev.theme, ...updates },
      lastUpdated: new Date().toISOString(),
    }));
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-9rem)] min-h-[520px] bg-[#F6EFE9]">
      {/* Header do Editor */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-[#131b2e]">Minha Página</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Sua página:</span>
            <span className="font-mono text-[#FF5E00]">pandabio.com/{user.username}</span>
            <button
              onClick={handleCopyLink}
              className="p-1.5 rounded hover:bg-gray-100 transition-colors"
              title="Copiar link"
            >
              {copySuccess ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
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
            <Eye className="w-4 h-4" />
            <span>{isPreviewMode ? 'Editar' : 'Visualizar'}</span>
          </button>
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF5E00] text-white font-medium hover:bg-[#E55300] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPublishing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>{isPublishing ? 'Publicando...' : 'Publicar'}</span>
          </button>
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
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-9 h-9 text-gray-400" />
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <Image className="w-4 h-4 text-gray-500" />
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
                      {user.coverUrl ? (
                        <img
                          src={user.coverUrl}
                          alt="Capa"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImagePlus className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => coverInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <Image className="w-4 h-4 text-gray-500" />
                        {user.coverUrl ? 'Alterar capa' : 'Adicionar capa'}
                      </button>
                      {user.coverUrl && (
                        <button
                          onClick={handleRemoveCover}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
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
                  <p className="text-[11px] text-gray-400 -mt-2">
                    Opcional. A capa aparecerá no topo da sua página com um degradê suave para o
                    fundo.
                  </p>

                  {/* Nome */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <input
                      type="text"
                      value={user.name}
                      maxLength={50}
                      onChange={(e) => onUpdateUser({ name: e.target.value })}
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
                        value={user.username}
                        maxLength={20}
                        onChange={(e) =>
                          onUpdateUser({
                            username: e.target.value.replace(/\s+/g, '').toLowerCase(),
                          })
                        }
                        className="flex-1 px-4 py-2 outline-none"
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Sua página:{' '}
                      <span className="font-mono text-[#FF5E00]">pandabio.com/{user.username}</span>
                    </p>
                  </div>

                  {/* Bio */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">Bio</label>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {(user.bioDescription || '').length}/200
                      </span>
                    </div>
                    <textarea
                      value={user.bioDescription}
                      maxLength={200}
                      onChange={(e) => onUpdateUser({ bioDescription: e.target.value })}
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
                      value={user.category || ''}
                      onChange={(e) => onUpdateUser({ category: e.target.value })}
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
                      value={user.location || ''}
                      maxLength={100}
                      onChange={(e) => onUpdateUser({ location: e.target.value })}
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
                      value={user.customLink || ''}
                      onChange={(e) => onUpdateUser({ customLink: e.target.value })}
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
                  <Plus className="w-4 h-4" />
                  Adicionar bloco
                </button>

                {pageData.blocks.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
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
                                : 'text-gray-400 hover:bg-gray-200'
                            }`}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingBlock(block)}
                            title="Configurar"
                            aria-label="Configurar bloco"
                            className="p-1.5 hover:bg-blue-100 text-blue-500 rounded transition-colors cursor-pointer"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicateBlock(block.id)}
                            title="Duplicar"
                            aria-label="Duplicar bloco"
                            className="p-1.5 hover:bg-gray-200 text-gray-500 rounded transition-colors cursor-pointer"
                          >
                            <CopyPlus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleMoveBlock(block.id, 'up')}
                            disabled={index === 0}
                            title="Mover para cima"
                            aria-label="Mover bloco para cima"
                            className="p-1.5 hover:bg-gray-200 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleMoveBlock(block.id, 'down')}
                            disabled={index === pageData.blocks.length - 1}
                            title="Mover para baixo"
                            aria-label="Mover bloco para baixo"
                            className="p-1.5 hover:bg-gray-200 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBlock(block.id)}
                            title="Excluir"
                            aria-label="Excluir bloco"
                            className="p-1.5 hover:bg-red-100 text-red-500 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
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
                <AppearancePanel theme={pageData.theme} onThemeUpdate={handleThemeUpdate} />
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
                      <Smartphone className="w-3.5 h-3.5" /> Celular
                    </button>
                    <button
                      onClick={() => setPreviewDevice('desktop')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        previewDevice === 'desktop'
                          ? 'bg-white text-[#131b2e] shadow-xs'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" /> Desktop
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
                  device={previewDevice}
                />
              </motion.div>
            </div>
          )}
        </div>

        {/* Área de Preview (Direita) */}
        <div className="hidden md:flex flex-col w-[420px] shrink-0 bg-gray-100 p-5 min-h-0">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h3 className="text-sm font-bold text-[#131b2e]">Visualização ao vivo</h3>
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
                <Smartphone className="w-3.5 h-3.5" />
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
                <Monitor className="w-3.5 h-3.5" />
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
                device={previewDevice}
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
      />
    </div>
  );
};

function getBlockIcon(type: BlockType): React.ReactNode {
  const icons: Record<string, React.ReactNode> = {
    link: <Link2 className="w-5 h-5 text-gray-600" />,
    text: <Type className="w-5 h-5 text-gray-600" />,
    image: <Image className="w-5 h-5 text-gray-600" />,
    video: <Video className="w-5 h-5 text-gray-600" />,
    agendamento: <Calendar className="w-5 h-5 text-gray-600" />,
    produto: <ShoppingBag className="w-5 h-5 text-gray-600" />,
    social: <Smartphone className="w-5 h-5 text-gray-600" />,
    contact: <Mail className="w-5 h-5 text-gray-600" />,
    music: <Music className="w-5 h-5 text-gray-600" />,
    location: <MapPin className="w-5 h-5 text-gray-600" />,
  };
  return icons[type] || <Package className="w-5 h-5 text-gray-600" />;
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
    music: 'Minha música',
    location: 'Minha localização',
  };
  return placeholders[type] || 'Bloco';
}
