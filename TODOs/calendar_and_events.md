# Spécification : Calendrier et Événements

Cette spécification définit le fonctionnement du nouveau système d'événements de l'école, et la façon dont ils s'intègrent dynamiquement dans l'emploi du temps.

## 1. Concept des Deux Niveaux d'Événements

Le système distingue deux portées (scopes) d'événements :

*   **A. Événements d'École (Global)** :
    *   **Créateurs** : Uniquement les Administrateurs.
    *   **Visibilité** : Tout le monde (Parents, Élèves, Profs, Visiteurs).
    *   **Exemples** : Fête de l'école, Réunion Parents-Profs générale, Jours fériés, Ponts, Kermesse.
    *   **Emplacement UI** : Un widget \"Agenda de l'École\" sur la page d'accueil principale, ainsi qu'une vue Calendrier complète.

*   **B. Événements de Classe (Local)** :
    *   **Créateurs** : Professeur de la classe, Administrateur.
    *   **Visibilité** : Uniquement les membres liés à cette classe (Élèves de la classe, leurs Parents, l'Équipe pédagogique).
    *   **Exemples** : Sortie scolaire au musée, Séance de piscine, Évaluation importante, Goûter d'anniversaire.
    *   **Emplacement UI** : Un widget \"Événements à venir\" sur la page de la classe.

## 2. Intégration Dynamique à l'Emploi du Temps

L'innovation principale réside dans le fait que **le calendrier et l'emploi du temps ne font qu'un**. 

Au lieu d'avoir un emploi du temps fixe qui ne reflète pas la réalité d'une semaine perturbée par une sortie, le système fusionnera les données à l'affichage :

1.  Le composant `ScheduleViewer` charge d'abord l'emploi du temps \"de base\" (la routine hebdomadaire) pour la semaine affichée.
2.  Il récupère ensuite les événements de la classe (et de l'école) qui tombent sur cette même semaine.
3.  **Remplacement Visuel** : Si un événement \"Sortie Musée\" est prévu un mardi de 14h à 16h, le rendu UI remplacera (ou superposera) les blocs de cours habituels de cette plage horaire par un grand bloc événementiel spécifique (couleur distincte, icône spéciale).

## 3. Modèle de Données (Base de Données)

Création d'une nouvelle collection `Event` :

*   `id` : Identifiant unique.
*   `title` : Titre de l'événement (ex: \"Sortie Piscine\").
*   `description` : Informations détaillées, affaires à prévoir, etc.
*   `startDate` : Date et heure de début.
*   `endDate` : Date et heure de fin.
*   `isGlobal` : Booléen (`true` si c'est un événement de l'école, `false` si spécifique à une classe).
*   `classId` : (Optionnel) Référence vers la classe, requis si `isGlobal` est `false`.
*   `location` : (Optionnel) Lieu de l'événement.
*   `type` : Type d'événement (ex: `\"SORTIE\"`, `\"EVALUATION\"`, `\"REUNION\"`, `\"FERMETURE\"`). Utile pour attribuer des couleurs ou des icônes dans l'UI.
*   `createdBy` : Utilisateur ayant créé l'événement.

## 4. Interface Utilisateur (UI)

*   **Vue "Calendrier Global" (Mensuel/Hebdo)** : Une page dédiée accessible via le menu principal (ex: `/calendar`) affichant un calendrier interactif (type FullCalendar) avec tous les événements visibles pour l'utilisateur connecté.
*   **Création d'Événement** : 
    *   Un bouton `+ Nouvel Événement` sur la page du calendrier.
    *   Un bouton `+ Planifier un événement` directement dans l'onglet Emploi du Temps / Agenda de la page d'une classe.
*   **Notification** : Lors de la création d'un événement, une case à cocher permettra de notifier automatiquement les parents (via le système de notification/messagerie).
