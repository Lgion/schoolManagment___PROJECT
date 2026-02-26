---
stepsCompleted: ['step-01-init', 'step-02-context', 'step-03-starter', 'step-04-decisions']
inputDocuments: ['_bmad-output/planning-artifacts/prd.md', '_bmad-output/planning-artifacts/product-brief-schoolManagment___PROJECT-2026-02-19.md', 'stores/adminContext.js', 'stores/ai_adminContext.js']
workflowType: 'architecture'
---

# Architecture Decisions - schoolManagment___PROJECT

**Author:** ERP_school
**Date:** 2026-02-20

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
- CRUD Centralisé (Élèves, Enseignants, Classes, Matières).
- Édition et visualisation de plannings dynamiques.
- Système d'extraction de données par vision IA (Notes & Scolarité).

**Non-Functional Requirements:**
- **Performance (Critique)** : Utilisation CPU < 10% en idle, fluidité premium par élimination des re-rendus inutiles.
- **Zéro Gâchis** : Élagage chirurgical de 100% des fichiers et APIs inutilisés identifiés lors de l'audit.
- **Sécurité** : Validation server-side systématique (RBAC) sur toutes les routes sensibles.

**Scale & Complexity:**
- Domaine : Full-Stack Web (Next.js 15 / React 19 / MongoDB).
- Niveau de Complexité : Élevé (Refactorisation profonde de l'existant + Intégration IA).
- Composants Architecturaux Estimés : Stores unifiés, Hub API School_AI, Système de Persistance physique automatique.

### Technical Constraints & Dependencies
- Stack : Next.js, Clerk (Auth), Mongoose (DB), Gemini AI (Vision).
- Contrainte de non-migration : Respecter l'arborescence actuelle du projet.

### Audit de Performance & "Zero-Waste"
- **Fichiers Suspects Identifiés** : `Ecommerce.js`, `Donation.js`, `Reservation.js`, `Slider.js`, `Articles.js`, `ecomContext.js`, `formContext.js`.
- **Causes Performance** : Définition de composants internes aux Providers, stockage de JSX dans le state, absence de mémoïsation du contexte.

---

## Starter Template Evaluation

### Primary Technology Domain
- **Full-stack Web Application** utilisant Next.js (App Router).

### Selected Starter: Existing Codebase (Martin de Porrès Phase 1)

**Rationale for Selection:**
Le projet est déjà bien avancé avec une intégration complexe de Clerk, MongoDB et Gemini Vision. L'objectif n'est pas de changer de base, mais de l'assainir radicalement.

**Architectural Decisions Established:**
- **Language**: JavaScript (ES6+).
- **Styling**: Sass modularisé (en cours de consolidation).
- **State Management**: React Context (Besoin de mémoïsation et découplage des composants).
- **API Strategy**: Hub centralisé sous `/api/school_ai`.

---

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- **Refonte de la Performance** : Restructuration de `adminContext.js` pour supprimer le rendu conditionnel interne et le stockage de JSX dans le state.
- **Purge "Zero-Waste"** : Suppression de 100% du code orphelin identifié (Modèles types `Ecommerce`, Stores inutilisés).

**Important Decisions (Shape Architecture):**
- **Sécurisation des Routes API** : Mise en place d'un utilitaire `checkRole` pour toutes les routes API sensibles.
- **Hub Unified API** : Consolidation des requêtes sous `/api/school_ai`.

**Deferred Decisions (Post-MVP):**
- Migration complète du système de design (nous conservons Sass pour le moment, mais envisageons Tailwind pour le futur).

### Data Architecture
- **Nettoyage Chirurgical** : Les anciens modèles en base (`Ecommerce.js`, `Donation.js`, etc.) sont supprimés du scope actif pour optimiser les performances.
- **Persistance Physique** : Création automatique des répertoires pour medias (`/public/school/{type}/{id}`) via des hooks asynchrones non bloquants.

### Authentication & Security
- **Sécurisation Multi-Couche** : L'authentification Clerk est doublée d'une vérification stricte côté serveur avec un utilitaire de validation de rôles pour interdire tout accès direct aux APIs.

### API & Communication Patterns
- **Hub school_ai** : Centralisation des appels API pour simplifier la maintenance et le logging.
- **Validation Robuste (IA)** : Les données retournées par Gemini Vision passent par une couche de validation stricte (ex: notes entre 0 et 20) avant intégration dans le workflow.

### Frontend Architecture
- **Performance State Management** : Extraction des définitions de composants hors des Providers. Utilisation de `useMemo` pour éviter les "Render Storms".
- **Styling** : Maintien de l'écosystème **Sass** existant, tout en restructurant l'arborescence (`app/assets/scss`) pour plus d'efficacité et la constitution du futur Design System.

## UX-Driven Architecture (Technical Impacts)

Suite à la phase de conception UX (UX Design Specification), plusieurs éléments techniques majeurs doivent être intégrés à l'architecture frontend pour supporter l'expérience utilisateur visée (Classic Premium ERP) :

### Optimistic UI & State Management
- **Mutation Client-Side First** : Pour répondre à l'exigence "Zéro Attente", les actions CRUD (suppression, validation) doivent refléter immédiatement le changement sur l'interface avant la résolution de la promesse (Promise) MongoDB.
- **Réversibilité (Undo)** : En cas d'échec de la requête réseau, le store (ex: `adminContext`) doit être capable d'annuler la mutation optimiste (rollback local).

### Asynchronous UI (Skeleton Loaders)
- **Granularité du Chargement** : Interdiction d'utiliser des spinners globaux bloquants. L'architecture des composants doit prévoir des états isolés (`isLoading`) pour afficher des Skeletons ciblés (ex: uniquement sur la liste des élèves, ou sur la modale d'IA) pendant la résolution des requêtes.

### Component Abstraction Strategy
Pour éviter la duplication et maintenir le "Zero-Waste", la création de composants réutilisables (Design System interne) est stricte :
- **`<ReviewModal />`** : Un composant portail (React Portal ou Dialog) gérant son propre cycle de vie asynchrone pour la validation "Photo-to-Web" (Vision Gemini).
- **`<MassActionBar />`** : Un composant conditionnel connecté au contexte global (`selectedItems`) qui ne s'insère dans le DOM que si nécessaire.
- **`<ReviewCell />`** : Un composant de cellule de tableau capable de gérer son propre état de "confiance IA" (Alerte visuelle vs Validation).

Ces principes guideront directement la création des Epics et des Stories d'implémentation.---

## UX-Driven Architecture (Impacts of the UX Design)

Suite à la spécification de l'expérience utilisateur, les décisions architecturales suivantes sont actées pour supporter le design "Classic Premium ERP" :

### 1. State Management for Optimistic UI
L'exigence de "Zéro Attente" (Zero-Wait) et d'interface optimiste implique une modification profonde de la gestion d'état frontend :
- Les mutations de données (ex: validation d'une note, suppression en masse) doivent mettre à jour immédiatement le store local (React Context ou SWR/React Query) *avant* d'attendre la réponse du réseau (Mock API call success).
- Une file d'attente de requêtes en arrière-plan sera nécessaire, avec un mécanisme de *rollback* discret (et un toast d'erreur non bloquant) en cas d'échec serveur inattendu.

### 2. UI Component Architecture (Legos)
Il est impératif d'isoler les composants clés spécifiés dans l'UX pour éviter la duplication et maintenir le "Zero-Waste" :
- **`components/ui/ReviewModal`** : Composant gérant son propre cycle de vie (`useEffect` cleanup) pour éviter les fuites mémoire après l'envoi lourd d'images (Base64) à Gemini Vision.
- **`components/ui/ReviewCell`** : Input granulaire isolant ses propres états locaux (`isDirty`, `isWarning`, `isFocused`) pour minimiser les re-rendus du tableau parent entier lors des corrections au clavier.
- **`components/ui/ProcessLoader`** : Composants *Skeleton* asynchrones qui devront remplacer globalement tout système de Spinner (indicateur de chargement circulaire) au niveau de l'App Router (`loading.jsx` de Next.js).
- **`components/ui/MassActionBar`** : Découplé du rendu de la Data Table ; écoute le Context global (ex: `selectedRowIds`) et s'injecte ou se retire dynamiquement du DOM (fading en CSS).

### 3. Styling Tokenization (Sass)
Pour implémenter la direction visuelle choisie sans librairie tierce, les fichiers Sass existants seront refactorisés selon une approche basée sur les variables de thème (Design Tokens) :
- `_colors.scss` : Définition stricte des variables (`$primary-navy`, `$accent-orange`, `$bg-soft-gray`, etc).
- `_typography.scss` : Importation d'une police adaptée aux données denses (ex: "Inter") et établissement des échelles (`h1`, `body`, `micro-copy`).
- Interdiction stricte d'utiliser des couleurs codées en dur (hardcoded hex) dans les fichiers `.jsx`. Toutes les couleurs doivent provenir des feuilles de style centralisées.

