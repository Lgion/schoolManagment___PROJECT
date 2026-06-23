# Spécification Technique : Création d'École et Mode Bac à Sable (Sandbox)

## 1. Objectifs de la Fonctionnalité

Cette spécification couvre la phase d'Onboarding (accueil des nouveaux clients) avec deux approches répondant à des besoins différents :
1. **Génération d'École (Production) :** Permettre à un nouveau directeur d'enregistrer et de configurer officiellement son établissement dans le système.
2. **Mode Bac à Sable (Découverte) :** Permettre à un prospect de tester l'application immédiatement, en manipulant des données fictives qui ne vivent que dans son navigateur, garantissant une expérience fluide sans polluer la base de données de production.

---

## 2. Fonctionnalité A : Génération de l'École (Formulaire)

### A. Philosophie
Il s'agit du tunnel de création classique d'un SaaS (Software as a Service). L'utilisateur (futur administrateur) remplit un formulaire pour configurer la base de données de son école.

### B. Interface Utilisateur (`/onboarding` ou `/create-school`)
Un formulaire multi-étapes (Stepper) pour ne pas submerger l'utilisateur :
*   **Étape 1 : Identité de l'établissement** (Nom de l'école, Adresse, Logo/Blason, Numéro de téléphone officiel).
*   **Étape 2 : Configuration Pédagogique** (Cycles enseignés : Primaire/Collège, Année scolaire courante, Système de notation par défaut : /20, Lettres, Bons Points).
*   **Étape 3 : Création du Super-Admin** (Liaison avec le compte Clerk connecté pour lui donner les droits maximaux sur cette nouvelle école).

### C. Modèle et Base de Données
Si le projet doit supporter plusieurs écoles (Multi-tenant), une architecture stricte doit être définie :
*   Soit un modèle global `School` (tenant) et tous les autres modèles (`Eleve`, `Classe`, `Teacher`) doivent posséder une référence `schoolId: ObjectId`.
*   Lors de la soumission du formulaire, l'API crée le document `School`, puis initialise l'année courante, et redirige l'utilisateur vers son nouveau Dashboard Admin vide.

---

## 3. Fonctionnalité B : Mode Bac à Sable (Local Session)

La tâche précise que cette école doit vivre **"temporairement dans la local session"**. C'est un défi architectural intéressant car l'application frontend doit fonctionner sans faire appel au backend MongoDB.

### A. Fonctionnement de la Démo
1. Sur la page d'accueil (vitrine), un bouton **"Essayer une démo"**.
2. Au clic, l'application ne crée pas de compte en base. Elle charge un gros fichier JSON (le "Mock") contenant une fausse école (ex: *École des Sorciers*, avec 3 classes, 10 élèves, des emplois du temps).
3. Ce JSON est injecté dans le `sessionStorage` du navigateur (ou via une librairie de state management configurée pour persister en local, comme Zustand persist).

### B. Architecture "Offline First" (Data Provider)
Pour que les composants actuels (qui font des `fetch('/api/classes')`) fonctionnent dans ce mode bac à sable, il faut implémenter une couche d'abstraction : un **API Interceptor** ou un **Custom Hook de données**.

*Mécanique :*
*   Une variable globale détermine le mode : `const IS_SANDBOX = sessionStorage.getItem('sandboxMode') === 'true';`
*   Si le client appelle la fonction pour récupérer les élèves :
    *   `if (IS_SANDBOX)` : La fonction lit le `sessionStorage`, simule un délai réseau de 200ms, et renvoie le JSON local.
    *   `else` : La fonction fait un vrai `fetch` vers l'API MongoDB.
*   Si le client ajoute une note ou modifie un élève en mode Sandbox :
    *   L'intercepteur met à jour l'objet JSON dans le `sessionStorage`. L'utilisateur voit sa modification à l'écran.
*   À la fermeture de l'onglet, le `sessionStorage` est vidé. La base de données reste immaculée.

### C. Alternative (Si l'Intercepteur est trop lourd)
*Note d'architecture :* Mocker entièrement une API REST en frontend est complexe. Si cela prend trop de temps, l'alternative standard est la **"Database Sandbox"** : on crée une vraie école dans MongoDB avec un flag `isSandbox: true`. L'utilisateur interagit avec la vraie API. Un "Cron Job" (tâche planifiée) tourne toutes les nuits à 3h du matin sur le serveur et détruit toutes les écoles ayant ce flag.

---

## 4. Étapes d'Implémentation Recommandées

1. **Génération d'École (Production) :**
   - Créer le modèle de base de données pour représenter une Institution/École.
   - Créer le formulaire frontend multi-étapes (`/onboarding`).
   - Câbler la route API `POST /api/schools` pour finaliser la création.

2. **Le Mock de Données (Sandbox) :**
   - Générer un fichier statique `mockSchoolData.json` extrêmement réaliste et complet (Classes, Élèves, Profs, Événements).

3. **Le Moteur Sandbox (Le plus technique) :**
   - Créer le hook personnalisé (ex: `useSchoolData()`) qui va wrapper les requêtes `SWR` ou `fetch` classiques.
   - Implémenter la logique de lecture/écriture dans le `sessionStorage` pour que les mutations (ajout, suppression) donnent une illusion de réalité au prospect pendant son test.
