# Spécification Technique : Dashboards (Portails) Parent et Élève

## 1. Objectifs de la Fonctionnalité

Plutôt que d'obliger les parents et les élèves à naviguer à travers l'arborescence globale de l'école (vue "Toutes les classes", vue "Tous les enseignants" qui requièrent de lourdes sécurités pour masquer les données des autres élèves), l'objectif est de leur offrir un **Portail ("Hub") sécurisé et centralisé**.

*   **Pour le Parent :** Un espace de suivi administratif et scolaire global pour l'ensemble de sa fratrie.
*   **Pour l'Élève :** Un espace de travail personnel orienté vers l'autonomie, les devoirs et les ressources pédagogiques.

---

## 2. Le Dashboard Parent (`role: 'parent'`)

### A. Philosophie
Le parent se connecte et n'a pas à "chercher" ses enfants dans l'école. Ils lui sont présentés immédiatement. L'interface est conçue pour répondre à la question : *"Que dois-je savoir aujourd'hui concernant la scolarité de mes enfants ?"*

### B. Structure de l'Interface (`/parent-dashboard` ou composant conditionnel sur `/`)

1. **Sélecteur d'Enfant (Header) :**
   - Basé sur le tableau `childrenRefs` du modèle `User` du parent.
   - Si le parent n'a qu'un enfant, la vue est directe. S'il en a plusieurs, un système d'onglets (Tabs) ou de menu déroulant (Select) en haut de page permet de basculer l'affichage d'un enfant à l'autre. *Tous les widgets ci-dessous se mettront à jour en fonction de l'enfant sélectionné.*

2. **Actions Rapides (Quick Actions) :**
   - ✉️ "Contacter le professeur" (Ouvre la Messagerie Directe).
   - 📅 "Prendre un rendez-vous".
   - ⚠️ "Signaler une absence ou un retard".

3. **Fil d'Actualité (Unified Feed - Version Parent) :**
   - Réutilisation du composant `UnifiedFeed`.
   - Filtre appliqué : Ne montre que les publications (articles, sondages) globales de l'école + les annonces spécifiques à la `classeId` de l'enfant sélectionné.

4. **Suivi Scolaire Rapide (Widgets) :**
   - **Emploi du temps :** L'emploi du temps de la journée pour la classe de l'enfant.
   - **Dernières Notes & Évaluations :** Un petit tableau récapitulatif des 3 dernières notes obtenues.
   - **Comportement :** Jauge de bons points / malus actuels.

---

## 3. Le Dashboard Élève (`role: 'eleve'`)

### A. Philosophie
L'interface de l'élève doit être moins administrative, plus motivante et centrée sur ses tâches quotidiennes ("Espace de travail").

### B. Structure de l'Interface (`/student-dashboard` ou composant conditionnel sur `/`)

1. **Accueil et Motivation (Header) :**
   - Message de bienvenue dynamique (ex: *"Bonjour Yanis ! Prêt pour une nouvelle journée ?"*).
   - Jauge bien visible des ses "Bons Points" obtenus, pour gamifier l'expérience.

2. **Mon Organisation (Widgets Centraux) :**
   - **Mon Cahier de Texte :** Le travail à faire pour demain ou les jours à venir. C'est l'outil le plus critique pour l'élève.
   - **Mon Emploi du Temps :** Les cours de la journée.

3. **Raccourcis Pédagogiques :**
   - 🎮 **"Jeux Pédagogiques" :** Accès direct à l'espace ludo-éducatif (adapté à son niveau de classe).
   - 💬 **"Poser une question" :** Un bouton d'accès rapide au chat "Élève ↔ Prof" avec son ou ses enseignants actuels.
   - 📄 **"Mes documents / Ressources" :** Accès aux fichiers PDF déposés par le professeur.

---

## 4. Sécurité et Composants Réutilisés

*   **Réutilisation :** Ces tableaux de bord feront appel à des composants UI existants (ex: `UnifiedFeed`, `ScheduleViewer`), mais ils seront instanciés avec des ID codés en dur depuis le backend de la session (ex: le `studentId` récupéré de `req.user.roleData.eleveRef`). 
*   **Contrôle strict (Zéro Trust) :** Même si le frontend affiche ce Dashboard restreint, le backend vérifiera à chaque requête réseau (`GET /api/notes/:studentId`) que le `studentId` demandé appartient bien au parent connecté (vérification dans `childrenRefs`).

---

## 5. Étapes d'Implémentation Recommandées

1. **Vues Parent/Élève :** 
   - Créer les pages/composants de haut niveau `ParentDashboard.jsx` et `StudentDashboard.jsx`.
2. **Mécanique de Routage à la connexion :**
   - Mettre à jour la logique post-login (ex: dans `app/page.js` ou un Layout) pour afficher le bon composant de Dashboard selon le `role` de l'utilisateur connecté (`parent` ou `eleve`).
3. **Le Sélecteur de Fratrie (Parent) :**
   - Créer le composant `<ChildSelector />` qui va populer un contexte React (ou état global) avec le `studentId` actif.
4. **Intégration des Widgets :**
   - Instancier un à un les widgets (Feed, Emploi du temps, Notes) en s'assurant qu'ils écoutent bien le `studentId` ou `classId` actif.
