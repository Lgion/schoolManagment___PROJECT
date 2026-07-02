"use client";

import { useState } from 'react';
import { generateGameFromPdf } from './gamesApi';

/**
 * Modale de génération d'un jeu via PDF (IA) — réservée CM1/CM2, prof/admin.
 * Props : { level, classId, onClose, onGenerated(game) }
 */
export default function GameGenerateModal({ level, classId, onClose, onGenerated }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!file) { setError('Sélectionnez un fichier PDF.'); return; }
    setLoading(true);
    try {
      const game = await generateGameFromPdf({ file, level, classId });
      onGenerated?.(game);
      onClose?.();
    } catch (err) {
      setError(err.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gameModal__overlay" onClick={onClose}>
      <div className="gameModal" onClick={(e) => e.stopPropagation()}>
        <header className="gameModal__header">
          <h3>Générer un jeu via PDF (IA) — {level}</h3>
          <button type="button" className="gameModal__close" onClick={onClose} aria-label="Fermer">×</button>
        </header>
        <form className="gameModal__form" onSubmit={submit}>
          <p className="gameModal__hint">
            Importez un cours, un texte ou une fiche d'exercices (PDF). L'IA en tirera un
            quiz adapté au niveau {level}.
          </p>
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          {error && <p className="gameModal__error">{error}</p>}
          <div className="gameModal__actions">
            <button type="button" className="gameModal__btn" onClick={onClose}>Annuler</button>
            <button type="submit" className="gameModal__btn gameModal__btn--primary" disabled={loading}>
              {loading ? 'Génération…' : 'Générer le jeu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
