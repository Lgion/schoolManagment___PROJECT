"use client"

import Link from 'next/link';
import { useContext, useEffect, Fragment, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
import { clearLS, setLSItem, initStorage } from '../utils/localStorageManager';

export default ({ children }) => {
  const router = useRouter();
  const {
    selected,
    setSelected,
    showModal,
    setShowModal,
    editType,
    eleves,
    enseignants,
    classes,
    fetchEleves,
    fetchEnseignants,
    fetchClasses,
  } = useContext(AiAdminContext)

  const {
    userRole,
    loading,
    isAuthenticated,
    userData,
    clerkUser,
    syncUser
  } = useUserRole();

  // Fonction pour gérer la navigation avec scroll automatique
  const handleNavClick = (path) => {
    router.push(path);
    // Scroll vers le contenu après un délai pour permettre la navigation
    setTimeout(() => {
      const contentElement = document.querySelector('.ecole-admin__content');
      if (contentElement) {
        contentElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  };

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

  // Fonction pour gérer la synchronisation manuelle
  const handleSyncUser = async () => {
    try {
      const result = await syncUser();
      if (result?.success) {
        alert(`✅ Synchronisation réussie ! Nouveau rôle: ${result.user.role}`);
        // Recharger la page pour voir les changements
        window.location.reload();
      }
    } catch (error) {
      alert(`❌ Erreur lors de la synchronisation: ${error.message}`);
      console.error('Détails de l\'erreur:', error);
    }
  };

  useEffect(() => {
    initStorage()

    // Le cache est-il valide ? On s'assure d'appeler local storage d'abord
    // fetch... sera bloqué dans le contexte par les fonctions elles-mêmes ou si besoin,
    // on appelle les datas initales ici
    fetchClasses()
    fetchEleves()
    fetchEnseignants()

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

  return <>
    <>
      <header className="ecole-admin__header">
        <div className="ecole-admin__header-container">
          <div className="ecole-admin__branding">
            <Link href={"/"} className="ecole-admin__branding-logo">
              {/* <img src="/logo.webp" alt="Logo ESMP" className="ecole-admin__branding-logo-img" /> */}
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
                >
                  <i className="fas fa-envelope"></i>
                </a>
                <a
                  href="tel:+2250704763132"
                  className="ecole-admin__headerActions-icon ecole-admin__headerActions-icon--contact"
                  data-tooltip="+225 07 04 76 31 32"
                >
                  <i className="fas fa-phone"></i>
                </a>
              </div>
            </div>

            {/* Bouton de réinitialisation des données (Déplacé ici pour éviter les chevauchements) */}
            <PermissionGate role="admin">
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
            </PermissionGate>


            <div className="ecole-admin__authSection">
              <SignedOut>
                <div className="ecole-admin__headerActions-iconGroup">
                  <SignInButton mode="modal">
                    <button className="ecole-admin__headerActions-icon ecole-admin__headerActions-icon--auth" data-tooltip="Se connecter">
                      <i className="fas fa-sign-in-alt"></i>
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="ecole-admin__headerActions-icon ecole-admin__headerActions-icon--auth" data-tooltip="S'inscrire">
                      <i className="fas fa-user-plus"></i>
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
        {/* <SignedIn> */}
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
              {/* <PermissionGate roles={['admin', 'prof']}> */}
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
                <PermissionGate role="admin">
                  <Link href="/administration" className="mainMenu__item ecole-admin__nav-btn ecole-admin__nav-btn--admin" aria-label="Administration">
                    <span role="img" aria-label="Admin">⚙️</span>
                    <strong>Administration</strong>
                  </Link>
                </PermissionGate>
                {/* 
                <Link href="/eleves" className="mainMenu__item ecole-admin__nav-btn ecole-admin__nav-btn--admin" aria-label="Gérer les élèves">
                  <span aria-label="Élève">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                      <path d="M219.3 .5c3.1-.6 6.3-.6 9.4 0l200 40C439.9 42.7 448 52.6 448 64s-8.1 21.3-19.3 23.5L352 102.9l0 57.1c0 70.7-57.3 128-128 128s-128-57.3-128-128l0-57.1L48 93.3l0 65.1 15.7 78.4c.9 4.7-.3 9.6-3.3 13.3s-7.6 5.9-12.4 5.9l-32 0c-4.8 0-9.3-2.1-12.4-5.9s-4.3-8.6-3.3-13.3L16 158.4l0-71.8C6.5 83.3 0 74.3 0 64C0 52.6 8.1 42.7 19.3 40.5l200-40zM111.9 327.7c10.5-3.4 21.8 .4 29.4 8.5l71 75.5c6.3 6.7 17 6.7 23.3 0l71-75.5c7.6-8.1 18.9-11.9 29.4-8.5C401 348.6 448 409.4 448 481.3c0 17-13.8 30.7-30.7 30.7L30.7 512C13.8 512 0 498.2 0 481.3c0-71.9 47-132.7 111.9-153.6z"/>
                    </svg>
                  </span>
                  <strong>Gérer les élèves</strong>
                </Link>
                <Link href="/enseignants" className="mainMenu__item ecole-admin__nav-btn ecole-admin__nav-btn--admin" aria-label="Gérer les enseignants">
                  <span aria-label="Enseignant">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                      <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z"/>
                    </svg>
                  </span>
                  <strong>Gérer les enseignants</strong>
                </Link>
                <Link href="/classes" className="mainMenu__item ecole-admin__nav-btn ecole-admin__nav-btn--admin" aria-label="Gérer les classes">
                  <span aria-label="École">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
                      <path d="M337.8 5.4C327-1.8 313-1.8 302.2 5.4L166.3 96 48 96C21.5 96 0 117.5 0 144L0 464c0 26.5 21.5 48 48 48l208 0 0-96c0-35.3 28.7-64 64-64s64 28.7 64 64l0 96 208 0c26.5 0 48-21.5 48-48l0-320c0-26.5-21.5-48-48-48L473.7 96 337.8 5.4zM96 192l32 0c8.8 0 16 7.2 16 16l0 64c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-64c0-8.8 7.2-16 16-16zm400 16c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16l0 64c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-64zM96 320l32 0c8.8 0 16 7.2 16 16l0 64c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-64c0-8.8 7.2-16 16-16zm400 16c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16l0 64c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-64zM232 176a88 88 0 1 1 176 0 88 88 0 1 1 -176 0zm88-48c-8.8 0-16 7.2-16 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-16 0 0-16c0-8.8-7.2-16-16-16z"/>
                    </svg>
                  </span>
                  <strong>Gérer les classes</strong>
                </Link>
                <PermissionGate role="admin">
                  <Link href="/administration" className="mainMenu__item ecole-admin__nav-btn ecole-admin__nav-btn--admin" aria-label="Administration">
                    <span aria-label="Admin">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                        <path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"/>
                      </svg>
                    </span>
                    <strong>Administration</strong>
                  </Link>
                </PermissionGate>
                 */}
                {/* <Link href="/admin/users" className="ecole-admin__nav-btn ecole-admin__nav-btn--admin" aria-label="Gestion des utilisateurs">
                      <span role="img" aria-label="Utilisateurs">👥</span>
                      <strong>Gestion des utilisateurs</strong>
                    </Link>
                    <Link href="/admin/settings" className="ecole-admin__nav-btn ecole-admin__nav-btn--admin" aria-label="Paramètres système">
                      <span role="img" aria-label="Paramètres">⚙️</span>
                      <strong>Paramètres système</strong>
                    </Link> */}
              </nav>
              {/* </PermissionGate> */}

              {/* <article className="ecole-admin__stats">
                  <div className="ecole-admin__stats-row">
                    <div className="ecole-admin__stats-col">
                      <h2 className="ecole-admin__stats-title">Statistiques globales: </h2>
                      <span className="ecole-admin__stats-value"><u>Nombre d'élèves:</u> {eleves?.length || 0}</span>
                      <span className="ecole-admin__stats-value"><u>Nombre d'enseignants:</u> {enseignants?.length || 0}</span>
                      <span className="ecole-admin__stats-value"><u>Nombre de classes:</u> {classes?.length || 0}</span>
                    </div>
                  </div>
                </article> */}

            </section>
          </>
        )}
        {/* </SignedIn> */}
        {/* Navigation sticky intégrée dans le header */}
        {/* <SignedIn>
        {!loading && (
          <nav className="ecole-admin__header-nav" role="navigation" aria-label="Navigation principale">
            <div className="ecole-admin__header-nav-tabs">
                <PermissionGate role="admin">
                  <button 
                    onClick={() => handleNavClick('/classes')}
                    className="ecole-admin__header-nav-tab" 
                    aria-label="Gérer les classes"
                  >
                    <span className="ecole-admin__header-nav-tab-icon" role="img" aria-label="Classes">🏫</span>
                    <span className="ecole-admin__header-nav-tab-text">Classes</span>
                    <span className="ecole-admin__header-nav-tab-badge" aria-label={`${classes?.length || 0} classes`}>
                      {classes?.length || 0}
                    </span>
                  </button>
                  <button 
                    onClick={() => handleNavClick('/eleves')}
                    className="ecole-admin__header-nav-tab" 
                    aria-label="Gérer les élèves"
                  >
                    <span className="ecole-admin__header-nav-tab-icon" role="img" aria-label="Élèves">👨‍🎓</span>
                    <span className="ecole-admin__header-nav-tab-text">Élèves</span>
                    <span className="ecole-admin__header-nav-tab-badge" aria-label={`${eleves?.length || 0} élèves`}>
                      {eleves?.length || 0}
                    </span>
                  </button>
                  <button 
                    onClick={() => handleNavClick('/enseignants')}
                    className="ecole-admin__header-nav-tab" 
                    aria-label="Gérer les enseignants"
                  >
                    <span className="ecole-admin__header-nav-tab-icon" role="img" aria-label="Enseignants">👨‍🏫</span>
                    <span className="ecole-admin__header-nav-tab-text">Enseignants</span>
                    <span className="ecole-admin__header-nav-tab-badge" aria-label={`${enseignants?.length || 0} enseignants`}>
                      {enseignants?.length || 0}
                    </span>
                  </button>
                  <button 
                    onClick={() => handleNavClick('/scheduling')}
                    className="ecole-admin__header-nav-tab" 
                    aria-label="Gestion du planning"
                  >
                    <span className="ecole-admin__header-nav-tab-icon" role="img" aria-label="Planning">📅</span>
                    <span className="ecole-admin__header-nav-tab-text">Planning</span>
                  </button>
                  <button 
                    onClick={() => handleNavClick('/rapports')}
                    className="ecole-admin__header-nav-tab" 
                    aria-label="Consulter les rapports"
                  >
                    <span className="ecole-admin__header-nav-tab-icon" role="img" aria-label="Rapports">📊</span>
                    <span className="ecole-admin__header-nav-tab-text">Rapports</span>
                  </button>
                </PermissionGate>
                
                <PermissionGate role="prof">
                  <button 
                    onClick={() => handleNavClick('/prof/classes')}
                    className="ecole-admin__header-nav-tab" 
                    aria-label="Mes classes"
                  >
                    <span className="ecole-admin__header-nav-tab-icon" role="img" aria-label="Classes">🏫</span>
                    <span className="ecole-admin__header-nav-tab-text">Mes Classes</span>
                  </button>
                  <button 
                    onClick={() => handleNavClick('/prof/eleves')}
                    className="ecole-admin__header-nav-tab" 
                    aria-label="Mes élèves"
                  >
                    <span className="ecole-admin__header-nav-tab-icon" role="img" aria-label="Élèves">👨‍🎓</span>
                    <span className="ecole-admin__header-nav-tab-text">Mes Élèves</span>
                  </button>
                  <button 
                    onClick={() => handleNavClick('/prof/planning')}
                    className="ecole-admin__header-nav-tab" 
                    aria-label="Mon planning"
                  >
                    <span className="ecole-admin__header-nav-tab-icon" role="img" aria-label="Planning">📅</span>
                    <span className="ecole-admin__header-nav-tab-text">Mon Planning</span>
                  </button>
                </PermissionGate>
                
                <PermissionGate role="eleve">
                  <button 
                    onClick={() => handleNavClick('/eleve/notes')}
                    className="ecole-admin__header-nav-tab" 
                    aria-label="Consulter mes notes"
                  >
                    <span className="ecole-admin__header-nav-tab-icon" role="img" aria-label="Notes">📝</span>
                    <span className="ecole-admin__header-nav-tab-text">Mes Notes</span>
                  </button>
                  <button 
                    onClick={() => handleNavClick('/eleve/planning')}
                    className="ecole-admin__header-nav-tab" 
                    aria-label="Mon planning de cours"
                  >
                    <span className="ecole-admin__header-nav-tab-icon" role="img" aria-label="Planning">📅</span>
                    <span className="ecole-admin__header-nav-tab-text">Mon Planning</span>
                  </button>
                  <button 
                    onClick={() => handleNavClick('/eleve/devoirs')}
                    className="ecole-admin__header-nav-tab" 
                    aria-label="Consulter mes devoirs"
                  >
                    <span className="ecole-admin__header-nav-tab-icon" role="img" aria-label="Devoirs">📚</span>
                    <span className="ecole-admin__header-nav-tab-text">Mes Devoirs</span>
                  </button>
                </PermissionGate>
              </div>
            </nav>
          )}
        </SignedIn> */}
      </header>

      {/* Dashboard pour utilisateurs non connectés */}
      {/*
    <SignedOut>
      <section className="ecole-admin__publicDashboard">
        <div className="ecole-admin__welcomeCard">
          <h2 className="ecole-admin__welcomeCard-title">
            🏫 École Martin de Porres
          </h2>
          <p className="ecole-admin__welcomeCard-subtitle">
            Système de gestion scolaire - Connectez-vous pour accéder à votre espace
          </p>
          <div className="ecole-admin__welcomeCard-features">
            <div className="ecole-admin__feature">
              <span className="ecole-admin__feature-icon">👑</span>
              <span className="ecole-admin__feature-text">Espace Administrateur</span>
            </div>
            <div className="ecole-admin__feature">
              <span className="ecole-admin__feature-icon">👨‍🏫</span>
              <span className="ecole-admin__feature-text">Espace Professeur</span>
            </div>
            <div className="ecole-admin__feature">
              <span className="ecole-admin__feature-icon">👨‍🎓</span>
              <span className="ecole-admin__feature-text">Espace Élève</span>
            </div>
          </div>
        </div>
      </section>
    </SignedOut>
    */}

      <main className="ecole-admin__content home">
        {birthdayCelebrants.length > 0 && (
          <div className="ecole-admin__birthday-banner">
            <span className="ecole-admin__birthday-icon">🎂</span>
            <div className="ecole-admin__birthday-text">
              Joyeux anniversaire{' '}
              {birthdayCelebrants.map((person, idx) => (
                <Fragment key={person.id}>
                  {idx > 0 && idx === birthdayCelebrants.length - 1 ? ' et ' : idx > 0 ? ', ' : ''}
                  <Link href={person.path} className="ecole-admin__birthday-link">
                    {person.role} <strong>{person.name}</strong>
                    {person.className && <Link href={"/classes/" + person.classId}>Classe: ${person.className}</Link>}
                  </Link>
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