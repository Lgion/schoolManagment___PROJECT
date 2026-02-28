'use client';

import React, { useEffect } from 'react';
import { useNavigationWithLoading } from '../../stores/useNavigationWithLoading';
import { useLoading } from '../../stores/useLoading';
import { useDetailPortal } from '../../stores/useDetailPortal';

/**
 * Composant pour intercepter les clics de navigation et gérer le loading
 * Surveille les sélecteurs CSS spécifiés par l'utilisateur
 */
const NavigationInterceptor = () => {
  const { navigateWithLoading } = useNavigationWithLoading();
  const { startLoading, stopLoading } = useLoading();
  const { openPortal } = useDetailPortal();

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

    // Fonction pour détecter les routes de détail
    const isDetailRoute = (url) => {
      const detailPatterns = [
        /^\/eleves\/[^\/]+$/,
        /^\/enseignants\/[^\/]+$/,
        /^\/classes\/[^\/]+$/
      ];
      return detailPatterns.some(pattern => pattern.test(url));
    };

    // Fonction pour extraire les infos de la route
    const parseDetailRoute = (url) => {
      if (url.match(/^\/eleves\/([^\/]+)$/)) {
        const id = url.match(/^\/eleves\/([^\/]+)$/)[1];
        return { type: 'eleve', id, icon: '👨‍🎓' };
      }
      if (url.match(/^\/enseignants\/([^\/]+)$/)) {
        const id = url.match(/^\/enseignants\/([^\/]+)$/)[1];
        return { type: 'enseignant', id, icon: '👨‍🏫' };
      }
      if (url.match(/^\/classes\/([^\/]+)$/)) {
        const id = url.match(/^\/classes\/([^\/]+)$/)[1];
        return { type: 'classe', id, icon: '🏫' };
      }
      return null;
    };

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
        // Vérifier si c'est une route de détail à intercepter
        // if (isDetailRoute(navigationUrl)) {
        //   const routeInfo = parseDetailRoute(navigationUrl);

        //   if (routeInfo) {
        //     // Empêcher la navigation par défaut
        //     event.preventDefault();
        //     event.stopPropagation();

        //     console.log('🎯 Route de détail interceptée:', navigationUrl, '→ Portal');

        //     // Remplacer l'URL actuelle sans ajouter d'entrée dans l'historique
        //     window.history.replaceState({}, '', navigationUrl);

        //     // Ouvrir dans le portal au lieu de naviguer
        //     const title = `${routeInfo.type} ${routeInfo.id}`;
        //     openPortal(routeInfo.type, routeInfo.id, title, routeInfo.icon);

        //     return;
        //   }
        // }

        // Pour les autres routes, navigation normale
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

    history.pushState = function (...args) {
      originalPushState.apply(history, args);
      // Defer state update to avoid 'useInsertionEffect must not schedule updates'
      setTimeout(handleUrlChange, 0);
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(history, args);
      // Defer state update to avoid 'useInsertionEffect must not schedule updates'
      setTimeout(handleUrlChange, 0);
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
