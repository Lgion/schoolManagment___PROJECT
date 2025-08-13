# Spécification Technique - École Administration

## Tableau des Endpoints API

| Verbe HTTP | Endpoint | Description | Request Body | Response | Status Codes |
|------------|----------|-------------|--------------|----------|--------------|
| **GET** | `/api/school_ai/classes` | Récupère toutes les classes | - | `Array<Classe>` | 200, 500 |
| **POST** | `/api/school_ai/classes` | Crée une nouvelle classe | `{nom, niveau, annee_scolaire, ...}` | `Classe` | 201, 500 |
| **PUT** | `/api/school_ai/classes` | Met à jour une classe existante | `{_id, nom, niveau, ...}` | `Classe` | 200, 500 |
| **DELETE** | `/api/school_ai/classes` | Supprime une classe | `{_id}` | `{success: true}` | 200, 500 |
| **GET** | `/api/school_ai/eleves` | Récupère tous les élèves | - | `Array<Eleve>` | 200, 500 |
| **POST** | `/api/school_ai/eleves` | Crée un nouvel élève | `{nom, prenom, sexe, current_classe, ...}` | `Eleve` | 201, 500 |
| **PUT** | `/api/school_ai/eleves` | Met à jour un élève existant | `{_id, nom, prenom, ...}` | `Eleve` | 200, 500 |
| **DELETE** | `/api/school_ai/eleves` | Supprime un élève | `{_id}` | `{success: true}` | 200, 500 |
| **GET** | `/api/school_ai/enseignants` | Récupère tous les enseignants | - | `Array<Teacher>` | 200, 500 |
| **POST** | `/api/school_ai/enseignants` | Crée un nouvel enseignant | `{nom, prenom, matiere, ...}` | `Teacher` | 201, 500 |
| **PUT** | `/api/school_ai/enseignants` | Met à jour un enseignant existant | `{_id, nom, prenom, ...}` | `Teacher` | 200, 500 |
| **DELETE** | `/api/school_ai/enseignants` | Supprime un enseignant | `{_id}` | `{success: true}` | 200, 500 |
| **POST** | `/api/school_ai/media` | Upload de fichiers média | `FormData{file, type, payload, ...}` | `{paths: Array<string>}` | 200, 500 |

## Architecture Technique

### **Gestionnaire localStorage**
- **Priorité absolue** : Récupération des données depuis localStorage
- **Système de fallback** : API REST si données absentes du localStorage
- **Contexte** : `AiAdminContext` gère toutes les opérations CRUD et localStorage
- **Protection SSR** : Vérifications `typeof window !== 'undefined'` pour tous les accès localStorage

### **Structure des données**
- **Classes** : `{_id, nom, niveau, annee_scolaire, photo, ...}`
- **Élèves** : `{_id, nom, prenom, sexe, current_classe, ...}`
- **Enseignants** : `{_id, nom, prenom, matiere, ...}`

### **Composants React BEM**
- Nomenclature BEM stricte pour tous les composants
- Transmission de données via props entre composants BEM
- HTML sémantique avec accessibilité ARIA et RG2A
- Micro data et potentiel tagging Google Analytics

### **Styles SCSS**
- Variables de thèmes définies
- Minimum 2 polices de caractères
- Composants imbriqués en BEM
- CamelCase privilégié (éviter les tirets)

### **Navigation**
- ViewTransition pour la navigation entre pages
- Liens Next.js pour optimisation des performances

### **ORM**
- **Prisma** prêt à l'emploi (schéma défini)
- **MongoDB** comme base de données
- **Mongoose** pour les modèles de données

### **Authentification**
- **Clerk** pour l'authentification utilisateur
- Instance User stockée dans localStorage si connecté
- Gestion des rôles admin via email

### **CDNs utilisés**
- **Icons** : FontAwesome
- **Typographie** : Google Fonts
- **CSS Libraries** : ShadCN, Foundation, Bootstrap
- **UI Kits** : Google, Alibaba, IBM Design Systems
- **JS Libraries** : Animation, Confetti, Underscore

## Mots-clés SEO
*Fichier .seo à générer automatiquement par l'IA*

- école administration
- gestion scolaire
- élèves enseignants
- classes niveau
- système éducatif
- plateforme pédagogique