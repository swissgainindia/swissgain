import { useState, useEffect } from 'react';
import { SwissGainData } from '@/types';
import { getStorageData, setStorageData, syncWithFirebase } from '@/lib/storage';

export const useLocalStorage = () => {
  const [data, setData] = useState<SwissGainData>(getStorageData());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Sync with Firebase on initial load
        await syncWithFirebase();
        setData(getStorageData());
      } catch (error) {
        console.error('Error syncing with Firebase:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();

    const handleStorageChange = () => {
      setData(getStorageData());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateData = async (updater: (data: SwissGainData) => SwissGainData) => {
    const newData = updater(data);
    setStorageData(newData);
    setData(newData);
    
    // Sync with Firebase after update
    try {
      await syncWithFirebase();
    } catch (error) {
      console.error('Error syncing with Firebase:', error);
    }
  };

  return { data, updateData, loading };
};