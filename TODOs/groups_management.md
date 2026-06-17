# Spécification : Gestion des Groupes

## 1. Concept et Cas d'usage
Les classes sont des groupes "fixes" et officiels. Cependant, la vie scolaire nécessite de créer des sous-groupes ou des groupes transversaux, temporaires ou permanents.
Exemples :
*   **Groupe de niveau :** "Soutien Mathématiques" (Professeur + quelques élèves de plusieurs classes).
*   **Événementiel :** "Voyage au ski" (Profs organisateurs + Parents accompagnateurs + Élèves concernés).
*   **Périscolaire :** "Club Théâtre" (Mixte élèves/profs).
*   **Administratif :** "Équipe pédagogique CP" (Uniquement des professeurs).

## 2. Modèle de Données (`Group` collection)
*   `id` : Identifiant unique.
*   `name` : Nom du groupe (ex: "Voyage au Ski").
*   `description` : Objet du groupe.
*   `creatorId` : Utilisateur ayant créé le groupe (souvent un professeur ou admin).
*   `members` : Tableau d'objets contenant :
    *   `userId` : Référence à l'utilisateur.
    *   `role` : `ADMIN` (peut ajouter/exclure), ou `MEMBER`.
    *   `userType` : `TEACHER`, `PARENT`, ou `STUDENT`.
*   `isPrivate` : `true` (sur invitation uniquement), `false` (rejoignable via un lien ou code).
*   `features` : Options activées pour ce groupe (ex: `{ chat: true, wall: true, fileSharing: true }`).

## 3. Fonctionnalités et Logique Backend
*   **Mur d'actualités (Feed) :** Comme pour une classe, un groupe possède un mur où les membres autorisés peuvent poster des annonces, des photos (qui pourront alimenter le Livre de Classe), ou des sondages.
*   **Messagerie Instantanée (Chat) :** Un canal de discussion dédié aux membres du groupe.
*   **Gestion des permissions :** Le créateur décide de qui peut publier. Par exemple, pour un groupe "Information École", seuls les profs publient et les parents lisent. Pour un "Club Théâtre", tout le monde peut discuter.
*   **Génération de lien/code d'invitation :** Pour faciliter l'ajout, le prof peut générer un code (ex: "SKI2024") que les élèves/parents entrent dans leur espace pour rejoindre le groupe.

## 4. Interface Utilisateur (Frontend)
*   **Menu "Mes Groupes" :** Dans la barre latérale ou sur la page d'accueil, l'utilisateur voit la liste des groupes dont il fait partie.
*   **Création :** Un bouton `[ + Nouveau Groupe ]` ouvre une modale en 3 étapes :
    1. Nom et description.
    2. Sélection des membres (avec une barre de recherche intelligente permettant de filtrer par classe, ou par rôle "Tous les parents de la 6ème B").
    3. Configuration des droits (Qui peut parler ? Qui peut inviter ?).
*   **Vue du groupe :** Similaire à la page d'une classe mais allégée (pas de bulletins ni de bons points). Juste le Mur, le Chat, et les Fichiers/Médias.
