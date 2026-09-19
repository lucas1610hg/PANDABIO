import React, { useState, useEffect } from 'react';
import { Eye, Copy, Smartphone, Palette, Check, Loader2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, PageBlock, PageTheme, BlockType } from '../types';
import { AddBlockModal } from './AddBlockModal';
import { AgendamentoBlockConfig } from './AgendamentoBlockConfig';
import { PageService } from '../supabase/services/pageService';
import { AuthService } from '../supabase/services/authService';

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
  const [pageData, setPageData] = useState({
    profile: user,
    blocks: [] as PageBlock[],
    theme: {
      theme: 'light' as const,
      backgroundColor: '#ffffff',
      backgroundType: 'color' as const,
      buttonStyle: 'rounded' as const,
      fontFamily: 'Inter',
      animationsEnabled: true,
    } as PageTheme,
    published: false,
    lastUpdated: new Date().toISOString(),
  });

  // Auto-save com debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      // Obter o usuário atual do Supabase Auth
      const { data: { user } } = await supabase?.auth.getUser() || { data: { user: null } };
      if (user) {
        // Buscar o profile_id na tabela profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          await PageService.savePageData(profile.id, pageData);
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [pageData]);

  // Carregar dados da página ao montar
  useEffect(() => {
    const loadPageData = async () => {
      const { data: { user } } = await supabase?.auth.getUser() || { data: { user: null } };
      if (user) {
        // Buscar o profile_id na tabela profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          const { success, pageData: loadedPageData } = await PageService.loadPageData(profile.id);
          if (success && loadedPageData) {
            setPageData(loadedPageData);
          }
        }
      }
    };

    loadPageData();
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://pandabio.com/${user.username}`);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      console.log('Iniciando publicação...');
      
      const { data: { user } } = await supabase?.auth.getUser() || { data: { user: null } };
      console.log('Usuário autenticado:', user);
      
      if (user) {
        // Buscar o profile_id na tabela profiles
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        console.log('Profile encontrado:', profile);
        console.log('Profile error:', profileError);
        
        if (profile) {
          console.log('Chamando PageService.publishPage com ID:', profile.id);
          const result = await PageService.publishPage(profile.id);
          console.log('Resultado do publishPage:', result);
          
          if (result.success) {
            setPageData(prev => ({ ...prev, published: true }));
          } else {
            console.error('Erro ao publicar:', result.error);
          }
        } else {
          console.error('Profile não encontrado para user_id:', user.id);
        }
      } else {
        console.error('Nenhum usuário autenticado');
      }
    } catch (error) {
      console.error('Error publishing page:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleAddBlock = (type: BlockType) => {
    const newBlock: PageBlock = {
      id: crypto.randomUUID(),
      type,
      order: pageData.blocks.length,
      active: true,
    };

    setPageData(prev => ({
      ...prev,
      blocks: [...prev.blocks, newBlock],
      lastUpdated: new Date().toISOString(),
    }));
  };

  const handleUpdateBlock = (blockId: string, updates: Partial<PageBlock>) => {
    setPageData(prev => ({
      ...prev,
      blocks: prev.blocks.map(block => 
        block.id === blockId ? { ...block, ...updates } : block
      ),
      lastUpdated: new Date().toISOString(),
    }));
  };

  const handleDeleteBlock = (blockId: string) => {
    setPageData(prev => ({
      ...prev,
      blocks: prev.blocks.filter(block => block.id !== blockId),
      lastUpdated: new Date().toISOString(),
    }));
  };

  const handleMoveBlock = (blockId: string, direction: 'up' | 'down') => {
    const blocks = [...pageData.blocks];
    const index = blocks.findIndex(b => b.id === blockId);
    
    if (direction === 'up' && index > 0) {
      [blocks[index], blocks[index - 1]] = [blocks[index - 1], blocks[index]];
    } else if (direction === 'down' && index < blocks.length - 1) {
      [blocks[index], blocks[index + 1]] = [blocks[index + 1], blocks[index]];
    }

    setPageData(prev => ({
      ...prev,
      blocks: blocks.map((block, i) => ({ ...block, order: i })),
      lastUpdated: new Date().toISOString(),
    }));
  };

  const handleThemeUpdate = (updates: Partial<PageTheme>) => {
    setPageData(prev => ({
      ...prev,
      theme: { ...prev.theme, ...updates },
      lastUpdated: new Date().toISOString(),
    }));
  };

  return (
    <div className="flex flex-col h-full bg-[#F6EFE9]">
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
      <div className="flex-1 flex overflow-hidden">
        {/* Área de Configurações */}
        <div className="flex-1 overflow-y-auto p-6 border-r border-gray-200">
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
                        <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl">👤</span>
                      )}
                    </div>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                      🖼️ Alterar foto
                    </button>
                  </div>

                  {/* Nome */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <input
                      type="text"
                      value={user.name}
                      onChange={(e) => onUpdateUser({ name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5E00] focus:border-transparent"
                    />
                  </div>

                  {/* Usuário */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
                    <div className="flex items-center">
                      <span className="text-gray-400 mr-2">@</span>
                      <input
                        type="text"
                        value={user.username}
                        onChange={(e) => onUpdateUser({ username: e.target.value })}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5E00] focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      value={user.bioDescription}
                      onChange={(e) => onUpdateUser({ bioDescription: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5E00] focus:border-transparent resize-none"
                      rows={3}
                      placeholder="Conte um pouco sobre você..."
                    />
                  </div>

                  {/* Categoria */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5E00] focus:border-transparent">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
                    <input
                      type="text"
                      placeholder="São Paulo, Brasil"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5E00] focus:border-transparent"
                    />
                  </div>

                  {/* Link Personalizado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link personalizado</label>
                    <input
                      type="text"
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
                  className="w-full mb-4 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-[#FF5E00] hover:text-[#FF5E00] transition-colors font-medium flex items-center justify-center gap-2"
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
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <span className="text-lg">{getBlockIcon(block.type)}</span>
                        <input
                          type="text"
                          value={block.title || getBlockPlaceholder(block.type)}
                          onChange={(e) => handleUpdateBlock(block.id, { title: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5E00] focus:border-transparent text-sm"
                        />
                        <button
                          onClick={() => setEditingBlock(block)}
                          className="p-1 hover:bg-blue-100 text-blue-500 rounded"
                          title="Configurar"
                        >
                          ⚙️
                        </button>
                        <button
                          onClick={() => handleMoveBlock(block.id, 'up')}
                          disabled={index === 0}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleMoveBlock(block.id, 'down')}
                          disabled={index === pageData.blocks.length - 1}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => handleDeleteBlock(block.id)}
                          className="p-1 hover:bg-red-100 text-red-500 rounded"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Aparência Rápida */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-[#131b2e]">Aparência Rápida</h2>
                  <button className="flex items-center gap-2 text-sm text-[#FF5E00] font-medium hover:underline">
                    <Palette className="w-4 h-4" />
                    Personalizar aparência
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Tema */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tema</label>
                    <div className="flex gap-2">
                      {(['light', 'dark', 'auto'] as const).map((theme) => (
                        <button
                          key={theme}
                          onClick={() => handleThemeUpdate({ theme })}
                          className={`px-4 py-2 rounded-lg border transition-colors ${
                            pageData.theme.theme === theme
                              ? 'bg-[#FF5E00] text-white border-[#FF5E00]'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {theme === 'light' ? '☀️ Claro' : theme === 'dark' ? '🌙 Escuro' : '🔄 Auto'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fundo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fundo</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={pageData.theme.backgroundColor}
                        onChange={(e) => handleThemeUpdate({ backgroundColor: e.target.value, backgroundType: 'color' })}
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                      <select
                        value={pageData.theme.backgroundType}
                        onChange={(e) => handleThemeUpdate({ backgroundType: e.target.value as 'color' | 'gradient' | 'image' })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5E00] focus:border-transparent"
                      >
                        <option value="color">Cor</option>
                        <option value="gradient">Gradiente</option>
                        <option value="image">Imagem</option>
                      </select>
                    </div>
                  </div>

                  {/* Fonte */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fonte</label>
                    <select
                      value={pageData.theme.fontFamily}
                      onChange={(e) => handleThemeUpdate({ fontFamily: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5E00] focus:border-transparent"
                    >
                      <option>Inter</option>
                      <option>Roboto</option>
                      <option>Open Sans</option>
                      <option>Poppins</option>
                    </select>
                  </div>

                  {/* Animações */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="animations"
                      checked={pageData.theme.animationsEnabled}
                      onChange={(e) => handleThemeUpdate({ animationsEnabled: e.target.checked })}
                      className="w-4 h-4 rounded text-[#FF5E00] focus:ring-[#FF5E00]"
                    />
                    <label htmlFor="animations" className="text-sm text-gray-700">Ativar animações</label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modo Preview - Todo tela é preview */}
          {isPreviewMode && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#131b2e]">Preview Completo</h2>
                <button
                  onClick={() => setIsPreviewMode(false)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium"
                >
                  <Palette className="w-4 h-4" />
                  Voltar ao editor
                </button>
              </div>
              <div className="text-center py-8 text-gray-400">
                <Smartphone className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Preview da página em desenvolvimento</p>
              </div>
            </div>
          )}
        </div>

        {/* Área de Preview (Direita) */}
        <div className="w-[400px] bg-gray-100 p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden sticky top-6" style={{ minHeight: '600px' }}>
            {/* Preview Header */}
            <div className="bg-[#FF5E00] text-white p-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-2">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span className="text-2xl">👤</span>
                )}
              </div>
              <h3 className="font-bold text-lg">{user.name}</h3>
              <p className="text-sm opacity-90">@{user.username}</p>
              {user.bioDescription && (
                <p className="text-xs mt-2 opacity-80">{user.bioDescription}</p>
              )}
            </div>

            {/* Preview Blocks */}
            <div className="p-4 space-y-3">
              {pageData.blocks.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">Adicione blocos para ver o preview</p>
                </div>
              ) : (
                pageData.blocks.map((block) => (
                  <div
                    key={block.id}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getBlockIcon(block.type)}</span>
                      <span className="font-medium text-sm">{block.title || getBlockPlaceholder(block.type)}</span>
                    </div>
                    {block.content && (
                      <p className="text-xs text-gray-600">{block.content}</p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Preview Footer */}
            <div className="bg-gray-50 p-3 text-center">
              <p className="text-xs text-gray-500">🐼 PandaBio</p>
            </div>
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
      {editingBlock && editingBlock.type === 'agendamento' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <AgendamentoBlockConfig
              block={editingBlock}
              onUpdate={(updates) => handleUpdateBlock(editingBlock.id, updates)}
              onDelete={() => {
                handleDeleteBlock(editingBlock.id);
                setEditingBlock(null);
              }}
            />
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => setEditingBlock(null)}
                className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function getBlockIcon(type: BlockType): string {
  const icons = {
    link: '🔗',
    text: '📝',
    image: '🖼️',
    video: '🎥',
    agendamento: '📅',
    produto: '🛍️',
    social: '📱',
    contact: '📧',
    music: '🎵',
    location: '📍',
  };
  return icons[type] || '📦';
}

function getBlockPlaceholder(type: BlockType): string {
  const placeholders = {
    link: 'Instagram.com/...',
    text: 'Seu texto aqui',
    image: 'Sua imagem',
    video: 'Seu vídeo',
    agendamento: 'Agende seu horário',
    produto: 'Conheça meus produtos',
    social: 'Minhas redes sociais',
    contact: 'Entre em contato',
    music: 'Minha música',
    location: 'Minha localização',
  };
  return placeholders[type] || 'Bloco';
}