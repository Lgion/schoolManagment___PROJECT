'use client';

import { useLoading } from './useLoading';
import { useNavigationWithLoading } from './useNavigationWithLoading';

/**
 * Hook personnalisé pour les développeurs - Navigation avec loader
 * Combine useLoading et useNavigationWithLoading pour faciliter l'utilisation
 */
export const useNavigationLoader = () => {
  const { isLoading, startLoading, stopLoading } = useLoading();
  const { navigateWithLoading, replaceWithLoading, backWithLoading } = useNavigationWithLoading();

  /**
   * Navigation simple avec loader automatique
   * @param {string} url - URL de destination
   * @param {Object} options - Options de navigation
   */
  const navigate = async (url, options = {}) => {
    await navigateWithLoading(url, options);
  };

  /**
   * Navigation avec loader manuel (pour cas spéciaux)
   * @param {Function} navigationFunction - Fonction de navigation personnalisée
   * @param {number} timeout - Timeout en ms (défaut: 3000)
   */
  const navigateWithManualLoader = async (navigationFunction, timeout = 3000) => {
    try {
      startLoading();
      await navigationFunction();
      
      // Timeout de sécurité
      setTimeout(() => {
        stopLoading();
      }, timeout);
      
    } catch (error) {
      console.error('❌ Erreur de navigation manuelle:', error);
      stopLoading();
    }
  };

  /**
   * Activer le loader pour une action longue
   * @param {Function} asyncAction - Action asynchrone à exécuter
   * @param {string} loadingText - Texte de chargement personnalisé
   */
  const withLoader = async (asyncAction, loadingText = 'Chargement en cours...') => {
    try {
      console.log('🔄', loadingText);
      startLoading();
      
      const result = await asyncAction();
      
      stopLoading();
      console.log('✅ Action terminée');
      
      return result;
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'action:', error);
      stopLoading();
      throw error;
    }
  };

  return {
    // État du loader
    isLoading,
    
    // Contrôle manuel du loader
    startLoading,
    stopLoading,
    
    // Navigation avec loader automatique
    navigate,
    replace: replaceWithLoading,
    back: backWithLoading,
    
    // Navigation avec loader manuel
    navigateWithManualLoader,
    
    // Wrapper pour actions longues
    withLoader,
    
    // Accès direct aux hooks sous-jacents
    navigateWithLoading,
    replaceWithLoading,
    backWithLoading
  };
};
