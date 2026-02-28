# Retrospective Epic 1: Portail Administratif Sécurisé & Fondations

**Date :** 2026-02-28
**Epic :** Epic 1
**Statut :** TERMINE (5/5 Stories)

## 📊 Métriques de Livraison

- **Stories complétées :** 5 / 5 (100%)
- **Vélocité réelle :** 21 points (T-shirt sizing approx.)
- **Bugs critiques corrigés :** 8 (via Code Reviews)
- **Dette technique résorbée :** Refonte massive de `adminContext.js`, purge de 3 modèles orphelins.

## 🌟 Succès & Victoires

- **Performance "Render-Storm Free"** : La refonte du contexte a éliminé les latences de rendu dans le dashboard.
- **Sécurité RBAC Granulaire** : Mise en place d'un socle solide `utils/roles.js` et d'une isolation stricte Professeur/Admin.
- **Optimistic UI Système** : Adoption systématique du pattern pour une interface "Zéro Attente".
- **Design System Sass** : Transition réussie vers 100% de CSS Custom Properties pour les composants critiques.

## ⚠️ Défis & Apprentissages

- **Le piège des tests fantômes** : Vigilance accrue sur les suggestions d'IA (Jest n'était pas installé mais des tests ont été générés).
- **Validation HTML/DOM** : Attention aux composants React (`PermissionGate`) injectant des `div` interdits dans des structures tabulaires.
- **Rigueur des Patterns API** : Nécessité de stabiliser le pattern `await auth()` pour éviter les accès non sécurisés.

## 🛠️ Dette Technique & Items à Surveiller

- **Complexité des Données Historiques** : Le mélange de formats (Array vs Object) dans les `compositions` demande une approche défensive.
- **Reliquats de Styles Inline** : Bien que la plupart aient été purgés, une vigilance constante est requise pour maintenir la propreté du JSX.

## 🚀 Préparation Epic 2 : Saisie Magique

- **Dépendances** : L'infrastructure de verrouillage (`_locked`) et la structure des compositions sont prêtes à accueillir les données extraites par l'IA.
- **Risque** : La performance de Gemini Vision devra être monitorée de près par rapport à la vélocité cible de 10s par capture.

**Actions Validées pour l'Epic 2 :**
- **Action A (Data Deep Dive)** : Avant chaque dev, vérifier les schémas de données réels en base pour éviter les conflits d'interface.
- **Action B (Sanity Check IA)** : Ajouter une étape systématique lors de l'implémentation pour repousser les hallucinations techniques (ex: références à des librairies absentes du projet).
