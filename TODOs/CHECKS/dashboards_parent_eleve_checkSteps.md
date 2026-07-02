# Vérification : Dashboards Parent et Élève (dashboards_parent_eleve)

Ce fichier sert de checklist pour vérifier l'implémentation complète de la spécification.

- [ ] Le composant `ParentDashboard` est créé.
- [ ] Le composant `StudentSpace` (Espace Élève) est créé.
- [ ] Le routage post-connexion dirige correctement le rôle `'parent'` vers `ParentDashboard` et `'eleve'` vers `StudentSpace`.
- [ ] Le `ParentDashboard` charge et affiche les données des enfants rattachés (fratrie via `childrenRefs`).
- [ ] Les widgets du `ParentDashboard` (notes, emploi du temps, feed, messagerie) fonctionnent en filtrant sur l'enfant sélectionné.
- [ ] L'`StudentSpace` affiche les informations personnelles de l'élève (devoirs, accès rapides).
