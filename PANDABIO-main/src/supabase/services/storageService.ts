import { supabase, isSupabaseConfigured } from '../client';
import { compressImage, dataUrlToBlob } from '../../utils/image';

export type UploadFolder = 'avatar' | 'cover' | 'background' | 'gallery' | 'product';

export interface UploadResult {
  success: boolean;
  /** URL pública (ou dataURL local quando o Supabase não está configurado) */
  url?: string;
  /** Caminho no bucket, quando enviado ao Storage */
  path?: string;
  error?: string;
}

const BUCKET = 'user-assets';
const PUBLIC_MARKER = `/object/public/${BUCKET}/`;

/**
 * Armazenamento de imagens do usuário no Supabase Storage.
 *
 * As imagens são comprimidas no cliente e enviadas para
 * `user-assets/<auth.uid()>/<pasta>/<timestamp>-<uuid>.<ext>`.
 * Quando o Supabase não está configurado, devolve o dataURL para
 * manter o funcionamento em modo local.
 */
export class StorageService {
  static isConfigured(): boolean {
    return isSupabaseConfigured() && !!supabase;
  }

  /**
   * Comprime e envia uma imagem para a pasta do usuário autenticado.
   */
  static async uploadImage(
    file: File,
    folder: UploadFolder,
    options: { maxDim?: number; quality?: number } = {},
  ): Promise<UploadResult> {
    const { maxDim = 1000, quality = 0.82 } = options;

    let dataUrl: string;
    try {
      dataUrl = await compressImage(file, maxDim, quality);
    } catch {
      return { success: false, error: 'Não foi possível processar a imagem' };
    }

    // Modo local: mantém o dataURL como antes.
    if (!this.isConfigured() || !supabase) {
      return { success: true, url: dataUrl };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: true, url: dataUrl };
      }

      const blob = dataUrlToBlob(dataUrl);
      const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
      const path = `${user.id}/${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, {
          cacheControl: '31536000',
          upsert: false,
          contentType: blob.type,
        });

      if (error) {
        console.error('Supabase storage upload error:', error);
        return { success: false, error: error.message || 'Erro ao enviar imagem', url: dataUrl };
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      return { success: true, url: data.publicUrl, path };
    } catch (error: any) {
      console.error('Error uploading image:', error);
      return { success: false, error: error.message || 'Erro ao enviar imagem', url: dataUrl };
    }
  }

  /**
   * Remove um arquivo do Storage a partir da sua URL pública.
   * Ignora URLs externas/dataURLs.
   */
  static async deleteByUrl(url?: string | null): Promise<void> {
    if (!url || !this.isConfigured() || !supabase) return;

    const index = url.indexOf(PUBLIC_MARKER);
    if (index === -1) return;

    const path = url.slice(index + PUBLIC_MARKER.length).split('?')[0];
    if (!path) return;

    try {
      const { error } = await supabase.storage.from(BUCKET).remove([path]);
      if (error) console.error('Supabase storage delete error:', error);
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  }
}
