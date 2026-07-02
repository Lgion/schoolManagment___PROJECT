"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import ChatWindow from './ChatWindow';
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  personLabel,
  conversationTypeMeta,
} from './messagingApi';

const POLL_MS = 12000;

const TABS = [
  { key: 'all', label: 'Tout' },
  { key: 'STUDENT_TEACHER', label: 'Élèves' },
  { key: 'PARENT_TEACHER', label: 'Parents' },
];

/**
 * Boîte de réception du professeur / admin (type WhatsApp Web) :
 * sidebar des conversations (filtrables Élèves / Parents) + fenêtre de chat.
 */
export default function TeacherInbox() {
  const [tab, setTab] = useState('all');
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const listPollRef = useRef(null);
  const msgPollRef = useRef(null);

  const loadConversations = useCallback(async () => {
    try {
      const data = await fetchConversations();
      setConversations(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Erreur');
    } finally {
      setLoadingList(false);
    }
  }, []);

  // Liste + polling.
  useEffect(() => {
    loadConversations();
    listPollRef.current = setInterval(loadConversations, POLL_MS);
    return () => clearInterval(listPollRef.current);
  }, [loadConversations]);

  // Messages de la conversation active + polling.
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    const tick = async () => {
      try {
        const { messages: msgs } = await fetchMessages(activeId);
        if (!cancelled) setMessages(msgs);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Erreur');
      }
    };
    setLoadingMsgs(true);
    tick().finally(() => { if (!cancelled) setLoadingMsgs(false); });
    msgPollRef.current = setInterval(tick, POLL_MS);
    return () => { cancelled = true; clearInterval(msgPollRef.current); };
  }, [activeId]);

  const handleSend = useCallback(async (content) => {
    if (!activeId) return;
    setSending(true);
    try {
      const msg = await sendMessage(activeId, content);
      setMessages((prev) => [...prev, msg]);
      loadConversations(); // rafraîchit l'aperçu / l'ordre dans la sidebar
    } finally {
      setSending(false);
    }
  }, [activeId, loadConversations]);

  const visible = conversations.filter((c) => tab === 'all' || c.conversationType === tab);
  const active = conversations.find((c) => c._id === activeId) || null;

  return (
    <div className="inbox">
      <aside className="inbox__sidebar">
        <div className="inbox__tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              className={`inbox__tab ${tab === t.key ? 'is-active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && <p className="messaging__error">{error}</p>}

        {loadingList ? (
          <p className="messaging__hint">Chargement…</p>
        ) : visible.length === 0 ? (
          <p className="messaging__hint">Aucune conversation.</p>
        ) : (
          <ul className="inbox__list">
            {visible.map((c) => {
              const meta = conversationTypeMeta(c.conversationType);
              return (
                <li key={c._id}>
                  <button
                    type="button"
                    className={`inbox__item ${activeId === c._id ? 'is-active' : ''}`}
                    onClick={() => setActiveId(c._id)}
                  >
                    <span className="inbox__item-icon" style={{ '--conv-color': meta.color }}>{meta.icon}</span>
                    <span className="inbox__item-body">
                      <span className="inbox__item-top">
                        <span className="inbox__item-name">{personLabel(c.studentRef)}</span>
                        <span className="inbox__item-badge">{meta.label}</span>
                      </span>
                      <span className="inbox__item-preview">{c.lastMessagePreview || 'Nouvelle conversation'}</span>
                    </span>
                    {c.unreadCount > 0 && <span className="inbox__item-unread">{c.unreadCount}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      <section className="inbox__main">
        {active ? (
          <>
            <header className="inbox__header">
              <span className="inbox__header-name">{personLabel(active.studentRef)}</span>
              <span className="inbox__header-badge">{conversationTypeMeta(active.conversationType).label}</span>
            </header>
            <ChatWindow
              messages={messages}
              onSend={handleSend}
              loading={loadingMsgs}
              sending={sending}
            />
          </>
        ) : (
          <p className="messaging__hint inbox__placeholder">Sélectionnez une conversation pour l'afficher.</p>
        )}
      </section>
    </div>
  );
}
