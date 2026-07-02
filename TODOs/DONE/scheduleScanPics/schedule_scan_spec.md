# Spécification : Scan et Photo d'Emploi du Temps

Ce dossier contient les exemples visuels (`.jpeg`) des emplois du temps actuels de l'école (CP1 au CM2) qui vont nous servir de base de test pour cette fonctionnalité.

## 1. Objectif de la Fonctionnalité

Permettre à un professeur ou à un administrateur d'ajouter rapidement l'emploi du temps d'une classe en fournissant directement le format visuel "brut" (Photo, Scan, ou PDF). L'objectif est d'offrir une alternative simple (ou un complément) à la création manuelle d'un emploi du temps bloc par bloc dans l'interface de l'application.

## 2. Interface Utilisateur (Upload & Appareil Photo)

Dans le composant `ScheduleManager` ou `ScheduleEditor`, une nouvelle option sera ajoutée : **"Charger depuis un document visuel"**.

L'interface proposera deux actions :
1.  **Parcourir (Upload)** : Sélectionner un fichier PDF, JPG ou PNG depuis l'ordinateur/téléphone.
2.  **Prendre une photo** : Utilisation de l'appareil photo du terminal. 
    *   **⚠️ Règle technique cruciale** : Nous ne devons **pas recréer** de nouveau composant React d'accès à la caméra s'il en existe déjà un dans le projet (ex: celui qui a été codé pour prendre la photo de profil des élèves ou le scan des bilans de composition). Ce composant doit être rendu réutilisable (`<CameraCapture onCapture={handleImage} />`).

## 3. Stockage et Base de Données

Dans la base de données (`Schedule`), on ajoutera un champ pour stocker le lien vers l'image/PDF de l'emploi du temps brut :
```javascript
mediaSourceUrl: { type: String, default: null } // URL de l'image (S3, Cloudinary, ou local public)
```

## 4. Affichage dans le Viewer (ScheduleViewer)

Lorsqu'un parent ou un élève consulte l'emploi du temps de sa classe :
*   Si le composant détecte qu'un `mediaSourceUrl` existe, il affichera prioritairement ou proposera un bouton bien visible **"Voir le document original"** qui ouvrira l'image (ou le PDF) en plein écran dans une modale de prévisualisation fluide.

## 5. (Évolution Future) Traitement par l'IA

Puisque nous disposons de nombreuses images d'exemples dans ce dossier (`CM1-CM2_a.jpeg`, etc.), la prochaine étape logique de cette fonctionnalité sera de connecter l'upload de cette image à un modèle d'IA multimodale (comme OpenAI Vision ou Gemini Pro Vision). 
L'IA se chargera de "lire" la photo et de remplir automatiquement la structure de données `Schedule` (les horaires, matières, etc.) sans que le professeur n'ait rien à taper à la main. L'image restera disponible comme "preuve" ou "secours".
