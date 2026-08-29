"use client"

import React, { useEffect, useState, useMemo } from 'react'
import { useUserRole } from '../../stores/useUserRole'
import Link from 'next/link'

export default function TeacherDailyWidget() {
  const { userData, isProf, isAdmin, loading } = useUserRole()
  const [scheduleData, setScheduleData] = useState(null)
  const [eventsData, setEventsData] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const teacherId = useMemo(() => {
    if (loading || !userData) return null
    return userData?.roleData?.teacherRef?._id || userData?.id || userData?.clerkId || userData?._id
  }, [userData, loading])

  useEffect(() => {
    const fetchDailyData = async () => {
      if (!teacherId || (!isProf() && !isAdmin())) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        // 1. Fetch schedule
        const schedRes = await fetch(`/api/schedules/teacher/${teacherId}`)
        const schedJson = await schedRes.json()
        if (schedJson.success && schedJson.data && schedJson.data.length > 0) {
          setScheduleData(schedJson.data[0])
        }

        // 2. Fetch today's events
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const eventsRes = await fetch(`/api/events?teacherId=${teacherId}&from=${today.toISOString()}&to=${tomorrow.toISOString()}`)
        const eventsJson = await eventsRes.json()
        if (eventsJson.success) {
          setEventsData(eventsJson.data)
        }
      } catch (err) {
        console.error("Erreur lors du chargement du planning du jour :", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDailyData()
  }, [teacherId, isProf, isAdmin])

  if (loading || isLoading) return null
  if (!teacherId || (!isProf() && !isAdmin())) return null

  // Filtre les événements du schedule pour aujourd'hui (0=Dimanche, 1=Lundi...)
  const todayDayOfWeek = new Date().getDay()
  const todayCourses = scheduleData?.events?.filter(e => e.dayOfWeek === todayDayOfWeek) || []
  
  // Combine cours et événements ponctuels, puis tri par heure
  const dailyItems = [
    ...todayCourses.map(c => ({
      type: 'course',
      time: c.startTime,
      endTime: c.endTime,
      title: c.subjectId?.nom || c.label || 'Cours',
      classe: c._classeLabel,
      color: c.subjectId?.couleur || '#3498db'
    })),
    ...eventsData.map(e => {
      const d = new Date(e.startDate)
      return {
        type: 'event',
        time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
        endTime: e.endDate ? `${String(new Date(e.endDate).getHours()).padStart(2, '0')}:${String(new Date(e.endDate).getMinutes()).padStart(2, '0')}` : null,
        title: e.title,
        classe: e.isGlobal ? 'Événement Global' : 'Événement de classe',
        color: '#e74c3c'
      }
    })
  ].sort((a, b) => a.time.localeCompare(b.time))

  if (dailyItems.length === 0) {
    return (
      <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span role="img" aria-label="Soleil">☀️</span> Mon programme du jour
        </h3>
        <p style={{ color: '#64748b', margin: 0 }}>Aucun cours ni événement prévu pour aujourd'hui. Bonne journée !</p>
        <div style={{ marginTop: '1rem' }}>
          <Link href="/enseignants/mon-planning" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}>
            Voir mon planning complet &rarr;
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #eef2f5' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span role="img" aria-label="Calendrier">📅</span> Mon programme du jour
        </h3>
        <Link href="/enseignants/mon-planning" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '500', fontSize: '0.9rem' }}>
          Planning complet
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {dailyItems.map((item, idx) => (
          <div key={idx} style={{ 
            display: 'flex', 
            padding: '12px', 
            borderRadius: '8px', 
            background: item.type === 'event' ? '#fff5f5' : '#f8fafc',
            borderLeft: `4px solid ${item.color}`,
            alignItems: 'center',
            gap: '15px'
          }}>
            <div style={{ minWidth: '100px', color: '#475569', fontWeight: '600', fontSize: '0.95rem' }}>
              {item.time} {item.endTime ? `- ${item.endTime}` : ''}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#0f172a', fontWeight: 'bold', fontSize: '1.05rem', marginBottom: '2px' }}>
                {item.title}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
                <i className={item.type === 'event' ? 'fas fa-bell' : 'fas fa-users'} style={{ marginRight: '6px' }}></i>
                {item.classe}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
