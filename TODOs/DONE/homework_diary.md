# Spécification : Cahier de texte numérique

L'objectif est de fournir un outil simple pour que le professeur puisse donner du travail à faire, et que les élèves/parents puissent consulter ce qu'ils ont à faire pour les jours à venir. Comme spécifié, les données seront organisées avec la date du jour comme clé principale d'accès.

## 1. Modèle de données (Base de données)

Pour respecter la logique d'avoir des clés représentant le timestamp du jour (la date de rendu prévue), voici la structure recommandée :

**Collection `HomeworkEntry` (Le travail à faire) :**
*   `id` : Identifiant unique
*   `classId` : Référence vers la classe
*   `teacherId` : Référence vers le professeur
*   `subject` : Matière (ex: "Mathématiques", "Histoire")
*   `dateDue` : **Clé principale (Timestamp)** représentant le jour pour lequel le devoir doit être fait (idéalement minuit UTC du jour concerné pour éviter les bugs de fuseau horaire).
*   `dateAssigned` : Date à laquelle le devoir a été donné.
*   `content` : Texte riche (HTML ou Markdown) décrivant les consignes ("Faire l'exercice 3 page 42").
*   `attachments` : (Optionnel) Tableau d'URLs (lien direct avec la fonctionnalité d'upload de PDF).
*   `estimatedTime` : (Optionnel) Temps estimé (ex: 15min), très apprécié des parents.

**Collection `HomeworkCompletion` (Optionnel mais recommandé pour l'UX) :**
Pour permettre à un élève de "cocher" un devoir une fois terminé.
*   `id` : Identifiant unique
*   `studentId` : Référence vers l'élève
*   `homeworkId` : Référence vers l'`HomeworkEntry`
*   `status` : `"DONE"` | `"TODO"`

## 2. Logique Backend (API)

*   `POST /api/classes/{classId}/homework` : Ajouter un devoir. *Payload : `dateDue`, `subject`, `content`*.
*   `GET /api/classes/{classId}/homework?from={timestamp}&to={timestamp}` : Récupérer les devoirs d'une classe pour une période donnée (ex: la semaine en cours). Le backend groupera idéalement les résultats par `dateDue`.
*   `PUT /api/homework/{id}` : Modifier une consigne (en cas d'erreur).
*   `DELETE /api/homework/{id}` : Supprimer un devoir.
*   `POST /api/students/{id}/homework/{homeworkId}/toggle` : (Optionnel) Marquer un devoir comme "Fait".

## 3. Interface Utilisateur (Frontend / Vues)

**Côté Professeur :**
*   **Vue Agenda / Semaine :** Une interface type calendrier ou planning hebdomadaire.
*   **Saisie rapide :** Le prof clique sur une date future (ex: le jeudi 18) et ouvre une modale de saisie.
*   **Éditeur de texte riche :** Un petit éditeur (gras, italique, puces) pour que les consignes soient claires, avec un bouton pour joindre un PDF s'il le souhaite.

**Côté Élève / Parent :**
*   **Vue "À faire" (To-Do List) :** L'affichage par défaut ne devrait pas être un calendrier classique, mais plutôt une liste verticale groupée par date :
    *   **📅 Pour Lundi 15 Octobre**
        *   🔴 *Maths* : Apprendre la leçon de géométrie. [ ]
    *   **📅 Pour Mardi 16 Octobre**
        *   🔵 *Français* : Lire le chapitre 2. [ ]
*   **Cases à cocher (Checkboxes) :** Permettre de cocher les devoirs terminés, ce qui les grise ou les barre visuellement pour encourager l'élève.
*   **Widget Dashboard :** Sur la page d'accueil de l'élève/parent, un petit encart "Devoirs pour demain" affichant le prochain `HomeworkEntry`.
