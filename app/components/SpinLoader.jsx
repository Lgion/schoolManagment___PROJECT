'use client';

import React, { useEffect } from 'react';
import { useLoading } from '../../stores/useLoading';
import "../../assets/scss/components/LOADERS/spinLoader.scss";

/**
 * Composant BEM SpinLoader - Overlay de chargement global
 * @param {string} variant - Variante de couleur (primary, success, warning, danger)
 * @param {string} size - Taille du loader (normal, compact)
 * @param {string} text - Texte de chargement personnalisé
 * @param {boolean} showText - Afficher ou masquer le texte
 */
const SpinLoader = ({ 
  variant = 'primary', 
  size = 'normal', 
  text = 'Chargement en cours...', 
  showText = true 
}) => {
  const { isLoading } = useLoading();

  useEffect(() => {
    // Gestion de la classe CSS sur le body pour désactiver les interactions
    if (typeof window !== 'undefined') {
      if (isLoading) {
        document.body.classList.add('spinLoader-active');
        
        // Désactiver le scroll
        const handleWheel = (e) => e.preventDefault();
        const handleTouchMove = (e) => e.preventDefault();
        const handleKeyDown = (e) => {
          // Désactiver les touches de navigation (flèches, espace, page up/down)
          if ([32, 33, 34, 35, 36, 37, 38, 39, 40].includes(e.keyCode)) {
            e.preventDefault();
          }
        };

        document.addEventListener('wheel', handleWheel, { passive: false });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('keydown', handleKeyDown);

        // Nettoyage des event listeners
        return () => {
          document.body.classList.remove('spinLoader-active');
          document.removeEventListener('wheel', handleWheel);
          document.removeEventListener('touchmove', handleTouchMove);
          document.removeEventListener('keydown', handleKeyDown);
        };
      } else {
        document.body.classList.remove('spinLoader-active');
      }
    }
  }, [isLoading]);

  // Ne pas afficher le loader si pas en cours de chargement
  if (!isLoading) return null;

  // Classes BEM dynamiques
  const loaderClasses = [
    'spinLoader',
    `spinLoader--${variant}`,
    size === 'compact' ? 'spinLoader--compact' : ''
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={loaderClasses}
      role="dialog" 
      aria-modal="true" 
      aria-label="Chargement en cours"
      aria-busy="true"
    >
      {/* Overlay pour capturer tous les clics */}
      <div className="spinLoader__overlay" />
      
      {/* Container principal */}
      <div className="spinLoader__container">
        {/* Icône de chargement */}
        <div 
          className="spinLoader__icon"
          role="status"
          aria-label="Chargement"
        />
        
        {/* Texte de chargement */}
        {showText && (
          <p className="spinLoader__text">
            {text}
          </p>
        )}
      </div>
    </div>
  );
};

export default SpinLoader;
