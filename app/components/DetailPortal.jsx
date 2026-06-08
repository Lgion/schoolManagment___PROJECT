"use client"

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

/**
 * Composant Portal générique pour wrapper le contenu des pages /[id] dans une modale.
 * Une seule action de fermeture (✕ ou Échap ou clic sur l'arrière-plan).
 */
export default function DetailPortal({ children, isOpen, onClose, title, icon = "📋", headerControls }) {
  const [isClosing, setIsClosing] = useState(false);
  const router = useRouter();

  // Fermeture avec animation
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      if (onClose) {
        onClose();
      } else {
        router.back();
      }
    }, 250);
  };

  // Échap pour fermer + verrou du scroll de l'arrière-plan
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Clic sur l'overlay (uniquement l'arrière-plan, pas le contenu)
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) handleClose();
  };

  if (!isOpen || typeof window === 'undefined') return null;

  return createPortal(
    <div
      className={`detailModal ${isClosing ? 'detailModal--closing' : ''}`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === 'string' ? title : undefined}
    >
      <div className="detailModal__overlay" />
      <div className="detailModal__container">
        <div className="detailModal__header">
          <h2 className="detailModal__title">
            <span className="detailModal__titleIcon" aria-hidden="true">{icon}</span>
            <span className="detailModal__titleFullName">{title}</span>
          </h2>

          {headerControls && (
            <div className="detailModal__headerControls">
              {headerControls}
            </div>
          )}

          <button
            className="detailModal__closeBtn"
            onClick={handleClose}
            aria-label="Fermer la fenêtre"
            title="Fermer"
            type="button"
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
