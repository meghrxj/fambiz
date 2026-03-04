'use client';

import { useEffect } from 'react';
import { useFinanceStore } from '@/lib/store';

export function StoreInitializer() {
  const loadFromServer = useFinanceStore((state) => state.loadFromServer);

  useEffect(() => {
    loadFromServer();
  }, [loadFromServer]);

  return null;
}
