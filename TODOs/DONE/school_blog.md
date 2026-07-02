# Spécification Technique : Blog de l'École (Journal Scolaire)

## 1. Objectifs de la Fonctionnalité

L'objectif est de doter l'école d'un véritable journal scolaire numérique. Contrairement au flux d'actualité ("Unified Feed" de la page d'accueil et des groupes) qui est axé sur de la communication descendante et brève (micro-blogging, annonces, sondages), le **Blog de l'École** est axé sur la **création de contenu riche**.

Ses particularités :
- **Ouverture totale :** TOUS les acteurs de l'école (élèves, parents, professeurs, administration) peuvent créer et soumettre des articles.
- **Format Éditorial :** Textes longs, mise en page riche (gras, puces, liens), images de couverture, tags.
- **Sécurité et Modération :** Pour prévenir tout contenu inapproprié ou fautes d'orthographe majeures sur un espace public, le contenu produit par les élèves et les parents est soumis à un processus de validation (modération) avant publication.

---

## 2. Modèle de Données (Base de Données)

Création d'un nouveau modèle MongoDB `Article` (ex: `app/api/_/models/ai/Article.js`), totalement distinct du modèle `Post`.

### Schéma `Article`
*   `title` : String (Titre principal de l'article).
*   `content` : String (Contenu de l'article, stocké en HTML ou Markdown).
*   `coverImage` : String (URL Cloudinary optionnelle de l'image de couverture).
*   `authorId` : String (clerkId de l'auteur).
*   `authorName` : String.
*   `authorRole` : String (`'admin'`, `'prof'`, `'eleve'`, `'parent'`). Permet d'afficher un badge à côté du nom.
*   `status` : Enum (`'DRAFT'`, `'PENDING_REVIEW'`, `'PUBLISHED'`, `'REJECTED'`). 
*   `tags` : Array of Strings (Catégories : ex: *"Sortie scolaire"*, *"Science"*, *"Opinion"*).
*   `publishedAt` : Date (Date de parution effective, null si non publié).
*   `createdAt`, `updatedAt` : Date.

---

## 3. Workflow de Publication et Modération

Pour garantir la qualité et la sécurité du contenu affiché à toute l'école :

1. **Création par un Professeur ou Administrateur :**
   - Peut sauvegarder en brouillon (`DRAFT`).
   - Peut publier directement sans validation (`PUBLISHED`).

2. **Création par un Élève ou un Parent :**
   - Peut sauvegarder en brouillon (`DRAFT`).
   - S'il clique sur "Soumettre", l'article passe en `PENDING_REVIEW`. Il n'est pas encore visible sur le blog public.
   - Les professeurs et administrateurs reçoivent une notification / voient un badge "Articles à valider".

3. **La Modération (Interface Staff) :**
   - Un enseignant/admin lit l'article en attente.
   - Il a 3 options :
     - **Approuver :** Le statut passe à `PUBLISHED`.
     - **Modifier :** Le modérateur peut corriger de petites fautes d'orthographe directement, puis publier.
     - **Rejeter :** Le statut passe à `REJECTED` (avec un champ de commentaire optionnel pour expliquer le refus).
   - Lors de la publication ou du rejet, l'auteur original reçoit une notification.

---

## 4. Interface Utilisateur (UI/UX)

### A. Le Portail du Blog (`/blog`)
- **Affichage :** Grille type "Masonry" ou liste de cartes (Cards).
- **Cartes d'article :** Affichage de l'image de couverture en haut, du titre, d'un résumé (truncate text), des tags, et du badge de l'auteur (ex: 🎓 Élève: *Jean Dupont*).
- **Navigation :** Barre de filtres en haut (filtrer par tags, par rôle d'auteur, barre de recherche textuelle).
- **Action principale :** Un gros bouton "✍️ Rédiger un article" flottant ou bien visible.

### B. L'Éditeur d'Article (`/blog/edit/[id]`)
- Utilisation d'un éditeur "Rich Text" simple (ex: *React Quill*, *TipTap*, ou un éditeur Markdown avec prévisualisation) pour permettre le formatage (Gras, Listes, Citations).
- Un module d'upload Cloudinary spécifique pour uploader l'image de couverture `coverImage`.
- Boutons d'action selon les permissions : "Sauvegarder Brouillon" et "Soumettre pour relecture" (ou "Publier").

### C. La Vue Lecture (`/blog/[id]`)
- Page épurée, focus sur la lecture.
- En-tête large (Hero banner) avec l'image de couverture.
- Boutons de partage interne ou de "J'aime" (optionnel en V2).

### D. Le Tableau de Bord "Mes Articles" et "Modération"
- **Auteurs :** Un onglet "Mes publications" pour voir ses brouillons, articles publiés, ou articles refusés.
- **Staff (Profs/Admins) :** Une file d'attente (Queue) de modération pour lister les articles en `PENDING_REVIEW`.

---

## 5. Étapes d'Implémentation Recommandées

1. **Modèles & API :**
   - Câbler le modèle `Article`.
   - Développer les routes `GET /api/articles` (avec filtre public pour tout le monde, et filtre `status` pour les admins).
   - Développer les routes `POST` et `PATCH` gérant le cycle de vie de la modération.

2. **Composant d'Édition Riche :**
   - Intégrer la librairie de texte riche de votre choix dans le formulaire de création d'article.
   - Assurer le lien avec l'API Cloudinary pour l'image de mise en avant.

3. **Pages Publiques :**
   - Développer le listing `/blog` et la page de détail `/blog/[id]`.

4. **Module de Modération (Admin/Prof) :**
   - Créer le tableau de modération, accessible via le menu d'administration ou le dashboard enseignant.
