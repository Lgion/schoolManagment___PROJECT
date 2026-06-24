# Spécification Technique : PLG Landing Page, Mega-Seeder & Sécurisation RBAC

*Extension du document `multi_tenant_architecture_and_sandbox.md`*

## 1. Vision et Objectifs
Bien que l'architecture multi-tenant et le système de Sandbox soient en place, l'expérience de démonstration manque de réalisme et de sécurisation visuelle. Pour convertir les prospects (stratégie Product-Led Growth), la "vitrine" (Landing Page) doit être ultra-compétitive et la Sandbox doit être gorgée de données cohérentes, profondes et interconnectées qui animent **100% des fonctionnalités** de l'application.

L'objectif de cette spécification est de définir le travail restant pour finaliser l'Onboarding SaaS :
1. **Verrouiller l'UI** (RBAC) pour les rôles restreints.
2. **Refondre la Landing Page** avec un argumentaire B2B massif.
3. **Développer un "Mega-Seeder"** capable de simuler plusieurs années de vie scolaire (historique, notes, blog, messages).

---

## 2. Sécurisation RBAC Visuelle (Interface Étudiante & Parent)

La navigation globale (`Home.jsx` et Sidebar) doit refléter la stricte étanchéité des rôles. Actuellement, les menus globaux sont visibles par tous.

### A. Implémentation Requise
1. **Enveloppement des Menus :** Les onglets *"Gérer les classes"*, *"Gérer les élèves"*, et *"Enseignants"* doivent être enveloppés d'une `<PermissionGate roles={['admin', 'prof']}>`.
2. **Tableaux de bord dédiés :**
   - L'élève ne verra qu'un menu simplifié : **"Mon Dossier", "Mon Cahier de Texte", "Mes Professeurs"**.
   - Le parent verra : **"Mes Enfants", "Paiements", "Professeurs"**.
3. **Sécurité des Routes :** Si un élève force l'URL `/classes` ou `/eleves`, la page elle-même doit intercepter le rôle via le layout et renvoyer une erreur 403 (ou rediriger vers l'accueil).

---

## 3. Landing Page Premium (L'Argumentaire B2B SaaS)

La page d'accueil doit se différencier radicalement des solutions vieillissantes du marché (Pronote, EcoleDirecte) en misant sur l'expérience utilisateur et les technologies modernes.

### A. Structure et Arguments Clés
1. **Hero Section (L'Accroche) :**
   - *Message :* "Le premier ERP Scolaire conçu pour l'Humain, propulsé par l'IA."
   - *Différenciateur :* Mise en avant de l'absence totale de temps de chargement (SPA Next.js).
2. **Social Proof & Metrics (Mockup) :**
   - Affichage de fausses métriques pour rassurer : *"Temps gagné par les enseignants : 4h/semaine"*, *"98% des parents satisfaits de la communication"*.
3. **Bento Grid des Fonctionnalités (Pourquoi Nous ?) :**
   - **Vitesse Éclair :** Pas de rechargement de page, interface fluide (contrairement aux usines à gaz concurrentes).
   - **Intelligence Artificielle intégrée :** Scan de bulletins, extraction de notes via photo, création de jeux pédagogiques sur mesure.
   - **Communication Centralisée :** Messagerie de groupe instantanée (façon WhatsApp/Slack) et intégration de la Visioconférence.
   - **Sécurité Multi-Tenant :** Isolation des données par école.
4. **Call-To-Action (Interactive Sandbox) :**
   - Inviter le prospect à créer son école de test en 1 clic pour prouver la réactivité du système.

---

## 4. Le "Mega-Seeder" (Génération de Données Exhaustives)

Pour que la Sandbox soit bluffante, elle ne doit pas être vide. La fonction `/api/sandbox/create` doit devenir un véritable moteur de simulation de vie scolaire sur plusieurs années.

### A. Cohérence de l'Historique Scolaire (Le Voyage dans le Temps)
Les élèves générés ne doivent pas exister que dans l'année courante. Ils doivent posséder un passé consultable.
- **Principe :** Si "Marc" est en CE1 en 2025-2026, il doit avoir une trace de son passage en CP en 2024-2025.
- **Données à injecter (`bolobi_class_history_$_ref_µ_classes`) :** 
  - Création de la classe passée (ex: "CP - 2024-2025").
  - Attribution des notes, bons points et absences de l'année précédente à cette classe.
- **Comportement UI attendu :** Sur le profil de Marc, le sélecteur d'année doit proposer "2024-2025" et "2025-2026". En sélectionnant 2024-2025, la page doit dynamiquement re-rendre les statistiques de cette année-là, et un clic sur le nom de l'ancienne classe doit rediriger vers l'archive de la classe de CP.

### B. Densité et Réalisme des Effectifs
- **Classes :** Au minimum 2 ou 3 classes par école.
- **Élèves :** Au moins 6 à 10 élèves par classe pour avoir de vraies listes et de la data à filtrer.
- **Profs :** Assigner au moins 2 enseignants pour simuler la collaboration.

### C. Carnet de Notes et Bulletins (Trimestres)
- Au lieu de `notes: {}`, le seeder génèrera un tableau de notes cohérent sur au moins **2 trimestres complets**.
- **Matières :** Mathématiques, Français, Histoire/Géo.
- **Valeurs :** Notes aléatoires entre 8 et 20, avec des coefficients (ex: Devoir sur table coef 2, Interrogation coef 1).

### D. Vie Disciplinaire et Assiduité
- **Absences/Retards :** Génération de 2 à 3 événements d'absence (justifiées ou non) avec des dates précises dans l'année.
- **Bonus/Malus :** Attribution de "Bons points" (ex: "Aidé un camarade") pour illustrer le widget de gestion comportementale.

### E. Animation Sociale (Blog, Groupes, Messages)
Pour montrer que l'application est un outil de communication moderne :
- **Le Blog de l'École (`Post`) :** Création de 3 articles de blog illustrés ("Sortie de fin d'année", "Rappel : Réunion Parents-Profs", "Gagnant du tournoi").
- **Les Groupes (`Group`) :** Création d'un groupe de discussion "Parents d'élèves - CE1".
- **Messagerie (`GroupMessage`) :** Injection de 3 à 5 messages factices dans le groupe (ex: Professeur : *"N'oubliez pas le matériel d'art plastique demain !"* -> Parent : *"Merci pour le rappel !"*).

### F. Emploi du Temps et Calendrier (`Schedule`, `Event`)
- **Événements École :** Génération d'événements globaux (ex: "Fête de l'école", "Conseil de classe").
- **Emploi du temps Classe/Prof :** Création de créneaux horaires (`Schedule`) pour les mathématiques et le français, assignés aux classes et professeurs générés.

---

## 5. Plan d'Action pour l'Implémentation

1.  **Phase 1 : RBAC Visuel**
    - Éditer `app/Home.jsx` et les Layouts pour restreindre l'affichage des menus globaux selon le rôle.
2.  **Phase 2 : Landing Page Premium**
    - Réécrire `LandingPage.jsx` avec des composants UI de haute volée (Bento, animations, copywriting orienté SaaS/IA).
3.  **Phase 3 : Refactorisation du Seeder (`/api/sandbox/create`)**
    - Découper la génération en sous-fonctions (`seedClasses`, `seedStudents`, `seedHistory`, `seedBlog`, `seedMessages`) pour garder un code propre malgré la complexité des données.
4.  **Phase 4 : Tests E2E**
    - S'assurer que le changement d'année dans le profil élève recharge bien l'historique de la Sandbox générée.
