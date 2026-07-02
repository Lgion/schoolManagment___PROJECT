"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import ChatWindow from './ChatWindow';
import { startConversation, fetchMessages, sendMessage, personLabel } from './messagingApi';

const POLL_MS = 12000;

/**
 * Panneau de messagerie côté élève / parent (page profil élève).
 * L'élève (canal STUDENT_TEACHER) ou le parent (canal PARENT_TEACHER) discute
 * avec le(s) enseignant(s) de sa classe.
 *
 * Props :
 *   - studentId : ObjectId de l'élève (string)
 *   - teachers  : [{ _id, nom, prenoms }] enseignants de la classe
 *   - conversationType : 'STUDENT_TEACHER' | 'PARENT_TEACHER'
 */
export default function StudentMessaging({ studentId, teachers = [], conversationType = 'STUDENT_TEACHER' }) {
  const [selectedTeacher, setSelectedTeacher] = useState(teachers[0]?._id || null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const pollRef = useRef(null);

  // La liste d'enseignants peut arriver de façon asynchrone (classe peuplée
  // après le premier rendu) : sélectionner le premier dès qu'elle est dispo.
  useEffect(() => {
    if (!selectedTeacher && teachers.length) setSelectedTeacher(teachers[0]._id);
  }, [teachers, selectedTeacher]);

  // Démarre / récupère la conversation quand l'enseignant sélectionné change.
  useEffect(() => {
    let cancelled = false;
    if (!selectedTeacher || !studentId) {
      setConversation(null);
      setMessages([]);
      return;
    }
    (async () => {
      setLoading(true);
      setError('');
      try {
        const conv = await startConversation({ conversationType, studentRef: studentId, teacherRef: selectedTeacher });
        if (cancelled) return;
        setConversation(conv);
        const { messages: msgs } = await fetchMessages(conv._id);
        if (!cancelled) setMessages(msgs);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Erreur');
          setConversation(null);
          setMessages([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedTeacher, studentId, conversationType]);

  // Polling des messages tant qu'une conversation est ouverte.
  useEffect(() => {
    if (!conversation?._id) return;
    const tick = async () => {
      try {
        const { messages: msgs } = await fetchMessages(conversation._id);
        setMessages(msgs);
      } catch { /* silencieux : on réessaiera au prochain tick */ }
    };
    pollRef.current = setInterval(tick, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [conversation?._id]);

  const handleSend = useCallback(async (content) => {
    if (!conversation?._id) return;
    setSending(true);
    try {
      const msg = await sendMessage(conversation._id, content);
      setMessages((prev) => [...prev, msg]);
    } finally {
      setSending(false);
    }
  }, [conversation?._id]);

  if (!teachers.length) {
    return <p className="messaging__hint">Aucun enseignant rattaché à la classe pour le moment.</p>;
  }

  return (
    <div className="messaging messaging--student">
      {teachers.length > 1 && (
        <div className="messaging__teacherTabs" role="tablist">
          {teachers.map((t) => (
            <button
              key={t._id}
              type="button"
              role="tab"
              aria-selected={selectedTeacher === t._id}
              className={`messaging__teacherTab ${selectedTeacher === t._id ? 'is-active' : ''}`}
              onClick={() => setSelectedTeacher(t._id)}
            >
              {personLabel(t)}
            </button>
          ))}
        </div>
      )}

      {error && <p className="messaging__error">{error}</p>}

      <ChatWindow
        messages={messages}
        onSend={handleSend}
        loading={loading}
        sending={sending}
        disabled={!conversation}
        emptyHint={`Démarrez la discussion avec ${personLabel(teachers.find((t) => t._id === selectedTeacher))}.`}
      />
    </div>
  );
}
