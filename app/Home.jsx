"use client"

import Link from 'next/link';
import { useContext, useEffect, useState, Fragment, useMemo } from 'react';
import { AiAdminContext } from '../stores/ai_adminContext';
import { useUserRole } from '../stores/useUserRole';
import PermissionGate, { RoleIndicator } from './components/PermissionGate';
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';
import EntityModal from './components/EntityModal';
import LandingPage from './components/LandingPage';
import { clearLS, initStorage } from '../utils/localStorageManager';
import { useAuth } from '@clerk/nextjs';
import LogSignIn from './_/LogSignIn';

export default ({ children }) => {
  const {
    selected,
    setSelected,
    showModal,
    setShowModal,
    editType,
    eleves,
    enseignants,
    classes,
  } = useContext(AiAdminContext)

  const {
    userRole,
    loading,
    userData
  } = useUserRole();

  const { isSignedIn } = useAuth();
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  // --- LOGIQUE ANNIVERSAIRES ---
  const birthdayCelebrants = useMemo(() => {
    if (!Array.isArray(eleves) || !Array.isArray(enseignants)) return [];

    const today = new Date();
    const tDay = today.getDate();
    const tMonth = today.getMonth();

    const result = [];

    const check = (person, roleLabel, type) => {
      const birthDate = person.naissance_$_date ? new Date(person.naissance_$_date) : null;
      if (birthDate && birthDate.getDate() === tDay && birthDate.getMonth() === tMonth) {
        const pPrenoms = Array.isArray(person.prenoms) ? person.prenoms.join(' ') : (person.prenoms || '');

        // Trouver la classe pour les élèves
        let personClassName = '';
        if (type === 'eleve' && Array.isArray(classes)) {
          const matchedClass = classes.find(c => (c._id || c.id) === person.current_classe);
          if (matchedClass) {
            personClassName = matchedClass && matchedClass.niveau + '-' + matchedClass.alias || 'NoValue';
          }
        }

        result.push({
          id: person._id || person.id,
          name: `${person.nom} ${pPrenoms}`,
          role: roleLabel,
          className: personClassName,
          classId: person.current_classe,
          path: type === 'eleve' ? `/eleves/${person._id || person.id}` : `/enseignants/${person._id || person.id}`
        });
      }
    };

    eleves.forEach(e => check(e, 'élève', 'eleve'));
    enseignants.forEach(e => check(e, 'professeur', 'prof'));

    return result;
  }, [eleves, enseignants, classes]);

  // Fonction pour vider toutes les données localStorage de l'app
  const clearAllAppData = () => {
    const confirmReset = confirm(
      '⚠️ ATTENTION ⚠️\n\n' +
      'Cette action va supprimer TOUTES les données de l\'application en cache :\n\n' +
      '• Élèves, Enseignants, Classes\n' +
      '• Matières et Coefficients\n' +
      '• Données utilisateur\n' +
      '• Contenu blog et carousel\n\n' +
      'Êtes-vous sûr de vouloir continuer ?'
    );

    if (!confirmReset) return;

    try {
      clearLS()

      alert('✅ Toutes les données ont été supprimées ! La page va se recharger.');
      window.location.reload();
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      alert('❌ Erreur lors de la suppression des données');
    }
  };

  useEffect(() => {
    initStorage()

    // Le chargement initial des données (élèves/profs/classes) est entièrement
    // géré par AiAdminContext (effet d'auto-fetch). On évite ici tout fetch
    // redondant qui déclenchait auparavant un triple appel au montage.

    const handleScroll = () => {
      if (window.scrollY > 10) {
        document.body.classList.add('header--shrunk');
      } else {
        document.body.classList.remove('header--shrunk');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Re-évaluer le mode démo à chaque changement d'état d'authentification
    // Le mode démo est déclenché EXPLICITEMENT par un clic sur la Landing Page (cookie is_landing_demo)
    setIsDemoMode(document.cookie.includes('is_landing_demo=true'));
    setMounted(true);
  }, [isSignedIn]);

  if (mounted && !isSignedIn && !isDemoMode) {
    return <LandingPage />;
  }

  return <>
    <>
      <header className="ecole-admin__header">
        <div className="ecole-admin__header-container">
          <div className="ecole-admin__branding">
            <Link href={"/"} className="ecole-admin__branding-logo">
              <img src="/logo.png" alt="Logo ESMP" className="ecole-admin__branding-logo-img" />
            </Link>
            <div>
              <h1 className="ecole-admin__branding-title">École Martin de Porres</h1>
              <p className="ecole-admin__branding-subtitle">Système de gestion scolaire</p>
            </div>
          </div>

          <div className="ecole-admin__headerActions">
            <div className="ecole-admin__headerActions-contact">
              <div className="ecole-admin__headerActions-iconGroup">
                <a
                  href="mailto:sanctuaire.rosaire.bolobi@gmail.com"
                  className="ecole-admin__headerActions-icon ecole-admin__headerActions-icon--contact"
                  data-tooltip="sanctuaire.rosaire.bolobi@gmail.com"
                  aria-label="Nous écrire par email"
                >
                  <i className="fas fa-envelope" aria-hidden="true"></i>
                </a>
                <a
                  href="tel:+2250704763132"
                  className="ecole-admin__headerActions-icon ecole-admin__headerActions-icon--contact"
                  data-tooltip="+225 07 04 76 31 32"
                  aria-label="Nous appeler au +225 07 04 76 31 32"
                >
                  <i className="fas fa-phone" aria-hidden="true"></i>
                </a>
              </div>
              <LogSignIn />
            </div>

            {/* Bouton de réinitialisation des données (Uniquement pour les admins enregistrés) */}
            <PermissionGate role="admin">
              {userData?.email && process.env.NEXT_PUBLIC_EMAIL_ADMIN?.includes(userData.email) && (
                <div className="ecole-admin__headerActions-reset">
                  <button
                    onClick={clearAllAppData}
                    className="ecole-admin__headerActions-reset-btn"
                    title="Réinitialiser toutes les données de l'application"
                  >
                    <span className="ecole-admin__headerActions-reset-btn-icon">🗑️</span>
                    <span className="ecole-admin__headerActions-reset-btn-text">Reset App</span>
                  </button>
                </div>
              )}
            </PermissionGate>


            <div className="ecole-admin__authSection">
              <SignedOut>
                <div className="ecole-admin__headerActions-iconGroup">
                  <SignInButton mode="modal">
                    <button className="ecole-admin__headerActions-icon ecole-admin__headerActions-icon--auth" data-tooltip="Se connecter" aria-label="Se connecter">
                      <i className="fas fa-sign-in-alt" aria-hidden="true"></i>
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="ecole-admin__headerActions-icon ecole-admin__headerActions-icon--auth" data-tooltip="S'inscrire" aria-label="S'inscrire">
                      <i className="fas fa-user-plus" aria-hidden="true"></i>
                    </button>
                  </SignUpButton>
                </div>
              </SignedOut>

              <SignedIn>
                <div className="ecole-admin__headerActions-iconGroup">
                  <div className="ecole-admin__headerActions-icon ecole-admin__headerActions-icon--account" data-tooltip="Mon compte">
                    <UserButton
                      appearance={{
                        elements: {
                          avatarBox: "ecole-admin__userAvatar"
                        }
                      }}
                    />
                  </div>
                  {!loading && userData && (
                    <div className="ecole-admin__headerActions-roleIndicator">
                      <RoleIndicator />
                    </div>
                  )}
                </div>
              </SignedIn>
            </div>
          </div>
        </div>

        {/* Dashboard adaptatif selon le rôle */}
        {loading ? (
          <section className="ecole-admin__loading">
            <div className="ecole-admin__loader">
              <span className="ecole-admin__loader-icon">⏳</span>
              <span className="ecole-admin__loader-text">Chargement de votre espace...</span>
            </div>
          </section>
        ) : (
          <>
            {/* Dashboard ADMIN */}
            <section className="mainMenu ecole-admin__adminDashboard">
              <nav className="ecole-admin__nav" role="navigation" aria-label="Navigation principale administrateur">
                <Link href="/eleves" className="mainMenu__item ecole-admin__nav-btn ecole-admin__nav-btn--admin" aria-label="Gérer les élèves">
                  <span role="img" aria-label="Élève">👨‍🎓</span>
                  <strong>Gérer les élèves</strong>
                </Link>
                <Link href="/enseignants" className="mainMenu__item ecole-admin__nav-btn ecole-admin__nav-btn--admin" aria-label="Gérer les enseignants">
                  <span role="img" aria-label="Enseignant">👨‍🏫</span>
                  <strong>Gérer les enseignants</strong>
                </Link>
                <Link href="/classes" className="mainMenu__item ecole-admin__nav-btn ecole-admin__nav-btn--admin" aria-label="Gérer les classes">
                  <span role="img" aria-label="École">🏫</span>
                  <strong>Gérer les classes</strong>
                </Link>
                <Link href="/groups" className="mainMenu__item ecole-admin__nav-btn ecole-admin__nav-btn--admin" aria-label="Mes Groupes">
                  <span role="img" aria-label="Groupes">👥</span>
                  <strong>Mes Groupes</strong>
                </Link>
                <Link href="/games" className="mainMenu__item ecole-admin__nav-btn ecole-admin__nav-btn--admin" aria-label="Jeux pédagogiques">
                  <span role="img" aria-label="Jeux">🎮</span>
                  <strong>Jeux pédagogiques</strong>
                </Link>
                <Link href="/blog" className="mainMenu__item ecole-admin__nav-btn ecole-admin__nav-btn--admin" aria-label="Blog de l'école">
                  <span role="img" aria-label="Blog">📰</span>
                  <strong>Blog de l'école</strong>
                </Link>
                <Link href="/gallery" className="mainMenu__item ecole-admin__nav-btn ecole-admin__nav-btn--admin" aria-label="Galerie des souvenirs">
                  <span role="img" aria-label="Galerie">📸</span>
                  <strong>Galerie des souvenirs</strong>
                </Link>
                <PermissionGate role="admin">
                  <Link href="/administration" className="mainMenu__item ecole-admin__nav-btn ecole-admin__nav-btn--admin" aria-label="Administration">
                    <span role="img" aria-label="Admin">⚙️</span>
                    <strong>Administration</strong>
                  </Link>
                </PermissionGate>
                <PermissionGate roles={['prof', 'admin']}>
                  <Link href="/enseignants/mon-planning" className="mainMenu__item ecole-admin__nav-btn ecole-admin__nav-btn--admin" aria-label="Mon Planning">
                    <span role="img" aria-label="Calendrier">📅</span>
                    <strong>Mon Planning</strong>
                  </Link>
                </PermissionGate>
              </nav>

            </section>
          </>
        )}
      </header>

      <main className="ecole-admin__content home">
        {birthdayCelebrants.length > 0 && (
          <div className="ecole-admin__birthday-banner">
            <span className="ecole-admin__birthday-icon">🎂</span>
            <div className="ecole-admin__birthday-text">
              Joyeux anniversaire{' '}
              {birthdayCelebrants.map((person, idx) => (
                <Fragment key={person.id}>
                  {idx > 0 && idx === birthdayCelebrants.length - 1 ? ' et ' : idx > 0 ? ', ' : ''}
                  <span className="ecole-admin__birthday-link-container">
                    <Link href={person.path} className="ecole-admin__birthday-link">
                      {person.role} <strong>{person.name}</strong>
                    </Link>
                    {person.className && (
                      <span className="ecole-admin__birthday-class-link">
                        - <Link href={"/classes/" + person.classId}>Classe: {person.className}</Link>
                      </span>
                    )}
                  </span>
                </Fragment>
              ))}
            </div>
          </div>
        )}
        <h1 className={"ecole-admin__dashboardTitle role___" + userRole}>
          {userRole === "admin" && "👑 "}
          {userRole === "prof" && "🎩 "}
          Tableau de bord
          {userRole === "admin" && " Administrateur"}
          {userRole === "prof" && " Enseignant"}
        </h1>


        {children}

      </main>
    </>
    {showModal && <EntityModal type={editType} entity={selected} onClose={() => setShowModal(false)} classes={classes || []} />}
  </>
}