# Spécification Technique : Visioconférence, Événements en Direct et Galerie Média

## 1. Objectifs de la Fonctionnalité
*   **Visioconférence Basique :** Permettre de lancer des visioconférences pour l'école globale (réunions d'équipe) et pour chaque classe (cours à distance).
*   **Visioconférence d'Événement :** Permettre de lier un salon de visio à un `Event` (Événement) existant pour le diffuser en direct (ex: Spectacle de fin d'année, Réunion parents-profs).
*   **Capture de Souvenirs (Photos) :** Intégrer un outil (bouton) directement dans l'interface de visio permettant de prendre des photos de l'écran en direct.
*   **Stockage Cloud :** Générer dynamiquement un dossier Cloudinary pour chaque visio/événement et y sauvegarder automatiquement les captures.
*   **Galerie Historique :** Créer une vue globale répertoriant tous les événements et leurs photos, filtrable par année scolaire et triée de manière chronologique (du plus récent au plus ancien).

## 2. Choix Technologiques
*   **Moteur de Visioconférence :** **Jitsi Meet API / React SDK**. Permet une intégration sans couture, est gratuit, et offre la possibilité de manipuler l'interface utilisateur pour y injecter nos propres boutons (comme le bouton de capture).
*   **Stockage Média :** **Cloudinary**. Utilisé pour la création de dossiers dynamiques et l'hébergement sécurisé des images.
*   **Capture d'écran (Snapshot) :** Utilisation de l'API HTML5 `<canvas>` ou des méthodes intégrées du SDK vidéo pour extraire une frame (image) du flux vidéo au moment du clic.

## 3. Modèle de Données (Base de Données)

### Mise à jour de la collection `Event`
Il faut ajouter des champs à l'événement pour gérer la visio et les médias associés :
*   `hasVisio` : Boolean (indique si un lien de direct est activé pour cet événement).
*   `visioRoomName` : String (le nom unique et cryptique du salon Jitsi généré).

### Nouvelle collection `MediaAlbum` (ou ajout d'un tableau de médias dans `Event`)
Pour gérer la galerie et les dossiers Cloudinary de façon propre :
*   `id` : Identifiant unique de l'album.
*   `title` : Titre (hérité de l'événement ou de la classe).
*   `date` : Date de la session.
*   `academicYear` : String (ex: `"2025-2026"`), crucial pour le filtrage dans la galerie.
*   `cloudinaryFolder` : String (Chemin exact du dossier, ex: `schoolManagement/events/2025_2026/kermesse_123`).
*   `images` : Array of Strings (URLs des photos Cloudinary).
*   `eventId` : Référence optionnelle à la collection `Event`.
*   `classId` : Référence optionnelle si la visio était liée à une classe hors événement.

## 4. Interface Utilisateur (UI/UX)

### A. Lancement et Accès à la Visio
*   **Page d'un Événement :** Si `hasVisio` est vrai, un gros bouton pulsant "🔴 Rejoindre le Direct" apparaît.
*   **Pages Classes/École :** Boutons standards "Lancer la visio" (seulement visibles pour le staff pour lancer, et pour les élèves/parents pour rejoindre).

### B. Le Studio Visio (L'interface en direct)
*   L'interface Jitsi est intégrée en mode plein écran ou dans une modale large.
*   **Bouton Capture (Action Custom) :** Une surcouche (Overlay) React affiche un bouton "📸 Prendre une photo".
*   Lors du clic :
    1.  Animation flash blanche type appareil photo.
    2.  Notification Toast : *"Photo enregistrée dans l'album de l'événement !"*

### C. La Galerie des Souvenirs
*   **Nouvelle page `/gallery` ou `/events-gallery`**.
*   **En-tête :** Sélecteur d'année scolaire (par défaut l'année en cours).
*   **Contenu :** Une liste sous forme de cartes (Cards) d'albums. Chaque carte représente un événement ayant des photos.
*   **Tri :** Automatiquement trié par `date` décroissante.
*   **Interaction :** Cliquer sur un événement ouvre une grille maçonnée (Masonry Grid) ou un carrousel listant toutes les photos prises lors de cette visio.

## 5. Logique Métier (Flux de Capture)
1. L'utilisateur (Hôte/Prof) clique sur le bouton 📸.
2. Le frontend capture l'image en Base64.
3. Le frontend envoie l'image au backend : `POST /api/media/event/:eventId/snapshot`.
4. Le backend :
   - Vérifie si le dossier Cloudinary de l'événement existe, sinon il le crée.
   - Uploade l'image Base64 vers ce dossier spécifique.
   - Récupère l'URL sécurisée Cloudinary.
   - Met à jour le document `MediaAlbum` (ou `Event`) en base de données en ajoutant l'URL au tableau `images`.
5. Le backend renvoie un succès (HTTP 200).

## 6. Gestion des Permissions et Sécurité (RGPD & Médias)

La gestion des photos d'élèves est très sensible (droit à l'image, RGPD). Voici la matrice de permissions et les solutions techniques à implémenter :

### A. Autorisation de Capture (Création)
*   **Staff Uniquement :** Le bouton "📸 Prendre une photo" dans l'interface de visio **ne doit être visible que pour les rôles `ADMIN`, `PRINCIPAL` et `TEACHER`** (pour le professeur de sa propre classe).
*   Les élèves et les parents ne doivent avoir aucun moyen technique de capturer le flux via l'application.

### B. Visibilité dans la Galerie (Lecture)
*   **Albums d'École (Événement Global) :** Accessibles par tous les utilisateurs connectés de l'école (Parents, Élèves, Profs, Admins).
*   **Albums de Classe (Événement Privé) :** Strictement limités. L'accès au contenu de l'album d'une classe n'est autorisé qu'aux élèves inscrits dans cette classe, à leurs parents, et au corps professoral concerné. 
*   **UI / UX :** Au lieu de masquer totalement les albums inaccessibles, l'interface affichera la carte de l'album sous forme "Verrouillée" (icône de cadenas, miniature floutée). Au clic ou au survol, un message explicatif clair s'affichera : *"Cet album est réservé aux élèves et parents de la classe [Nom de la classe]."*.
*   **Techniquement :** La route `/api/gallery` renverra la liste des albums, mais pour les albums restreints, elle ne renverra que des métadonnées (titre, date) sans les URLs des images. Si un utilisateur tente d'accéder directement au contenu via `/api/gallery/:albumId`, l'API vérifiera les appartenances et renverra une erreur `403 Forbidden`.

### C. Modération des Médias (Suppression)
*   **Droit de suppression :** Les administrateurs et directeurs peuvent supprimer n'importe quelle photo ou album. Les professeurs peuvent gérer les médias de leurs propres classes.
*   **Action :** Un bouton "Supprimer" sur chaque photo de la galerie, déclenchant la suppression dans la base de données **ET** via l'API d'administration Cloudinary (pour effacer définitivement le fichier des serveurs).

### D. Sécurité Cloudinary (Protection des liens)
*   Par défaut, les liens Cloudinary sont publics. Pour éviter qu'une photo de l'école soit partagée publiquement sur internet, nous utiliserons le paramètre **`type: "authenticated"`** lors de l'upload vers Cloudinary.
*   **URLs Signées :** Le backend générera des URLs signées avec une durée d'expiration (ex: 1 heure) lors de l'affichage de la galerie. Si un lien d'image fuite, il sera invalide peu de temps après.
*   **Désactivation du clic-droit :** Bien que non infaillible, l'UI de la galerie inclura des protections basiques (comme le blocage du menu contextuel ou un overlay transparent) pour décourager la sauvegarde locale facile par les utilisateurs.
