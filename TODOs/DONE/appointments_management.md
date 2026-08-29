# Spécification Technique : Gestion des Rendez-vous et Convocations Parent-Professeur

## 1. Objectifs de la Fonctionnalité

Ce module unifie deux besoins fondamentaux de communication bilatérale au sein de l'école :
1. **Demande de rendez-vous (Parent → Enseignant) :** Permettre à un parent de solliciter une entrevue avec un professeur en proposant une ou plusieurs dates/heures.
2. **Convocation / Sollicitation (Enseignant → Parent) :** Permettre à un enseignant de demander une rencontre avec un parent, que ce soit pour une simple demande de rendez-vous de routine ou une convocation (urgente, disciplinaire, suivi).

**Lignes directrices :**
- L'approche n'est pas basée sur un calendrier de réservation en "clic-rapide" (pas de créneaux pré-définis libres comme Doctolib), mais sur un **système de proposition/acceptation** plus souple.
- Le format de la rencontre (Visioconférence ou Présentiel) est négociable. Le demandeur peut en imposer un, ou proposer les deux au choix.
- L'intitulé (statut) de la rencontre est modifiable à la volée pour s'adapter à la gravité ou au but du rendez-vous.

---

## 2. Modèle de Données (Base de Données)

Pour garder l'historique et les spécificités des rencontres privées, un nouveau modèle `Appointment` (distinct de `Event`) doit être créé dans MongoDB (`app/api/_/models/ai/Appointment.js`).

### Schéma `Appointment`
*   `initiatorId` : String (clerkId de la personne qui initie la demande).
*   `initiatorRole` : String (`'parent'` ou `'prof'`).
*   `recipientId` : String (clerkId du destinataire).
*   `studentId` : ObjectId (Référence à l'élève, indispensable pour contextualiser la rencontre).
*   `title` : String (Titre ou motif court).
*   `statusLabel` : String. Définit la nature de l'entrevue (ex: *"Demande de rdv"*, *"Convocation"*, *"Information urgente"*). L'UI proposera des choix par défaut mais permettra la saisie libre.
*   `meetingStatus` : Enum (`'PENDING'`, `'ACCEPTED'`, `'REJECTED'`, `'CANCELED'`, `'COMPLETED'`). Par défaut `'PENDING'`.
*   `proposedDates` : Array d'objets `{ startDate, endDate }`. Permet à l'initiateur de proposer un ou plusieurs créneaux.
*   `agreedDate` : Objet `{ startDate, endDate }` ou `null`. C'est la date finale validée.
*   `meetingFormatOptions` : Array of Strings (`['PRESENTIAL']`, `['VISIO']`, ou `['PRESENTIAL', 'VISIO']`).
*   `agreedFormat` : String (`'PRESENTIAL'` ou `'VISIO'`) ou `null`. Format final validé.
*   `visioRoomName` : String (Nom de la salle Jitsi généré automatiquement si `'VISIO'` est choisi).
*   `message` : String (Description détaillée ou motif de la demande).
*   `createdAt`, `updatedAt` : Date.

---

## 3. Interface Utilisateur (UI/UX) et Flux

### A. Phase 1 : Initialisation de la demande
1. **Accès :** 
   - Pour un parent : Sur la page de profil du professeur ou dans la section équipe pédagogique de la classe, bouton **"Demander un RDV"**.
   - Pour un prof : Sur la page profil de l'élève ou l'annuaire parent, bouton **"Solliciter un RDV / Convoquer"**.
2. **Le Formulaire (Modal) :**
   - **Type de demande (statusLabel) :** Menu déroulant (Demande, Convocation...) avec champ texte "Autre" pour saisie libre.
   - **Date(s) proposée(s) :** Sélecteur de date/heure (possibilité d'ajouter plusieurs choix `+ Ajouter une alternative`).
   - **Format proposé :** Cases à cocher pour "Présentiel", "Visio" (ou les deux cochés si on laisse le choix).
   - **Motif / Message :** Zone de texte libre.

### B. Phase 2 : Réception et Négociation/Validation
1. Le destinataire reçoit une notification sur son Dashboard (et potentiellement Mail/SMS).
2. En cliquant sur la notification, une carte de rendez-vous en attente s'affiche.
3. **Actions possibles :**
   - Si plusieurs dates/formats étaient proposés, le destinataire DOIT sélectionner un choix avant de cliquer sur **"Accepter"**.
   - Si une seule date/format était proposé, il clique simplement sur **"Accepter"**.
   - Il peut aussi cliquer sur **"Refuser"** (avec possibilité de laisser un message d'annulation).
4. Lors de l'acceptation :
   - `meetingStatus` passe à `'ACCEPTED'`.
   - `agreedDate` et `agreedFormat` sont renseignés.
   - Si `VISIO`, `visioRoomName` est généré.

### C. Phase 3 : Finalisation et Tenue du Rendez-vous
1. **Intégration Emploi du Temps :** Le rendez-vous accepté s'insère dynamiquement dans le composant d'Emploi du temps agrégé de l'enseignant (Spécification *Teacher Schedule*).
2. **Module Visio :** À l'heure prévue, si le format est `VISIO`, un bouton "Rejoindre la visio" apparaît sur la carte du rendez-vous, s'appuyant sur l'infrastructure Jitsi/Cloudinary définie dans la spécification *Visioconférence*.

---

## 4. Système de Notifications
*   **Tableau de bord (In-App) :** Présence d'un badge (ex: cloche) ou section dédiée sur la page d'accueil pour lister les "Demandes en attente" et "Prochains Rendez-vous".
*   **Alerte Externe :** Option d'envoi d'un **SMS** ou **Email** selon les préférences du destinataire pour l'avertir d'une nouvelle demande, confirmation, ou annulation. Utile surtout pour les *"Convocations urgentes"*.

---

## 5. Étapes d'Implémentation Recommandées

1. **Backend / Base de Données :**
   - Créer le modèle MongoDB `Appointment`.
   - Développer les routes API CRUD sous `/api/appointments/`.
     - `POST` pour la création initiale (`PENDING`).
     - `GET` pour récupérer la liste des requêtes envoyées/reçues par l'utilisateur connecté.
     - `PATCH` pour l'acceptation (choix final de la date/format) ou le refus.

2. **Frontend - Formulaire de Création :**
   - Créer le composant React (ex: `AppointmentRequestModal`) gérant l'UX asynchrone (label personnalisé, gestion des dates multiples, formats).

3. **Frontend - Centre de Gestion des RDVs :**
   - Créer un widget ou onglet pour le Dashboard (Parents et Profs) affichant les cartes `AppointmentCard` avec les états (En attente de réponse, Confirmé, Refusé).

4. **Intégration Transversale :**
   - Relier la route de récupération de l'emploi du temps enseignant (`GET /api/schedules/teacher/:profId`) à la collection `Appointment` pour afficher les RDVs confirmés de la journée.
   - Relier le bouton de visio au module global d'appels vidéo.
