'use client';

import { useContext } from 'react';
import { MusicKitContext } from '@/components/music/MusicKitProvider';

export function useMusicKit() {
  const context = useContext(MusicKitContext);
  if (!context) {
    throw new Error('useMusicKit must be used within a MusicKitProvider');
  }
  return context;
}
