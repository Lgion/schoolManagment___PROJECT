"use client"

import { useUserRole } from '../../../stores/useUserRole'
import AppointmentsPanel from '../../components/appointments/AppointmentsPanel'

export default function TeacherAppointmentsPage() {
  const { isProf, isAdmin, loading } = useUserRole()

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>
  }

  if (!isProf() && !isAdmin()) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#e74c3c' }}>
        <h2>Accès refusé</h2>
        <p>Cette page est réservée à l'équipe pédagogique.</p>
      </div>
    )
  }

  return (
    <div className="rdv-page" style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '0.5rem' }}>Mes rendez-vous</h1>
        <p style={{ color: '#7f8c8d', fontSize: '1.05rem' }}>
          Demandes reçues des parents et convocations que vous avez envoyées. Les
          convocations se créent depuis la page d'un élève.
        </p>
      </div>

      <AppointmentsPanel initiatorRole="prof" canCreate={false} />
    </div>
  )
}
