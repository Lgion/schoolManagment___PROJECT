- homepage: refont de chaque section
- permettre à l'admin de customizer l'application (custom photo, logo, slogan, etc)
- refondre la page admin -> et y intégrer une section de customisation
- il faut que l'IA aide à construire un footer (pour l'instant inexistant)
- trouver une solution à l'affichage du menu (une solution pour tous les rôles et toutes les tailles d'écran)
- créer une branche spéciale pour définir avec l'IA ce qu'il faudrait modifier/ajouter dans l'application pour passer à une solution de collège et plus -->> il faut être créatif et bien réfléchir afin de définir des spécifications techniques solides et claires.
- sur la page des élèves, il y a 2 problemes: le contenu affiché de .infos_cards manque de finition (les boutons ne sont pas de la meme taille, ni de la meme couleurs, ni meme dans le meme style). Et #camembert prend bcp de place sur toute sa ligne (row), et ce seul camembert de genre en guise d'information générale concernant tous les élèves ..je trouve ça faible. Un ou des élèves pourraient etre mis en valeur dans cette zone.
- concernant la page des classes, il faudrait aussi pouvoir avoir une zone de statistiques et performances (là aussi, une ou des classes pourai(en)t etre mis en valeur dans cette zone).
- sur la page d'une classe, c'est actuellement un peu comme sur la homepagen, un scroll qui n'en fini pas et qui devrait etre mieux géré en scss (je pense à l'utilisation d'accordéon pour afficher toutes les sections de la page d'une classe)


------------------------------------------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------------------------------------

# 🎨 Propositions détaillées de Refonte & Optimisation du Design

Ce document recense les propositions concrètes d'optimisation visuelle et d'expérience utilisateur (UI/UX) pour l'application, en s'appuyant sur les captures d'écran de `@TODOs/screenshots4design` et la structure actuelle des fichiers SCSS.

---

## 🏠 1. Refonte Globale de la Page d'Accueil (Homepage)
* **Captures de référence :** 
  * `02_dashboard.png` (Vue Admin/Prof)
  * `19_dashboard_eleveview.png` (Espace Élève)
  * `20_dashboard_parentview.png` (Espace Parent)
* **Fichiers SCSS concernés :** 
  * `app/assets/scss/pages/home.scss`
  * `app/assets/scss/components/CONTENT/homeContent.scss`
  * `app/assets/scss/_variables.scss`

### Constat actuel :
La page d'accueil affiche les éléments (`TeacherDailyWidget`, `TeacherReportModule`, `UnifiedFeed`, `CalendarContent`) de façon verticale, ce qui crée une page très longue sur grand écran, avec un manque de repères visuels forts et de hiérarchie.
De plus, les rôles Parent et Élève sont actuellement redirigés vers des templates complètement déconnectés (`ParentDashboard` et `StudentSpace`), alors qu'un tableau de bord partagé et cohérent avec des restrictions de contenu par rôle (comme pour les actions et boutons) serait beaucoup plus unifié et professionnel.

### Propositions de refonte :
1. **Unification Multi-Rôles du Dashboard :**
   * Fusionner le conteneur principal de la page d'accueil pour tous les rôles.
   * Utiliser une structure de widgets partagée : le fil d'actualités (`UnifiedFeed`) et le calendrier sont visibles par tous.
   * Restreindre uniquement les actions sensibles (ex. bouton d'appel, saisie de rapports ou modifications d'emploi du temps) via le composant `PermissionGate`, en affichant des boutons d'actions contextuels adaptés à chaque rôle (ex. "Consulter mes notes" pour l'élève, "Payer la scolarité" pour le parent, "Gérer la classe" pour le professeur).
2. **Grille de Dashboard Réactive (Desktop & Tablette) :**
   * Remplacer le flux linéaire vertical par une grille CSS (`grid-template-columns: repeat(auto-fit, minmax(360px, 1fr))`).
   * Placer les widgets quotidiens (`TeacherDailyWidget` / tâches) et les anniversaires dans une colonne latérale de résumé, et le flux d'actualités (`UnifiedFeed`) ainsi que l'agenda au centre.
3. **Gestion du Défilement (Scroll) Trop Long en SCSS :**
   * Fixer une hauteur maximale sur les widgets à contenu dynamique long (comme le fil d'actualité et le calendrier) : `max-height: 500px`.
   * Permettre un défilement interne fluide et stylisé :
     ```scss
     .ecole-scrollable-widget {
       max-height: 500px;
       overflow-y: auto;
       padding-right: 0.5rem;

       /* Scrollbar personnalisée premium */
       &::-webkit-scrollbar {
         width: 6px;
       }
       &::-webkit-scrollbar-track {
         background: var(--color-background);
         border-radius: var(--border-radius-pill);
       }
       &::-webkit-scrollbar-thumb {
         background: var(--color-border-strong);
         border-radius: var(--border-radius-pill);
         &:hover {
           background: var(--color-text-muted);
         }
       }
     }
     ```
   * En option, implémenter un système d'onglets locaux (Tabs) pour basculer rapidement entre "Annonces/Sondages" et "Événements/Calendrier" plutôt que de les afficher l'un en dessous de l'autre.
4. **Design de Cartes Unifié (Glassmorphism) :**
   * Appliquer une charte de cartes moderne et premium dans `homeContent.scss` :
     ```scss
     .ecole-card-dashboard {
       background: rgba(255, 255, 255, 0.75);
       backdrop-filter: blur(12px);
       -webkit-backdrop-filter: blur(12px);
       border: 1px solid rgba(255, 255, 255, 0.4);
       border-radius: var(--border-radius-lg);
       box-shadow: var(--shadow-medium);
       transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease;
       
       &:hover {
         transform: translateY(-4px);
         box-shadow: var(--shadow-large);
       }
     }
     ```
5. **Titres avec Dégradés Signature :**
   * Harmoniser les sections en appliquant le dégradé de marque aux titres (`--gradient-brand` défini dans `_variables.scss`) :
     ```scss
     .home-section-title {
       background: var(--gradient-brand);
       -webkit-background-clip: text;
       -webkit-text-fill-color: transparent;
       font-weight: var(--font-weight-bold);
     }
     ```

---

## ⚙️ 2. Customisation Globale par l'Administrateur
* **Captures de référence :** `01_landing_page.png` (Logo, Titre et Bannière de la Landing), `02_dashboard.png` (Branding Header).
* **Modèle de données & API :** 
  * `app/api/_/models/ai/SchoolSettings.js` (`homepageSchema`)
  * `app/api/school_ai/ecole/route.js`

### Constat actuel :
Les éléments de marque comme le logo (`/logo.png`), le slogan de l'école dans le header, et la photo de couverture de la landing page (`/ecole_testes/photo.jpg`) sont codés en dur ou disposent d'un schéma Mongoose restreint à `title`, `texts` et `photo`. Les polices (Inter, Poppins) et arrondis de bordures sont figés dans `_variables.scss`.

### Propositions de refonte :
1. **Extension du Schéma de Configuration (`SchoolSettings.js`) :**
   Ajouter des attributs de personnalisation pour les visuels, les couleurs, **les polices de caractères**, et **les arrondis de bordures (Border-radius)** :
   ```javascript
   const homepageSchema = new mongoose.Schema({
     title: { type: String, default: 'École de Démo' },
     slogan: { type: String, default: 'Système de gestion scolaire' },
     texts: { type: [String], default: [] },
     photo: { type: String, default: '/ecole_testes/photo.jpg' }, // Image de la Landing Page
     logoUrl: { type: String, default: '/logo.png' },             // Logo de l'établissement
     bannerUrl: { type: String, default: '/bg_header.webp' },     // Fond du Header principal
     primaryColor: { type: String, default: '#1E3A8A' },          // Couleur de marque (Bleu)
     accentColor: { type: String, default: '#F97316' },            // Couleur d'accentuation (Orange)
     
     // --- NOUVEAUTÉS TYPOGRAPHIE & STYLE PRESETS ---
     fontHeading: { type: String, default: 'Poppins' },           // Police pour les Titres
     fontBody: { type: String, default: 'Inter' },                 // Police pour le corps de texte
     borderRadiusPreset: { type: String, default: 'medium' },      // 'none' (0px) | 'medium' (8px/10px) | 'rounded' (16px/20px)
     headerStylePreset: { type: String, default: 'glass' }         // 'dark' | 'light' | 'brand' | 'glass'
   });
   ```
2. **Injection Dynamique de Thème & Typographie CSS :**
   * Dans `app/layout.jsx` ou `app/Home.jsx`, charger dynamiquement les polices Google Fonts demandées, puis injecter les variables CSS :
     ```jsx
     const fontHeading = settings.homepage.fontHeading || 'Poppins';
     const fontBody = settings.homepage.fontBody || 'Inter';
     
     // Génération de l'import d'URL Google Fonts
     const googleFontsUrl = `https://fonts.googleapis.com/css2?family=${fontHeading.replace(' ', '+')}:wght@500;600;700;800&family=${fontBody.replace(' ', '+')}:wght@300;400;500;600&display=swap`;
     
     // Calcul du Border-radius
     const radiusMapping = { none: '0px', medium: '8px', rounded: '16px' };
     const selectedRadius = radiusMapping[settings.homepage.borderRadiusPreset] || '8px';
     ```
   * Balise de style dynamique injectée côté client :
     ```jsx
     <>
       <link rel="stylesheet" href={googleFontsUrl} />
       <style>{`
         :root {
           --font-primary: '${fontBody}', sans-serif;
           --font-secondary: '${fontHeading}', sans-serif;
           --font-heading: '${fontHeading}', sans-serif;
           
           --color-primary: ${settings.homepage.primaryColor || '#1E3A8A'};
           --color-accent: ${settings.homepage.accentColor || '#F97316'};
           --color-secondary: ${settings.homepage.accentColor || '#F97316'};
           
           --border-radius-sm: calc(${selectedRadius} * 0.6);
           --border-radius-md: ${selectedRadius};
           --border-radius-lg: calc(${selectedRadius} * 1.4);
           --border-radius-xl: calc(${selectedRadius} * 2);
           
           --bg-header-url: url('${settings.homepage.bannerUrl || '/bg_header.webp'}');
           --logo-url: url('${settings.homepage.logoUrl || '/logo.png'}');
         }
       `}</style>
     </>
     ```
   * Modifier les SCSS (comme `headers.scss` et `index.scss`) pour consommer les variables de typographie dynamically : `font-family: var(--font-primary);`.

3. **Autres propositions de personnalisation (Optionnelles) :**
   * **Bandeau de Notification global :** Message d'information défilant (ex: alertes météo, vacances) affichable tout en haut sous le menu, activable et éditable depuis l'admin.
   * **Modes de thème préconfigurés :** Une galerie de thèmes en un clic (ex. "Classic Royal", "Warm Amber", "Emerald Forest", "Cyber Dark") qui appliquent directement des combinaisons de couleurs et de polices prédéfinies.

---

## 🔧 3. Refonte de la Page Admin & Panel de Customisation
* **Captures de référence :** `17_administration.png` (Interface de configuration actuelle).
* **Fichiers SCSS concernés :** `app/assets/scss/pages/administration.scss`

### Constat actuel :
L'interface d'administration liste les élèves, enseignants et classes dans un tableau épuré, mais regroupe de manière brute des actions critiques (comme la migration annuelle et la réinitialisation de la démo) sans séparation visuelle claire, et ne propose aucune option pour modifier les paramètres de l'école ou son apparence.

### Propositions de refonte :
1. **Création d'un Onglet "Personnalisation" dédié :**
   * Ajouter un onglet `Configuration & Design` aux côtés de `Élèves`, `Enseignants`, `Classes` et `Paramètres des Frais`.
   * Cet onglet contiendra un formulaire de saisie structuré :
     * **Identité visuelle :** Zones d'upload d'images (Logo, Bannière d'en-tête, Photo d'accueil de la Landing) connectées à l'API Cloudinary du projet (`/api/school_ai/media`).
     * **Textes institutionnels :** Modification en direct du Titre de l'école, du Slogan et des textes de présentation.
     * **Palette de couleurs :** Deux sélecteurs de couleur natifs (`<input type="color">`) pour définir la couleur primaire et la couleur d'accent (orange).
2. **Séparation Visuelle des Outils Systèmes (Migration / Reset) :**
   * Isoler les boutons dangereux (`Migrer l'Année Scolaire` et `Réinitialiser la Démo`) dans un panneau latéral ou une section "Actions de maintenance" stylisée en rouge/orange avec des avertissements explicites.
3. **Cartes d'Identité Visuelle en Temps Réel :**
   * Ajouter un encadré de prévisualisation en temps réel (Preview) montrant à l'administrateur à quoi ressembleront le logo et le header de l'école avant d'enregistrer.

---

## 🦶 4. Création d'un Footer Esthétique & Institutionnel
* **Captures de référence :** Manquant (le bas de page s'arrête brusquement après les flux d'actualités).
* **Proposition de fichier SCSS :** `app/assets/scss/layouts/footer.scss` (à créer).

### Propositions de refonte :
1. **Structure HTML5 sémantique :**
   Intégrer à la base de `app/Home.jsx` un composant `Footer` structuré en 3 colonnes principales :
   * **Colonne 1 (Branding) :** Mini logo de l'école, Nom officiel de l'établissement, Slogan et une brève description institutionnelle.
   * **Colonne 2 (Liens rapides) :** Raccourcis vers la Messagerie, le Blog, la Galerie de photos, le Calendrier des événements et la page de support/contact.
   * **Colonne 3 (Contact & Info) :** Coordonnées téléphoniques, e-mail de l'école (ex: `sanctuaire.rosaire.bolobi@gmail.com`), localisation physique et liens vers les réseaux sociaux.
2. **Style SCSS Premium :**
   * Fond sombre contrasté utilisant la variable `--color-primary-dark` (#172554) pour asseoir le site sur une base solide.
   * Typographie fine en blanc cassé avec des effets de transition de couleur au survol des liens vers `--color-secondary` (orange).
   * Ligne de copyright inférieure avec mention des mentions légales et séparation soignée par une bordure fine translucide (`border-top: 1px solid rgba(255, 255, 255, 0.1)`).

---

## 📱 5. Solution pour l'Affichage du Menu (Responsive & Multi-Rôles)
* **Captures de référence :** 
  * `02_dashboard.png` (Menu Admin horizontal très large)
  * `19_dashboard_eleveview.png` / `20_dashboard_parentview.png` (Menus restreints)
* **Fichiers SCSS concernés :** `app/assets/scss/layouts/headers.scss` (styles `.mainMenu` et `.ecole-admin__nav`)

### Constat actuel :
Le menu est horizontal et intégré dans le header. Il utilise un mécanisme de réduction au scroll (`header--shrunk`). Sur mobile, les nombreux boutons s'empilent mal ou débordent sur les côtés, rendant la navigation complexe, et le changement de rôle en Sandbox modifie la taille de la barre de navigation de façon saccadée.

### Propositions de refonte :
1. **Menu Latéral Rétractable (Navigation Drawer) sur Mobile :**
   * Pour les écrans inférieurs à `768px` (media query dans `headers.scss`), remplacer la barre horizontale par un bouton de menu "Burger" flottant ou logé dans le header.
   * Au clic, déclencher l'ouverture d'un panneau latéral (`drawer`) coulissant depuis la gauche avec un effet de flou en arrière-plan (`backdrop-filter`).
   * Liste des boutons ordonnée verticalement avec de grandes icônes tactiles simples d'accès.
2. **Barre de Navigation Horizontale Fluide sur Desktop :**
   * Supprimer le positionnement absolu restrictif. Utiliser un affichage Flexbox moderne avec retour à la ligne automatique (`flex-wrap: wrap`) et un espacement calculé via `gap: 0.5rem 1rem`.
   * En cas de dépassement sur les tablettes, utiliser un conteneur à défilement horizontal fluide avec indicateur visuel de fondu (gradient de masquage à droite).
3. **Thématisation de Couleur par Rôle :**
   * Assigner une couleur d'accentuation propre à chaque type d'utilisateur pour éviter les confusions de rôle en Sandbox :
     * **Administrateur :** Couleur d'accent Or/Orange (ex: boutons `--admin`).
     * **Enseignant :** Couleur d'accent Bleu de marque (ex: boutons `--prof`).
     * **Élève :** Couleur d'accent Violet / Indigo moderne.
     * **Parent :** Couleur d'accent Émeraude rassurante.

---

## 🎓 6. Spécifications Techniques : Passage à une solution "Collège et Lycée"
* **Objectif :** Créer des spécifications et une structure de données permettant de faire évoluer cet ERP (actuellement taillé pour le Primaire) vers le Secondaire (Collège/Lycée).

### Différences fondamentales à modéliser :
Dans le primaire, une classe a généralement un seul enseignant principal qui dispense toutes les matières. Au collège et au lycée, la classe dispose d'un **corps enseignant pluridisciplinaire** (un enseignant différent par matière) et un système d'évaluation basé sur des **coefficients** et des moyennes pondérées complexes.

### Évolutions Techniques Proposées :

#### 1. Modification du Schéma des Classes (`Classe.js`)
* **Actuellement :** Une classe possède un enseignant référent (`prof_principal_id`).
* **Nouvelle Spécification :** Remplacer par un tableau d'enseignants associés à leurs matières respectives, ainsi que la liste des coefficients de chaque matière pour cette classe :
  ```javascript
  const matiereCoefficientSchema = new mongoose.Schema({
    matiereId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    coefficient: { type: Number, default: 1, min: 1 }
  }, { _id: false });

  const classeEnseignantSchema = new mongoose.Schema({
    enseignantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    matiereId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true }
  }, { _id: false });

  // Ajout au schéma Classe :
  // matieresCoefficients: [matiereCoefficientSchema]
  // corpsEnseignant: [classeEnseignantSchema]
  ```

#### 2. Refonte du Calcul des Bulletins Scolaires (`ReportCard.js`)
* **Nouvelle Spécification :** Adapter le moteur de calcul pour prendre en compte les coefficients :
  * Calcul de la moyenne de l'élève par matière : $\text{Moyenne Matière} = \frac{\sum(\text{Notes Compositions})}{\text{Nombre de notes}}$ (ou pondéré selon les devoirs de classe / devoirs communs).
  * Calcul de la moyenne générale du trimestre/semestre : 
    $$\text{Moyenne Générale} = \frac{\sum(\text{Moyenne Matière} \times \text{Coefficient})}{\sum(\text{Coefficients})}$$
  * Intégration dans le PDF du bulletin : Affichage de la moyenne de la classe pour la matière, de la note minimale, de la note maximale, du rang de l'élève dans la matière, et des appréciations individualisées de chaque enseignant.

#### 3. Gestion Avancée des Emplois du Temps (Scheduling)
* **Nouvelle Spécification :** Prévenir les conflits d'emploi du temps.
  * Validation lors de l'ajout d'un cours : Vérifier que l'enseignant $X$ n'est pas déjà assigné à une autre classe sur ce créneau horaire, et que la salle de classe $Y$ est libre.
  * Gérer les cours en demi-groupes (Langues Vivantes, TP de Sciences).

#### 4. Séparation des Espaces de Travail Parent & Élève
* **Nouvelle Spécification :** Les élèves du secondaire ont besoin d'une autonomie complète :
  * **Espace Élève :** Accès à son cahier de texte personnel, téléchargement des cours PDF des profs, rendu des devoirs en ligne, messagerie directe avec ses enseignants.
  * **Espace Parent :** Suivi des absences et des sanctions en temps réel, signature électronique des bulletins trimestriels, messagerie avec le professeur principal et l'administration, paiement en ligne des frais de scolarité.

---

## 📊 7. Refonte des Pages de Listes et Détails (Élèves & Classes)
* **Captures de référence :** 
  * `03_classes.png` / `11_classe.png` (Page des classes et détails d'une classe)
  * `04_eleves.png` / `12_eleve.png` (Page des élèves et détails d'un élève)
* **Fichiers SCSS concernés :** 
  * `app/assets/scss/pages/eleves.scss` (ou style des listes d'élèves)
  * `app/assets/scss/pages/classes.scss`
  * `app/assets/scss/components/DISPLAYS/classeEnseignantDisplay.scss`
  * `app/assets/scss/components/CONTROLS/infosCardsControls.scss`

### Constat actuel :
- **Page des élèves :** La section `.infos_cards` présente des boutons non uniformes en taille, style et couleur. De plus, le graphique en camembert de répartition par genre (`#camembert`) monopolise tout l'espace d'une ligne, alors qu'il s'agit d'une métrique simple.
- **Page des classes :** Manque d'indicateurs de performances ou de statistiques générales permettant de valoriser certaines classes.
- **Détail d'une classe :** Présente un scroll trop long avec toutes les sections affichées de manière brute, ce qui nuit à l'ergonomie.

### Propositions de refonte :
1. **Harmonisation de `.infos_cards` (Boutons d'action) :**
   * Standardiser les boutons à l'aide d'un mixin SCSS ou de classes uniformes garantissant la même hauteur (`height: 42px`), la même police, des styles de bordure cohérents (contour discret ou fond plein selon l'importance), et des couleurs issues du thème configuré.
2. **Optimisation de l'Espace `#camembert` & Mise en Valeur :**
   * Remplacer le camembert géant par une grille à 2 colonnes :
     * **Gauche :** Un camembert compact et élégant (ex: 200px de large) intégré dans une carte de statistiques.
     - **Droite :** Une section dynamique "Élèves à l'honneur" ou "Anniversaires & Actus Élèves" mettant en valeur les réussites (meilleure progression, bons points) ou activités récentes.
3. **Statistiques et Performances sur la Page des Classes :**
   * Créer un bandeau supérieur de statistiques de performance (ex: Taux de réussite global, classe avec la meilleure moyenne, total de devoirs validés).
   * Mettre en valeur la classe ayant les meilleurs résultats ou la meilleure assiduité sous forme de carte vitrine "Classe du mois".
4. **Gestion du Scroll via Accordéons (Détail Classe) :**
   * **Pour le détail classe (`11_classe.png`) :** Regrouper les sections (Élèves, Emploi du temps, Carnet de liaison, Documents) dans un composant Accordéon interactif ou des onglets verticaux / horizontaux.
   * **Pour la Homepage (`02_dashboard.png`) :** Limiter la hauteur des widgets volumineux (ex: calendrier, annonces) à un `max-height` fixe (ex: `400px` ou `500px`) avec un défilement interne personnalisé (`overflow-y: auto` avec scrollbar fine CSS), ou utiliser un système d'onglets pour naviguer entre les annonces et le calendrier.