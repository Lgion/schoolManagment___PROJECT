# Spécification : Ajout de fichiers PDF par le Professeur

## 1. Stockage des fichiers (Infrastructure)

Concernant le stockage, **Cloudinary** est une option tout à fait viable et très rapide à mettre en place (en utilisant `resource_type: "raw"` ou `"auto"` lors de l'upload). 
Cependant, il faut garder à l'esprit que par défaut, les liens Cloudinary sont publics. Pour des ressources de cours générales, ce n'est pas un problème. Si des documents confidentiels doivent être partagés à l'avenir (ex: bulletins), il vaudra mieux s'orienter vers des solutions comme **AWS S3**, **Supabase Storage** ou **Firebase Storage** qui gèrent plus facilement les accès privés (URLs signées).

Pour cette spécification, nous partons sur un stockage cloud externe (type Cloudinary/S3) avec une URL renvoyée à la base de données.

## 2. Modèle de données (Base de données)

Il faut créer une collection pour lier le fichier uploadé à la classe concernée.

**Collection `ClassDocument` :**
*   `id` : Identifiant unique du document
*   `classId` : Référence vers la classe
*   `teacherId` : Référence vers le professeur qui a uploadé le fichier
*   `title` : Titre lisible du document (ex: "Chapitre 1 : Les fractions")
*   `fileUrl` : URL distante du fichier (générée par Cloudinary ou S3)
*   `fileSize` : (Optionnel) Taille du fichier en octets (utile pour l'affichage UI)
*   `createdAt` : Date d'ajout

## 3. Logique Backend (API)

*   `POST /api/classes/{classId}/documents` : Route d'upload.
    *   *Option A (Backend comme proxy)* : Le client envoie le fichier (via `multipart/form-data`). Le backend le reçoit, l'envoie sur Cloudinary, récupère l'`URL`, puis sauvegarde l'entrée en BDD.
    *   *Option B (Presigned URL - Plus optimisé)* : Le client demande une autorisation d'upload au backend, upload le fichier directement sur le Cloud, puis envoie juste l'`URL` au backend pour sauvegarde.
*   `GET /api/classes/{classId}/documents` : Récupérer la liste des documents d'une classe.
*   `DELETE /api/classes/{classId}/documents/{docId}` : Supprimer le document. Le backend doit supprimer l'entrée en base de données **ET** déclencher la suppression du fichier sur Cloudinary.

## 4. Interface Utilisateur (Frontend / Vues)

**Côté Professeur :**
*   **Zone de dépôt (Drag & Drop) :** Sur la page de gestion de la classe, un composant UI permettant de glisser-déposer un PDF.
*   **Formulaire de métadonnées :** Avant de valider, un champ texte permet de donner un `title` propre au document (plutôt que d'afficher le nom brut du fichier `cours_maths_vfinal_2.pdf`).
*   **Indicateur de chargement :** Une barre de progression pendant l'upload, très important pour les gros PDF.
*   **Liste de gestion :** Un tableau récapitulatif des PDF partagés avec une icône de corbeille pour les supprimer.

**Côté Élève / Parent :**
*   **Section Ressources :** Sur la page de la classe, une section dédiée "Documents de cours".
*   **Affichage :** Une liste avec le titre du document, la date d'ajout, et une icône 📄.
*   **Action :** Un clic sur le document l'ouvre dans un nouvel onglet ou lance le téléchargement (via l'attribut `target="_blank"` ou `download`).
