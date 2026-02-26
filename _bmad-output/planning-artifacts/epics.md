---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics']
inputDocuments: ['_bmad-output/planning-artifacts/prd.md', '_bmad-output/planning-artifacts/architecture.md', '_bmad-output/planning-artifacts/ux-design-specification.md']
---

# schoolManagment___PROJECT - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for schoolManagment___PROJECT, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Le Système doit authentifier les utilisateurs et restreindre l'accès selon des rôles stricts (Admin, Enseignant).
FR2: L'Admin peut créer, modifier, et désactiver des profils d'enseignants, d'élèves et de parents.
FR3: L'Enseignant peut uniquement consulter les listes d'élèves des classes qui lui sont assignées.
FR4: L'Enseignant peut capturer ou télécharger une photo d'une feuille de notes via l'interface.
FR5: Le Système extrait les notes de l'image et les pré-remplit dans une grille numérique.
FR6: L'Enseignant peut afficher simultanément la photo originale et la grille extraite pour comparaison (Split-Screen).
FR7: Le Système signale visuellement (Soft Warning) les notes extraites avec un faible indice de confiance.
FR8: L'Enseignant peut modifier manuellement le contenu de n'importe quelle cellule pré-remplie.
FR9: L'Enseignant peut ignorer une ligne non reconnue ou initier la création d'un élève manquant directement depuis l'interface d'import.
FR10: Le Système permet d'interrompre l'import par IA et de basculer vers une saisie 100% manuelle à tout moment.
FR11: L'Enseignant peut saisir manuellement des notes et des absences dans une grille de classe standard (DataTable).
FR12: L'Enseignant peut valider et publier définitivement un ensemble de notes.
FR13: L'Admin peut consulter l'historique inaltérable de conservation des notes et scolarités des années précédentes.
FR14: L'Admin peut visualiser des graphiques consolidés sur la situation financière (taux de paiement) et pédagogique globale.
FR15: L'Admin peut filtrer finement ces statistiques et afficher les listes détaillées correspondantes (ex: liste des élèves en retard) sans rechargement de la page.
FR16: L'Admin peut sélectionner de multiples utilisateurs (ex: parents) depuis n'importe quelle liste (DataTable).
FR17: L'Admin peut déclencher une action groupée (ex: "Relance SMS") pour les utilisateurs sélectionnés via une barre d'action contextuelle.
FR18: Le Système envoie les notifications (SMS/Email) via un service tiers et affiche un accusé de réception système (Toast) sans bloquer l'interface.

### NonFunctional Requirements

NFR-PERF-1: Toute interaction dans le Dashboard doit se refléter visuellement en moins de 100 millisecondes (via Optimistic UI).
NFR-PERF-2: Le First Contentful Paint (FCP) doit être inférieur à 1.5 secondes sur une connexion 3G moyenne.
NFR-PERF-3: Le cycle complet de "Saisie Magique" doit être complété en moins de 10 secondes dans 95% des cas.
NFR-SEC-1: Toutes les données personnelles et financières doivent être chiffrées en transit (TLS 1.3) et au repos (AES-256).
NFR-SEC-2: Les photos transmises pour l'OCRISATION ne doivent jamais être stockées de manière permanente sur le serveur après l'extraction.
NFR-SEC-3: Déconnexion automatique après 30 minutes d'inactivité.
NFR-REL-1: L'interface de "Saisie Magique" doit permettre la capture de photos hors-ligne, en mettant en cache localement au moins 10 photos, avec synchronisation automatique au retour réseau.
NFR-REL-2: L'infrastructure SaaS doit garantir un uptime de 99.9% pendant les heures de bureau.

### Additional Requirements

**Technical/Architecture Requirements:**
- Refonte "Zero-Waste" de `adminContext.js` pour supprimer le rendu conditionnel interne pour la Performance.
- Purge "Zero-Waste" du code orphelin (`Ecommerce`, Stores inutilisés).
- Sécurisation des routes API (`checkRole`) pour interdire tout accès direct non autorisé aux APIs.
- Hub API `school_ai` pour consolider et simplifier la maintenance.
- Persistance physique asynchrone pour les medias (`/public/school/{type}/{id}`).
- Validation IA robuste pour valider les données de Gemini Vision avant intégration.
- Optimistic UI (Mutation Client-Side First) et gestion du rollback (Undo).
- Architecture de composants isolés pour Skeletons (pas de spinners bloquants) et composants réutilisables (`<ReviewModal />`, `<MassActionBar />`, `<ReviewCell />`).

**UX Requirements:**
- Direction Visuelle : "Classic Premium ERP" avec Top-Bar, contraste fort Bleu/Orange.
- Minimalisme "Zero-Waste" : Sans surchargement technique et visuel.
- Design Tokens System basé sur Sass (pas de Material UI/Ant Design lourds).
- Interface "Touch-first" pour la prise de photo sur mobile.
- Séparation visuelle de l'état : Focus tabulaire au clavier hautement visible.
- Actions contextuelles seulement visibles sur sélection (`MassActionBar`).

### FR Coverage Map

FR1: Epic 1 - Le Système doit authentifier les utilisateurs et restreindre l'accès selon des rôles stricts
FR2: Epic 1 - L'Admin peut créer, modifier, et désactiver des profils
FR3: Epic 1 - L'Enseignant peut uniquement consulter les listes d'élèves de ses classes
FR4: Epic 2 - Capturer ou télécharger une photo d'une feuille de notes
FR5: Epic 2 - Extraire les notes de l'image et pré-remplir la grille
FR6: Epic 2 - Afficher simultanément photo originale et grille extraite (Split-Screen)
FR7: Epic 2 - Signaler visuellement (Soft Warning) les notes extraites incertaines
FR8: Epic 2 - Modifier manuellement le contenu d'une cellule pré-remplie
FR9: Epic 2 - Ignorer une ligne ou initier la création d'un élève manquant
FR10: Epic 2 - Interrompre l'import par IA et basculer vers manuel
FR11: Epic 1 - Saisir manuellement notes et absences dans la grille
FR12: Epic 1 - Valider et publier définitivement un ensemble de notes
FR13: Epic 1 - Consulter l'historique inaltérable de conservation des notes et scolarités
FR14: Epic 3 - Visualiser des graphiques consolidés sur la situation financière/pédagogique
FR15: Epic 3 - Filtrer les statistiques et afficher les listes détaillées sans rechargement
FR16: Epic 3 - Sélectionner de multiples utilisateurs depuis une DataTable
FR17: Epic 3 - Déclencher une action groupée via une barre d'action contextuelle
FR18: Epic 3 - Envoyer notifications (SMS/Email) via service tiers et afficher Toast

## Epic List

### Epic 1: Portail Administratif Sécurisé & Fondations (Le Socle)
Mettre en place un accès sécurisé hautement performant (Zero-Waste refactor), gérer le CRUD vital (élèves, enseignants, classes) et l'authentification (RBAC) pour s'assurer que seuls les bons utilisateurs accèdent aux bonnes fonctionnalités.
**FRs couverts :** FR1, FR2, FR3, FR11, FR12, FR13

### Epic 2: Saisie Magique des Notes (Le Différenciateur Enseignant)
Révolutionner la saisie en introduisant la fonctionnalité Photo-to-Web propulsée par l'API Gemini Vision. Couvrir l'ensemble du flux asynchrone sans spinners bloquants, avec gestion des incertitudes IA (Soft Warnings) et modifications manuelles.
**FRs couverts :** FR4, FR5, FR6, FR7, FR8, FR9, FR10

### Epic 3: Dashboard "Sexy Stats" et Communication de Masse (Pouvoir de Direction)
Assurer le suivi et la réactivité en masse aux parents/élèves en retard (financier, pédagogique) grâce à un "MassActionBar" et un design "Notion-like" Dashboard qui supporte l'Optimistic UI.
**FRs couverts :** FR14, FR15, FR16, FR17, FR18

<!-- Repeat for each epic in epics_list (N = 1, 2, 3...) -->

## Epic 1: Portail Administratif Sécurisé & Fondations (Le Socle)

Mettre en place un accès sécurisé hautement performant (Zero-Waste refactor), gérer le CRUD vital (élèves, enseignants, classes) et l'authentification (RBAC) pour s'assurer que seuls les bons utilisateurs accèdent aux bonnes fonctionnalités.

### Story 1.1: Authentification et Contrôle d'Accès Sécurisé (RBAC)

As an Admin,
I want le système pour authentifier les utilisateurs et restreindre l'accès avec des vérifications côté serveur (checkRole),
So that seuls les utilisateurs autorisés puissent accéder aux données sensibles.

**Acceptance Criteria:**

**Given** un utilisateur non authentifié ou inactif depuis 30 minutes
**When** il tente d'accéder à l'application
**Then** il est redirigé vers la page de connexion
**And** aucun accès aux données n'est compromis

**Given** un Enseignant authentifié
**When** il tente d'accéder à l'URL du Dashboard Admin ou à une route API restreinte
**Then** l'accès est refusé et une erreur 403 est retournée

### Story 1.2: Gestion Complète des Utilisateurs (CRUD)

As an Admin,
I want créer, modifier et désactiver les profils (enseignants, élèves, parents, classes) via une interface "Render-Storm free",
So that je puisse gérer et maintenir à jour l'annuaire de l'école sans latence.

**Acceptance Criteria:**

**Given** que l'Admin est sur la vue de gestion des utilisateurs
**When** il modifie ou ajoute un utilisateur
**Then** l'interface se met à jour instantanément (Optimistic UI)
**And** les données sont persistées en base

**Given** l'ancien code encombré
**When** l'Admin navigue dans les listes
**Then** l'utilisation CPU reste faible (<10%) avec la refonte propre du adminContext.js

### Story 1.3: Visualisation Isolée des Classes

As a Teacher,
I want visualiser uniquement les listes d'élèves des classes qui me sont assignées,
So that je puisse me concentrer sur mon périmètre éducatif sans voir les autres classes.

**Acceptance Criteria:**

**Given** un Enseignant connecté
**When** il accède à ses classes
**Then** il ne voit que les élèves qui lui sont liés dans le système
**And** toute donnée financière est masquée

### Story 1.4: Saisie Manuelle des Notes et Absences

As a Teacher,
I want pouvoir saisir manuellement des notes et des absences dans une grille de classe standard (DataTable) et les publier définitivement,
So that je puisse gérer l'évaluation de ma classe de manière traditionnelle avant même d'utiliser l'IA.

**Acceptance Criteria:**

**Given** la DataTable de la classe
**When** l'enseignant édite une note manuellement
**Then** l'indicateur de focus est clairement visible (Accessibilité UX) et se sauvegarde

**Given** une grille de notes remplie
**When** l'enseignant clique sur "Publier"
**Then** les notes sont verrouillées et enregistrées définitivement sans rechargement de la page

### Story 1.5: Consultation de l'Historique Inaltérable

As an Admin,
I want pouvoir consulter l'historique de conservation des notes et scolarités des années précédentes,
So that je puisse répondre aux audits académiques ou besoins de ré-édition de bulletins.

**Acceptance Criteria:**

**Given** qu'une année scolaire précédente est archivée
**When** l'Admin recherche le profil d'un ancien élève
**Then** il peut voir son historique complet en mode lecture seule

## Epic 2: Saisie Magique des Notes (Le Différenciateur Enseignant)

Révolutionner la saisie en introduisant la fonctionnalité Photo-to-Web propulsée par l'API Gemini Vision. Couvrir l'ensemble du flux asynchrone sans spinners bloquants, avec gestion des incertitudes IA (Soft Warnings) et modifications manuelles.

### Story 2.1: Prototype d'Import d'Image et Skeletons

As a Teacher,
I want pouvoir prendre en photo ma liste de notes ou uploader un fichier avec un feedback visuel de chargement non bloquant,
So that je puisse initier la Saisie Magique en toute confiance, même sur mobile.

**Acceptance Criteria:**

**Given** qu'un Enseignant clique sur "Scanner une classe"
**When** il sélectionne une image
**Then** un composant ProcessLoader (Skeleton élégant) s'affiche immédiatement

**Given** une perte de connexion réseau
**When** l'Enseignant prend une photo
**Then** l'image est mise en cache localement et synchronisée automatiquement au retour de la connexion

### Story 2.2: Intégration de l'Intelligence Artificielle (Gemini Vision)

As a System,
I want envoyer l'image capturée à l'API Gemini Vision et structurer la réponse JSON des notes extraites,
So that le travail humain de saisie soit remplacé par la machine en moins de 10 secondes.

**Acceptance Criteria:**

**Given** une image téléchargée
**When** elle est envoyée au backend
**Then** l'API Gemini est appelée et retourne un JSON formaté (avec scores de confiance par élève)

**Given** que l'extraction est réussie
**When** la session se termine
**Then** la photo de la copie (Base64) est définitivement supprimée côté serveur

### Story 2.3: Interface de Validation Split-Screen (ReviewModal)

As a Teacher,
I want afficher simultanément la photo originale (avec zoom) et la grille extraite dans une Modale pleine page,
So that je puisse comparer visuellement le résultat de l'IA avec mon document original sans friction.

**Acceptance Criteria:**

**Given** le retour de Gemini Vision
**When** la modale s'ouvre
**Then** l'écran est divisé proprement (layout "Classic Premium")

**Given** l'Enseignant veut annuler l'import (il s'est trompé de classe)
**When** il clique sur "Basculer en Manuel"
**Then** le processus IA est annulé et il retourne à la DataTable standard

### Story 2.4: Gestion des Incertitudes (Soft Warnings) et Édition de Cellule (ReviewCell)

As a Teacher,
I want voir visuellement les notes dont l'IA doute et pouvoir modifier n'importe quelle case,
So that je puisse corriger les erreurs de l'OCR rapidement grâce à une édition intégrée et non punitive.

**Acceptance Criteria:**

**Given** une note avec un faible score de confiance IA
**When** la grille s'affiche
**Then** la cellule .ReviewCell correspondante s'affiche avec un fond jaune/warning

**Given** une cellule en Soft Warning
**When** l'Enseignant la corrige au clavier
**Then** la surbrillance jaune disparaît immédiatement (Optimistic local state)

### Story 2.5: Élèves Fantômes et Fusion de Lignes

As a Teacher,
I want ignorer une ligne reconnue par erreur ou créer "à la volée" un élève absent de la base, depuis l'écran de révision,
So that je ne sois pas bloqué par une erreur de l'IA et puisse finaliser toute ma liste en une seule fois.

**Acceptance Criteria:**

**Given** une ligne "Fatoumata B." non reconnue dans la base
**When** l'Enseignant clique sur l'action de ligne
**Then** il peut ignorer la ligne ou l'associer à un profil existant

**Given** la grille entièrement révisée
**When** l'Enseignant clique sur "Valider & Publier"
**Then** la modale se ferme élégamment et un Toast de Succès met fin au flux, mettant à jour la classe

## Epic 3: Dashboard "Sexy Stats" et Communication de Masse (Pouvoir de Direction)

Assurer le suivi et la réactivité en masse aux parents/élèves en retard (financier, pédagogique) grâce à un "MassActionBar" et un design "Notion-like" Dashboard qui supporte l'Optimistic UI.

### Story 3.1: Conception du Dashboard "Sexy Stats"

As an Admin,
I want visualiser des graphiques consolidés modernes (type Stripe/Notion) sur la situation financière et pédagogique globale,
So that je puisse piloter l'école d'un seul coup d'œil avec clarté et sérénité.

**Acceptance Criteria:**

**Given** qu'un Admin se connecte
**When** le Dashboard s'affiche
**Then** les widgets statistiques (taux de paiement, absences) sont visibles avec le design system (Navy/Orange) sans bordures lourdes

**Given** des données à charger en base
**When** la page est appelée
**Then** seuls les widgets non prêts affichent un Skeleton Loader (ProcessLoader), laissant le reste interactif

### Story 3.2: Filtrage Instantané et DataTable Admin

As an Admin,
I want cliquer sur un graphique pour filtrer et afficher instantanément la liste détaillée correspondante (ex: élèves en retard),
So that je passe de la vue macro à la micro sans aucun temps de chargement bloquant.

**Acceptance Criteria:**

**Given** le widget "12% de retards de paiement"
**When** l'Admin clique dessus
**Then** la DataTable se met à jour en moins de 100ms pour ne montrer que ces élèves

**Given** la liste filtrée
**When** l'Admin navigue ou trie les colonnes
**Then** la page ne se recharge pas entièrement (Zéro "Render-Storm")

### Story 3.3: Sélection de Masse (Checkboxes)

As an Admin,
I want pouvoir sélectionner de multiples utilisateurs via des cases à cocher depuis n'importe quelle liste,
So that je prépare des actions groupées efficacement.

**Acceptance Criteria:**

**Given** une liste d'élèves
**When** l'Admin clique sur la case "Tout sélectionner"
**Then** toutes les lignes de la page active sont sélectionnées visuellement (Highlight de ligne)

### Story 3.4: Barre d'Action Contextuelle (MassActionBar)

As an Admin,
I want voir apparaître une barre d'action flottante uniquement lorsque je sélectionne des utilisateurs,
So that je puisse agir sur eux (ex: Relance) sans polluer visuellement le reste de mon interface.

**Acceptance Criteria:**

**Given** 0 ligne sélectionnée
**When** on regarde l'écran
**Then** la MassActionBar est invisible ou absente du DOM

**Given** 1 ou plusieurs lignes sélectionnées
**When** l'interface réagit
**Then** la barre glisse doucement depuis le bas de l'écran avec les actions disponibles

### Story 3.5: Communication Asynchrone (Relance SMS/Email)

As an Admin,
I want déclencher un envoi de SMS/Email en masse via la barre d'action et recevoir un accusé de réception non bloquant,
So that je puisse notifier les parents en retard tout en continuant mon travail immédiatement.

**Acceptance Criteria:**

**Given** 14 parents sélectionnés en retard de paiement
**When** l'Admin clique sur "Relance SMS"
**Then** la demande est envoyée en arrière-plan et la MassActionBar se désactive temporairement

**Given** l'action déclenchée
**When** l'API tiers répond
**Then** un petit Toast vert "14 SMS envoyés" apparaît en bas d'écran, sans interrompre la lecture courante de l'Admin
