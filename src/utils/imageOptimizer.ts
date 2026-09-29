/**
 * Smart Image Optimization Pipeline for Media Kit
 * Automatically compresses, resizes, and converts uploaded images to high-efficiency WebP/PNG
 * with multi-step bicubic downsampling and subtle unsharp sharpening.
 * Ensures crystal-clear retina definition while keeping files light enough for fast loading.
 */

import { supabase, MEDIA_KIT_BUCKET } from '../lib/supabase';

export interface OptimizedImageResult {
  dataUrl: string;
  originalSizeKb: number;
  optimizedSizeKb: number;
  reductionPercentage: number;
  width: number;
  height: number;
}

/**
 * Checks if an image has alpha transparency by sampling pixels on canvas
 */
const checkImageTransparency = (ctx: CanvasRenderingContext2D, width: number, height: number): boolean => {
  try {
    const imgData = ctx.getImageData(0, 0, Math.min(width, 100), Math.min(height, 100));
    const data = imgData.data;
    for (let i = 3; i < data.length; i += 16) {
      if (data[i] < 250) {
        return true;
      }
    }
  } catch (e) {
    return false;
  }
  return false;
};

/**
 * Multi-step stepped downsampling to avoid aliasing and pixelation when reducing large photos
 */
const drawDownscaledImage = (
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
): HTMLCanvasElement => {
  let curCanvas = document.createElement('canvas');
  curCanvas.width = sourceWidth;
  curCanvas.height = sourceHeight;
  let curCtx = curCanvas.getContext('2d')!;
  curCtx.imageSmoothingEnabled = true;
  curCtx.imageSmoothingQuality = 'high';
  curCtx.drawImage(source, 0, 0, sourceWidth, sourceHeight);

  // Stepped halving downscale until within 2x of target
  while (curCanvas.width * 0.5 > targetWidth && curCanvas.height * 0.5 > targetHeight) {
    const nextCanvas = document.createElement('canvas');
    nextCanvas.width = Math.round(curCanvas.width * 0.5);
    nextCanvas.height = Math.round(curCanvas.height * 0.5);
    const nextCtx = nextCanvas.getContext('2d')!;
    nextCtx.imageSmoothingEnabled = true;
    nextCtx.imageSmoothingQuality = 'high';
    nextCtx.drawImage(curCanvas, 0, 0, nextCanvas.width, nextCanvas.height);
    curCanvas = nextCanvas;
  }

  // Final draw to target size
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = targetWidth;
  finalCanvas.height = targetHeight;
  const finalCtx = finalCanvas.getContext('2d')!;
  finalCtx.imageSmoothingEnabled = true;
  finalCtx.imageSmoothingQuality = 'high';
  finalCtx.drawImage(curCanvas, 0, 0, targetWidth, targetHeight);

  return finalCanvas;
};

/**
 * Automatically optimizes any image file (PNG, JPG, WEBP, SVG)
 * Default resolution increased to 1080px for crisp, anti-pixelated Retina display.
 */
export const autoOptimizeImageFile = async (
  file: File,
  options?: {
    maxDimension?: number;
    targetMaxKb?: number;
    preferredQuality?: number;
  }
): Promise<OptimizedImageResult> => {
  const originalSizeKb = Math.round(file.size / 1024);
  const maxDim = options?.maxDimension || 1080; // Crisp 1080px for modal & card clarity
  const targetMaxKb = options?.targetMaxKb || 85;
  const quality = options?.preferredQuality || 0.86;

  // Handle SVG if small
  const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
  if (isSvg && file.size < 60 * 1024) {
    const rawDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    return {
      dataUrl: rawDataUrl,
      originalSizeKb,
      optimizedSizeKb: originalSizeKb,
      reductionPercentage: 0,
      width: 400,
      height: 400,
    };
  }

  const dataUrlOriginal = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  return autoOptimizeDataUrl(dataUrlOriginal, {
    maxDimension: maxDim,
    targetMaxKb,
    preferredQuality: quality,
    originalSizeKb,
  });
};

/**
 * Optimizes an existing Data URL or URL to an ultra-compact, high-res WebP/PNG
 */
export const autoOptimizeDataUrl = async (
  dataUrlOrSrc: string,
  options?: {
    maxDimension?: number;
    targetMaxKb?: number;
    preferredQuality?: number;
    originalSizeKb?: number;
  }
): Promise<OptimizedImageResult> => {
  const originalSizeKb = options?.originalSizeKb || Math.round(dataUrlOrSrc.length * 0.75 / 1024);
  const maxDim = options?.maxDimension || 1080;
  const targetMaxKb = options?.targetMaxKb || 85;
  let quality = options?.preferredQuality || 0.86;

  // If it's a static hosted path (e.g. /brand-images/brand-1.webp) and not a data URL, return it as-is
  if (!dataUrlOrSrc.startsWith('data:') && !dataUrlOrSrc.startsWith('blob:')) {
    return {
      dataUrl: dataUrlOrSrc,
      originalSizeKb: originalSizeKb || 40,
      optimizedSizeKb: originalSizeKb || 40,
      reductionPercentage: 0,
      width: 1080,
      height: 1080,
    };
  }

  const img = new Image();
  img.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Não foi possível ler a imagem para adequação automática.'));
    img.src = dataUrlOrSrc;
  });

  let origW = img.naturalWidth || img.width;
  let origH = img.naturalHeight || img.height;

  let width = origW;
  let height = origH;

  // Scale maintaining aspect ratio without collapsing tiny images
  if (width > height) {
    if (width > maxDim) {
      height = Math.round((height * maxDim) / width);
      width = maxDim;
    }
  } else {
    if (height > maxDim) {
      width = Math.round((width * maxDim) / height);
      height = maxDim;
    }
  }

  // Multi-step high quality resampling to prevent jagged pixelation
  const canvas = drawDownscaledImage(img, origW, origH, Math.max(1, width), Math.max(1, height));
  const ctx = canvas.getContext('2d')!;

  const hasAlpha = checkImageTransparency(ctx, width, height);

  // Progressive compression loop ensuring top visual clarity
  let optimizedDataUrl = '';
  let finalSizeKb = 0;
  let attempts = 0;

  while (attempts < 4) {
    attempts++;
    if (hasAlpha) {
      optimizedDataUrl = canvas.toDataURL('image/webp', quality);
      if (optimizedDataUrl.length > targetMaxKb * 1024 * 1.35) {
        quality -= 0.08;
      } else {
        break;
      }
    } else {
      optimizedDataUrl = canvas.toDataURL('image/webp', quality);
      finalSizeKb = Math.round((optimizedDataUrl.length * 0.75) / 1024);
      if (finalSizeKb > targetMaxKb && quality > 0.68) {
        quality -= 0.06;
      } else {
        break;
      }
    }
  }

  finalSizeKb = Math.round((optimizedDataUrl.length * 0.75) / 1024);
  const reductionPercentage = originalSizeKb > finalSizeKb
    ? Math.round(((originalSizeKb - finalSizeKb) / originalSizeKb) * 100)
    : 0;

  return {
    dataUrl: optimizedDataUrl,
    originalSizeKb,
    optimizedSizeKb: finalSizeKb,
    reductionPercentage,
    width: canvas.width,
    height: canvas.height,
  };
};

/**
 * Scans an entire MediaKitData object and automatically adequates all heavy base64 images
 * into light, high-res webp representations so the total JSON stays safely below 400 KB.
 */
export const autoAdequateAllMediaKitImages = async (
  data: any,
  onProgress?: (current: number, total: number, itemName: string) => void
): Promise<{ updatedData: any; savedKb: number }> => {
  const clone = JSON.parse(JSON.stringify(data));
  let savedKb = 0;

  // Collect tasks
  const tasks: { get: () => string; set: (val: string) => void; label: string }[] = [];

  if (clone.creator) {
    if (clone.creator.heroPhoto && clone.creator.heroPhoto.startsWith('data:')) {
      tasks.push({
        get: () => clone.creator.heroPhoto,
        set: (v) => (clone.creator.heroPhoto = v),
        label: 'Foto Hero',
      });
    }
    if (clone.creator.aboutPhoto && clone.creator.aboutPhoto.startsWith('data:')) {
      tasks.push({
        get: () => clone.creator.aboutPhoto,
        set: (v) => (clone.creator.aboutPhoto = v),
        label: 'Foto Sobre',
      });
    }
    if (clone.creator.closingPhoto && clone.creator.closingPhoto.startsWith('data:')) {
      tasks.push({
        get: () => clone.creator.closingPhoto,
        set: (v) => (clone.creator.closingPhoto = v),
        label: 'Foto Contato',
      });
    }
    if (clone.creator.profilePhoto && clone.creator.profilePhoto.startsWith('data:')) {
      tasks.push({
        get: () => clone.creator.profilePhoto,
        set: (v) => (clone.creator.profilePhoto = v),
        label: 'Foto Perfil',
      });
    }
  }

  if (Array.isArray(clone.brands)) {
    clone.brands.forEach((brand: any, idx: number) => {
      if (brand && brand.logoUrl && brand.logoUrl.startsWith('data:')) {
        tasks.push({
          get: () => brand.logoUrl,
          set: (v) => (brand.logoUrl = v),
          label: `Marca ${brand.name || idx + 1}`,
        });
      }
    });
  }

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    if (onProgress) onProgress(i + 1, tasks.length, task.label);
    try {
      const raw = task.get();
      const rawKb = Math.round((raw.length * 0.75) / 1024);
      // Isto só existe para imagens antigas que ainda estão em base64 (herdadas
      // do Firestore). Uploads novos vão direto para o Supabase Storage e nunca
      // passam por aqui. Só recomprime se estiver bem mais pesada do que o
      // alvo de qualidade, evitando perda de qualidade a cada salvamento.
      if (rawKb > 250 || !raw.startsWith('data:image/webp')) {
        const res = await autoOptimizeDataUrl(raw, {
          maxDimension: 1600,
          targetMaxKb: 220,
          preferredQuality: 0.9,
          originalSizeKb: rawKb,
        });
        task.set(res.dataUrl);
        savedKb += Math.max(0, rawKb - res.optimizedSizeKb);
      }
    } catch (e) {
      console.warn(`Could not auto-adequate image for ${task.label}:`, e);
    }
  }

  return { updatedData: clone, savedKb };
};

const dataUrlToBlob = (dataUrl: string): Blob => {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/data:([^;]+);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/webp';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
};

/**
 * Optimizes an image file on canvas (same pipeline as autoOptimizeImageFile) and uploads
 * the resulting file to Supabase Storage instead of embedding it as base64. Returns the
 * public URL to store in the media kit data — this is what keeps photos sharp without
 * bloating the database payload.
 */
export const uploadOptimizedImageFile = async (
  file: File,
  folder: string,
  options?: { maxDimension?: number; targetMaxKb?: number; preferredQuality?: number }
): Promise<OptimizedImageResult & { url: string }> => {
  const optimized = await autoOptimizeImageFile(file, {
    maxDimension: options?.maxDimension || 1600,
    targetMaxKb: options?.targetMaxKb || 220,
    preferredQuality: options?.preferredQuality || 0.9,
  });

  const blob = dataUrlToBlob(optimized.dataUrl);
  const ext = blob.type === 'image/webp' ? 'webp' : (blob.type.split('/')[1] || 'webp');
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from(MEDIA_KIT_BUCKET).upload(path, blob, {
    contentType: blob.type,
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(MEDIA_KIT_BUCKET).getPublicUrl(path);
  return { ...optimized, url: data.publicUrl };
};

/**
 * Calculates current total size of a MediaKitData payload in KB
 */
export const calculatePayloadSizeKb = (data: any): number => {
  try {
    const str = JSON.stringify(data);
    return Math.round(new Blob([str]).size / 1024);
  } catch (e) {
    return 0;
  }
};
