# Spécification Technique : Refonte du Système d'Emploi du Temps

Ce document est la spécification technique découlant du fichier d'audit `schedule_analysis.md`. Il sert de plan d'implémentation direct pour le développement.

## 1. Modèle de Données (Mongoose)

Le fichier `app/api/_/models/ai/Schedule.js` doit être complètement restructuré pour abandonner la rigidité des jours en dur.

### Nouveau Schéma `Schedule`
*   **Supprimer** la structure actuelle `planning: { lundi: [...], mardi: [...] }`.
*   **Ajouter** un tableau d'événements :
    ```javascript
    events: [{
      dayOfWeek: { type: Number, required: true, min: 0, max: 6 }, // 0 = Dimanche, 1 = Lundi...
      startTime: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ }, // "08:15"
      endTime: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ }, // "09:10"
      type: { type: String, enum: ['COURSE', 'BREAK', 'CUSTOM_EVENT'], default: 'COURSE' },
      subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: false }, // Requis si type === 'COURSE'
      teacherId: { type: String, required: false }, // Optionnel, pour assignation directe
      notes: { type: String }
    }],
    ```
*   **Ajouter** la gestion des périodes de validité :
    ```javascript
    validFrom: { type: Date, required: true, default: Date.now },
    validUntil: { type: Date, required: false }, // Si null, c'est l'emploi du temps par défaut actif
    ```

## 2. API Endpoints (`/api/schedules/...`)

*   **GET `/api/schedules`** :
    *   Le paramètre `activeOnly=true` doit évoluer. L'API doit filtrer en fonction de la date du jour : retourner le `Schedule` où `Date.now()` est compris entre `validFrom` et `validUntil`. Si aucun ne correspond, retourner le plus récent sans date de fin.
    *   S'assurer de faire le `.populate('events.subjectId')` directement dans le backend pour éviter des requêtes supplémentaires côté client.
*   **Migration des données** : 
    *   Dans les requêtes `GET`, si l'API rencontre un ancien document (avec `planning.lundi`), elle doit le transformer "à la volée" (ou via un script de migration séparé) vers le nouveau format `events` avant de l'envoyer au client.

## 3. Architecture UI (`ScheduleViewer.jsx`)

Le composant doit abandonner le système de tableau (table) pour passer au rendu par positionnement absolu ("Absolute Positioning Model").

### A. Calcul des bornes de la grille (Dynamique)
Ne plus coder d'heures en dur. Au montage du composant :
1.  Parcourir tous les `events` pour trouver l'heure de début la plus matinale (`minTime`, ex: "07:45") et la plus tardive (`maxTime`, ex: "17:30").
2.  Arrondir ces bornes pour définir la grille (ex: Grille de 07:00 à 18:00).

### B. Moteur de rendu (Logique Mathématique)
*   **Échelle de temps** : Définir une constante, par exemple `PIXELS_PER_MINUTE = 1.5`.
*   Chaque colonne représentant un jour sera un conteneur avec `position: relative`.
*   Chaque événement (cours, pause) à l'intérieur de cette colonne sera `position: absolute`.
*   **Fonction de calcul** :
    ```javascript
    const getEventStyles = (startTime, endTime, gridStartHour = 7) => {
        const startMinutes = timeStringToMinutes(startTime) - (gridStartHour * 60);
        const durationMinutes = timeStringToMinutes(endTime) - timeStringToMinutes(startTime);
        
        return {
            top: `${startMinutes * PIXELS_PER_MINUTE}px`,
            height: `${durationMinutes * PIXELS_PER_MINUTE}px`,
            position: 'absolute',
            width: '100%'
        };
    };
    ```

### C. Affichage
*   **Les Pauses** (`type: 'BREAK'`) : Elles n'auront plus d'heures codées en dur, elles seront dessinées exactement comme les cours, mais avec un style CSS différent (ex: fond hachuré gris, classe `.scheduleViewer__break`).
*   **Suppression des requêtes redondantes** : Retirer le `fetch('/api/subjects')` de ce composant. L'objet `schedule` injecté en props doit déjà contenir toutes les données `subjectId` peuplées par l'API.

## 4. Composant d'Édition (`ScheduleEditor.jsx`)
*   Le Drag & Drop doit être mis à jour pour interagir avec le nouveau modèle mathématique absolu (les déplacements modifient les pixels, qui sont traduits en heures/minutes `HH:mm` lors de l'événement `onDrop`).
*   Ajouter des boutons pour créer spécifiquement des "Blocs de pause" (Break).
