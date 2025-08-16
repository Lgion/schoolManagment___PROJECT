"use client"

import { useUserRole } from '../stores/useUserRole';

// Composant pour contrôler l'accès selon les permissions
export default function PermissionGate({ 
  permission, 
  role, 
  roles, 
  children, 
  fallback = null,
  className = ""
}) {
  const { hasPermission, hasRole, hasAnyRole, loading } = useUserRole();

  // Affichage pendant le chargement
  if (loading) {
    return (
      <div className={`permissionGate permissionGate--loading ${className}`}>
        <div className="permissionGate__loader">
          <span className="permissionGate__loader-icon">⏳</span>
          <span className="permissionGate__loader-text">Vérification des permissions...</span>
        </div>
      </div>
    );
  }

  // Vérification des permissions
  let hasAccess = true;

  if (permission && !hasPermission(permission)) {
    hasAccess = false;
  }

  if (role && !hasRole(role)) {
    hasAccess = false;
  }

  if (roles && !hasAnyRole(roles)) {
    hasAccess = false;
  }

  // Rendu conditionnel
  if (!hasAccess) {
    return fallback ? (
      <div className={`permissionGate permissionGate--denied ${className}`}>
        {fallback}
      </div>
    ) : null;
  }

  return (
    <div className={`permissionGate permissionGate--granted ${className}`}>
      {children}
    </div>
  );
}

// Composant pour afficher les informations de rôle
export function RoleIndicator({ className = "" }) {
  const { userRole, userData, loading } = useUserRole();

  if (loading || !userData) {
    return null;
  }

  const roleLabels = {
    admin: 'Administrateur',
    prof: 'Professeur',
    eleve: 'Élève',
    public: 'Visiteur'
  };

  const roleColors = {
    admin: 'roleIndicator--admin',
    prof: 'roleIndicator--prof',
    eleve: 'roleIndicator--eleve',
    public: 'roleIndicator--public'
  };

  const roleIcons = {
    admin: '👑',
    prof: '👨‍🏫',
    eleve: '👨‍🎓',
    public: '👤'
  };

  return (
    <div className={`roleIndicator ${roleColors[userRole]} ${className}`}>
      <span className="roleIndicator__icon">{roleIcons[userRole]}</span>
      <span className="roleIndicator__label">{roleLabels[userRole]}</span>
      <span className="roleIndicator__name">
        {userData.firstName} {userData.lastName}
      </span>
    </div>
  );
}

// Composant pour profil utilisateur
export function UserProfile({ className = "" }) {
  const { userData, userRole, permissions, loading } = useUserRole();

  if (loading) {
    return (
      <div className={`userProfile userProfile--loading ${className}`}>
        <div className="userProfile__loader">Chargement du profil...</div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className={`userProfile userProfile--error ${className}`}>
        <div className="userProfile__error">
          <span className="userProfile__error-icon">⚠️</span>
          <span className="userProfile__error-text">Profil non disponible</span>
        </div>
      </div>
    );
  }

  return (
    <article className={`userProfile ${className}`}>
      <header className="userProfile__header">
        <div className="userProfile__avatar">
          <span className="userProfile__avatar-icon">
            {userRole === 'admin' ? '👑' : 
             userRole === 'prof' ? '👨‍🏫' : 
             userRole === 'eleve' ? '👨‍🎓' : '👤'}
          </span>
        </div>
        <div className="userProfile__info">
          <h3 className="userProfile__name">
            {userData.firstName} {userData.lastName}
          </h3>
          <p className="userProfile__email">{userData.email}</p>
          <RoleIndicator className="userProfile__role" />
        </div>
      </header>

      <section className="userProfile__permissions">
        <h4 className="userProfile__permissions-title">Permissions</h4>
        <ul className="userProfile__permissions-list">
          {permissions.map((permission) => (
            <li key={permission} className="userProfile__permissions-item">
              <span className="userProfile__permissions-icon">✓</span>
              <span className="userProfile__permissions-text">
                {formatPermissionLabel(permission)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Affichage des données spécifiques au rôle */}
      {userData.roleData && (
        <section className="userProfile__roleData">
          <h4 className="userProfile__roleData-title">Informations spécifiques</h4>
          
          {userRole === 'admin' && userData.roleData.adminLevel && (
            <div className="userProfile__roleData-item">
              <span className="userProfile__roleData-label">Niveau admin:</span>
              <span className="userProfile__roleData-value">{userData.roleData.adminLevel}</span>
            </div>
          )}
          
          {userRole === 'prof' && userData.roleData.teacherRef && (
            <div className="userProfile__roleData-item">
              <span className="userProfile__roleData-label">Profil enseignant:</span>
              <span className="userProfile__roleData-value">Lié</span>
            </div>
          )}
          
          {userRole === 'eleve' && userData.roleData.eleveRef && (
            <div className="userProfile__roleData-item">
              <span className="userProfile__roleData-label">Profil élève:</span>
              <span className="userProfile__roleData-value">Lié</span>
            </div>
          )}
        </section>
      )}
    </article>
  );
}

// Composant pour navigation conditionnelle selon le rôle
export function RoleBasedNavigation({ className = "" }) {
  const { userRole, isAdmin, isProf, isEleve, loading } = useUserRole();

  if (loading) {
    return null;
  }

  return (
    <nav className={`roleBasedNavigation ${className}`}>
      {/* Navigation pour tous les utilisateurs authentifiés */}
      <div className="roleBasedNavigation__section">
        <h4 className="roleBasedNavigation__title">Général</h4>
        <ul className="roleBasedNavigation__list">
          <li className="roleBasedNavigation__item">
            <a href="/" className="roleBasedNavigation__link">
              🏠 Accueil
            </a>
          </li>
        </ul>
      </div>

      {/* Navigation pour les admins */}
      {isAdmin() && (
        <div className="roleBasedNavigation__section">
          <h4 className="roleBasedNavigation__title">Administration</h4>
          <ul className="roleBasedNavigation__list">
            <li className="roleBasedNavigation__item">
              <a href="/admin/users" className="roleBasedNavigation__link">
                👥 Gestion des utilisateurs
              </a>
            </li>
            <li className="roleBasedNavigation__item">
              <a href="/admin/settings" className="roleBasedNavigation__link">
                ⚙️ Paramètres
              </a>
            </li>
          </ul>
        </div>
      )}

      {/* Navigation pour les profs */}
      {(isAdmin() || isProf()) && (
        <div className="roleBasedNavigation__section">
          <h4 className="roleBasedNavigation__title">Enseignement</h4>
          <ul className="roleBasedNavigation__list">
            <li className="roleBasedNavigation__item">
              <a href="/classes" className="roleBasedNavigation__link">
                🏫 Mes classes
              </a>
            </li>
            <li className="roleBasedNavigation__item">
              <a href="/eleves" className="roleBasedNavigation__link">
                👨‍🎓 Mes élèves
              </a>
            </li>
          </ul>
        </div>
      )}

      {/* Navigation pour les élèves */}
      {isEleve() && (
        <div className="roleBasedNavigation__section">
          <h4 className="roleBasedNavigation__title">Mon espace élève</h4>
          <ul className="roleBasedNavigation__list">
            <li className="roleBasedNavigation__item">
              <a href="/eleve/notes" className="roleBasedNavigation__link">
                📊 Mes notes
              </a>
            </li>
            <li className="roleBasedNavigation__item">
              <a href="/eleve/emploi-du-temps" className="roleBasedNavigation__link">
                📅 Mon emploi du temps
              </a>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}

// Fonction utilitaire pour formater les labels de permissions
function formatPermissionLabel(permission) {
  const labels = {
    manage_users: 'Gérer les utilisateurs',
    manage_classes: 'Gérer les classes',
    manage_students: 'Gérer les élèves',
    manage_teachers: 'Gérer les enseignants',
    view_reports: 'Voir les rapports',
    manage_settings: 'Gérer les paramètres',
    delete_data: 'Supprimer des données',
    export_data: 'Exporter des données',
    view_my_classes: 'Voir mes classes',
    manage_my_students: 'Gérer mes élèves',
    create_reports: 'Créer des rapports',
    view_my_statistics: 'Voir mes statistiques',
    update_grades: 'Mettre à jour les notes',
    manage_attendance: 'Gérer les présences',
    view_my_profile: 'Voir mon profil',
    view_my_grades: 'Voir mes notes',
    view_my_schedule: 'Voir mon emploi du temps',
    contact_teachers: 'Contacter les enseignants',
    view_public_info: 'Voir les informations publiques',
    contact_school: 'Contacter l\'école'
  };
  
  return labels[permission] || permission;
}
