"use client"

import { useUserRole } from '../../../stores/useUserRole'
import TeacherInbox from '../../components/messaging/TeacherInbox'

export default function TeacherMessagesPage() {
  const { isProf, isAdmin, loading } = useUserRole()

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>
  }

  if (!isProf() && !isAdmin()) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#e74c3c' }}>
        <h2>Accès refusé</h2>
        <p>La boîte de réception est réservée à l'équipe pédagogique.</p>
      </div>
    )
  }

  return (
    <div className="messages-page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '0.5rem' }}>Messagerie</h1>
        <p style={{ color: '#7f8c8d', fontSize: '1.05rem' }}>
          Vos échanges privés avec les élèves et les parents, séparés par onglets.
        </p>
      </div>

      <TeacherInbox />
    </div>
  )
}
