'use client';

import { useRouter } from 'next/navigation';
import { useLoading } from './useLoading';

/**
 * Hook personnalisé pour navigation avec loading et ViewTransitions
 * Respecte les règles utilisateur pour les ViewTransitions dans navigation pages
 */
export const useNavigationWithLoading = () => {
  const router = useRouter();
  const { startLoading, stopLoading } = useLoading();

  /**
   * Navigation avec loading et ViewTransitions
   * @param {string} url - URL de destination
   * @param {Object} options - Options de navigation
   */
  const navigateWithLoading = async (url, options = {}) => {
    try {
      console.log('🔄 Navigation avec loading vers:', url);
      
      // Activer le loader
      startLoading();

      // Attendre que React rende le spinner (50ms)
      await new Promise(resolve => setTimeout(resolve, 50));

      // BLOQUER L'EXÉCUTION POUR INSPECTER LE SPINNER
      // debugger; // ⚠️ Supprimez cette ligne après inspection

      // Vérifier si ViewTransitions est supporté
      if (typeof document !== 'undefined' && document.startViewTransition) {
        // Utiliser ViewTransitions pour une navigation fluide
        await document.startViewTransition(async () => {
          await router.push(url, options);
        });
      } else {
        // Fallback sans ViewTransitions
        await router.push(url, options);
      }

      // Timeout de sécurité pour désactiver le loader
      setTimeout(() => {
        stopLoading();
      }, 3000);

    } catch (error) {
      console.error('❌ Erreur de navigation:', error);
      stopLoading();
    }
  };

  /**
   * Navigation de remplacement avec loading
   * @param {string} url - URL de destination
   */
  const replaceWithLoading = async (url) => {
    try {
      console.log('🔄 Remplacement avec loading vers:', url);
      
      startLoading();

      if (typeof document !== 'undefined' && document.startViewTransition) {
        await document.startViewTransition(async () => {
          await router.replace(url);
        });
      } else {
        await router.replace(url);
      }

      setTimeout(() => {
        stopLoading();
      }, 3000);

    } catch (error) {
      console.error('❌ Erreur de remplacement:', error);
      stopLoading();
    }
  };

  /**
   * Navigation arrière avec loading
   */
  const backWithLoading = () => {
    console.log('🔄 Navigation arrière avec loading');
    
    startLoading();

    if (typeof document !== 'undefined' && document.startViewTransition) {
      document.startViewTransition(() => {
        router.back();
      });
    } else {
      router.back();
    }

    setTimeout(() => {
      stopLoading();
    }, 2000);
  };

  return {
    navigateWithLoading,
    replaceWithLoading,
    backWithLoading,
    // Exposer aussi les méthodes du router original pour compatibilité
    push: navigateWithLoading,
    replace: replaceWithLoading,
    back: backWithLoading
  };
};
