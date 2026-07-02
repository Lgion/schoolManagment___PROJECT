# Spécification : Livre de Classe (Album Photo / Yearbook)

Inspirée du concept de Klassbook par Klassly, cette fonctionnalité permet de créer un album photo souvenir de l'année scolaire. Elle se décline en deux niveaux : un livre global pour toute la classe, et un livre personnalisé pour chaque élève.

## 1. Modèle de données (Base de données)

L'idée principale n'est pas de dupliquer les photos, mais de s'appuyer sur les médias déjà partagés par le professeur tout au long de l'année sur le "Mur de classe" unifié (modèle `Post`), ou de permettre un upload dédié direct pour l'album.

**Collection `ClassMedia` (La source des images) :**
Pour éviter la duplication brute, l'album va puiser en priorité dans les photos du fil d'actualité. Chaque document `ClassMedia` servira de lien ou d'image propre :
*   `source` : L'origine de l'image (ex: `UPLOAD_DIRECT` pour une photo ajoutée manuellement au livre, ou `FEED_POST` pour une photo provenant de la collection `Post`).
*   `postId` : (Optionnel) Si la source est `FEED_POST`, référence directe au post du mur d'actualité.
*   `classId` : La classe concernée.
*   `tags` : Tableau des `studentId` identifiés sur la photo (crucial pour créer le livre spécifique à l'élève).
*   `inClassBook` : Booléen (`true`/`false`) indiquant si le prof a retenu cette photo pour l'album global.

**Collection `ClassBook` (Le Livre Global de la classe) :**
*   `id`, `classId`, `schoolYear`, `title`, `coverImage`.
*   `status` : `DRAFT` (En cours de sélection) ou `PUBLISHED` (Visible par tous).
*   `globalPdfUrl` : Lien vers le PDF généré pour l'ensemble de la classe.

**Collection `StudentBook` (Le Livre Individuel de l'Élève) :**
Pour conserver l'historique d'année en année (le "livre d'élève"), il faut une entité propre à l'enfant.
*   `id` : Identifiant unique.
*   `studentId` : L'élève concerné.
*   `classBookId` : Référence vers l'album de classe source.
*   `personalizedPdfUrl` : Lien vers le PDF contenant la version personnalisée (où l'algorithme a mis en avant les photos où l'élève est tagué).

## 2. Logique Backend

*   `GET /api/classes/{classId}/classbook/photos` : Récupère toutes les photos de l'année pour aider le prof à faire sa sélection.
*   `POST /api/classes/{classId}/classbook/generate-pdf` : Comme pour les bulletins, le backend compile les photos sélectionnées (`inClassBook: true`), génère une mise en page automatique (ex: 2 à 4 photos par page avec leurs légendes), et génère un fichier PDF prêt à imprimer.
*   `POST /api/classes/{classId}/classbook/generate-student-books` : **Génération des Livres d'Élèves**. Le backend boucle sur les élèves de la classe. Pour chaque `studentId`, il applique un algorithme de personnalisation : il prend la trame du livre de classe, mais modifie l'ordre des pages ou ajoute des "pages bonus" contenant les photos où ce `studentId` est tagué. Il génère un PDF unique et sauvegarde son URL dans la collection `StudentBook`.
*   `GET /api/students/{studentId}/books` : Récupère la liste de tous les `StudentBook` d'un élève (lui permettant de voir son historique sur plusieurs années).

## 3. Interface Utilisateur (Frontend)

### Côté Professeur (Édition de l'Album)
*   **Mode "Curateur" :** Sur la page de la classe, un onglet "Livre de classe".
*   **Sélection rapide :** Une interface type galerie où le prof voit toutes les photos de l'année. Il peut cocher/décocher rapidement les photos à inclure dans l'album.
*   **Identification (Tagging) :** Au survol ou clic sur une photo, le prof peut identifier les élèves présents dessus.
*   **Bouton "Publier" :** Rend le livre de classe visible aux parents.

### Côté Parent / Élève (Consultation)
*   **Onglet "Mon Livre d'Année" :** Accessible depuis le profil de l'élève.
*   **Vue Interactive :** Un affichage ludique (type livre qu'on feuillette, ou belle galerie masonry) pour voir l'album.
*   **Le Livre de l'Élève :** L'interface met particulièrement en valeur les photos où l'enfant est présent, créant un "Livre d'élève" unique d'année en année (l'élève garde accès à ses anciens livres des années précédentes).
*   **Bouton "Télécharger" :** Pour obtenir le PDF de l'album.

## 4. Lien avec les autres fonctionnalités (Synergie)
*   **Le Fil d'actualité unifié (Déjà implémenté) :** Grâce au modèle unifié `Post` fraîchement implémenté, les photos (`mediaUrls`) publiées sur le mur de la classe au cours de l'année alimenteront directement et automatiquement la galerie `ClassMedia` du professeur pour le livre de classe, lui évitant de devoir tout ré-uploader.
*   **Trombinoscope :** La première page de l'album global et individuel peut être générée automatiquement en utilisant les photos de profil des élèves de la classe.
