import React, { useEffect, useState } from 'react';
import {
  PageBlock,
  BlockType,
  BlockProduct,
  SocialPlatform,
  GalleryLayout,
  BlockImage,
  BioLink,
  ProductItem,
  CustomForm,
} from '../types';
import {
  Plus,
  Trash2,
  Image as ImageIcon,
  Link as LinkIcon,
  Wand2,
  Upload,
  Loader2,
} from 'lucide-react';
import { Instagram, Facebook, Music2, Linkedin, Pin, Youtube, Play, AtSign } from 'lucide-react';
import { Modal } from './Modal';
import { StorageService } from '../supabase/services/storageService';

function fetchWithTimeout(url: string, ms = 15000): Promise<Response> {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    fetch(url, { signal: controller.signal }).then(
      (res) => {
        clearTimeout(timer);
        resolve(res);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

function resolveImageUrl(maybe: string, base: string): string | null {
  try {
    return new URL(maybe, base).href;
  } catch {
    return null;
  }
}

// Detecta a plataforma do vídeo a partir da URL e devolve a capa (thumbnail)
// quando possível. Retorna null para MP4s diretos (sem capa automática).
function getVideoInfo(url: string): {
  platform: 'youtube' | 'vimeo' | 'mp4' | 'outro';
  thumbnail: string | null;
} {
  if (!url) return { platform: 'outro', thumbnail: null };
  const lower = url.toLowerCase();
  let videoId: string | null = null;

  // YouTube: youtube.com/watch?v=..., youtu.be/..., shorts, embed
  const ytMatch =
    lower.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/,
    ) || lower.match(/youtube\.com\/watch\?.*[?&]v=([a-zA-Z0-9_-]{6,})/);
  if (ytMatch) {
    videoId = ytMatch[1];
    return { platform: 'youtube', thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` };
  }

  // Vimeo: vimeo.com/<id>
  const vmMatch = lower.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vmMatch) {
    return { platform: 'vimeo', thumbnail: null };
  }

  // MP4 direto
  if (/\.(mp4|webm|ogv|mov|m4v)(\?|#|$)/.test(lower)) {
    return { platform: 'mp4', thumbnail: null };
  }

  return { platform: 'outro', thumbnail: null };
}

// Filtra logos, favicons, avatares, sprites e placeholders da plataforma
// (não são a imagem do produto)
function isPlatformImage(url: string): boolean {
  const lower = url.toLowerCase();
  if (lower.startsWith('data:image/svg') || /\.svg(\?|$)/.test(lower)) return true;
  // GIF 1x1 transparente (placeholder comum em og:image de Hotmart/afiiliados)
  if (/data:image\/gif;base64,r0lgodlhaqaba/.test(lower)) return true;
  return (
    /(logo|favicon|icon|avatar|banner|sprite|pixel|track|spacer|placeholder|error\/logo|faviconv2)/.test(
      lower,
    ) ||
    /\.gif(\?|$)/.test(lower) ||
    lower.includes('1x1')
  );
}

// Coleta imagens do JSON-LD (schema.org Product/Offer) — a fonte mais confiável da
// imagem real do produto. Nunca usa o logo da plataforma.
function collectJsonLdImages(htmlDoc: Document, out: Set<string>): void {
  htmlDoc.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
    let data: unknown;
    try {
      data = JSON.parse(script.textContent || 'undefined');
    } catch {
      return;
    }
    const walk = (node: unknown): void => {
      if (Array.isArray(node)) {
        node.forEach(walk);
        return;
      }
      if (!node || typeof node !== 'object') return;
      const obj = node as Record<string, unknown>;
      if (obj.image !== undefined) {
        const img = obj.image;
        if (typeof img === 'string') out.add(img);
        else if (Array.isArray(img)) {
          img.forEach((i) => {
            if (typeof i === 'string') out.add(i);
            else if (i && typeof i === 'object' && typeof (i as { url?: unknown }).url === 'string')
              out.add((i as { url: string }).url);
          });
        } else if (
          img &&
          typeof img === 'object' &&
          typeof (img as { url?: unknown }).url === 'string'
        ) {
          out.add((img as { url: string }).url);
        }
      }
      Object.keys(obj).forEach((k) => {
        if (k !== 'image') walk(obj[k]);
      });
    };
    walk(data);
  });
}

function extractImagesFromHtml(html: string, baseUrl: string): string[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const collected = new Set<string>();
  const push = (value: string | null | undefined) => {
    if (!value) return;
    const resolved = resolveImageUrl(value, baseUrl);
    if (resolved && !isPlatformImage(resolved)) collected.add(resolved);
  };

  // 1) Imagens estruturadas do produto (JSON-LD / schema.org)
  collectJsonLdImages(doc, collected);

  // 2) og:image / twitter:image
  doc
    .querySelectorAll(
      'meta[property="og:image"], meta[property="og:image:url"], meta[name="twitter:image"], meta[name="twitter:image:src"]',
    )
    .forEach((meta) => push(meta.getAttribute('content')));

  // 3) <img> dentro de áreas de produto/conteúdo
  doc
    .querySelectorAll(
      'main img[src], article img[src], [class*="product" i] img[src], [class*="produto" i] img[src]',
    )
    .forEach((img) => push(img.getAttribute('src')));

  // 4) <img> com tamanho explícito relevante (evita thumbnails/ícones minúsculos)
  doc.querySelectorAll('img[src]').forEach((img) => {
    const width = Number(img.getAttribute('width') || 0);
    if (width && width > 80) push(img.getAttribute('src'));
  });

  return Array.from(collected);
}

async function getPageHtml(url: string): Promise<string | null> {
  const proxies = [
    (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u: string) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
    (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
  ];
  const results = await Promise.race([
    Promise.all(
      proxies.map(async (build) => {
        try {
          const res = await fetchWithTimeout(build(url), 9000);
          if (res.ok) {
            const text = await res.text();
            if (text && text.includes('<')) return text;
          }
        } catch {
          // tenta o próximo proxy
        }
        return null;
      }),
    ).then((values) => values.find((v) => v !== null) || null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 10000)),
  ]);
  return results;
}

// Busca a imagem DO PRODUTO a partir do link. O logo/ícone da plataforma nunca é usado.
async function fetchProductImages(rawUrl: string): Promise<string[]> {
  const result: string[] = [];
  const pushUnique = (url: string | null | undefined) => {
    if (!url) return;
    if (isPlatformImage(url)) return;
    if (/^data:image\/(svg|gif)/.test(url)) return;
    const resolved = resolveImageUrl(url, rawUrl);
    if (resolved && !result.includes(resolved)) result.push(resolved);
  };

  // Microlink processa a página no servidor e é o caminho mais confiável.
  // Executa meta (og:image do produto) e screenshot (captura da página do
  // produto) EM PARALELO, com teto global de ~14s para não travar a UI.
  const sources = await Promise.race([
    Promise.allSettled([
      (async () => {
        try {
          const res = await fetchWithTimeout(
            `https://api.microlink.io/?url=${encodeURIComponent(rawUrl)}&meta=true`,
            10000,
          );
          if (!res.ok) return null;
          const json = await res.json();
          return json?.data?.image?.url || null;
        } catch {
          return null;
        }
      })(),
      (async () => {
        try {
          const res = await fetchWithTimeout(
            `https://api.microlink.io/?url=${encodeURIComponent(rawUrl)}&screenshot=true&palette=false`,
            13000,
          );
          if (!res.ok) return null;
          const json = await res.json();
          const shot = json?.data?.screenshot?.url;
          return typeof shot === 'string' && shot ? shot : null;
        } catch {
          return null;
        }
      })(),
    ]).then((results) => results.map((r) => (r.status === 'fulfilled' ? r.value : null))),
    new Promise<null[]>((resolve) => setTimeout(() => resolve([null, null]), 14000)),
  ]);

  const [ogImage, screenshot] = sources as [string | null, string | null];

  // 1) og:image do produto (real) — só se não for placeholder
  if (ogImage && !/^data:image/.test(ogImage)) pushUnique(ogImage);

  // 2) Captura da página do produto (sempre como opção final)
  if (screenshot) pushUnique(screenshot);

  return result.slice(0, 12);
}

// Reforço em segundo plano: busca o HTML da página e coleciona mais imagens
// reais do produto (JSON-LD, og/twitter e <img>). Nunca bloqueia o retorno.
// Retorna true se conseguiu adicionar candidatos adicionais.
async function enrichProductImages(rawUrl: string, current: string[]): Promise<string[]> {
  const html = await getPageHtml(rawUrl);
  if (!html) return current;
  const extras = extractImagesFromHtml(html, rawUrl);
  if (extras.length === 0) return current;
  const seen = new Set(current);
  const merged = [...current];
  for (const url of extras) {
    const resolved = resolveImageUrl(url, rawUrl);
    if (resolved && !seen.has(resolved)) {
      seen.add(resolved);
      merged.push(resolved);
    }
  }
  return merged.slice(0, 12);
}

interface BlockConfigModalProps {
  block: PageBlock | null;
  onClose: () => void;
  onUpdate: (blockId: string, updates: Partial<PageBlock>) => void;
  onDelete: (blockId: string) => void;
  links?: BioLink[];
  catalogProducts?: ProductItem[];
  forms?: CustomForm[];
}

const BLOCK_NAMES: Record<BlockType, string> = {
  link: 'Link',
  text: 'Texto',
  image: 'Imagem',
  video: 'Vídeo',
  agendamento: 'Agendamento',
  produto: 'Produto',
  social: 'Redes sociais',
  contact: 'Contato',
  form: 'Formulário',
  music: 'Música',
  location: 'Localização',
};

const SOCIAL_PLATFORMS: {
  platform: SocialPlatform;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { platform: 'instagram', label: 'Instagram', icon: Instagram },
  { platform: 'facebook', label: 'Facebook', icon: Facebook },
  { platform: 'tiktok', label: 'TikTok', icon: Music2 },
  { platform: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { platform: 'pinterest', label: 'Pinterest', icon: Pin },
  { platform: 'youtube', label: 'YouTube', icon: Youtube },
  { platform: 'kwai', label: 'Kwai', icon: Play },
  { platform: 'threads', label: 'Threads', icon: AtSign },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label}>
      <span className="block text-xs font-semibold text-gray-700 mb-1">{label}</span>
      {children}
    </div>
  );
}

const inputClass =
  'w-full px-3.5 py-2.5 bg-[#f2f3ff] border-0 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#FF7A00] outline-none';

export const BlockConfigModal: React.FC<BlockConfigModalProps> = ({
  block,
  onClose,
  onUpdate,
  onDelete,
  links = [],
  catalogProducts = [],
  forms = [],
}) => {
  const [form, setForm] = useState<Partial<PageBlock>>({});
  const [gallery, setGallery] = useState<string[]>([]);
  const [fetchingProductId, setFetchingProductId] = useState<string | null>(null);
  const [galleryOpenFor, setGalleryOpenFor] = useState<string | null>(null);
  const [linkCandidates, setLinkCandidates] = useState<Record<string, string[]>>({});
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    if (block) setForm({ ...block });
    void StorageService.listImages('product').then(setGallery);
    setFetchingProductId(null);
    setGalleryOpenFor(null);
  }, [block]);

  if (!block) return null;

  const set = <K extends keyof PageBlock>(key: K, value: PageBlock[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const defaultLinkIds = links.filter((link) => link.active).map((link) => link.id);
  const selectedLinkIds = form.linkIds ?? defaultLinkIds;

  const toggleLinkSelection = (linkId: string, checked: boolean) => {
    const next = new Set(selectedLinkIds);
    if (checked) next.add(linkId);
    else next.delete(linkId);
    set('linkIds', Array.from(next));
  };

  const updateProduct = (productId: string, patch: Partial<BlockProduct>) => {
    setForm((prev) => ({
      ...prev,
      products: (prev.products || []).map((p) => (p.id === productId ? { ...p, ...patch } : p)),
    }));
  };

  const handleUploadProductImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
    productId: string,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    const result = await StorageService.uploadImage(file, 'product', {
      maxDim: 800,
      quality: 0.82,
    });
    if (!result.success || !result.url) {
      setLinkError(result.error || 'Não foi possível processar a imagem');
      return;
    }
    setGallery((current) => [result.url as string, ...current.filter((url) => url !== result.url)]);
    updateProduct(productId, { imageUrl: result.url });
  };

  const handleVideoUrlChange = (value: string) => {
    set('videoUrl', value);
    const info = getVideoInfo(value);
    // YouTube: guarda a capa automaticamente para o preview
    if (info.platform !== 'outro') set('thumbnailUrl', info.thumbnail || '');
  };

  // Adiciona as imagens lidas no upload à galeria do bloco (máx. 10)
  const commitGallery = (added: BlockImage[]) => {
    if (added.length === 0) return;
    const current = form.gallery?.images || [];
    const merged = [...current, ...added].slice(0, 10);
    set('gallery', { images: merged, layout: form.gallery?.layout || 'grid' });
  };

  const handleFetchProductImage = async (productId: string) => {
    const product = (form.products || []).find((p) => p.id === productId);
    const link = product?.link?.trim();
    if (!link) return;
    setFetchingProductId(productId);
    setLinkError(null);
    setLinkCandidates((prev) => ({ ...prev, [productId]: [] }));
    try {
      const candidates = await fetchProductImages(link);
      if (!candidates.length) {
        // Sem resultado rápido: tenta o reforço pelo HTML da página
        const enriched = await enrichProductImages(link, []);
        setLinkCandidates((prev) => ({ ...prev, [productId]: enriched }));
        if (!enriched.length) {
          setLinkError(
            'Não foi possível encontrar a imagem do produto automaticamente. Use a galeria ou suba uma imagem.',
          );
        } else {
          updateProduct(productId, { imageUrl: enriched[0] });
        }
      } else {
        setLinkCandidates((prev) => ({ ...prev, [productId]: candidates }));
        updateProduct(productId, { imageUrl: candidates[0] });
        // Reforço em segundo plano (sem bloquear): adiciona imagens do HTML se houver
        enrichProductImages(link, candidates).then((enriched) => {
          if (enriched.length > candidates.length) {
            setLinkCandidates((prev) => ({ ...prev, [productId]: enriched }));
          }
        });
      }
    } catch {
      setLinkError('Erro ao buscar a imagem. Verifique o link e tente novamente.');
    } finally {
      setFetchingProductId(null);
    }
  };

  const handleSave = () => {
    onUpdate(block.id, { ...form, id: block.id, type: block.type });
    onClose();
  };

  const renderTypeFields = () => {
    switch (block.type) {
      case 'link':
        return (
          <>
            <Field label="Link cadastrado na seção Links">
              {links.length > 0 ? (
                <>
                  <div className="max-h-52 space-y-2 overflow-y-auto rounded-xl bg-[#f2f3ff] p-2">
                    {links.map((link) => (
                      <label
                        key={link.id}
                        className={`flex items-start gap-2 rounded-lg px-2.5 py-2 text-xs ${
                          link.active ? 'cursor-pointer hover:bg-white' : 'opacity-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 accent-[#FF7A00]"
                          checked={selectedLinkIds.includes(link.id)}
                          disabled={!link.active}
                          onChange={(e) => toggleLinkSelection(link.id, e.target.checked)}
                        />
                        <span className="min-w-0">
                          <span className="block break-words font-semibold text-gray-800">
                            {link.title} {link.active ? '' : '(inativo)'}
                          </span>
                          <span className="block break-all text-[11px] text-gray-500">
                            {link.url}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="mt-1 text-[11px] text-gray-500">
                    Selecione um ou mais links. Links ativos ficam selecionados por padrão.
                  </p>
                </>
              ) : (
                <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs text-amber-700">
                  Cadastre links na seção Links para selecioná-los aqui.
                </p>
              )}
            </Field>
            {selectedLinkIds.length === 0 && (
              <>
                <Field label="Título personalizado">
                  <input
                    className={inputClass}
                    value={form.title || ''}
                    onChange={(e) => set('title', e.target.value)}
                    placeholder="Usado quando não houver link cadastrado"
                  />
                </Field>
                <Field label="URL personalizada">
                  <input
                    className={inputClass}
                    value={form.url || ''}
                    onChange={(e) => set('url', e.target.value)}
                    placeholder="https://exemplo.com/..."
                  />
                </Field>
              </>
            )}
          </>
        );
      case 'text':
        return (
          <>
            <Field label="Título">
              <input
                className={inputClass}
                value={form.title || ''}
                onChange={(e) => set('title', e.target.value)}
                placeholder="Título do texto"
              />
            </Field>
            <Field label="Conteúdo">
              <textarea
                className={`${inputClass} resize-none`}
                rows={4}
                value={form.content || ''}
                onChange={(e) => set('content', e.target.value)}
                placeholder="Escreva seu texto..."
              />
            </Field>
          </>
        );
      case 'image':
        return (
          <>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-700">
                Galeria de imagens ({form.gallery?.images.length ?? 0}/10)
              </label>
              <div className="flex gap-1">
                {(['grid', 'carousel', 'film'] as const).map((layout) => (
                  <button
                    key={layout}
                    type="button"
                    onClick={() =>
                      set('gallery', {
                        images: form.gallery?.images || [],
                        layout: layout as GalleryLayout,
                      })
                    }
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      (form.gallery?.layout || 'grid') === layout
                        ? 'bg-[#FF7A00] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {layout === 'grid' ? 'Grade' : layout === 'carousel' ? 'Carrossel' : 'Fita'}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {form.gallery?.images.map((img, index) => (
                <div
                  key={img.id}
                  className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200"
                >
                  <img
                    src={img.url}
                    alt={`Imagem ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {(form.gallery?.images.length || 0) < 10 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-500 hover:border-[#FF7A00] hover:text-[#FF7A00] cursor-pointer transition-colors">
                  <Plus aria-hidden="true" className="w-5 h-5" />
                  <span className="text-[10px] font-semibold">Adicionar</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      const remaining = 10 - (form.gallery?.images.length || 0);
                      const toUpload = files
                        .filter((f) => f.type.startsWith('image/'))
                        .slice(0, remaining);
                      e.target.value = '';
                      if (toUpload.length === 0) return;
                      const results = await Promise.all(
                        toUpload.map(async (file): Promise<BlockImage | null> => {
                          const result = await StorageService.uploadImage(file, 'gallery', {
                            maxDim: 900,
                            quality: 0.8,
                          });
                          return result.success && result.url
                            ? { id: crypto.randomUUID(), url: result.url }
                            : null;
                        }),
                      );
                      commitGallery(results.filter((r): r is BlockImage => r !== null));
                    }}
                  />
                </label>
              )}
            </div>
            {form.gallery?.images && form.gallery.images.length > 0 && (
              <p className="text-[11px] text-gray-500">
                A galeria salva imagens no Supabase Storage. Até 10 imagens por bloco.
              </p>
            )}
            {!form.gallery?.images?.length && (
              <Field label="Ou use uma única imagem por URL">
                <input
                  className={inputClass}
                  value={form.imageUrl || ''}
                  onChange={(e) => set('imageUrl', e.target.value)}
                  placeholder="https://.../imagem.jpg"
                />
                {form.imageUrl && (
                  <img
                    src={form.imageUrl}
                    alt="Prévia"
                    className="mt-2 h-24 w-full object-cover rounded-xl border border-gray-200"
                  />
                )}
              </Field>
            )}
          </>
        );
      case 'video':
        return (
          <>
            <Field label="Link do vídeo">
              <input
                className={inputClass}
                value={form.videoUrl || ''}
                onChange={(e) => handleVideoUrlChange(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
              />
            </Field>
            {form.videoUrl && (
              <div className="rounded-xl border border-gray-200 p-2.5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-[#FF7A00]/10 text-[#FF7A00] text-[10px] font-bold uppercase tracking-wide">
                    {(() => {
                      const info = getVideoInfo(form.videoUrl || '');
                      if (info.platform === 'youtube') return 'YouTube';
                      if (info.platform === 'vimeo') return 'Vimeo';
                      if (info.platform === 'mp4') return 'Vídeo MP4';
                      return 'Vídeo';
                    })()}
                  </span>
                  <span className="text-[11px] text-gray-500">Fonte detectada automaticamente</span>
                </div>
                {getVideoInfo(form.videoUrl || '').thumbnail && (
                  <img
                    src={getVideoInfo(form.videoUrl || '').thumbnail || ''}
                    alt="Capa do vídeo"
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  />
                )}
              </div>
            )}
          </>
        );
      case 'agendamento':
        return (
          <>
            <Field label="Título">
              <input
                className={inputClass}
                value={form.appointmentTitle || ''}
                onChange={(e) => set('appointmentTitle', e.target.value)}
                placeholder="Agende seu horário"
              />
            </Field>
            <Field label="Descrição">
              <textarea
                className={`${inputClass} resize-none`}
                rows={3}
                value={form.appointmentDescription || ''}
                onChange={(e) => set('appointmentDescription', e.target.value)}
                placeholder="Escolha o melhor horário para você"
              />
            </Field>
            <div className="rounded-xl border border-[#FF7A00]/20 bg-[#FF7A00]/5 p-3 text-xs text-gray-600">
              Serviços, profissionais, dias e horários são carregados automaticamente da seção
              Agendamentos.
            </div>
            <Field label="Texto do botão">
              <input
                className={inputClass}
                value={form.content || ''}
                onChange={(e) => set('content', e.target.value)}
                placeholder="Ver agenda e horários"
              />
            </Field>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={!!form.showPrice}
                  onChange={(e) => set('showPrice', e.target.checked)}
                  className="w-4 h-4 rounded text-[#FF7A00] focus:ring-[#FF7A00]"
                />
                Mostrar preço
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={!!form.showDuration}
                  onChange={(e) => set('showDuration', e.target.checked)}
                  className="w-4 h-4 rounded text-[#FF7A00] focus:ring-[#FF7A00]"
                />
                Mostrar duração
              </label>
            </div>
          </>
        );
      case 'produto':
        return (
          <>
            <Field label="Título do catálogo">
              <input
                className={inputClass}
                value={form.title || ''}
                onChange={(e) => set('title', e.target.value)}
                placeholder="Meus produtos"
              />
            </Field>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-gray-700">
                  Produtos ({form.products?.length ?? 0})
                </label>
                <div className="flex items-center gap-2">
                  {catalogProducts.length > 0 && (
                    <select
                      defaultValue=""
                      aria-label="Adicionar produto do catálogo"
                      onChange={(event) => {
                        const selected = catalogProducts.find(
                          (product) => product.id === event.target.value,
                        );
                        if (!selected) return;
                        set('products', [
                          ...(form.products || []),
                          {
                            id: crypto.randomUUID(),
                            productId: selected.id,
                            name: selected.name,
                            price: selected.price,
                            description: selected.description,
                            imageUrl: selected.image,
                            link: selected.purchaseUrl || selected.sourceUrl || '',
                            purchaseType: selected.purchaseType || 'sales',
                          },
                        ]);
                        event.target.value = '';
                      }}
                      className="max-w-[180px] rounded-lg border border-[#ffcfaa] bg-[#fffaf5] px-2 py-1.5 text-[11px] font-semibold text-[#ff7a00] outline-none"
                    >
                      <option value="">Adicionar do catálogo</option>
                      {catalogProducts.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      set('products', [
                        ...(form.products || []),
                        {
                          id: crypto.randomUUID(),
                          name: '',
                          price: undefined,
                          imageUrl: '',
                          link: '',
                        },
                      ])
                    }
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#ff7a00] transition-colors hover:bg-[#ff7a00]/10"
                  >
                    <Plus aria-hidden="true" className="h-3.5 w-3.5" /> Manual
                  </button>
                </div>
              </div>
              {(!form.products || form.products.length === 0) && (
                <p className="text-xs text-gray-500 text-center py-3 border border-dashed border-gray-300 rounded-xl">
                  Nenhum produto no catálogo. Clique em "Adicionar produto".
                </p>
              )}
              <div className="space-y-3">
                {(form.products || []).map((product, index) => (
                  <div
                    key={product.id}
                    className="border border-gray-200 rounded-xl p-3 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                        Produto {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          StorageService.deleteByUrl(product.imageUrl);
                          set(
                            'products',
                            (form.products || []).filter((p) => p.id !== product.id),
                          );
                        }}
                        aria-label={`Remover produto ${index + 1}`}
                        className="flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:bg-red-50 rounded-lg px-2 py-1 transition-colors cursor-pointer"
                      >
                        <Trash2 aria-hidden="true" className="w-3 h-3" /> Remover
                      </button>
                    </div>
                    <div className="flex gap-2.5">
                      <div className="w-[68px] h-[68px] shrink-0 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name || `Produto ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2.5">
                        <input
                          className={inputClass}
                          value={product.name}
                          onChange={(e) => updateProduct(product.id, { name: e.target.value })}
                          placeholder="Nome do produto"
                        />
                        <div className="flex gap-2.5">
                          <input
                            type="number"
                            step="0.01"
                            className={`${inputClass} w-24`}
                            value={product.price ?? ''}
                            onChange={(e) =>
                              updateProduct(product.id, {
                                price:
                                  e.target.value === ''
                                    ? undefined
                                    : Number.isFinite(parseFloat(e.target.value))
                                      ? parseFloat(e.target.value)
                                      : undefined,
                              })
                            }
                            placeholder="Preço"
                          />
                          <input
                            className={`${inputClass} flex-1`}
                            value={product.imageUrl || ''}
                            onChange={(e) =>
                              updateProduct(product.id, { imageUrl: e.target.value })
                            }
                            placeholder="URL da imagem"
                          />
                        </div>
                        <textarea
                          rows={2}
                          className={`${inputClass} resize-none`}
                          value={product.description || ''}
                          onChange={(e) =>
                            updateProduct(product.id, { description: e.target.value })
                          }
                          placeholder="Descrição do produto"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 mb-1">
                        <LinkIcon className="w-3 h-3" /> Link do produto / afiliado
                      </label>
                      <input
                        className={inputClass}
                        value={product.link || ''}
                        onChange={(e) => updateProduct(product.id, { link: e.target.value })}
                        placeholder="https://hotmart.com/... (uso comercial)"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleFetchProductImage(product.id)}
                        disabled={!product.link?.trim() || fetchingProductId === product.id}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-[#FF7A00] hover:bg-[#FF7A00]/10 rounded-lg px-2.5 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="Busca a imagem REAL do produto a partir do link (não o logo da plataforma)"
                      >
                        {fetchingProductId === product.id ? (
                          <Loader2 aria-hidden="true" className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Wand2 aria-hidden="true" className="w-3.5 h-3.5" />
                        )}
                        Buscar imagem do link
                      </button>
                      <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600 hover:bg-gray-100 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer">
                        <Upload aria-hidden="true" className="w-3.5 h-3.5" /> Subir imagem
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleUploadProductImage(e, product.id)}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setGalleryOpenFor((prev) => (prev === product.id ? null : product.id))
                        }
                        className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600 hover:bg-gray-100 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5" /> Galeria
                      </button>
                      {product.imageUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            StorageService.deleteByUrl(product.imageUrl);
                            updateProduct(product.id, { imageUrl: '' });
                          }}
                          className="flex items-center gap-1.5 text-[11px] font-semibold text-red-500 hover:bg-red-50 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer"
                        >
                          <Trash2 aria-hidden="true" className="w-3 h-3" /> Remover imagem
                        </button>
                      )}
                    </div>
                    {linkCandidates[product.id] && linkCandidates[product.id].length > 0 && (
                      <div className="rounded-xl border border-gray-200 p-2">
                        <p className="text-[11px] font-semibold text-gray-500 mb-1.5">
                          {linkCandidates[product.id].some((u) => u.includes('microlink.io'))
                            ? 'Imagem do produto ou captura da página — escolha a melhor:'
                            : 'Imagens do produto encontradas no link — escolha uma:'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {linkCandidates[product.id].map((img) => (
                            <button
                              key={img}
                              type="button"
                              onClick={() => updateProduct(product.id, { imageUrl: img })}
                              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-colors cursor-pointer ${
                                product.imageUrl === img
                                  ? 'border-[#FF7A00]'
                                  : 'border-transparent hover:border-gray-300'
                              }`}
                              title="Usar esta imagem"
                            >
                              <img
                                src={img}
                                alt="Imagem do produto"
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {linkError && (
                      <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                        {linkError}
                      </p>
                    )}
                    {galleryOpenFor === product.id && (
                      <div className="rounded-xl border border-gray-200 p-2">
                        {gallery.length === 0 ? (
                          <p className="text-[11px] text-gray-500 text-center py-2">
                            Nenhuma imagem na galeria ainda. Suba imagens para reutilizá-las.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {gallery.map((img) => (
                              <button
                                key={img}
                                type="button"
                                onClick={() => updateProduct(product.id, { imageUrl: img })}
                                className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-colors cursor-pointer ${
                                  product.imageUrl === img
                                    ? 'border-[#FF7A00]'
                                    : 'border-transparent hover:border-gray-300'
                                }`}
                                title={
                                  product.imageUrl === img
                                    ? 'Imagem selecionada'
                                    : 'Usar esta imagem'
                                }
                              >
                                <img
                                  src={img}
                                  alt="Opção da galeria"
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        );
      case 'social':
        return (
          <>
            <Field label="Redes sociais — cole o link de cada uma">
              <div className="space-y-2">
                {SOCIAL_PLATFORMS.map(({ platform, label, icon: PlatformIcon }) => {
                  const link =
                    (form.socialLinks || []).find((l) => l.platform === platform)?.url || '';
                  return (
                    <div key={platform} className="flex items-center gap-2">
                      <span className="w-9 h-9 shrink-0 rounded-xl bg-[#f2f3ff] flex items-center justify-center text-gray-600">
                        <PlatformIcon className="w-4 h-4" />
                      </span>
                      <input
                        className={inputClass}
                        value={link}
                        onChange={(e) => {
                          const existing = form.socialLinks || [];
                          const idx = existing.findIndex((l) => l.platform === platform);
                          const updated = [...existing];
                          if (idx >= 0) updated[idx] = { ...updated[idx], url: e.target.value };
                          else updated.push({ id: platform, platform, url: e.target.value });
                          set('socialLinks', updated);
                        }}
                        placeholder={`Link do ${label}`}
                      />
                    </div>
                  );
                })}
              </div>
            </Field>
          </>
        );
      case 'contact':
        return (
          <>
            <Field label="WhatsApp (com DDD)">
              <input
                className={inputClass}
                value={form.contact?.whatsapp || ''}
                onChange={(e) =>
                  set('contact', { ...(form.contact || {}), whatsapp: e.target.value })
                }
                placeholder="11999990000"
              />
            </Field>
            <Field label="E-mail para contato">
              <input
                type="email"
                className={inputClass}
                value={form.contact?.email || ''}
                onChange={(e) => set('contact', { ...(form.contact || {}), email: e.target.value })}
                placeholder="contato@seunegocio.com.br"
              />
            </Field>
            <Field label="Texto do botão">
              <input
                className={inputClass}
                value={form.content || ''}
                onChange={(e) => set('content', e.target.value)}
                placeholder="Fale comigo"
              />
            </Field>
            <label className="flex items-start gap-3 rounded-xl border border-[#eaedff] bg-[#faf8ff] p-3">
              <input
                type="checkbox"
                checked={form.contact?.captureEnabled === true}
                onChange={(event) =>
                  set('contact', {
                    ...(form.contact || {}),
                    captureEnabled: event.target.checked,
                  })
                }
                className="mt-0.5 h-4 w-4 accent-[#FF7A00]"
              />
              <span>
                <span className="block text-xs font-bold text-[#131b2e]">
                  Ativar captura de lead
                </span>
                <span className="mt-1 block text-[11px] leading-5 text-gray-500">
                  Exibe formulário público neste bloco e exige consentimento.
                </span>
              </span>
            </label>
            {form.contact?.captureEnabled && (
              <>
                <Field label="Título da captura">
                  <input
                    className={inputClass}
                    value={form.contact?.captureTitle || ''}
                    onChange={(e) =>
                      set('contact', { ...(form.contact || {}), captureTitle: e.target.value })
                    }
                    placeholder="Receba 10% de desconto"
                  />
                </Field>
                <Field label="Texto do botão da captura">
                  <input
                    className={inputClass}
                    value={form.contact?.captureButtonLabel || ''}
                    onChange={(e) =>
                      set('contact', {
                        ...(form.contact || {}),
                        captureButtonLabel: e.target.value,
                      })
                    }
                    placeholder="Quero receber"
                  />
                </Field>
                <Field label="Texto de consentimento">
                  <input
                    className={inputClass}
                    value={form.contact?.captureConsentText || ''}
                    onChange={(e) =>
                      set('contact', {
                        ...(form.contact || {}),
                        captureConsentText: e.target.value,
                      })
                    }
                    placeholder="Aceito receber contato sobre esta oferta."
                  />
                </Field>
              </>
            )}
          </>
        );
      case 'form': {
        const selectedForm = forms.find((item) => item.id === form.formId);
        return (
          <>
            <Field label="Formulário salvo">
              {forms.length > 0 ? (
                <select
                  className={inputClass}
                  value={form.formId || ''}
                  onChange={(event) => {
                    const nextForm = forms.find((item) => item.id === event.target.value);
                    set('formId', event.target.value || undefined);
                    if (nextForm) set('title', nextForm.title);
                  }}
                >
                  <option value="">Selecione um formulário</option>
                  {forms.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                  Crie um formulário na seção Formulários antes de publicar este bloco.
                </p>
              )}
            </Field>
            {selectedForm && (
              <div className="rounded-xl border border-[#eaedff] bg-[#faf8ff] p-3 text-xs text-gray-600">
                <p className="font-bold text-[#131b2e]">{selectedForm.title}</p>
                <p className="mt-1">{selectedForm.fields.length} campos · consentimento ativo</p>
              </div>
            )}
          </>
        );
      }
      case 'music':
        return (
          <>
            <Field label="Provedor">
              <div className="flex gap-2">
                {(
                  [
                    { value: 'spotify', label: 'Spotify' },
                    { value: 'youtube', label: 'YouTube' },
                    { value: 'outro', label: 'Outro' },
                  ] as const
                ).map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set('musicProvider', value)}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      (form.musicProvider || 'spotify') === value
                        ? 'bg-[#FF7A00] text-white'
                        : 'bg-[#f2f3ff] text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Link da playlist ou música">
              <input
                className={inputClass}
                value={form.url || ''}
                onChange={(e) => set('url', e.target.value)}
                placeholder={
                  (form.musicProvider || 'spotify') === 'spotify'
                    ? 'https://open.spotify.com/playlist/...'
                    : 'https://youtube.com/playlist?...'
                }
              />
            </Field>
            <Field label="Título">
              <input
                className={inputClass}
                value={form.title || ''}
                onChange={(e) => set('title', e.target.value)}
                placeholder="Minha playlist"
              />
            </Field>
            <Field label="Descrição">
              <input
                className={inputClass}
                value={form.content || ''}
                onChange={(e) => set('content', e.target.value)}
                placeholder="Ouça agora"
              />
            </Field>
          </>
        );
      case 'location':
        return (
          <>
            <Field label="Endereço">
              <input
                className={inputClass}
                value={form.address || ''}
                onChange={(e) => set('address', e.target.value)}
                placeholder="Av. Paulista, 1000"
              />
            </Field>
            <Field label="URL do mapa (Google Maps)">
              <input
                className={inputClass}
                value={form.mapUrl || ''}
                onChange={(e) => set('mapUrl', e.target.value)}
                placeholder="https://maps.google.com/..."
              />
            </Field>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={!!block}
      onClose={onClose}
      titleId="block-config-title"
      size={block.type === 'produto' ? 'lg' : 'md'}
    >
      <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100">
        <h2 id="block-config-title" className="font-bold text-base text-[#131b2e]">
          Configurar {BLOCK_NAMES[block.type]}
        </h2>
        <button
          onClick={() => {
            onDelete(block.id);
            onClose();
          }}
          className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer"
        >
          Excluir bloco
        </button>
      </div>

      <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
        {renderTypeFields()}
      </div>

      <div className="px-5 sm:px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-5 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-bold rounded-xl transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          className="px-5 py-2 bg-[#FF7A00] hover:brightness-110 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
        >
          Salvar alterações
        </button>
      </div>
    </Modal>
  );
};
