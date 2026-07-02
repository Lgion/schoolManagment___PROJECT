# Spécification : Emploi du Temps Personnel des Professeurs

L'application doit fournir à chaque membre de l'équipe pédagogique (professeurs) un emploi du temps centralisé qui reflète l'ensemble de leurs obligations au sein de l'école.

## 1. Concept de l'Emploi du Temps "Agrégé"

Contrairement à un emploi du temps de classe qui est créé de toutes pièces, l'emploi du temps d'un professeur n'est pas "dessiné" manuellement. Il est **généré dynamiquement** par agrégation de plusieurs sources de données.

Le système consultera la base de données pour compiler :
1.  **Les cours assignés** : Toutes les occurrences dans les différents `Schedules` de classes où le `subjectId` (la matière) est relié à ce professeur (ex: Le prof d'Anglais verra ses heures en CP1 le lundi et en CM2 le mardi).
2.  **Les événements locaux** : Les événements des classes dont il est le professeur principal ou dans lesquelles il intervient (ex: Sortie au musée).
3.  **Les événements globaux** : Les réunions pédagogiques ou événements de l'école (ex: Conseil de classe, Réunion parents-profs).
4.  **Les rendez-vous** : Les entretiens programmés avec des parents d'élèves (qui fait l'objet d'une fonctionnalité dans la section "Communication").

## 2. API et Backend

Création d'un endpoint spécifique : `GET /api/schedules/teacher/:profId`

**Logique de récupération :**
*   L'API interroge les `Schedules` actifs de toutes les classes.
*   Elle filtre les créneaux pour ne garder que ceux où `slot.teacherId === profId` (soit défini directement sur le créneau, soit déduit du `subjectId`).
*   Elle récupère les événements (`Events`) liés au professeur.
*   Elle formate le tout dans une structure unifiée (ex: liste d'événements avec heure de début, fin, titre, et lieu/classe).

## 3. Interface Utilisateur (UI)

*   **Emplacement** : Sur le tableau de bord (Dashboard) du professeur, un widget "Mon Planning du Jour" affichera le programme immédiat.
*   **Vue Complète** : Une page dédiée `/teacher/schedule` affichera la grille complète de la semaine.
*   **Composant Réutilisable** : Nous utiliserons le même composant de rendu final que celui imaginé dans l'analyse de l'emploi du temps (un calendrier absolu dynamique) pour afficher ces données. Le code visuel sera donc partagé avec `ScheduleViewer`, seule la source de données changera.

## 4. Bénéfices
*   **Évitement des conflits** : L'administration saura instantanément si un professeur est "double-booké" (placé dans deux classes à la même heure).
*   **Responsabilisation** : Le professeur sait exactement dans quelle salle ou classe il est attendu à la minute près.
