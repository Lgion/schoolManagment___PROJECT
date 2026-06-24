# Spécification d'Intention : Matrice des Permissions (RBAC)

## 1. Objectif de la Tâche (À réaliser en fin de projet)

Cette tâche consiste à créer le document de référence absolu pour la sécurité et la navigation de l'application : la **Matrice RBAC** (Role-Based Access Control). 

Au lieu de fouiller dans le code source pour comprendre qui a le droit de voir quoi, cette matrice centralisera toutes les règles d'accès de l'application de manière visuelle, documentée et facilement vérifiable.

## 2. Pourquoi repousser cette tâche à la fin ?

La matrice va s'appuyer sur des **liens dynamiques et des captures d'écran** pour montrer exactement à quoi ressemble une page (ex: la page d'une "Classe") selon si l'utilisateur est connecté en tant qu'Admin, Professeur, Parent ou Élève.

Si nous réalisons ces captures d'écran et figeons ces règles maintenant (alors que l'UI et les fonctionnalités évoluent quotidiennement), cette documentation sera obsolète le lendemain. Cette tâche constitue donc l'**étape ultime de documentation et de recettage (QA)** avant la livraison finale du projet.

---

## 3. Contenu de la Page d'Administration (`/admin/rbac-matrix`)

L'implémentation prendra la forme d'une route cachée dans l'application, accessible uniquement aux rôles `admin`. Cette page sera un véritable centre de documentation interne divisé en trois sections principales :

### Section 1 : Inventaire des Fonctionnalités
Une liste exhaustive de toutes les fonctionnalités disponibles dans l'application (ex: "Saisie des Bons Points", "Prise de RDV", "Lancement d'une Visio", "Modération du Blog", etc.). Cela permet d'avoir une vision globale des capacités du logiciel.

### Section 2 : Inventaire des Vues et Droits d'Accès Globaux
Une liste de toutes les vues (URLs/Pages) de l'application, définissant systématiquement quels rôles sont autorisés à y accéder au sens large du routage (ex: `/classes/[id]` -> Accessible par Admin, Prof, Parent. Interdit au Public).

### Section 3 : La Matrice des Permissions Détaillée (RBAC)
C'est le tableau croisé interactif développé en React qui rentre dans le détail granulaire (UI) de chaque vue :
*   **Les Lignes :** Les Vues (Détail d'une classe, Profil d'un élève, Messagerie, etc.)
*   **Les Colonnes :** Les Rôles (`admin`, `prof`, `parent`, `eleve`, `public`)
*   **Le Contenu des Cellules (L'intersection) :**
    1.  **Le niveau d'accès :** `Accès Total`, `Accès Restreint`, ou `Interdit`.
    2.  **La règle métier stricte :** *Ex: "Peut voir le nom du professeur et l'emploi du temps, MAIS l'onglet 'Liste des élèves' est totalement retiré du DOM."*
    3.  **La Preuve Visuelle :** Un bouton JS ouvrant une Modale React dynamique affichant la capture d'écran exacte du composant tel qu'il s'affiche pour ce rôle. Les images seront stockées dans `public/docs/screenshots/`.

---

## 4. Étapes de réalisation (Checklist Future)

Quand l'application sera intégralement codée, voici comment traiter cette tâche :

- [ ] Dresser la liste exhaustive de toutes les routes de l'application (`/classes`, `/eleves`, `/agenda`, etc.).
- [ ] Naviguer sur l'application avec des comptes de tests pour chaque rôle (`admin`, `prof`, `parent`, `eleve`).
- [ ] Prendre les captures d'écran finales pour chaque rôle sur chaque route critique.
- [ ] Construire le tableau croisé récapitulatif avec les liens vers ces images.
- [ ] Faire valider ce document pour s'assurer qu'aucune faille de fuite de données (ex: un parent voyant les notes d'un autre élève) n'a été laissée.

---

## 5. Prise de Captures d'Écran (Automatisation via Playwright)

La prise des captures d'écran des dizaines de vues pour chaque rôle est une tâche très chronophage.
Plutôt que d'écrire un script séparé, **nous allons exploiter directement le framework de test Playwright** (spécifié dans `testing_framework_playwright.md`).

### Synergie Tests & Documentation
Lors de l'exécution de nos tests E2E, Playwright navigue déjà sur toutes les pages critiques avec les différents rôles. Nous allons intégrer la capture d'écran directement dans ce flux :

1. **Intégration dans les Tests :** Dans nos fichiers de tests de navigation, nous ajouterons une commande de capture d'écran, par exemple :
   ```javascript
   await page.screenshot({ path: 'public/docs/screenshots/parent-classes.png' });
   ```
2. **Commande Dédiée :** Nous configurerons un script NPM dédié :
   ```json
   "test:screenshots": "playwright test --config=playwright.config.js --grep @screenshot"
   ```
   Cette commande lancera uniquement les tests marqués du tag `@screenshot`, générant ou mettant à jour instantanément toutes les images de la matrice d'administration en une seule commande, sans perturber les tests de non-régression classiques.

Cette approche garantit que la documentation visuelle de la matrice reste **toujours synchronisée** avec le comportement réel et testé de l'application !
