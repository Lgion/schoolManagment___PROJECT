# Vérification : Rôles et Comptes Famille (roles_and_accounts)

Ce fichier sert de checklist pour vérifier l'implémentation complète de la spécification.

- [ ] Le modèle `User` supporte désormais le rôle `'parent'` et contient le champ `childrenRefs`.
- [ ] Le modèle `Eleve` peut stocker des informations de contact propres (email/téléphone) pour l'élève autonome.
- [ ] Le Webhook Clerk a été mis à jour pour détecter automatiquement les rôles `'parent'` et `'eleve'` à la connexion/création de compte, en comparant les emails/téléphones avec les documents `Eleve`.
- [ ] L'interface UI d'un profil élève (côté admin/prof) permet de configurer l'accès autonome de l'élève (ajout d'email/tel) pour déclencher la création de son compte Clerk via l'API backend.
