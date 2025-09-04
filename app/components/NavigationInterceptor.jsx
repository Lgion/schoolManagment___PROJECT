'use client';

import React, { useEffect } from 'react';
import { useNavigationWithLoading } from '../../stores/useNavigationWithLoading';
import { useLoading } from '../../stores/useLoading';

/**
 * Composant pour intercepter les clics de navigation et gérer le loading
 * Surveille les sélecteurs CSS spécifiés par l'utilisateur
 */
const NavigationInterceptor = () => {
  const { navigateWithLoading } = useNavigationWithLoading();
  const { startLoading, stopLoading } = useLoading();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Sélecteurs CSS des liens à intercepter
    const targetSelectors = [
      '.ecole-admin__nav > a',
      '.ecole-admin__content h1 > .ecole-admin__nav-btn',
      '.classe-card',
      '.eleve-card', 
      '.person-card',
      '.classe-card__editbtn',
      '.eleve-card__editbtn',
      '.person-card__editbtn',
      '.person-detail__editbtn'
    ];

    // Fonction pour gérer les clics interceptés
    const handleNavigationClick = async (event) => {
      const target = event.target;
      const clickedElement = target.closest(targetSelectors.join(', '));
      
      if (!clickedElement) return;

      // Vérifier si c'est un lien ou un élément avec navigation
      let navigationUrl = null;
      
      // Si c'est un lien <a>
      if (clickedElement.tagName === 'A' && clickedElement.href) {
        navigationUrl = clickedElement.getAttribute('href');
      }
      // Si c'est un élément avec data-href
      else if (clickedElement.dataset.href) {
        navigationUrl = clickedElement.dataset.href;
      }
      // Si c'est un élément avec onclick qui contient router.push
      else if (clickedElement.onclick) {
        // Pour les éléments qui utilisent router.push dans leur onclick
        // On laisse passer et on active juste le loading
        console.log('🔄 Navigation détectée via onclick - activation du loader');
        startLoading();
        
        // Désactiver le loader après un délai (au cas où la navigation échoue)
        setTimeout(() => {
          stopLoading();
        }, 5000);
        
        return;
      }

      // Si on a trouvé une URL de navigation
      if (navigationUrl) {
        // Empêcher la navigation par défaut
        event.preventDefault();
        event.stopPropagation();

        console.log('🔄 Navigation interceptée vers:', navigationUrl);
        
        // Activer le loader
        startLoading();

        try {
          // Naviguer avec loading et ViewTransitions
          await navigateWithLoading(navigationUrl);
          
        } catch (error) {
          console.error('❌ Erreur de navigation:', error);
          stopLoading();
        }
      }
    };

    // Ajouter l'event listener sur le document
    document.addEventListener('click', handleNavigationClick, true);

    // Observer les changements d'URL pour désactiver le loader
    const handleUrlChange = () => {
      console.log('✅ URL changée - désactivation du loader');
      stopLoading();
    };

    // Observer les changements d'URL via l'API History
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      handleUrlChange();
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      handleUrlChange();
    };

    window.addEventListener('popstate', handleUrlChange);

    // Nettoyage
    return () => {
      document.removeEventListener('click', handleNavigationClick, true);
      window.removeEventListener('popstate', handleUrlChange);
      
      // Restaurer les méthodes originales
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [navigateWithLoading, startLoading, stopLoading]);

  // Ce composant ne rend rien, il ne fait qu'intercepter les événements
  return null;
};

export default NavigationInterceptor;
