"use client";

import { useState } from 'react';
import { gameKeyOf, saveGameProgress } from './gamesApi';

/**
 * Lecteur de quiz unifié (jeux statiques et IA partagent le schéma
 * { questions: [{ question, options, answerIndex }] }).
 *
 * Props :
 *   - game : l'objet jeu (avec content.questions)
 *   - studentId : si fourni, le score est enregistré à la fin
 *   - onClose() : fermeture
 */
export default function QuizPlayer({ game, studentId, onClose }) {
  const questions = game?.content?.questions || [];
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null); // index choisi pour la question courante
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saved, setSaved] = useState(false);

  const q = questions[index];
  const total = questions.length;

  const choose = (optIdx) => {
    if (picked !== null) return; // déjà répondu
    setPicked(optIdx);
    if (optIdx === q.answerIndex) setScore((s) => s + 1);
  };

  const next = async () => {
    if (index + 1 < total) {
      setIndex((i) => i + 1);
      setPicked(null);
    } else {
      setFinished(true);
      if (studentId && !saved) {
        try {
          await saveGameProgress({
            studentId,
            gameKey: gameKeyOf(game),
            gameTitle: game.title,
            score,
            total,
          });
          setSaved(true);
        } catch { /* non bloquant */ }
      }
    }
  };

  const restart = () => {
    setIndex(0); setPicked(null); setScore(0); setFinished(false); setSaved(false);
  };

  if (total === 0) {
    return (
      <div className="quizPlayer__overlay" onClick={onClose}>
        <div className="quizPlayer" onClick={(e) => e.stopPropagation()}>
          <p className="quizPlayer__empty">Ce jeu n'a pas encore de questions.</p>
          <button className="quizPlayer__btn" onClick={onClose}>Fermer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="quizPlayer__overlay" onClick={onClose}>
      <div className="quizPlayer" onClick={(e) => e.stopPropagation()}>
        <header className="quizPlayer__header">
          <h3 className="quizPlayer__title">{game.icon ? `${game.icon} ` : ''}{game.title}</h3>
          <button type="button" className="quizPlayer__close" onClick={onClose} aria-label="Fermer">×</button>
        </header>

        {finished ? (
          <div className="quizPlayer__result">
            <p className="quizPlayer__score">Score : <strong>{score} / {total}</strong></p>
            <p className="quizPlayer__feedback">
              {score === total ? '🏆 Parfait !' : score >= total / 2 ? '👍 Bien joué !' : '💪 Continue de t’entraîner !'}
            </p>
            {studentId && <p className="quizPlayer__saved">{saved ? '✅ Score enregistré' : '…'}</p>}
            <div className="quizPlayer__actions">
              <button type="button" className="quizPlayer__btn" onClick={restart}>Rejouer</button>
              <button type="button" className="quizPlayer__btn quizPlayer__btn--primary" onClick={onClose}>Terminer</button>
            </div>
          </div>
        ) : (
          <div className="quizPlayer__body">
            <div className="quizPlayer__progress">Question {index + 1} / {total}</div>
            <p className="quizPlayer__question">{q.question}</p>
            <ul className="quizPlayer__options">
              {q.options.map((opt, i) => {
                let cls = 'quizPlayer__option';
                if (picked !== null) {
                  if (i === q.answerIndex) cls += ' is-correct';
                  else if (i === picked) cls += ' is-wrong';
                }
                return (
                  <li key={i}>
                    <button type="button" className={cls} onClick={() => choose(i)} disabled={picked !== null}>
                      {opt}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="quizPlayer__actions">
              <button type="button" className="quizPlayer__btn quizPlayer__btn--primary" onClick={next} disabled={picked === null}>
                {index + 1 < total ? 'Suivant' : 'Voir le score'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
