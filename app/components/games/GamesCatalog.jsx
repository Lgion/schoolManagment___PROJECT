"use client";

import { useCallback, useEffect, useState } from 'react';
import QuizPlayer from './QuizPlayer';
import GameGenerateModal from './GameGenerateModal';
import { fetchAiGames, deleteGame, gameKeyOf, GAME_LEVELS } from './gamesApi';
import { staticGamesForLevel, isAiLevel } from './staticGames';

/**
 * Catalogue de jeux pédagogiques (statiques CP1→CE2 + IA CM1/CM2).
 * Props :
 *   - level : verrouille le niveau (vue classe). Absent → sélecteur de niveau (vue globale).
 *   - classId : restreint les jeux IA à une classe (vue classe)
 *   - studentId : si fourni, les scores sont enregistrés
 *   - canGenerate : affiche la génération IA + suppression (prof/admin)
 */
export default function GamesCatalog({ level, classId, studentId, canGenerate = false }) {
  const locked = Boolean(level);
  const [activeLevel, setActiveLevel] = useState(level || 'CP1');
  const [aiGames, setAiGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState(null);
  const [generateOpen, setGenerateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAiGames({ level: activeLevel, classId });
      setAiGames(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [activeLevel, classId]);

  useEffect(() => { load(); }, [load]);

  const staticList = staticGamesForLevel(activeLevel);
  const allGames = [...staticList, ...aiGames];

  const handleDelete = async (id) => {
    try {
      await deleteGame(id);
      setAiGames((prev) => prev.filter((g) => g._id !== id));
    } catch (err) {
      setError(err.message || 'Erreur');
    }
  };

  return (
    <div className="games">
      {!locked && (
        <div className="games__levels" role="tablist">
          {GAME_LEVELS.map((lvl) => (
            <button
              key={lvl}
              type="button"
              role="tab"
              aria-selected={activeLevel === lvl}
              className={`games__level ${activeLevel === lvl ? 'is-active' : ''}`}
              onClick={() => setActiveLevel(lvl)}
            >
              {lvl}
            </button>
          ))}
        </div>
      )}

      {canGenerate && isAiLevel(activeLevel) && (
        <div className="games__toolbar">
          <button type="button" className="games__generate" onClick={() => setGenerateOpen(true)}>
            + Générer un jeu via PDF (IA)
          </button>
        </div>
      )}

      {error && <p className="games__error">{error}</p>}

      {loading && allGames.length === 0 ? (
        <p className="games__hint">Chargement…</p>
      ) : allGames.length === 0 ? (
        <p className="games__hint">
          {isAiLevel(activeLevel)
            ? 'Aucun jeu pour ce niveau. Un enseignant peut en générer à partir d’un PDF.'
            : 'Aucun jeu disponible pour ce niveau.'}
        </p>
      ) : (
        <ul className="games__grid">
          {allGames.map((g) => {
            const key = gameKeyOf(g);
            const isAi = g.type === 'AI_GENERATED';
            const count = g.content?.questions?.length || 0;
            return (
              <li key={key} className="games__card">
                <button type="button" className="games__card-main" onClick={() => setPlaying(g)}>
                  <span className="games__card-icon">{g.icon || (isAi ? '🤖' : '🎮')}</span>
                  <span className="games__card-title">{g.title}</span>
                  <span className="games__card-meta">{g.level} · {count} question{count > 1 ? 's' : ''}{isAi ? ' · IA' : ''}</span>
                </button>
                {canGenerate && isAi && (
                  <button type="button" className="games__card-delete" onClick={() => handleDelete(g._id)} aria-label="Supprimer">🗑️</button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {playing && (
        <QuizPlayer game={playing} studentId={studentId} onClose={() => setPlaying(null)} />
      )}

      {generateOpen && (
        <GameGenerateModal
          level={activeLevel}
          classId={classId}
          onClose={() => setGenerateOpen(false)}
          onGenerated={(game) => setAiGames((prev) => [game, ...prev])}
        />
      )}
    </div>
  );
}
