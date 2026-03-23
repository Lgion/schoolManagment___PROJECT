"use client"

import { useContext } from 'react';
import { AiAdminContext } from '../stores/ai_adminContext';
import TeacherReportModule from './components/TeacherReportModule';

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
    
    <picture>
      <source type="image/jpeg" srcSet={homepage.photo} />
      <img style={{ "width": "100%" }} src={homepage.photo} alt={`Photo de ${homepage.title}`} loading="lazy" />
    </picture>
  </>;
}