"use client"

import { createContext, useContext, useState, useEffect } from 'react';

const DetailPortalContext = createContext();

export function DetailPortalProvider({ children }) {
  const [portalState, setPortalState] = useState({
    isOpen: false,
    type: null, // 'eleve', 'enseignant', 'classe'
    entityId: null,
    title: '',
    icon: '📋'
  });

  // Gérer le bouton retour du navigateur
  useEffect(() => {
    const handlePopState = () => {
      if (portalState.isOpen) {
        setPortalState({
          isOpen: false,
          type: null,
          entityId: null,
          title: '',
          icon: '📋'
        });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [portalState.isOpen]);

  const openPortal = (type, entityId, title, icon) => {
    setPortalState({
      isOpen: true,
      type,
      entityId,
      title,
      icon
    });
  };

  const closePortal = () => {
    setPortalState({
      isOpen: false,
      type: null,
      entityId: null,
      title: '',
      icon: '📋'
    });
    
    // Revenir à l'URL précédente sans navigation supplémentaire
    window.history.back();
  };

  return (
    <DetailPortalContext.Provider value={{
      portalState,
      openPortal,
      closePortal
    }}>
      {children}
    </DetailPortalContext.Provider>
  );
}

export function useDetailPortal() {
  const context = useContext(DetailPortalContext);
  if (!context) {
    throw new Error('useDetailPortal must be used within a DetailPortalProvider');
  }
  return context;
}
