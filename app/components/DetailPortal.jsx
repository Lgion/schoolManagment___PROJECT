"use client"

import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

/**
 * Verrou de scroll partagé : compteur de référence au niveau module pour gérer
 * proprement les portails imbriqués (le dernier fermé restaure le scroll).
 */
let openPortalCount = 0;

function lockBodyScroll() {
  if (openPortalCount === 0) {
    document.body.style.overflow = 'hidden';
  }
  openPortalCount += 1;
}

function unlockBodyScroll() {
  openPortalCount = Math.max(0, openPortalCount - 1);
  if (openPortalCount === 0) {
    document.body.style.overflow = '';
  }
}

/**
 * Composant Portal générique pour wrapper le contenu des pages /[id] dans une modale.
 * Une seule action de fermeture (✕ ou Échap ou clic sur l'arrière-plan).
 */
export default function DetailPortal({ children, isOpen, onClose, title, icon = "📋", headerControls }) {
  const [isClosing, setIsClosing] = useState(false);
  const router = useRouter();
  const closeTimeoutRef = useRef(null);
  const closeBtnRef = useRef(null);

  // Fermeture avec animation — stabilisée pour ne pas capturer un onClose périmé
  const handleClose = useCallback(() => {
    setIsClosing(true);
    closeTimeoutRef.current = setTimeout(() => {
      if (onClose) {
        onClose();
      } else {
        router.back();
      }
    }, 250);
  }, [onClose, router]);

  // Échap pour fermer + verrou du scroll de l'arrière-plan (ref-counté)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    lockBodyScroll();
    // Déplace le focus dans la modale pour l'accessibilité
    closeBtnRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      unlockBodyScroll();
    };
  }, [isOpen, handleClose]);

  // Nettoie le timeout de fermeture si le composant est démonté avant la fin de l'animation
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

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
            ref={closeBtnRef}
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
