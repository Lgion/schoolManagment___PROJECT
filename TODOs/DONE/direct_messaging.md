# Spécification Technique : Messagerie Directe (Parent/Prof & Élève/Prof)

## 1. Objectifs de la Fonctionnalité

Mettre en place un système de messagerie privée (1-to-1) respectant la séparation stricte des canaux de communication au sein de l'école (référence : Spécification *Roles and Accounts*) :
- **Canal Pédagogique (Élève ↔ Prof) :** Espace d'échange privé favorisant l'autonomie de l'élève (questions sur les devoirs, etc.). Les parents n'ont pas d'accès direct à ce fil de discussion pour préserver le dialogue élève-enseignant.
- **Canal Administratif et Suivi (Parent ↔ Prof) :** Canal officiel de communication entre la famille et l'équipe pédagogique.

---

## 2. Modèle de Données (Base de Données)

### A. Modèle `Conversation` (`app/api/_/models/ai/Conversation.js`)
Ce modèle représente le "salon" de discussion.
*   `participants`: Array of Strings (clerkIds des deux utilisateurs impliqués).
*   `conversationType`: Enum (`'STUDENT_TEACHER'`, `'PARENT_TEACHER'`). *C'est le champ clé pour assurer la séparation des vues.*
*   `studentRef`: ObjectId (Référence à l'élève, indispensable pour savoir "de quel élève on parle", particulièrement crucial dans une discussion Parent-Prof).
*   `lastMessage`: ObjectId (Référence au dernier message envoyé, utile pour trier la boîte de réception du professeur).
*   `updatedAt`: Date (Pour trier chronologiquement les discussions actives).

### B. Modèle `Message` (`app/api/_/models/ai/Message.js`)
*   `conversationId`: ObjectId.
*   `senderId`: String (clerkId de l'expéditeur).
*   `content`: String (Le texte du message).
*   `readBy`: Array of Strings (clerkIds des utilisateurs ayant lu le message. Utile pour les accusés de réception).
*   `createdAt`: Date.

---

## 3. Sécurité et Règles d'Accès (Backend)

La confidentialité repose sur des contrôles stricts côté API (Middlewares) :
*   **Lecture de la liste des conversations (`GET /api/conversations`) :** 
    - Le serveur ne renvoie que les conversations où le `clerkId` du demandeur figure dans `participants`.
*   **Lecture des messages d'une conversation (`GET /api/conversations/:id/messages`) :** 
    - Le serveur vérifie que l'utilisateur est bien dans les `participants`. Sinon, erreur `403 Forbidden`. Il est donc techniquement impossible pour un parent "hackant" l'URL d'aller lire le `STUDENT_TEACHER` chat de son enfant.

---

## 4. Interface Utilisateur (UI/UX)

### A. Vue Élève (`role: 'eleve'`)
*   **Emplacement :** Sur sa page de profil d'élève (`/eleves/[id]`).
*   **Interface :** Un composant de Chat ("bulle" type Messenger ou panneau latéral) lui permettant d'initier ou poursuivre une discussion avec ses enseignants actuels.

### B. Vue Parent (`role: 'parent'`)
*   **Emplacement :** Une section ou widget pleine page "Messagerie" sur la page d'accueil (Dashboard Parent).
*   **Interface :** Permet de démarrer une discussion avec le professeur principal (ou les professeurs associés) des enfants listés dans son objet `childrenRefs`.

### C. Vue Professeur / Admin (La Boîte de Réception - "Inbox")
*   **Emplacement :** Nouvelle route dédiée `/enseignants/messages`.
*   **Structure de la page :** Interface type *WhatsApp Web*.
    - **Panneau latéral (Sidebar) :** Liste de toutes les conversations actives triées de la plus récente à la plus ancienne. **Un filtre / système d'onglets ("Parents" / "Élèves")** permet au professeur de s'y retrouver facilement.
    - **Panneau principal :** Affichage de la bulle de chat complète pour la conversation sélectionnée, avec le champ de saisie du message.

---

## 5. Étapes d'Implémentation Recommandées

1. **Création des Modèles MongoDB :** `Conversation.js` et `Message.js`.
2. **Développement des endpoints API CRUD :**
   - Lancement d'une conversation (`POST`).
   - Récupération des historiques (`GET`).
   - Mise à jour du statut de lecture (`PATCH`).
3. **Création du composant UI central `ChatWindow` :** Un composant React robuste, gérant le scroll automatique, l'affichage des bulles de messages (droite/gauche selon sender), et le champ d'input.
4. **Intégration distribuée :** Insérer `ChatWindow` sur la page Élève et le Dashboard Parent.
5. **Développement de l'Inbox Professeur :** Créer la vue complexe avec Sidebar et filtrage des types de conversations.
6. **(Optionnel MVP / V2) Temps Réel :** Ajouter un système de rafraîchissement (SWR polling toutes les X secondes) ou des WebSockets (via Pusher ou socket.io) pour une expérience instantanée.
