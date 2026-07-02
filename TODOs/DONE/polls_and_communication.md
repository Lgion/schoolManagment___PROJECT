# Spécification Technique : Système de Sondages et Fil de Communication (Micro-blogging)

## 1. Vision et Approche UX
Tu as totalement raison : **tu ne fais pas fausse route du tout !**
Dans des applications comme Klassly ou Seesaw, le sondage n'est pas un module isolé mais un **type de publication (Post)** au sein d'un fil d'actualité (micro-blogging) de la classe. Cette approche est bien plus naturelle et interactive car :
*   Le fil d'actualité centralise toutes les informations (photos, devoirs, événements, sondages).
*   Les parents/élèves voient le sondage directement dans leur flux quotidien.
*   L'architecture devient très évolutive : nous créons un système de "Post" générique qui peut ensuite accueillir d'autres types de contenus (annonces, signatures de documents, bilans).

---

## 2. Architecture et Modèle de Données (Unification avec le système de Groupes)

*Mise à jour suite à l'implémentation des Groupes :* Plutôt que de créer une collection `Post` isolée, nous allons **faire évoluer le modèle `GroupPost` existant** (qui sera renommé conceptuellement en `FeedPost` ou `Post`) pour qu'il devienne le moteur central de tous les fils d'actualité de l'application (Groupes, Classes, et École entière).

### A. Évolution de la Collection `GroupPost` (vers un modèle unifié `Post`)
Le schéma actuel sera enrichi avec les champs suivants :

*   `groupId` : (Existant) Optionnel. Référence au groupe, si publié dans un groupe.
*   `classId` : (Nouveau) Optionnel. Référence à la classe, si publié dans le fil d'une classe.
*   `isGlobal` : (Nouveau) Boolean. Si `true`, c'est un post global pour le fil d'actualité de toute l'école.
*   `authorId`, `authorName`, `content`, `mediaUrls`, `createdAt` : (Existants).
*   `type` : (Nouveau) String (`"ANNOUNCEMENT"` | `"POLL"`). Par défaut `"ANNOUNCEMENT"`.
*   
*   **Champs spécifiques au type `"POLL"` (Nouveaux) :**
    *   `pollQuestion` : String (La question du sondage, peut remplacer ou compléter `content`).
    *   `pollOptions` : Array d'objets :
        *   `id` : String (Identifiant unique de l'option).
        *   `text` : String (Texte de l'option, ex: "Oui", "Non").
        *   `voters` : Array de Strings (Liste des `userId` ayant voté pour cette option).
    *   `pollSettings` : Object :
        *   `multipleChoices` : Boolean (Permettre de cocher plusieurs réponses).
        *   `isAnonymous` : Boolean (Masquer l'identité des votants).
        *   `expiresAt` : Date (Date limite de vote, optionnel).

---

## 3. Flux de Notification SMS

Pour la fonctionnalité *"possibilité d'envoyer un SMS pour s'assurer que tous soient notifiés"* :
1.  **Création du Sondage :** Lors de la création, le professeur coche une case `"Notifier les parents par SMS"`.
2.  **Traitement Backend :** 
    *   Le serveur enregistre le sondage.
    *   Il récupère la liste des parents des élèves de la classe (via `classId -> Student -> Parent -> phoneNumber`).
    *   Il envoie un SMS groupé ou individuel via un fournisseur tiers (ex: Twilio, Vonage) ou un service d'envoi interne.
3.  **Contenu du SMS :** Un texte court et clair + un lien direct vers la classe :
    > *"Sondage [Nom de l'école] : [Nom du Prof] a publié un nouveau sondage : '[Question]'. Merci de répondre sur l'application : [Lien sécurisé]"*

---

## 4. Interface Utilisateur (UI/UX)

### A. La boîte de création de Post (Teacher / Admin)
Intégrée en haut du fil d'actualité de la classe et sur la page d'accueil de l'école. **Nous réutiliserons le composant de création développé pour le Mur des Groupes**, en l'enrichissant :
*   Zone de texte standard pour les annonces (déjà existante).
*   Ajout d'onglets ou boutons d'actions rapides : `[Annonce simple]` `[Sondage]` `[Photo]`.
*   Si `[Sondage]` est sélectionné :
    *   Champs pour ajouter des options (avec un bouton `+ Ajouter une option`).
    *   Options de configuration (Choix multiples, Anonyme).
    *   **Case à cocher :** "🔴 Envoyer une alerte SMS d'urgence aux parents".

### B. Le Rendu du Sondage dans le Fil (Feed)
*   **Pour le Parent/Élève :**
    *   Si l'utilisateur n'a pas encore voté : il voit des boutons radio/checkboxes pour faire son choix et un bouton "Voter".
    *   Si l'utilisateur a voté (ou si le sondage est expiré) : il voit les résultats sous forme de barres de progression colorées avec le pourcentage et le nombre de votes.
*   **Pour le Professeur (Auteur) :**
    *   Il voit les résultats en temps réel.
    *   Un bouton "Voir les détails" pour voir la liste nominative des votants par option (sauf si configuré comme anonyme).

---

## 5. Étapes d'Implémentation dans la Spécification

Voici le découpage recommandé pour l'exécution :

*   **Étape 1 : Base de données & API**
    *   Créer le schéma `Post` dans MongoDB.
    *   Créer les endpoints API :
        *   `POST /api/classes/:id/posts` (Création de post/sondage).
        *   `POST /api/posts/:postId/vote` (Enregistrement d'un vote).
        *   `DELETE /api/posts/:postId` (Suppression d'un post).
*   **Étape 2 : Service SMS (Twilio/Vonage)**
    *   Configurer un helper de notification SMS.
    *   Mettre en place un mode bac à sable (Mock) dans l'environnement de développement pour simuler l'envoi de SMS sans consommer de crédits réels (log dans la console ou fichier de log local).
*   **Étape 3 : Frontend - Boîte de création (Composer)**
    *   Adapter le composant existant du Mur des Groupes pour inclure le formulaire interactif de création de sondage avec gestion dynamique des options.
*   **Étape 4 : Frontend - Composant d'affichage (Feed & Poll Card)**
    *   Étendre le composant existant de la carte de post pour gérer le type `POLL`.
    *   Créer le basculement automatique entre l'état "Vote" et l'état "Résultats (Barres de progression)".
*   **Étape 5 : Intégration sur les Pages (Classe et Accueil)**
    *   Afficher le composant de fil d'actualité chronologique unifié sur la page d'une classe (`/classes/[id]`).
    *   Afficher ce même composant sur la page d'accueil de l'école (récupérant les posts avec `isGlobal: true` ou agrégés).
