"use client"

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

/**
 * Composant Portal générique pour wrapper le contenu des pages /[id] dans une modale
 * Réutilise les styles existants de DetailModal
 */
export default function DetailPortal({ children, isOpen, onClose, title, icon = "📋" }) {
  const [isClosing, setIsClosing] = useState(false);
  const router = useRouter();
  
  // Gestion de la fermeture avec animation
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      if (onClose) {
        onClose();
      } else {
        // Fallback : navigation back si pas de onClose fourni
        router.back();
      }
    }, 300); // Durée de l'animation de fermeture
  };

  // Gestion des touches clavier
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden'; // Empêcher le scroll du body

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Gestion du clic sur l'overlay
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Ne pas rendre si pas ouvert ou côté serveur
  if (!isOpen || typeof window === 'undefined') return null;

  return createPortal(
    <div 
      className={`detailModal ${isClosing ? 'detailModal--closing' : ''}`}
      onClick={handleOverlayClick}
    >
      <div className="detailModal__overlay" />
      <div className="detailModal__container">
        <div className="detailModal__header">
          <h2 className="detailModal__title">
            <span className="detailModal__titleIcon">{icon}</span>
            {title}
          </h2>
          <button 
            className="detailModal__closeBtn"
            onClick={handleClose}
            aria-label="Fermer la modale"
          >
            ✕
          </button>
        </div>
        
        <div className="detailModal__content">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
