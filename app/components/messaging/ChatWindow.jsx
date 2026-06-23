"use client";

import { useEffect, useRef, useState } from 'react';
import { formatMessageTime } from './messagingApi';

/**
 * Fenêtre de chat réutilisable (présentationnel).
 * Props :
 *   - messages : [{ _id, content, createdAt, mine }]
 *   - onSend   : async (content) => void
 *   - loading  : bool (chargement initial)
 *   - sending  : bool (envoi en cours)
 *   - disabled : bool (champ de saisie inactif, ex. aucune conversation sélectionnée)
 *   - emptyHint: texte affiché quand il n'y a aucun message
 *   - placeholder : placeholder du champ de saisie
 */
export default function ChatWindow({
  messages = [],
  onSend,
  loading = false,
  sending = false,
  disabled = false,
  emptyHint = 'Aucun message pour le moment. Démarrez la discussion !',
  placeholder = 'Écrire un message…',
}) {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef(null);

  // Autoscroll vers le bas à chaque nouveau message.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const submit = async (e) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content || sending || disabled) return;
    setDraft('');
    try {
      await onSend(content);
    } catch (err) {
      // En cas d'échec, on restitue le brouillon pour ne pas perdre le texte.
      setDraft(content);
    }
  };

  return (
    <div className="chatWindow">
      <div className="chatWindow__messages" ref={scrollRef}>
        {loading ? (
          <p className="chatWindow__hint">Chargement…</p>
        ) : messages.length === 0 ? (
          <p className="chatWindow__hint">{emptyHint}</p>
        ) : (
          messages.map((m) => (
            <div
              key={m._id}
              className={`chatWindow__bubble ${m.mine ? 'chatWindow__bubble--mine' : 'chatWindow__bubble--theirs'}`}
            >
              <span className="chatWindow__bubble-text">{m.content}</span>
              <time className="chatWindow__bubble-time" dateTime={m.createdAt}>
                {formatMessageTime(m.createdAt)}
              </time>
            </div>
          ))
        )}
      </div>

      <form className="chatWindow__form" onSubmit={submit}>
        <textarea
          className="chatWindow__input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit(e);
            }
          }}
          placeholder={disabled ? 'Sélectionnez une conversation…' : placeholder}
          rows={2}
          disabled={disabled || sending}
        />
        <button
          type="submit"
          className="chatWindow__send"
          disabled={disabled || sending || !draft.trim()}
        >
          {sending ? '…' : 'Envoyer'}
        </button>
      </form>
    </div>
  );
}
