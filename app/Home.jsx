"use client"

import Link from 'next/link';
import { useContext,useEffect } from 'react';
import {AiAdminContext} from '../stores/ai_adminContext';
import { useUserRole } from '../stores/useUserRole';
import PermissionGate, { RoleIndicator } from './components/PermissionGate';
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';

export default ({children}) => {
  const { 
    eleves, 
    enseignants, 
    classes, 
    fetchEleves, 
    fetchEnseignants, 
    fetchClasses 
  } = useContext(AiAdminContext)

  const { 
    userRole, 
    loading, 
    isAuthenticated, 
    userData,
    clerkUser,
    syncUser 
  } = useUserRole();

  // Fonction pour vider le cache localStorage
  const clearCache = () => {
    localStorage.clear();
    alert('✅ Cache vidé ! La page va se recharger.');
    window.location.reload();
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

  return <main className="ecole-admin">
    <header className="ecole-admin__header">
      <h1 className="ecole-admin__title">Administration École
        <Link href={"/"}>🏠</Link>
        <a href="mailto:sanctuaire.rosaire.bolobi@gmail.com">sanctuaire.rosaire.bolobi@gmail.com</a>
        <a href="tel:+2250704763132">+2250704763132</a>
        <a href="tel:+2250709360672">+2250709360672</a>
      </h1>
      
      <div className="ecole-admin__authSection">
        <SignedOut>
          <div className="ecole-admin__authButtons">
            <SignInButton mode="modal">
              <button className="ecole-admin__authButton ecole-admin__authButton--signIn">
                <span className="ecole-admin__authButton-icon">🔐</span>
                <span className="ecole-admin__authButton-text">Se connecter</span>
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="ecole-admin__authButton ecole-admin__authButton--signUp">
                <span className="ecole-admin__authButton-icon">📝</span>
                <span className="ecole-admin__authButton-text">S'inscrire</span>
              </button>
            </SignUpButton>
          </div>
        </SignedOut>
        
        <SignedIn>
          <div className="ecole-admin__userSection">
            <span className="ecole-admin__userWelcome">Bienvenue</span>
            {!loading && userData && <RoleIndicator />}
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "ecole-admin__userAvatar"
                }
              }}
            />
          </div>
        </SignedIn>
      </div>
    </header>

    {/* Dashboard pour utilisateurs non connectés */}
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

    {/* Dashboard adaptatif selon le rôle */}
    <SignedIn>
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
          <PermissionGate role="admin">
            <section className="ecole-admin__adminDashboard">
              <h2 className="ecole-admin__dashboardTitle">
                👑 Tableau de bord Administrateur
              </h2>
              
              <nav className="ecole-admin__nav">
                <Link href="/eleves">
                  <button className="ecole-admin__nav-btn ecole-admin__nav-btn--admin">
                    <span>👨‍🎓</span> Gérer les élèves
                  </button>
                </Link>
                <Link href="/enseignants">
                  <button className="ecole-admin__nav-btn ecole-admin__nav-btn--admin">
                    <span>👨‍🏫</span> Gérer les enseignants
                  </button>
                </Link>
                <Link href="/classes">
                  <button className="ecole-admin__nav-btn ecole-admin__nav-btn--admin">
                    <span>🏫</span> Gérer les classes
                  </button>
                </Link>
                <Link href="/admin/users">
                  <button className="ecole-admin__nav-btn ecole-admin__nav-btn--admin">
                    <span>👥</span> Gestion des utilisateurs
                  </button>
                </Link>
                <Link href="/admin/settings">
                  <button className="ecole-admin__nav-btn ecole-admin__nav-btn--admin">
                    <span>⚙️</span> Paramètres système
                  </button>
                </Link>
              </nav>

              <article className="ecole-admin__stats">
                <div className="ecole-admin__stats-row">
                  <div className="ecole-admin__stats-col">
                    <h2 className="ecole-admin__stats-title">Statistiques globales: </h2>
                    <span className="ecole-admin__stats-value"><u>Nombre d'élèves:</u> {eleves?.length || 0}</span>
                    <span className="ecole-admin__stats-value"><u>Nombre d'enseignants:</u> {enseignants?.length || 0}</span>
                    <span className="ecole-admin__stats-value"><u>Nombre de classes:</u> {classes?.length || 0}</span>
                  </div>
                </div>
              </article>
            </section>
          </PermissionGate>

          {/* Dashboard PROF */}
          <PermissionGate role="prof">
            <section className="ecole-admin__profDashboard">
              <h2 className="ecole-admin__dashboardTitle">
                👨‍🏫 Espace Professeur
              </h2>
              
              <nav className="ecole-admin__nav">
                <Link href="/prof/classes">
                  <button className="ecole-admin__nav-btn ecole-admin__nav-btn--prof">
                    <span>🏫</span> Mes classes
                  </button>
                </Link>
                <Link href="/prof/eleves">
                  <button className="ecole-admin__nav-btn ecole-admin__nav-btn--prof">
                    <span>👨‍🎓</span> Mes élèves
                  </button>
                </Link>
                <Link href="/prof/notes">
                  <button className="ecole-admin__nav-btn ecole-admin__nav-btn--prof">
                    <span>📊</span> Gestion des notes
                  </button>
                </Link>
                <Link href="/prof/rapports">
                  <button className="ecole-admin__nav-btn ecole-admin__nav-btn--prof">
                    <span>📋</span> Mes rapports
                  </button>
                </Link>
              </nav>

              <article className="ecole-admin__quickActions">
                <h3 className="ecole-admin__quickActions-title">Actions rapides</h3>
                <div className="ecole-admin__quickActions-grid">
                  <button className="ecole-admin__quickAction">
                    <span className="ecole-admin__quickAction-icon">✏️</span>
                    <span className="ecole-admin__quickAction-text">Saisir des notes</span>
                  </button>
                  <button className="ecole-admin__quickAction">
                    <span className="ecole-admin__quickAction-icon">📅</span>
                    <span className="ecole-admin__quickAction-text">Marquer les absences</span>
                  </button>
                </div>
              </article>
            </section>
          </PermissionGate>

          {/* Dashboard ELEVE */}
          <PermissionGate role="eleve">
            <section className="ecole-admin__eleveDashboard">
              <h2 className="ecole-admin__dashboardTitle">
                👨‍🎓 Mon espace élève
              </h2>
              
              <nav className="ecole-admin__nav">
                <Link href="/eleve/notes">
                  <button className="ecole-admin__nav-btn ecole-admin__nav-btn--eleve">
                    <span>📊</span> Mes notes
                  </button>
                </Link>
                <Link href="/eleve/emploi-du-temps">
                  <button className="ecole-admin__nav-btn ecole-admin__nav-btn--eleve">
                    <span>📅</span> Mon emploi du temps
                  </button>
                </Link>
                <Link href="/eleve/devoirs">
                  <button className="ecole-admin__nav-btn ecole-admin__nav-btn--eleve">
                    <span>📚</span> Mes devoirs
                  </button>
                </Link>
                <Link href="/eleve/profil">
                  <button className="ecole-admin__nav-btn ecole-admin__nav-btn--eleve">
                    <span>👤</span> Mon profil
                  </button>
                </Link>
              </nav>

              <article className="ecole-admin__studentInfo">
                <h3 className="ecole-admin__studentInfo-title">Informations rapides</h3>
                <div className="ecole-admin__studentInfo-grid">
                  <div className="ecole-admin__infoCard">
                    <span className="ecole-admin__infoCard-icon">🎯</span>
                    <span className="ecole-admin__infoCard-label">Moyenne générale</span>
                    <span className="ecole-admin__infoCard-value">--/20</span>
                  </div>
                  <div className="ecole-admin__infoCard">
                    <span className="ecole-admin__infoCard-icon">📚</span>
                    <span className="ecole-admin__infoCard-label">Devoirs à rendre</span>
                    <span className="ecole-admin__infoCard-value">--</span>
                  </div>
                </div>
              </article>
            </section>
          </PermissionGate>

          {/* Dashboard PUBLIC */}
          <PermissionGate role="public">
            <section className="ecole-admin__publicUserDashboard">
              <h2 className="ecole-admin__dashboardTitle">
                👤 Espace visiteur
              </h2>
              
              <div className="ecole-admin__publicMessage">
                <div className="ecole-admin__messageCard">
                  <span className="ecole-admin__messageCard-icon">ℹ️</span>
                  <div className="ecole-admin__messageCard-content">
                    <h3 className="ecole-admin__messageCard-title">Accès limité</h3>
                    <p className="ecole-admin__messageCard-text">
                      Votre compte n'est pas encore associé à un rôle spécifique dans l'école. 
                      Contactez l'administration pour obtenir les accès appropriés.
                    </p>
                    <div style={{ display: 'flex', gap: '1em', marginTop: '1em', flexWrap: 'wrap' }}>
                      <button 
                        onClick={handleSyncUser}
                        className="ecole-admin__nav-btn ecole-admin__nav-btn--admin"
                      >
                        <span>🔄</span> Synchroniser mon compte
                      </button>
                      <button 
                        onClick={clearCache}
                        className="ecole-admin__nav-btn ecole-admin__nav-btn--public"
                      >
                        <span>🗑️</span> Vider le cache
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <nav className="ecole-admin__nav">
                <Link href="/contact">
                  <button className="ecole-admin__nav-btn ecole-admin__nav-btn--public">
                    <span>📞</span> Contacter l'école
                  </button>
                </Link>
                <Link href="/informations">
                  <button className="ecole-admin__nav-btn ecole-admin__nav-btn--public">
                    <span>📋</span> Informations générales
                  </button>
                </Link>
              </nav>
            </section>
          </PermissionGate>
        </>
      )}
    </SignedIn>
    <section className="ecole-admin__content">
      {children}
    </section>
  </main>
}