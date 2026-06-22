'use client';
import { useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { AiAdminContext } from '../../../stores/ai_adminContext';
import { useUserRole } from '../../../stores/useUserRole';
import { fetchUserWithRefs, studentFullName } from './familyApi';
import AppointmentsPanel from '../appointments/AppointmentsPanel';

// Nom lisible d'une classe à partir de son _id (via le contexte admin).
function classLabel(classes, classId) {
  if (!classId || !Array.isArray(classes)) return '';
  const c = classes.find((x) => String(x._id || x.id) === String(classId));
  return c ? `${c.niveau || ''} ${c.alias || ''}`.trim() : '';
}

/**
 * Tableau de bord du PARENT (spec roles_and_accounts §4) : la fratrie rattachée,
 * un accès rapide aux rendez-vous et aux espaces de l'école. Le rattachement des
 * enfants se fait par correspondance d'e-mail (childrenRefs côté User).
 */
export default function ParentDashboard() {
  const { classes } = useContext(AiAdminContext);
  const { clerkUser, userData } = useUserRole();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (clerkUser?.id) {
        try {
          const u = await fetchUserWithRefs(clerkUser.id);
          if (alive) { setData(u); setLoading(false); return; }
        } catch (_) { /* fallback below */ }
      }
      if (alive) { setData(userData); setLoading(false); }
    })();
    return () => { alive = false; };
  }, [clerkUser, userData]);

  const children = data?.roleData?.childrenRefs || [];
  const firstName = data?.firstName || userData?.firstName || '';

  return (
    <div className="familyHome familyHome--parent">
      <header className="familyHome__hero">
        <h1 className="familyHome__title">👪 Bonjour {firstName || 'cher parent'}</h1>
        <p className="familyHome__subtitle">Votre espace famille — suivez la scolarité de vos enfants.</p>
      </header>

      <section className="familyHome__section">
        <h2 className="familyHome__sectionTitle">Mes enfants</h2>
        {loading ? (
          <p className="familyHome__hint">Chargement…</p>
        ) : children.length === 0 ? (
          <p className="familyHome__hint">
            Aucun enfant rattaché à votre compte pour le moment. Le rattachement se fait
            automatiquement par correspondance d'e-mail — contactez l'école si besoin.
          </p>
        ) : (
          <div className="familyHome__children">
            {children.map((child) => {
              const cls = classLabel(classes, child.current_classe);
              return (
                <article key={child._id} className="familyHome__childCard">
                  <div className="familyHome__childTop">
                    <span className="familyHome__avatar">🧒</span>
                    <div>
                      <h3 className="familyHome__childName">{studentFullName(child)}</h3>
                      {cls && <span className="familyHome__childClass">{cls}</span>}
                    </div>
                  </div>
                  <div className="familyHome__childLinks">
                    <Link href={`/eleves/${child._id}`} className="familyHome__chip">📋 Profil & bulletins</Link>
                    <Link href={`/eleves/${child._id}`} className="familyHome__chip">💬 Messagerie</Link>
                    <Link href={`/eleves/${child._id}`} className="familyHome__chip">💶 Scolarité</Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="familyHome__section">
        <h2 className="familyHome__sectionTitle">Mes rendez-vous</h2>
        <p className="familyHome__hint">Pour demander un rendez-vous, ouvrez la page de votre enfant.</p>
        <AppointmentsPanel initiatorRole="parent" canCreate={false} />
      </section>

      <section className="familyHome__section">
        <h2 className="familyHome__sectionTitle">Accès rapides</h2>
        <div className="familyHome__quickLinks">
          <Link href="/calendar" className="familyHome__quick">📅 Agenda de l'école</Link>
          <Link href="/gallery" className="familyHome__quick">📸 Galerie des souvenirs</Link>
          <Link href="/blog" className="familyHome__quick">📰 Communications & blog</Link>
          <Link href="/games" className="familyHome__quick">🎮 Jeux pédagogiques</Link>
        </div>
      </section>
    </div>
  );
}
