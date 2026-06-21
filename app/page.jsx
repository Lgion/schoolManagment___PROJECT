"use client"

import { useContext } from 'react';
import { AiAdminContext } from '../stores/ai_adminContext';
import TeacherReportModule from './components/TeacherReportModule';
import CalendarContent from './calendar/CalendarContent';
import UnifiedFeed from './components/feed/UnifiedFeed';

export default function Page() {
  const { homepage, homepageLoaded } = useContext(AiAdminContext);

  if (!homepageLoaded && (!homepage.title || homepage.title === '')) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>;
  }

  return <>
    <TeacherReportModule />
    <h2>{homepage.title}</h2>
    
    {homepage.texts && homepage.texts.map((text, i) => (
      <p key={i}>{text}</p>
    ))}
    
    {homepage.photo && (
      <picture>
        <source type="image/jpeg" srcSet={homepage.photo} />
        <img style={{ "width": "100%" }} src={homepage.photo} alt={`Photo de ${homepage.title}`} loading="lazy" />
      </picture>
    )}

    {/* Fil d'actualité global & Sondages de l'école */}
    <div className="ecole-admin__feed-section" style={{ marginTop: '2.5rem', borderTop: '1px solid #eef2f5', paddingTop: '1.5rem' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.4rem', color: '#1e293b' }}>
        📢 Annonces & Sondages de l'Établissement
      </h3>
      <UnifiedFeed contextType="global" />
    </div>

    <div className="ecole-admin__calendar-section" style={{ marginTop: '2rem' }}>
      <CalendarContent embedded={true} />
    </div>
  </>;
}