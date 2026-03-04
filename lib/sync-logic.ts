'use client';

import { useState } from 'react';
import { useFinanceStore } from './store';

export function useCloudSync() {
  const store = useFinanceStore();
  const { syncId, setLastSynced } = store;
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Push local changes to server
  const pushToCloud = async () => {
    if (!syncId) return;
    setIsSyncing(true);
    setError(null);
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
      };

      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: syncId, data: dataToSync }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to sync');
      
      setLastSynced(result.updatedAt);
      return true;
    } catch (err: any) {
      console.error('Server Sync Error:', err);
      setError(err.message);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Pull from server
  const pullFromCloud = async (id: string) => {
    setIsSyncing(true);
    setError(null);
    try {
      const response = await fetch(`/api/sync?key=${encodeURIComponent(id)}`);
      const result = await response.json();
      
      if (!response.ok) throw new Error(result.error || 'Failed to fetch data');

      if (result.data) {
        store.importData(result.data);
        setLastSynced(result.data.updatedAt || new Date().toISOString());
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Server Pull Error:', err);
      setError(err.message);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Delete from server
  const deleteFromServer = async () => {
    if (!syncId) return;
    setIsSyncing(true);
    setError(null);
    try {
      const response = await fetch(`/api/sync?key=${encodeURIComponent(syncId)}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to delete data');
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  return { pushToCloud, pullFromCloud, deleteFromServer, isSyncing, error };
}
