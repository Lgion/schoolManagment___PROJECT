stepsCompleted: [1, 2, 3]
inputDocuments: ['_bmad-output/implementation-artifacts/tech-spec-perf-ia-vision-relooking.md', 'docs/LOADING_SYSTEM.md']
date: 2026-02-19
author: ERP_school
---

# Product Brief: schoolManagment___PROJECT

<!-- Content will be appended sequentially through collaborative workflow steps -->

## État Actuel (Phase 1 - Livrée/Stable)

Basé sur l'analyse du code source et des modèles de données :

### 1. Gestion Administrative & CRUD
- **Entités** : Élèves, Enseignants, Classes, Matières.
- **Interface** : `EntityModal` (gestion centralisée), Dashboard Administration.
- **Stockage** : MongoDB avec schémas typés.

### 2. Système de Planning & Calendrier
- **Éditeur** : `ScheduleEditor` avec gestion des créneaux et des pauses (`BreakTimes`).
- **Visualisation** : Modes Viewer et History pour le suivi des emplois du temps.

### 3. Sécurité & Permissions
- **Authentification** : Clerk intégré.
- **RBAC** : Système de rôles (Admin, Prof, Élève) avec `PermissionGate` côté client et début de sécurisation API.

### 4. IA & Vision (Phase 1 en cours)
- **OCR** : Infrastructure pour l'extraction de notes via Gemini.
- **Matching** : Logique de correspondance (Fuzzy matching) pour lier les scans aux élèves.

### 5. Media & Storage
- **Services** : Intégration Cloudinary pour les photos de profil et les documents.
- **Persistence** : Création automatique de dossiers dans `/public/school`.

### 6. Fonctionnalités Pédagogiques
- **Rapports** : Module de rapports enseignants (`TeacherReportModule`).
- **Notes** : Bloc de gestion des notes par élève.
- **Micro-features** : Bannière d'anniversaires dynamique.

---

## Executive Summary

L'évolution de **Martin de Porrès** se concentre sur la transformation d'un socle fonctionnel riche mais techniquement encombré en un ERP scolaire ultra-performant et épuré. Le succès de cette version sera mesuré exclusivement par la fluidité de l'expérience utilisateur pour les administrateurs et les enseignants, obtenue grâce à un élagage chirurgical du code mort et une optimisation radicale des cycles de rendu React.

---

## Core Vision

### Problem Statement

L'application souffre d'un paradoxe : elle offre des fonctionnalités avancées (IA, Planning, Gestion d'entités) mais est freinée par une **dette technique massive** (fichiers orphelins, modèles inutilisés) et des **problèmes de performance critiques** (surchauffe CPU, latence d'interface). 

### Problem Impact

Les administrateurs et les professeurs sont les premiers impactés. La lourdeur de l'application ralentit les tâches quotidiennes de gestion, crée une frustration technique et rend la maintenance du code dangereuse, car l'accumulation de fichiers inutilisés masque la logique réelle du système.

### Why Existing Solutions Fall Short

Les optimisations partielles menées jusqu'ici n'ont pas traité la racine du problème : la pollution structurelle. Tant que les dossiers `models`, `apis` et `components` n'auront pas été purgés du code "fantôme", toute optimisation de performance restera superficielle et l'application continuera de consommer des ressources inutiles.

### Proposed Solution

Une version de Martin de Porrès "Zero-Waste" :
1. **Élagage Audit** : Identification et suppression garantie de 100% des fichiers inutilisés.
2. **Performance First** : Refonte de la réactivité des composants (notamment les headers et dashboards) pour atteindre une utilisation CPU minimale.
3. **Consolidation** : Regroupement cohérent des APIs actives pour simplifier l'architecture.

### Key Differentiators

- **Zéro Code Mort** : Une application où chaque ligne de code a un but identifié et vérifié.
- **Expérience Premium** : Une fluidité "standard industrielle" pour un outil scolaire local.
- **Ancrage sur l'Existant** : Évolution native sans rupture de stack technique (Sass/JS/Next.js) ni migration de répertoire.

---

## Target Users

### Primary Users

#### Moussa (Administrateur Principal)
- **Rôle & Contexte** : Chef d'orchestre de l'école Martin de Porrès. Il gère l'aspect financier et académique global.
- **Motivations** : Avoir une vision "Tout-en-un" sans friction.
- **Problem Experience** : Perd un temps précieux chaque nouvelle année scolaire à migrer manuellement les élèves entre les classes et à vérifier les paiements un par un. La lenteur de l'interface lors des opérations de masse est son plus gros frein.
- **Success Vision** : Une vue "Dashboard" qui lui confirme en un coup d'œil que tout est à jour, et des outils de migration automatique pour la rentrée scolaire.

#### Les Enseignants
- **Rôle & Contexte** : Acteurs de terrain qui saisissent les résultats et les paiements.
- **Motivations** : Réduire le temps passé devant l'écran pour se concentrer sur l'enseignement.
- **Problem Experience** : La saisie manuelle de listes entières de notes ou de paiements est répétitive et source d'erreurs.
- **Success Vision** : L'outil "Photo-to-Web" (Vision IA) qui transforme instantanément une feuille de papier en tableau numérique à valider.

### Secondary Users

#### La Direction (Profil "Sexy Stats")
- **Intérêt** : Ne saisit pas de données mais veut des statistiques propres, visuelles et des fonctionnalités de vie scolaire (ex: bannière d'anniversaires) pour rendre l'outil attractif et "vivant".

---

## User Journey

### 1. La Rentrée Scolaire (Le pic d'activité de Moussa)
- **Action** : Moussa crée les 6 classes du primaire.
- **Action** : Le système propose une migration automatique des élèves (ex: du CP au CE1).
- **Aha! Moment** : Moussa voit 100 élèves passer dans leurs nouvelles classes en 3 clics au lieu d'une journée de saisie.

### 2. La Saisie des Notes/Paiements (Le quotidien des Profs)
- **Action** : Le prof prend une photo de sa liste de composition.
- **Action** : Gemini Vision extrait les données.
- **Aha! Moment** : Le prof clique sur "Valider" et voit son tableau complet prêt en 10 secondes.

### 3. Le Pilotage (La consultation Admin)
- **Action** : L'admin ouvre le Dashboard.
- **Action** : Les graphiques Chart.js montrent l'état des paiements et des moyennes.
- **Success** : L'application répond instantanément, fluide, sans surchauffe.


