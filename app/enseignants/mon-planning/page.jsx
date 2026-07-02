"use client"

import React, { useEffect, useState } from 'react'
import { useUserRole } from '../../../stores/useUserRole'
import ScheduleViewer from '../../components/ScheduleViewer'
import PermissionGate from '../../components/PermissionGate'

export default function MonPlanning() {
  const { userData, isProf, isAdmin, loading } = useUserRole()
  const [teacherId, setTeacherId] = useState(null)

  useEffect(() => {
    if (!loading && userData) {
      // Extraction de l'ID enseignant. Si l'utilisateur est prof, on prend sa ref.
      // S'il est admin, on prend son clerkId au cas où (ou on le bloque si non prof)
      const id = userData?.roleData?.teacherRef?._id || userData?.id || userData?.clerkId || userData?._id
      setTeacherId(id)
    }
  }, [loading, userData])

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>
  }

  if (!isProf() && !isAdmin()) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#e74c3c' }}>
        <h2>Accès refusé</h2>
        <p>Cette page est réservée aux membres de l'équipe pédagogique.</p>
      </div>
    )
  }

  if (!teacherId) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Impossible de trouver votre profil enseignant.</p>
      </div>
    )
  }

  return (
    <div className="mon-planning-page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '0.5rem' }}>Mon Planning Personnel</h1>
        <p style={{ color: '#7f8c8d', fontSize: '1.1rem' }}>
          Cet emploi du temps agrège tous vos cours assignés ainsi que les événements de vos classes et de l'établissement.
        </p>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', padding: '1rem', overflowX: 'auto' }}>
        <ScheduleViewer 
          teacherId={teacherId} 
          mergeEvents={true} 
          isEditable={false} 
        />
      </div>
    </div>
  )
}
