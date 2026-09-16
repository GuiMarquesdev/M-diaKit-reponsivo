import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { initialMediaKitData } from '../initialData';
import { MediaKitData } from '../types';
import { OFFICIAL_SOCIAL_LINKS } from '../constants';

const STORAGE_KEY = 'sophiamenezes_mediakit_data_cache';

const normalizeSocialLinks = (target: any) => {
  if (!target) return;
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
    let unsubscribe = () => {};

    try {
      const docRef = doc(db, 'content', 'mediaKit');

      // Realtime listener
      unsubscribe = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const cloudData = docSnap.data() as MediaKitData;
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
          } else {
            // Document doesn't exist yet on Firestore; fallback gracefully to initial data
            setData(initialMediaKitData);
          }
          setLoading(false);
        },
        (err) => {
          console.warn('Firestore subscription notice:', err);
          // If Firestore permission or network issue occurs, continue gracefully with local/cached data
          setLoading(false);
        }
      );
    } catch (e: any) {
      console.warn('Firestore initialize error:', e);
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const updateData = async (newData: MediaKitData): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      // 1. Sanitize to prevent undefined values which break Firestore setDoc
      const cleanData: MediaKitData = JSON.parse(
        JSON.stringify(newData, (_, value) => (value === undefined ? null : value))
      );

      // 2. Validate payload size before Firestore rejection (Firestore document ceiling is 1MB)
      const payloadString = JSON.stringify(cleanData);
      const payloadBytes = new Blob([payloadString]).size;
      if (payloadBytes > 950 * 1024) {
        throw new Error(
          `O tamanho total das informações (${(payloadBytes / 1024).toFixed(0)} KB) ultrapassa o limite permitido pelo Firestore (1 MB). Reduza a resolução dos arquivos de logos inseridos.`
        );
      }

      // 3. Persist directly to Firestore
      const docRef = doc(db, 'content', 'mediaKit');
      await setDoc(docRef, cleanData, { merge: true });

      // 4. Update local state and localStorage cache after cloud write confirmation
      setData(cleanData);
      try {
        localStorage.setItem(STORAGE_KEY, payloadString);
      } catch (e) {
        console.warn('LocalStorage cache update notice:', e);
      }

      setSaving(false);
      return true;
    } catch (err: any) {
      console.error('Error saving media kit data to Firestore:', err);
      const message = err?.message || 'Falha ao persistir alterações no Firestore.';
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
