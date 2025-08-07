'use client';

import type { User } from 'better-auth';
import { useRef, useState } from 'react';
import { authClient } from '../lib/auth-client';

export const useUser = (): { user: User | null; isLoading: boolean } => {
  const loading = useRef(false);
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    const localData = localStorage.getItem('userData');
    if (localData) {
      return JSON.parse(localData);
    }
    return null;
  });

  if (!user) {
    (async () => {
      loading.current = true;
      const session = await authClient.getSession();
      localStorage.setItem('userData', JSON.stringify(session?.data?.user));
      setUser(session?.data?.user ?? null);
      loading.current = false;
    })();
  }

  return { user, isLoading: loading.current };
};
