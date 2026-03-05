"use client"

import { useState, useEffect, useContext, createContext } from 'react';
import { useUser } from '@clerk/nextjs';

// Contexte pour les données utilisateur
const UserRoleContext = createContext({});

// Provider pour le contexte utilisateur
export function UserRoleProvider({ children }) {
  const { user: clerkUser, isLoaded } = useUser();
  const [userData, setUserData] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fonction pour récupérer les données utilisateur depuis MongoDB
  const fetchUserData = async (clerkId) => {
    try {
      const response = await fetch(`/api/users/${clerkId}`);
      if (response.ok) {
        return await response.json();
      } else if (response.status === 401 || response.status === 403) {
        console.warn(`⚠️ Fetch user data returned ${response.status}. Session might be invalid or role missing.`);
        return { error: 'Unauthorized', status: response.status };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  // Fonction pour sauvegarder dans localStorage (PRIORITÉ ABSOLUE selon vos règles)
  const saveToLocalStorage = (key, data) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
    }
  };

  // Fonction pour récupérer depuis localStorage
  const getFromLocalStorage = (key) => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  };

  // Fonction pour déterminer les permissions selon le rôle
  const getPermissionsByRole = (role) => {
    const rolePermissions = {
      admin: [
        'manage_users', 'manage_classes', 'manage_students',
        'manage_teachers', 'view_reports', 'manage_settings',
        'delete_data', 'export_data'
      ],
      prof: [
        'view_my_classes', 'manage_my_students', 'create_reports',
        'view_my_statistics', 'update_grades', 'manage_attendance'
      ],
      eleve: [
        'view_my_profile', 'view_my_grades', 'view_my_schedule',
        'contact_teachers'
      ],
      public: [
        'view_public_info', 'contact_school'
      ]
    };

    return rolePermissions[role] || [];
  };

  // Effet principal pour charger les données utilisateur
  useEffect(() => {
    const loadUserData = async () => {
      // Test mode bypass
      if (process.env.NEXT_PUBLIC_MODE === 'test') {
        const mockRole = (typeof window !== 'undefined' ? localStorage.getItem('mock_role') : null) || 'admin';
        setUserData({ id: 'test', firstName: 'Test', lastName: 'User', email: 'test@test.com', role: mockRole });
        setUserRole(mockRole);
        setPermissions(getPermissionsByRole(mockRole));
        setLoading(false);
        return;
      }

      if (!isLoaded || !clerkUser) {
        setLoading(false);
        return;
      }

      const userStorageKey = `user_${clerkUser.id}`;

      // 1. PRIORITÉ ABSOLUE : récupérer depuis localStorage
      let storedUserData = getFromLocalStorage(userStorageKey);

      if (storedUserData) {
        // Données trouvées dans localStorage
        setUserData(storedUserData);
        setUserRole(storedUserData.role);
        setPermissions(getPermissionsByRole(storedUserData.role));
        setLoading(false);

        // Vérification en arrière-plan pour mise à jour
        const freshData = await fetchUserData(clerkUser.id);
        if (freshData && JSON.stringify(freshData) !== JSON.stringify(storedUserData)) {
          // Mise à jour si les données ont changé
          setUserData(freshData);
          setUserRole(freshData.role);
          setPermissions(getPermissionsByRole(freshData.role));
          saveToLocalStorage(userStorageKey, freshData);
        } else if (!freshData) {
          // If fetch fails but we have storage data, we might want to try to sync-user
          // just in case the db was wiped but localstorage remained.
          console.log('⚠️ Re-syncing user due to empty fresh data from API...');
          try {
            await fetch('/api/sync-user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                clerkId: clerkUser.id,
                email: clerkUser.emailAddresses[0]?.emailAddress,
                firstName: clerkUser.firstName,
                lastName: clerkUser.lastName
              })
            });
          } catch (e) {
            console.error('Background sync failed:', e);
          }
        }
      } else {
        // 2. Fallback : récupérer depuis MongoDB puis sauvegarder dans localStorage
        const freshData = await fetchUserData(clerkUser.id);

        if (freshData) {
          setUserData(freshData);
          setUserRole(freshData.role);
          setPermissions(getPermissionsByRole(freshData.role));
          saveToLocalStorage(userStorageKey, freshData);
        } else {
          // 3. Fallback final : synchroniser automatiquement l'utilisateur
          console.log('🔄 Aucune donnée trouvée, synchronisation automatique...');

          const userData = {
            clerkId: clerkUser.id,
            email: clerkUser.emailAddresses[0]?.emailAddress,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName
          };

          try {
            const syncResponse = await fetch('/api/sync-user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(userData)
            });

            if (syncResponse.ok) {
              const result = await syncResponse.json();
              if (result.success && result.user) {
                console.log('✅ Synchronisation automatique réussie, rôle:', result.user.role);
                setUserData(result.user);
                setUserRole(result.user.role);
                setPermissions(getPermissionsByRole(result.user.role));
                saveToLocalStorage(userStorageKey, result.user);
              } else {
                throw new Error('Réponse de synchronisation invalide');
              }
            } else {
              throw new Error(`HTTP ${syncResponse.status}`);
            }
          } catch (error) {
            console.error('❌ Erreur lors de la synchronisation automatique:', error);
            // Fallback vers rôle public
            const defaultUserData = {
              clerkId: clerkUser.id,
              email: clerkUser.emailAddresses[0]?.emailAddress,
              firstName: clerkUser.firstName,
              lastName: clerkUser.lastName,
              role: 'public'
            };
            setUserData(defaultUserData);
            setUserRole('public');
            setPermissions(getPermissionsByRole('public'));
            saveToLocalStorage(userStorageKey, defaultUserData);
          }
        }

        setLoading(false);
      }
    };

    loadUserData();
  }, [isLoaded, clerkUser]);

  // Fonction pour vérifier une permission
  const hasPermission = (permission) => {
    return permissions.includes(permission);
  };

  // Fonction pour vérifier un rôle
  const hasRole = (role) => {
    return userRole === role;
  };

  // Fonction pour vérifier plusieurs rôles
  const hasAnyRole = (roles) => {
    return roles.includes(userRole);
  };

  // Fonction pour vérifier si c'est un admin
  const isAdmin = () => {
    return userRole === 'admin';
  };

  // Fonction pour vérifier si c'est un prof
  const isProf = () => {
    return userRole === 'prof';
  };

  // Fonction pour vérifier si c'est un élève
  const isEleve = () => {
    return userRole === 'eleve';
  };

  // Fonction pour vérifier si c'est un utilisateur public
  const isPublic = () => {
    return userRole === 'public';
  };

  // Fonction pour synchroniser manuellement l'utilisateur
  const syncUser = async () => {
    if (!clerkUser?.id) {
      throw new Error('Aucun utilisateur Clerk connecté');
    }

    setLoading(true);
    try {
      // Définir la clé de stockage
      const userStorageKey = `user_${clerkUser.id}`;

      // Préparer les données utilisateur depuis Clerk
      const userData = {
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName
      };

      console.log('🔄 Synchronisation avec données:', userData);

      const response = await fetch('/api/sync-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.user) {
          setUserData(result.user);
          setUserRole(result.user.role);
          setPermissions(getPermissionsByRole(result.user.role));
          saveToLocalStorage(userStorageKey, result.user);
          console.log('✅ Synchronisation réussie:', result.message);
          return result;
        }
      }

      // Essayer de récupérer l'erreur détaillée
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || `HTTP ${response.status}`);
    } catch (error) {
      console.error('❌ Error syncing user:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const contextValue = {
    userData,
    userRole,
    permissions,
    loading,
    hasPermission,
    hasRole,
    hasAnyRole,
    isAdmin,
    isProf,
    isEleve,
    isPublic,
    clerkUser,
    isAuthenticated: !!clerkUser && !!userData,
    syncUser
  };

  return (
    <UserRoleContext.Provider value={contextValue}>
      {children}
    </UserRoleContext.Provider>
  );
}

// Hook pour utiliser le contexte utilisateur
export function useUserRole() {
  const context = useContext(UserRoleContext);

  if (!context) {
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }

  return context;
}
