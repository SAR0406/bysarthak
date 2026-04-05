'use client';

import React, { useMemo, useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Only run on client-side
    setIsClient(true);
  }, []);

  const firebaseServices = useMemo(() => {
    // Only initialize Firebase on the client side
    if (typeof window === 'undefined') {
      return null;
    }
    return initializeFirebase();
  }, [isClient]);

  // During SSR or before client hydration, don't initialize Firebase
  if (!isClient || !firebaseServices) {
    return <>{children}</>;
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
      storage={firebaseServices.storage}
    >
      {children}
    </FirebaseProvider>
  );
}
