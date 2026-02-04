"use client"

import Link from 'next/link';
import { useContext, useEffect, Fragment } from 'react';
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
import TeacherReportModule from './components/TeacherReportModule';

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
      // 🎓 Données scolaires principales
      localStorage.removeItem('eleves');
      localStorage.removeItem('enseignants');
      localStorage.removeItem('classes');

      // 📚 Données pédagogiques
      localStorage.removeItem('app_subjects');

      // Coefficients par classe (pattern dynamique)
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('app_class_coefficients_')) {
          localStorage.removeItem(key);
        }
      });

      // 👤 Données utilisateur
      localStorage.removeItem('user');
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('user_')) {
          localStorage.removeItem(key);
        }
      });


      console.log('🗑️ Toutes les données de l\'application ont été supprimées du localStorage');
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
    fetchClasses()
    fetchEleves()
    fetchEnseignants()
  }, []);

  return <>
    <>
      {/* Bouton de réinitialisation des données */}
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
            <section className="ecole-admin__adminDashboard">
              {/* <PermissionGate roles={['admin', 'prof']}> */}
              <nav className="ecole-admin__nav" role="navigation" aria-label="Navigation principale administrateur">
                <Link href="/eleves" className="ecole-admin__nav-btn ecole-admin__nav-btn--admin" aria-label="Gérer les élèves">
                  <span role="img" aria-label="Élève">👨‍🎓</span>
                  <strong>Gérer les élèves</strong>
                </Link>
                <Link href="/enseignants" className="ecole-admin__nav-btn ecole-admin__nav-btn--admin" aria-label="Gérer les enseignants">
                  <span role="img" aria-label="Enseignant">👨‍🏫</span>
                  <strong>Gérer les enseignants</strong>
                </Link>
                <Link href="/classes" className="ecole-admin__nav-btn ecole-admin__nav-btn--admin" aria-label="Gérer les classes">
                  <span role="img" aria-label="École">🏫</span>
                  <strong>Gérer les classes</strong>
                </Link>
                <PermissionGate role="admin">
                  <Link href="/administration" className="ecole-admin__nav-btn ecole-admin__nav-btn--admin" aria-label="Administration">
                    <span role="img" aria-label="Admin">⚙️</span>
                    <strong>Administration</strong>
                  </Link>
                </PermissionGate>
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
        <h1 className={"ecole-admin__dashboardTitle role___" + userRole}>
          {userRole === "admin" && "👑 "}
          {userRole === "prof" && "🎩 "}
          Tableau de bord
          {userRole === "admin" && " Administrateur"}
          {userRole === "prof" && " Enseignant"}
        </h1>

        <TeacherReportModule />

        {children}

      </main>
    </>
    {showModal && <EntityModal type={editType} entity={selected} onClose={() => setShowModal(false)} classes={classes || []} />}
  </>
}