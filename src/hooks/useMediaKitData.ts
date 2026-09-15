import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { initialMediaKitData } from '../initialData';
import { MediaKitData } from '../types';

const STORAGE_KEY = 'sophiamenezes_mediakit_data_cache';

export function useMediaKitData() {
  const [data, setData] = useState<MediaKitData>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.contact && (parsed.contact.email === 'contato@sophiamenezes.com.br' || !parsed.contact.email)) {
          parsed.contact.email = 'Sophiaamenezes10@gmail.com';
        }
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
            if (cloudData.contact && (cloudData.contact.email === 'contato@sophiamenezes.com.br' || !cloudData.contact.email)) {
              cloudData.contact.email = 'Sophiaamenezes10@gmail.com';
            }
            setData((prev) => ({
              ...prev,
              ...cloudData,
              creator: { ...prev.creator, ...(cloudData.creator || {}) },
              metrics: { ...prev.metrics, ...(cloudData.metrics || {}) },
              instagram: { ...prev.instagram, ...(cloudData.instagram || {}) },
              tiktok: { ...prev.tiktok, ...(cloudData.tiktok || {}) },
              contact: { ...prev.contact, ...(cloudData.contact || {}) },
              segments: cloudData.segments || prev.segments,
              brands: cloudData.brands && cloudData.brands.length > 0 ? cloudData.brands : (prev.brands && prev.brands.length > 0 ? prev.brands : initialMediaKitData.brands),
              partnershipFormats: cloudData.partnershipFormats && cloudData.partnershipFormats.length > 0 ? cloudData.partnershipFormats : (prev.partnershipFormats && prev.partnershipFormats.length > 0 ? prev.partnershipFormats : initialMediaKitData.partnershipFormats),
            }));
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData));
            } catch (e) {
              console.error(e);
            }
          } else {
            // Document doesn't exist yet on Firestore; fallback gracefully to initial data
            setData(initialMediaKitData);
          }
          setLoading(false);
        },
        (err) => {
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
    let localSuccess = false;
    try {
      // 1. Update local state and localStorage immediately for instant feedback
      setData(newData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      localSuccess = true;

      // 2. Persist to Firestore
      const docRef = doc(db, 'content', 'mediaKit');
      await setDoc(docRef, newData, { merge: true });
      setSaving(false);
      return true;
    } catch (err: any) {
      console.warn('Notice saving media kit data to Firestore:', err);
      // If local storage was saved successfully, retain updates without blocking the user
      if (localSuccess) {
        setSaving(false);
        return true;
      }
      setError(err.message || 'Erro ao salvar alterações.');
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
