# Spécification Technique : Framework de Test E2E avec Playwright

## 1. Objectifs de la Fonctionnalité

Pour garantir un lancement d'application 100% serein et robuste, nous devons mettre en place un cadre de tests End-to-End (E2E). L'objectif principal est de valider automatiquement les scénarios métiers critiques et de garantir la **non-régression** (s'assurer qu'une modification future ne casse pas ce qui fonctionne déjà).

### Pourquoi Playwright ?
*   **Multi-Rôles Concurrents :** Playwright permet de faire tourner plusieurs contextes de navigateurs isolés en parallèle dans un seul test. C'est l'outil parfait pour tester des fonctionnalités collaboratives (ex : un professeur envoie un message, et on vérifie en temps réel que le parent le reçoit sur son écran).
*   **Rapidité & Fiabilité :** Gestion native de l'auto-attente (évite les tests "flaky" qui échouent aléatoirement à cause des temps de chargement).
*   **Rapports Visuels :** Fournit un "Trace Viewer" qui permet de rejouer le test pas à pas avec des captures d'écran et des logs réseau en cas d'échec.

---

## 2. Architecture et Structure des Tests

Les fichiers de test seront localisés dans un dossier dédié à la racine du projet :
*   `tests/` : Contient tous les scripts de test.
*   `tests/auth/` : Gestion des états de connexion (sauvegarde de session).
*   `tests/fixtures/` : Données de test réutilisables (élèves de test, profs de test).
*   `playwright.config.js` : Fichier de configuration global à la racine.

### Optimisation : Sauvegarde des États d'Authentification
Pour éviter que chaque test ne doive passer par l'étape lente de saisie des identifiants Clerk, Playwright sera configuré pour :
1. Se connecter une seule fois par rôle au début de la suite de tests.
2. Sauvegarder les cookies et tokens de session dans des fichiers JSON (`tests/auth/adminStorageState.json`, `tests/auth/parentStorageState.json`, etc.).
3. Réutiliser ces états instantanément pour chaque test individuel.

---

## 3. Scénarios Critiques à Automatiser en Priorité

### Scénario A : Étanchéité et Sécurité des Données (RBAC)
*   **Test :** Se connecter en tant que `parent_A`.
*   **Actions :**
    *   Tenter d'accéder à l'URL du profil de l'élève `enfant_B` (n'appartenant pas à sa fratrie).
    *   Vérifier que l'application redirige vers une page d'erreur ou affiche un message d'accès refusé.
    *   Vérifier que les requêtes API backend sous-jacentes renvoient un code d'erreur `403 Forbidden`.

### Scénario B : Messagerie Collaborative en Temps Réel
*   **Test :** Lancer deux navigateurs simultanés (Concurrence).
    *   Navigateur 1 : Connecté en tant que `parent_A`.
    *   Navigateur 2 : Connecté en tant que `prof_A`.
*   **Actions :**
    *   Le parent ouvre la conversation avec le prof et envoie : *"Bonjour, des nouvelles de Yanis ?"*.
    *   Dans le navigateur du prof, vérifier que le message apparaît instantanément sans rafraîchissement manuel de la page.
    *   Le prof répond. Vérifier que le parent reçoit la notification/le message en direct.

### Scénario C : Cycle de Vie d'un Rendez-vous / Convocation
*   **Test :** Cycle complet de demande de rendez-vous.
*   **Actions :**
    *   Le parent formule une proposition de RDV (Présentiel, 2 créneaux proposés).
    *   Le professeur se connecte, reçoit la notification de demande, accepte l'un des deux créneaux.
    *   Vérifier que le statut passe à `ACCEPTED` chez le parent et que l'événement est correctement ajouté à son tableau de bord.

---

## 4. Stratégie de Base de Données pour les Tests

Pour éviter de polluer les données réelles (Production/Staging) :
*   Les tests tourneront en utilisant une base de données de test dédiée (ex : `mongodb://.../school-management-test`).
*   **Seeding :** Avant de lancer la suite de tests, un script (`npm run test:db-seed`) sera exécuté pour injecter un jeu de données minimal et prédictible (1 école de test, 2 classes de test, 3 profs, 5 élèves, etc.).

---

## 5. Étapes d'Implémentation Recommandées

1.  **Initialisation :**
    *   Installer Playwright via `npm init playwright@latest` (choisir JavaScript, dossier `tests/`, ne pas ajouter de workflow GitHub Actions pour l'instant).
2.  **Configuration :**
    *   Configurer `playwright.config.js` avec l'URL de base locale (`http://localhost:3000`).
    *   Mettre en place les scripts de génération d'états d'authentification Clerk (`setup.auth.js`).
3.  **Écriture du premier test (Le "Smoke Test") :**
    *   Vérifier simplement que la page de connexion se charge et que les redirections de base fonctionnent.
4.  **Automatisation des Scénarios Prioritaires :**
    *   Coder les scénarios A, B et C décrits ci-dessus.
5.  **Scripts NPM :**
    *   Ajouter dans `package.json` :
        *   `"test:e2e": "playwright test"` (lance tous les tests).
        *   `"test:e2e:ui": "playwright test --ui"` (lance l'interface graphique interactive de Playwright, géniale pour le développement).
