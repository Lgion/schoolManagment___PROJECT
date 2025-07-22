"use client"

import Link from 'next/link';
import { useState,useContext,useEffect } from 'react';
import {AiAdminContext} from '../stores/ai_adminContext';

export default ({children}) => {
  const { fetchEleves, fetchEnseignants, fetchClasses } = useContext(AiAdminContext)
  const [stats, setStats] = useState({
    eleves: 0,
    enseignants: 0,
    classes: 0
  })

  useEffect(() => {
    fetchClasses()
    fetchEleves()
    fetchEnseignants()
  }, []);

  return <main className="ecole-admin">
    <h1 className="ecole-admin__title">Administration École
      <Link href={""}>🏠</Link>
    </h1>
    <nav className="ecole-admin__nav">
      <Link href="/eleves">
        <button className="ecole-admin__nav-btn"><span>👨‍🎓</span> Gérer les élèves </button>
      </Link>
      <Link href="/enseignants">
        <button className="ecole-admin__nav-btn"><span>👨</span> Gérer les enseignants </button>
      </Link>
      <Link href="/classes">
        <button className="ecole-admin__nav-btn"><span>🏫</span> Gérer les classes </button>
      </Link>
    </nav>
    <article className="ecole-admin__stats">
      <div className="ecole-admin__stats-row">
        <div className="ecole-admin__stats-col">
          <span className="ecole-admin__stats-label">Statistiques</span>
          <span className="ecole-admin__stats-value">Nombre d'élèves: {JSON.parse(localStorage.getItem('eleves'))?.length
            || 0}</span>
          <span className="ecole-admin__stats-value">Nombre d'enseignants:
            {JSON.parse(localStorage.getItem('enseignants'))?.length || 0}</span>
          <span className="ecole-admin__stats-value">Nombre de classes:
            {JSON.parse(localStorage.getItem('classes'))?.length || 0}</span>
        </div>
      </div>
    </article>
    <section className="ecole-admin__content">
      {children}
    </section>
  </main>
}