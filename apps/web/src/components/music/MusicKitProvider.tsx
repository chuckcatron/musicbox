'use client';

import {
  createContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { configureMusicKit, authorizeMusicKit, unauthorizeMusicKit } from '@/lib/musickit';
import { storeAppleMusicToken } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface MusicKitContextType {
  isConfigured: boolean;
  isAuthorized: boolean;
  isLoading: boolean;
  authorize: () => Promise<boolean>;
  unauthorize: () => Promise<void>;
}

export const MusicKitContext = createContext<MusicKitContextType | null>(null);

export function MusicKitProvider({ children }: { children: ReactNode }) {
  const { getAccessToken } = useAuth();
  const [isConfigured, setIsConfigured] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const music = await configureMusicKit();
      if (music) {
        setIsConfigured(true);
        setIsAuthorized(music.isAuthorized);
      }
      setIsLoading(false);
    }
    init();
  }, []);

  const authorize = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const musicUserToken = await authorizeMusicKit();
      if (musicUserToken) {
        // Store the token in our backend
        const accessToken = await getAccessToken();
        if (accessToken) {
          await storeAppleMusicToken(accessToken, musicUserToken);
        }
        setIsAuthorized(true);
        return true;
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken]);

  const unauthorize = useCallback(async () => {
    setIsLoading(true);
    try {
      await unauthorizeMusicKit();
      setIsAuthorized(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <MusicKitContext.Provider
      value={{
        isConfigured,
        isAuthorized,
        isLoading,
        authorize,
        unauthorize,
      }}
    >
      {children}
    </MusicKitContext.Provider>
  );
}
