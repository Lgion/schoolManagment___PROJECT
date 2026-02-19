---
title: 'Optimisation Performance, IA Vision & Refonte Visuelle Dashboard'
slug: 'perf-ia-vision-relooking'
created: '2026-02-17T20:29:40Z'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['Next.js 15', 'React 19', 'MongoDB (Mongoose)', 'SWR', 'Clerk', 'Chart.js', 'Sharp', 'Google Gemini AI', 'Fuse.js']
files_to_modify: ['stores/adminContext.js', 'app/api/school_ai/media/route.js', 'app/components/ScheduleEditor.jsx', 'app/administration/page.jsx', 'app/Home.jsx', 'stores/ai_adminContext.js', 'app/api/school_ai/**/*.js', 'app/api/lib/authWithFallback.js', 'middleware.js']
code_patterns: ['Server-side Role Enforcement (Middleware + Route level)', 'Async File Persistence', 'Unified API Structure', 'Automated Directory Persistence', 'Input Validation Guards']
test_patterns: []
---

# Tech-Spec: Optimisation Performance, IA Vision & Refonte Visuelle Dashboard

**Created:** 2026-02-17T20:29:40Z

## Overview

### Problem Statement

L'application souffre de ralentissements majeurs et de surchauffe CPU (re-rendus excessifs). La saisie des données est manuelle. Le calendrier est imprécis. S'ajoutent à cela :
1. **Dette Technique API** : Trop d'APIs inutilisées ou redondantes (`/api/classes` vs `/api/school_ai/classes`).
2. **Persistence Physique** : Absence de création automatique de dossiers dédiés dans `/public/school` lors de la création d'entités.
3. **Sécurité** : Le système de permissions est fragmenté et principalement client-side, sans validation de rôle rigoureuse sur les routes d'API.

### Solution

1. **Performance & Cleanup** : Optimisation des Providers et suppression/regroupement des APIs mortes.
2. **IA Gemini Vision** : OCR avec validation humaine.
3. **Calendrier** : Ajustement temporel dynamique.
4. **Permissions Audit** : Sécurisation server-side des routes d'API selon les rôles.
5. **Dossiers Automatiques** : Garantir la création de la structure `/public/school/{type}/{id}`.
6. **Stats Admin** : Dashboard visuel.

### Scope

**In Scope:**
- Optimisation React (useMemo, dissociation des Providers) et nettoyage des logs.
- Refactorisation API : Fusion des doublons vers `/api/school_ai` et suppression du code mort.
- Sécurisation des APIs avec `checkRole` côté serveur.
- Création automatique des répertoires d'entités via Mongoose hooks ou API Utils.
- IA Vision (Gemini) pour notes/frais.
- Calendrier & Dashboard Stats & Refonte UI/UX.

**Out of Scope:**
- Migration de la base de données vers une autre technologie.
- Gestion complexe des ressources humaines (contrats, paies détaillées).

## Context for Development

### Codebase Patterns

- **Performance (Anti-Pattern)** : Les composants `MembersMenu`, `YearsList` et `ClassesList` sont actuellement définis *à l'intérieur* de `AdminContextProvider`, provoquant des remontages (remounts) à chaque re-rendu du provider.
- **Service Pattern** : Utilisation de services pour les tiers (Cloudinary). Le même pattern sera appliqué pour Gemini.
- **Convention d'API** : Les routes utilisent `NextRequest`/`NextResponse` avec une gestion manuelle des erreurs et des logs verbeux.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `stores/adminContext.js` | Gestion des données école (à refactoriser pour perf) |
| `app/api/school_ai/media/route.js` | Hub d'upload actuel (à étendre pour Gemini) |
| `app/components/ScheduleEditor.jsx` | Éditeur de calendrier (heures codées en dur à corriger) |
| `app/administration/page.jsx` | Dashboard admin à enrichir de graphiques |
| `app/api/breaktimes/route.js` | API de gestion des pauses |
| `public/scans/` | Dossier source des documents à analyser |

### Technical Decisions

- **Unification API** : Migrer toutes les fonctionnalités "School Management" sous `/api/school_ai`. Faire un inventaire complet des appels (`grep`) avant suppression.
- **Sécurité Multi-couches** : Wrapper `withAdmin` / `withProf` sur les routes + vérification `auth().protect()` dans `middleware.js`.
- **Persistence Hooks Asynchrones** : Utiliser `fs.promises.mkdir` dans des hooks `post('save')` pour ne pas bloquer l'event loop.
- **Gemini 1.5 Flash (OCR)** : Avec logique de retry (3 tentatives) et validation server-side des données extraites (bornes 0-20 pour les notes).
- **Fuzzy Matching** : Utiliser `Fuse.js` pour la correspondance robuste des noms d'élèves.
- **Optimisation DB** : Création d'index composés sur `niveau`, `annee` et `current_classe` pour les stats.
- **Isolation des composants de contexte** : Sortir les définitions de composants du corps des Providers.

## Implementation Plan

### Tasks

- [ ] **Task 1: Optimisation Critique des Performances**
  - File: `stores/adminContext.js`
  - Action: Sortir les composants `MembersMenu`, `YearsList`, `ClassesList` et `DetailsList` du Provider. Utiliser `useMemo` pour les valeurs du contexte.
  - Notes: C'est l'action #1 pour stopper la surchauffe CPU.

- [ ] **Task 2: Nettoyage de la Console**
  - File: Global (utiliser `grep` pour identifier les `console.log` non essentiels)
  - Action: Supprimer les logs de debug redondants, garder uniquement les logs critiques ou d'initialisation.
  - Notes: Focus sur les boucles de rendu et les contextes.

- [ ] **Task 8: Audit et Sécurisation des Permissions**
  - File: `app/api/lib/authWithFallback.js`, sensitive routes
  - Action: Créer un utilitaire `isAuthorized(request, allowedRoles)` et l'appliquer au début de chaque route DELETE/POST/PUT sensibles.
  - Notes: Aligner les rôles avec ceux déclarés dans `useUserRole.js`.

- [ ] **Task 9: Inventaire et Unification des APIs**
  - File: `app/api/subjects`, `app/api/schedules`, `app/api/classes`
  - Action: Lister TOUS les appels clients. Rediriger vers `/api/school_ai`. Supprimer les anciens fichiers UNIQUEMENT après validation du bon fonctionnement.
  - Notes: Risque de régression élevé sur les vieux composants (ex: `TeacherReportModule`).

- [ ] **Task 10: Création Automatique des Dossiers (Async)**
  - File: `app/api/school_ai/lib/persistence.js`
  - Action: Fonction `ensureEntityFolder` utilisant `fs.promises.mkdir`. Ajouter un try/catch pour éviter de bloquer l'API en cas d'erreur FS.
  - Notes: Utiliser `path.join` pour la compatibilité d'OS.

- [ ] **Task 11: Validation et Robustesse IA (Server-side)**
  - File: `app/api/school_ai/media/route.js`
  - Action: Implémenter un schéma de validation (Zod ou manuel) pour les données Gemini. Interdire toute note hors du range 0-20.
  - Action: Ajouter des index MongoDB sur les champs utilisés par les statistiques admin.

- [ ] **Task 5: Correction de la Logique du Calendrier**
  - File: `app/components/ScheduleEditor.jsx`
  - Action: Rendre les créneaux horaires configurables. Intégrer les `breaktimes` de l'API dynamiquement au lieu des buffers codés en dur.
  - Notes: Vérifier la synchronisation entre l'affichage et les données MongoDB.

- [ ] **Task 6: Dashboard Admin avec Statistiques Visuelles**
  - File: `app/administration/page.jsx`
  - Action: Implémentation de graphiques (Bar, Pie) via `chart.js` pour les effectifs par classe et l'état des paiements.
  - Notes: Utiliser les données déjà présentes en contexte.

- [ ] **Task 7: Refonte Visuelle Premium (Etape Finale)**
  - Files: `app/Home.jsx`, `app/administration/page.jsx`, CSS associés.
  - Action: Appliquer une palette de couleurs moderne, des gradients subtils, et améliorer l'espacement.
  - Notes: Utiliser des micro-animations CSS.

### Acceptance Criteria

- [ ] **AC 1 (Perf)**: Given l'application ouverte, when on navigue dans le menu administration, then l'utilisation CPU reste stable (< 10% en idle) et aucun remount inutile n'est détecté dans React DevTools.
- [ ] **AC 2 (IA)**: Given une photo de bulletin de notes, when uploadée avec l'option IA, then un formulaire pré-rempli s'affiche avec les notes et matières correctement identifiées.
- [ ] **AC 3 (Calendrier)**: Given une pause de 15 min ajoutée, when consultée dans le calendrier, then elle apparaît précisément à l'heure définie sans décalage visuel.
- [ ] **AC 4 (Stats)**: Given la page administration, when chargée, then des graphiques interactifs affichent les données réelles de l'école.

## Additional Context

### Dependencies

- `@clerk/nextjs`: Authentification.
- `mongoose`: ORM MongoDB.
- `chart.js` & `react-chartjs-2`: Visualisations.
- `swr`: Fetching de données.
- `google-generative-ai`: API Gemini Vision.
- `sharp`: Traitement d'images.
- `fuse.js`: Fuzzy matching pour les noms d'élèves.

### Testing Strategy

- **Performance**: Monitoring via l'onglet "Performance" de Chrome (CPU/Heap).
- **IA**: Test avec 5 types de documents différents (bulletins, reçus).
- **Validation Humaine**: Vérifier que les données modifiées dans la modale sont bien celles enregistrées en base.

### Notes

- **Sécurité**: La clé API Gemini doit être stockée en variable d'environnement (`GEMINI_API_KEY`).
- **Confirmation**: L'utilisateur a spécifié que la validation humaine est **obligatoire** avant toute injection de données issues de l'IA.
- **Dette Technique**: Le nettoyage des `console.log` doit être fait avec précaution pour ne pas supprimer les logs d'erreurs utiles.
