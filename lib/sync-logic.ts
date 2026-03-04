'use client';

import { useEffect, useState } from 'react';
import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { useFinanceStore } from './store';

export function useCloudSync() {
  const store = useFinanceStore();
  const { syncId, setLastSynced } = store;
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Push local changes to cloud
  const pushToCloud = async () => {
    if (!syncId) return;
    setIsSyncing(true);
    try {
      const dataToSync = {
        members: store.members,
        categories: store.categories,
        salaries: store.salaries,
        expenses: store.expenses,
        liabilities: store.liabilities,
        investments: store.investments,
        lending: store.lending,
        profitShares: store.profitShares,
        properties: store.properties,
        rentalPayments: store.rentalPayments,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'family_data', syncId), dataToSync);
      setLastSynced(new Date().toISOString());
    } catch (err: any) {
      console.error('Cloud Sync Error:', err);
      setError(err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Pull from cloud
  const pullFromCloud = async (id: string) => {
    setIsSyncing(true);
    try {
      const docRef = doc(db, 'family_data', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        store.importData(data);
        setLastSynced(data.updatedAt || new Date().toISOString());
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  return { pushToCloud, pullFromCloud, isSyncing, error };
}
