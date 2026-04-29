'use client';

import { useEffect } from 'react';

import { setAuthTokenGetter } from '@/lib/api';
import { useAuth } from '@/lib/auth';

/**
 * Wires the active AuthProvider into the global API client so non-demo
 * fetches can attach `Authorization: Bearer <token>`. Mounted once near the
 * top of the React tree.
 */
export function AuthTokenBridge() {
  const auth = useAuth();
  const getAccessToken = auth.getAccessToken;

  useEffect(() => {
    setAuthTokenGetter(getAccessToken);
    return () => setAuthTokenGetter(null);
  }, [getAccessToken]);

  return null;
}
