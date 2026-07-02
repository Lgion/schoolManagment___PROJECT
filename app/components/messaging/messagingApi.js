// Helpers client pour la messagerie directe (parent/prof & élève/prof).
// L'authentification Clerk passe par les cookies (middleware) → fetch nu.

export const CONVERSATION_TYPE_META = {
  STUDENT_TEACHER: { label: 'Élève', icon: '🎓', color: '#3478c4' },
  PARENT_TEACHER: { label: 'Parent', icon: '👪', color: '#2e9e6b' },
};

export function conversationTypeMeta(type) {
  return CONVERSATION_TYPE_META[type] || CONVERSATION_TYPE_META.STUDENT_TEACHER;
}

// Affiche « Nom Prénoms » à partir d'une réf entité peuplée (élève ou prof).
export function personLabel(ref) {
  if (!ref) return 'Inconnu';
  const prenoms = Array.isArray(ref.prenoms) ? ref.prenoms.join(' ') : ref.prenoms || '';
  return `${ref.nom || ''} ${prenoms}`.trim() || 'Inconnu';
}

export async function fetchConversations({ studentRef, type } = {}) {
  const qs = new URLSearchParams();
  if (studentRef) qs.set('studentRef', studentRef);
  if (type) qs.set('type', type);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const res = await fetch(`/api/conversations${suffix}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur chargement des conversations');
  return data.data;
}

export async function startConversation({ conversationType, studentRef, teacherRef }) {
  const res = await fetch('/api/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationType, studentRef, teacherRef }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Impossible de démarrer la conversation');
  return data.data;
}

export async function fetchMessages(conversationId) {
  const res = await fetch(`/api/conversations/${conversationId}/messages`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur chargement des messages');
  return data.data; // { conversation, messages }
}

export async function sendMessage(conversationId, content) {
  const res = await fetch(`/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Erreur lors de l'envoi");
  return data.data;
}

// Formatage horaire court pour les bulles.
export function formatMessageTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) +
        ' ' +
        d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
