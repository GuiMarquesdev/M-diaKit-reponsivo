import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { initialMediaKitData } from '../initialData';
import { MediaKitData } from '../types';
import { OFFICIAL_SOCIAL_LINKS } from '../constants';

const STORAGE_KEY = 'sophiamenezes_mediakit_data_cache_v3';
const CONTENT_ROW_ID = 'main';

const BRAND_HIGH_RES_MAP: Record<string, string> = {
  'brand-1': '/brand-images/brand-1.webp',
  'brand-2': '/brand-images/brand-2.webp',
  'brand-3': '/brand-images/brand-3.webp',
  'brand-4': '/brand-images/brand-4.webp',
  'brand-5': '/brand-images/brand-5.webp',
  'brand-7': '/brand-images/brand-6.webp',
};

const normalizeBrands = (brands: any[]) => {
  if (!Array.isArray(brands)) return brands;
  return brands.map((b) => {
    if (!b) return b;
    // Map by id or by name to always ensure pristine, crystal clear resolution
    const matchedAsset =
      BRAND_HIGH_RES_MAP[b.id] ||
      (b.name === 'Forever Liss' ? '/brand-images/brand-1.webp' : null) ||
      (b.name === 'L’Oréal Paris' || b.name === "L'Oreal Paris" ? '/brand-images/brand-2.webp' : null) ||
      (b.name === 'TopWay' ? '/brand-images/brand-3.webp' : null) ||
      (b.name === 'Haskell' ? '/brand-images/brand-4.webp' : null) ||
      (b.name === 'Red Bull' ? '/brand-images/brand-5.webp' : null) ||
      (b.name?.includes('Look de Hoje') ? '/brand-images/brand-6.webp' : null);

    if (matchedAsset) {
      // If the brand currently holds a low-res data URI or was saved as an older compressed data URL,
      // restore the native 1200px Retina WebP file so it never looks pixelated or compressed
      if (
        !b.logoUrl ||
        b.logoUrl.startsWith('data:') ||
        b.logoUrl.includes('blob:') ||
        b.logoUrl.includes('unsplash')
      ) {
        return { ...b, logoUrl: matchedAsset };
      }
    }
    return b;
  });
};

const normalizeSocialLinks = (target: any) => {
  if (!target) return;
  if (target.brands) {
    target.brands = normalizeBrands(target.brands);
  }
  if (target.contact && (target.contact.email === 'contato@sophiamenezes.com.br' || !target.contact.email)) {
    target.contact.email = 'Sophiaamenezes10@gmail.com';
  }
  if (target.instagram) {
    if (
      !target.instagram.profileUrl ||
      target.instagram.profileUrl === 'https://instagram.com' ||
      target.instagram.profileUrl.includes('sophiamenezes')
    ) {
      target.instagram.profileUrl = OFFICIAL_SOCIAL_LINKS.instagram.url;
    }
    if (!target.instagram.handle || target.instagram.handle === '@sophiamenezes') {
      target.instagram.handle = OFFICIAL_SOCIAL_LINKS.instagram.handle;
    }
  }
  if (target.tiktok) {
    if (
      !target.tiktok.profileUrl ||
      target.tiktok.profileUrl === 'https://tiktok.com' ||
      target.tiktok.profileUrl.includes('sophiamenezes')
    ) {
      target.tiktok.profileUrl = OFFICIAL_SOCIAL_LINKS.tiktok.url;
    }
    if (!target.tiktok.handle || target.tiktok.handle === '@sophiamenezes') {
      target.tiktok.handle = OFFICIAL_SOCIAL_LINKS.tiktok.handle;
    }
  }
};

export function useMediaKitData() {
  const [data, setData] = useState<MediaKitData>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        normalizeSocialLinks(parsed);
        return {
          ...initialMediaKitData,
          ...parsed,
          brands: parsed.brands && parsed.brands.length > 0 ? parsed.brands : initialMediaKitData.brands,
          partnershipFormats: parsed.partnershipFormats && parsed.partnershipFormats.length > 0 ? parsed.partnershipFormats : initialMediaKitData.partnershipFormats,
        };
      }
    } catch (e) {
      console.warn('Could not read cached data', e);
    }
    return initialMediaKitData;
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data: row, error: fetchError } = await supabase
          .from('media_kit_content')
          .select('data')
          .eq('id', CONTENT_ROW_ID)
          .maybeSingle();

        if (cancelled) return;
        if (fetchError) throw fetchError;

        if (row?.data) {
          const cloudData = row.data as MediaKitData;
          normalizeSocialLinks(cloudData);
          setData((prev) => ({
            ...prev,
            ...cloudData,
            creator: { ...prev.creator, ...(cloudData.creator || {}) },
            metrics: { ...prev.metrics, ...(cloudData.metrics || {}) },
            instagram: { ...prev.instagram, ...(cloudData.instagram || {}) },
            tiktok: { ...prev.tiktok, ...(cloudData.tiktok || {}) },
            contact: { ...prev.contact, ...(cloudData.contact || {}) },
            segments: Array.isArray(cloudData.segments) ? cloudData.segments : prev.segments,
            brands: Array.isArray(cloudData.brands) ? cloudData.brands : prev.brands,
            partnershipFormats: Array.isArray(cloudData.partnershipFormats) ? cloudData.partnershipFormats : prev.partnershipFormats,
          }));
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData));
          } catch (e) {
            console.error('Failed to cache in localStorage:', e);
          }
        }
      } catch (e) {
        console.warn('Supabase load notice:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateData = async (newData: MediaKitData): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      const cleanData: MediaKitData = JSON.parse(
        JSON.stringify(newData, (_, value) => (value === undefined ? null : value))
      );

      const { error: upsertError } = await supabase
        .from('media_kit_content')
        .upsert({ id: CONTENT_ROW_ID, data: cleanData, updated_at: new Date().toISOString() });

      if (upsertError) throw upsertError;

      setData(cleanData);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanData));
      } catch (e) {
        console.warn('LocalStorage cache update notice:', e);
      }

      setSaving(false);
      return true;
    } catch (err: any) {
      console.error('Error saving media kit data to Supabase:', err);
      const message = err?.message || 'Falha ao persistir alterações no Supabase.';
      setError(message);
      setSaving(false);
      return false;
    }
  };

  const resetToDefault = async () => {
    return updateData(initialMediaKitData);
  };

  return {
    data,
    loading,
    saving,
    error,
    updateData,
    resetToDefault,
  };
}
