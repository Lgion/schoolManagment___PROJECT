'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Contexte pour gérer l'état de loading global
const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Dans Next.js 13+ App Router, les router events ne sont plus disponibles
    // La logique de loading sera gérée manuellement via les clics interceptés
    console.log('🔄 LoadingProvider initialisé - gestion manuelle du loading');
  }, [router]);

  // Fonction pour déclencher le loading manuellement
  const startLoading = () => setIsLoading(true);
  const stopLoading = () => setIsLoading(false);

  const value = {
    isLoading,
    startLoading,
    stopLoading,
    setIsLoading
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte de loading
export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading doit être utilisé dans un LoadingProvider');
  }
  return context;
};
