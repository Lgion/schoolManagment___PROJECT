---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
inputDocuments: ['_bmad-output/planning-artifacts/product-brief-schoolManagment___PROJECT-2026-02-19.md', '_bmad-output/implementation-artifacts/tech-spec-perf-ia-vision-relooking.md', 'docs/LOADING_SYSTEM.md']
workflowType: 'prd'
documentCounts:
  briefCount: 1
  researchCount: 0
  brainstormingCount: 0
  projectDocsCount: 1
classification:
  projectType: 'saas_b2b'
  domain: 'edtech'
  complexity: 'medium'
  projectContext: 'brownfield'
---

# Product Requirements Document - schoolManagment___PROJECT

**Author:** ERP_school
**Date:** 2026-02-19

## Executive Summary

schoolManagment___PROJECT est une plateforme ERP (SaaS B2B) conçue pour révolutionner la gestion scolaire en combinant l'exhaustivité d'un outil de direction institutionnelle avec une expérience utilisateur "Premium" sans friction. Destinée à la fois au personnel administratif (Moussa) et aux enseignants, elle élimine la complexité visuelle et technique traditionnelle des logiciels éducatifs pour offrir un contrôle total, clair et rassurant, centré sur l'efficacité au quotidien (pédagogique et financière).

### What Makes This Special

Le différenciateur clé réside dans "La Saisie Magique" couplée à une interface "Render-Storm Free". En remplaçant la saisie manuelle fastidieuse des notes par une capture photo interprétée par l'IA (Vision Gemini), l'outil transforme l'ordinateur de fardeau en assistant. L'enseignant devient éditeur/réviseur plutôt que créateur de données. Associée à un design "Sexy Stats" minimaliste (inspiré de Stripe/Notion) et à une Optimistic UI éliminant toute attente bloquante (sans spinners intrusifs), la plateforme offre une fluidité d'utilisation rare dans le secteur de l'éducation.

## Project Classification

- **Project Type:** SaaS B2B
- **Domain:** EdTech
- **Complexity:** Medium
- **Project Context:** Brownfield

## Success Criteria

### User Success

- **Enseignants (Zéro Saisie)** : Le temps passé à saisir les notes d'une classe passe de plusieurs dizaines de minutes à moins de 2 minutes par évaluation grâce à la magie "Photo-to-Web". L'ordinateur n'est plus perçu comme une corvée.
- **Direction (Moussa)** : Les actions de masse (relances, gestion des élèves) s'effectuent en moins de 3 clics avec des retours visuels immédiats (grâce à l'Optimistic UI) transmettant un sentiment de calme et de contrôle.

### Business Success

- **Adoption Organique** : 100% des enseignants adoptent spontanément l'outil IA pour remonter leurs notes au lieu du papier/Excel dans les 3 mois.
- **Efficacité Financière** : Réduction drastique du temps passé sur les relances de frais de scolarité, améliorant directement la trésorerie.
- **Diminution du Support** : Quasi aucun ticket de support lié à des lenteurs ("l'appli rame") ou à des erreurs d'interface.

### Technical Success

- **Performance "Render-Storm Free"** : L'utilisation CPU du navigateur reste inférieure à 10% au repos, 0 re-rendu inutile lors des frappes au clavier.
- **Temps de Traitement IA** : L'extraction de notes par Gemini Vision prend moins de 10 secondes bout en bout depuis le clic "Envoyer".
- **Fiabilité API** : Les réponses de l'API (hors IA) se font en moins de 200ms.

### Measurable Outcomes

- Taux d'intervention manuelle post-IA : < 10% des cellules (cases jaunes/doutes de l'IA).
- Temps de chargement ressenti (Time to Interactive) : Instantané grace aux Skeleton loaders.

## User Journeys

### 1. Le Parcours "Saisie Magique" (L'Enseignant - Happy Path)
**Situation :** M. Diallo, professeur de mathématiques, vient de finir de corriger 45 copies à 21h30. Sa liste papier est remplie de notes rouges. D'habitude, il soupire en ouvrant son ordinateur, sachant qu'il va devoir passer 30 minutes à reporter chaque note sans se tromper de ligne.
**Le Tournant :** Il ouvre schoolManagment sur son téléphone. Il clique sur "Scanner une classe". Il prend l'appareil photo, vise sa feuille volante. Un Sceleton loader gris élégant s'affiche ("Gemini lit votre écriture..."). 
**Le Climax :** 8 secondes plus tard, l'écran se divise. À gauche, la photo de sa feuille. À droite, le tableau web pré-rempli. Tout est vert. Seule la note de "Kadiatou" est orange car Gemini a hésité sur un "7" ou un "1".
**Résolution :** M. Diallo tape "7" sur son clavier, l'orange devient vert. Il clique sur "Publier". C'est terminé en 45 secondes. Il ferme son ordinateur avec soulagement.

### 2. Le Parcours "Contrôle de Masse" (Le Directeur - Admin Ops)
**Situation :** Moussa arrive à son bureau lundi matin. Il sait que la fin du mois approche et que les impayés de scolarité risquent de peser sur la paie des professeurs. Il lui faut un état des lieux instantané.
**Le Tournant :** Il ouvre son Dashboard. Pas de chargement de page saccadé. Le graphique "Sexy Stats" financier lui indique immédiatement 12% de retard. Il clique sur la barre rouge du graphique.
**Le Climax :** L'interface le fait glisser (sans recharger) vers une DataTable listant uniquement les 14 parents en retard. Moussa coche la case "Tout sélectionner". Une "MassActionBar" orange glisse depuis le bas de l'écran. Il clique sur "Relance SMS".
**Résolution :** L'écran affiche un petit Toast vert "14 SMS envoyés". La page n'a jamais rechargé, il garde son calme et son sentiment de maîtrise absolue.

### 3. Le Parcours "L'Élève Fantôme" (Enseignant - Edge Case / Erreur)
**Situation :** Mme Touré scanne sa liste de notes. Mais sur sa liste papier, elle avait rajouté au stylo "Fatoumata B.", une nouvelle élève qui n'est pas encore dans la base de données de cette classe.
**Le Tournant :** Gemini analyse la page. Au lieu de crasher avec une "Erreur 500" punitive, la Modale Split-Screen s'ouvre calmement.
**Le Climax :** La ligne de Fatoumata B. est surlignée en rouge doux avec la mention "Élève introuvable dans cette classe". L'interface lui propose deux boutons clairs : "Ignorer cette ligne" ou "Créer l'élève à la volée".
**Résolution :** L'interface ne l'a pas bloquée. Elle a pu sauver toutes les autres notes, et gérer l'anomalie en un clic sans perdre son travail.

### Journey Requirements Summary

Ces parcours révèlent des besoins fonctionnels stricts :
- **Intégration d'appareil photo / upload mobile** ("Scanner une classe").
- **Flux IA asynchrone robuste** avec composant de chargement Sceleton non bloquant.
- **Interface Split-Screen Modale** pour l'édition et la validation des données d'IA.
- **Système de sélection de masse et actions groupées** ("MassActionBar", DataTable interactive).
- **Communication externe intégrée** ("Relance SMS" via API appropriée).
- **Gestion des cas d'erreur IA permissive (Soft Warnings)** permettant la correction manuelle ou la création à la volée au lieu d'un blocage système.

## Domain-Specific Requirements

### Compliance & Regulatory
- **Protection des Données (Privacy)** : Confidentialité stricte des données personnelles des élèves (mineurs), des informations familiales et des dossiers disciplinaires/médicaux.
- **Transparence Financière** : Traçabilité absolue des paiements de scolarité (historique inaltérable) pour répondre aux audits comptables de l'établissement.

### Technical Constraints
- **Gestion des Rôles et Permissions (RBAC strict)** : Cloisonnement imperméable des accès. (Ex: Un professeur ne voit que les notes de ses classes, jamais les finances ; la direction a une vue globale).
- **Archivage et Rétention** : Obligation de conserver les historiques de notes et de scolarité sur plusieurs années scolaires pour la ré-édition de bulletins ou les contrôles académiques.

### Integration Requirements
- **Passerelle de Communication (SMS/Email)** : Intégration fiable avec des fournisseurs d'envoi de SMS/Emails pour l'alerte rapide des parents (absences, retards de paiement, convocations).
- **Formats d'Export Académiques** : Génération de bulletins officiels au format PDF, prêts pour l'impression et conformes aux standards académiques locaux.

## Innovation & Novel Patterns

### Detected Innovation Areas

- **"La Saisie Magique" (AI Agent Workflow)** : Remplacement de la saisie manuelle de données tabulaires (les notes) par un flux Photo-to-Web propulsé par un LLM multimodal (Gemini Vision). L'ordinateur n'est plus un outil de saisie mais un outil de révision.
- **"Zero-Wait" EdTech** : Application stricte des concepts d'Optimistic UI et de tolérance aux pannes réseau (Skeleton loaders, mise à jour instantanée des grilles) dans un domaine habitué aux ERP lents et bloquants.

### Market Context & Competitive Landscape

La majorité des logiciels de vie scolaire concurrents (Pronote, École Directe, etc.) imposent aux enseignants des interfaces lourdes où chaque note doit être tapée au clavier. La "Saisie Magique" crée une disruption par la commodité : l'adoption par les professeurs se fera par un gain de temps personnel, et non par contrainte de la direction.

### Validation Approach

- **Mesure du temps de complétion** : Chronométrer un enseignant saisissant 45 notes au clavier vs via la Saisie Magique. Le gain de temps doit être supérieur à 80% pour être considéré comme réussi.
- **Taux de précision (Accuracy rate)** : Mesurer le pourcentage de cellules correctement détectées par Gemini sur un échantillon significatif de copies avec écritures manuscrites difficiles. Tolérance acceptable cible : > 90% (les < 10% restants étant gérés par la modale de révision/Split-Screen).

## Project Scoping & Phased Development

### MVP Strategy & Philosophy
**MVP Approach:** "Experience MVP" & "Problem-Solving MVP".
L'objectif premier n'est pas de refaire 100% des fonctionnalités d'un ERP classique, mais de résoudre la plus grande friction (la saisie des notes) avec la meilleure expérience possible (Render-Storm free), tout en refondant techniquement l'existant.
**Resource Requirements:** Une équipe technique resserrée (Full-stack Next.js, expert UX/UI, intégrateur API IA).

### MVP Feature Set (Phase 1)
**Core User Journeys Supported:**
- L'Enseignant : Importation "Photo-to-Web" (Saisie Magique) et correction via Split-Screen.
- L'Admin (Direction) : Visualisation globale (Dashboard) et action de masse (Sélection et relance SMS).

**Must-Have Capabilities:**
- Base de données robuste et sécurisée (élèves, classes, parents, enseignants).
- Authentification avec RBAC strict (Admin vs Enseignant).
- Application Mobile/PWA ou interface web responsive très performante pour la prise de photo.
- Modale Split-Screen avec intégration de l'API Gemini Vision (et Skeleton loaders).
- Dashboard avec graphiques financiers et DataTable interactive (sélection multiple, MassActionBar).
- Intégration d'une API d'envoi de SMS.

### Post-MVP Features

**Phase 2 (Growth):**
- **App/Portail Parent & Élève** : Consultation en lecture seule des notes et du statut des paiements.
- **Générateur Modulaire d'Emplois du Temps** : Interface drag-and-drop complexe pour la direction.
- **Export PDF Avancé** : Génération en masse des bulletins officiels avec cachet de l'école.

**Phase 3 (Expansion):**
- **Intelligence Prédictive** : Alertes IA sur le risque de décrochage scolaire ou d'impayés critiques.
- **Multi-Tenant Actif** : Ouverture de la plateforme SaaS à d'autres établissements scolaires de manière isolée et sécurisée.

### Comprehensive Risk Mitigation Strategy
- **Technical Risks (Fiabilité IA & Réseau) :** Validation humaine obligatoire via Split-Screen ("Human-in-the-Loop"). Tolérance offline avec mise en cache locale des photos. Fallback vers une saisie manuelle via DataTable classique si l'API Gemini est hors service.
- **Market Risks (Adoption Professeurs) :** Co-construction et tests utilisateurs (bêta) avec 2 ou 3 enseignants relais. L'adoption doit être organique grâce à l'évidence du gain de temps (mesuré >80%), sans jamais forcer l'usage par la direction.
- **Resource & Development Risks :** Refonte "Zero-Waste" de l'existant (Brownfield) en éliminant le code mort. Utilisation de composants UI éprouvés (Radix/Shadcn) sur-mesurisés pour le thème "Classic Premium" afin de sécuriser la vélocité.
- **Compliance & Privacy Risks :** Chiffrement systématique, déconnexion automatique sur inactivité, et suppression immédiate des photos après extraction (aucun stockage cloud persistant des copies élèves).

## SaaS B2B Specific Requirements

### Project-Type Overview
schoolManagment___PROJECT est une plateforme SaaS B2B d'EdTech. Bien qu'initialement conçue pour un seul établissement (Martin de Porrès), la structure technique doit garantir une sécurité absolue des accès et anticiper une éventuelle évolution.

### Technical Architecture Considerations

**Modèle Multi-Écoles (Tenant Model) :**
- **Approche MVP** : Déploiement pour un seul établissement (Single-tenant logiciel, ou base de données isolée). 
- **Évolutivité** : Le schéma de base de données inclura conceptuellement la notion d'établissement (`schoolId`) pour ne pas bloquer une évolution vers une plateforme multi-écoles (SaaS complet) dans le futur.

**Matrice des Permissions (RBAC Matrix) :**
La plateforme repose sur un contrôle d'accès basé sur les rôles (Role-Based Access Control) strict :
- **Admin (Ex: Moussa / Direction)** : Accès complet (Lecture/Écriture/Suppression) à tous les modules : Finances, RH, Inscriptions, Notes, Paramétrages système.
- **Enseignant** : Accès limité. Lecture seule sur les listes de ses propres classes. Écriture autorisée uniquement pour la saisie des notes (via IA ou manuel) et des absences de ses élèves. Aucun accès aux données financières.
- *(Futur)* **Parent/Élève** : Accès en lecture seule au profil individuel (bulletin de notes, état des paiements de scolarité).

**Liste des Intégrations Externes (Integration List) :**
- **API Google Gemini (Vision)** : Pour la fonctionnalité centrale "Saisie Magique" (OCR et analyse d'écriture manuscrite).
- **Service SMS/Email (ex: Twilio, SendGrid, ou passerelle SMS locale)** : Indispensable pour l'envoi des relances de paiement en masse.

### Implementation Considerations
- **Sécurité API** : Les Server Actions Next.js (backend) valideront systématiquement la session de l'utilisateur ET ses permissions (rôle) avant toute interaction avec la base de données.
- **Gestion d'État Front-end** : Utilisation d'un store global (ex: Zustand) pour le Dashboard et la Modale Split-Screen afin d'assurer l'Optimistic UI sans requêtes réseau redondantes (Render-Storm free).

## Functional Requirements

### 1. Gestion des Accès et Utilisateurs
- **FR1:** Le Système doit authentifier les utilisateurs et restreindre l'accès selon des rôles stricts (Admin, Enseignant).
- **FR2:** L'Admin peut créer, modifier, et désactiver des profils d'enseignants, d'élèves et de parents.
- **FR3:** L'Enseignant peut uniquement consulter les listes d'élèves des classes qui lui sont assignées.

### 2. Saisie Magique (Importation IA Photo-to-Web)
- **FR4:** L'Enseignant peut capturer ou télécharger une photo d'une feuille de notes via l'interface.
- **FR5:** Le Système extrait les notes de l'image et les pré-remplit dans une grille numérique.
- **FR6:** L'Enseignant peut afficher simultanément la photo originale et la grille extraite pour comparaison (Split-Screen).
- **FR7:** Le Système signale visuellement (Soft Warning) les notes extraites avec un faible indice de confiance.
- **FR8:** L'Enseignant peut modifier manuellement le contenu de n'importe quelle cellule pré-remplie.
- **FR9:** L'Enseignant peut ignorer une ligne non reconnue ou initier la création d'un élève manquant directement depuis l'interface d'import.
- **FR10:** Le Système permet d'interrompre l'import par IA et de basculer vers une saisie 100% manuelle à tout moment.

### 3. Gestion Pédagogique (Notes et Absences)
- **FR11:** L'Enseignant peut saisir manuellement des notes et des absences dans une grille de classe standard (DataTable).
- **FR12:** L'Enseignant peut valider et publier définitivement un ensemble de notes.
- **FR13:** L'Admin peut consulter l'historique inaltérable de conservation des notes et scolarités des années précédentes.

### 4. Suivi Administratif et Financier (Dashboard)
- **FR14:** L'Admin peut visualiser des graphiques consolidés sur la situation financière (taux de paiement) et pédagogique globale.
- **FR15:** L'Admin peut filtrer finement ces statistiques et afficher les listes détaillées correspondantes (ex: liste des élèves en retard) sans rechargement de la page.

### 5. Actions de Masse et Communication
- **FR16:** L'Admin peut sélectionner de multiples utilisateurs (ex: parents) depuis n'importe quelle liste (DataTable).
- **FR17:** L'Admin peut déclencher une action groupée (ex: "Relance SMS") pour les utilisateurs sélectionnés via une barre d'action contextuelle.
- **FR18:** Le Système envoie les notifications (SMS/Email) via un service tiers et affiche un accusé de réception système (Toast) sans bloquer l'interface.

## Non-Functional Requirements

### Performance (La promesse "Zero-Wait")
- **NFR-PERF-1 (UI Réactive)** : Toute interaction dans le Dashboard (changement d'onglet, tri de tableau, sélection de masse) doit se refléter visuellement en moins de **100 millisecondes** (via Optimistic UI), sans attendre la réponse du serveur.
- **NFR-PERF-2 (Vitesse de Chargement)** : Le First Contentful Paint (FCP) de l'application web doit être inférieur à **1.5 secondes** sur une connexion 3G moyenne.
- **NFR-PERF-3 (Latence IA)** : Le cycle complet de "Saisie Magique" (de l'envoi de la photo à l'affichage du Split-Screen avec les données pré-remplies) doit être complété en moins de **10 secondes** dans 95% des cas.

### Security & Privacy (Confidentialité EdTech)
- **NFR-SEC-1 (Chiffrement)** : Toutes les données personnelles et financières doivent être chiffrées en transit (TLS 1.3) et au repos (AES-256).
- **NFR-SEC-2 (Données Éphémères IA)** : Les photos des copies d'élèves transmises pour l'OCRISATION ne doivent **jamais** être stockées de manière permanente sur le serveur après l'extraction réussie des notes.
- **NFR-SEC-3 (Session)** : Déconnexion automatique (Time-out) de tout compte utilisateur après 30 minutes d'inactivité pour éviter l'exposition des notes ou finances sur un poste non surveillé.

### Reliability & Offline Tolerance (Fiabilité en milieu scolaire)
- **NFR-REL-1 (Tolérance Réseau)** : L'interface de "Saisie Magique" doit permettre la capture de photos même hors-ligne, en mettant en cache localement au moins **10 photos**, avec synchronisation automatique et silencieuse au retour de la connexion Internet.
- **NFR-REL-2 (Disponibilité)** : L'infrastructure SaaS doit garantir un uptime de **99.9%** pendant les heures de bureau académiques (07h00 - 18h00, heure de l'école).
