'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUserRole } from '../../../stores/useUserRole';
import { fetchUserWithRefs, studentFullName } from './familyApi';

/**
 * Espace de travail de l'ÉLÈVE (spec roles_and_accounts §4) : un point d'entrée
 * vers son profil (devoirs, notes, messagerie avec le prof) et les espaces de
 * l'école. L'élève est rattaché via roleData.eleveRef (compte autonome).
 */
export default function StudentSpace() {
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

  const eleve = data?.roleData?.eleveRef || null;
  const firstName = data?.firstName || userData?.firstName || '';
  const profileHref = eleve?._id ? `/eleves/${eleve._id}` : null;

  return (
    <div className="familyHome familyHome--student">
      <header className="familyHome__hero">
        <h1 className="familyHome__title">🎒 Salut {firstName || (eleve ? studentFullName(eleve) : '')}</h1>
        <p className="familyHome__subtitle">Bienvenue dans ton espace élève.</p>
      </header>

      {loading ? (
        <p className="familyHome__hint">Chargement…</p>
      ) : !profileHref ? (
        <p className="familyHome__hint">
          Ton profil élève n'est pas encore rattaché à ce compte. Contacte l'école si besoin.
        </p>
      ) : (
        <section className="familyHome__section">
          <div className="familyHome__quickLinks">
            <Link href={profileHref} className="familyHome__quick familyHome__quick--primary">📋 Mon profil & mes devoirs</Link>
            <Link href={profileHref} className="familyHome__quick">💬 Mes messages avec le prof</Link>
            <Link href="/games" className="familyHome__quick">🎮 Jeux pédagogiques</Link>
            <Link href="/calendar" className="familyHome__quick">📅 Agenda de l'école</Link>
            <Link href="/gallery" className="familyHome__quick">📸 Galerie des souvenirs</Link>
            <Link href="/blog" className="familyHome__quick">📰 Blog de l'école</Link>
          </div>
        </section>
      )}
    </div>
  );
}
