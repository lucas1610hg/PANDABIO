/**
 * Redimensiona e comprime uma imagem para dataURL, evitando base64 gigantes
 * no estado antes do envio para o Supabase Storage.
 */
export const compressImage = (file: File, maxDim = 1000, quality = 0.82): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler a imagem'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Imagem inválida'));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas indisponível'));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const out = canvas.toDataURL('image/jpeg', quality);
        // Se a compressão ficou maior que a original, mantém a original
        if (out.length >= String(reader.result).length) {
          resolve(String(reader.result));
        } else {
          resolve(out);
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });

/**
 * Converte um dataURL (base64) em Blob, usado para enviar ao Supabase Storage.
 */
export const dataUrlToBlob = (dataUrl: string): Blob => {
  const [meta, base64] = dataUrl.split(',');
  const mime = /:(.*?);/.exec(meta || '')?.[1] || 'image/jpeg';
  const binary = atob(base64 || '');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
};
