# Spécification : Système de Bons Points

## 1. Modèle de données (Base de données)

Pour garantir la traçabilité, nous utiliserons un système d'historique de transactions plutôt qu'un simple compteur.

**Collection `PointTransaction` (Historique) :**
*   `id` : Identifiant unique de la transaction
*   `studentId` : Référence vers l'élève
*   `teacherId` : Référence vers le professeur
*   `classId` : Référence vers la classe (optionnel, mais utile pour les stats)
*   `amount` : Nombre entier (ex: `+1`, `+5`, `-2`)
*   `labelId` : Référence vers la catégorie (voir ci-dessous)
*   `comment` : Texte optionnel pour apporter une précision supplémentaire
*   `createdAt` : Date et heure de la transaction

**Collection `PointLabel` (Catégories de Bonus/Malus) :**
*   `id` : Identifiant unique
*   `name` : Nom de la catégorie (ex: "Participation", "Entraide", "Bavardages")
*   `type` : Enumérateur `"BONUS"` | `"MALUS"`
*   `icon` : (Optionnel) Emoji ou nom d'icône pour l'UI (ex: 🌟, 💬, ⚠️)

*Note : Le total des points d'un élève peut être calculé dynamiquement ou stocké en cache dans son entité `Student`.*

## 2. Logique Backend (API)

*   `GET /api/points/labels` : Récupérer la liste des catégories pré-définies de bonus/malus.
*   `POST /api/points/award` : Attribuer ou retirer des points. 
    *   *Payload : `[studentIds]`, `labelId`, `amount` (optionnel si surcharge), `comment` (optionnel).*
*   `GET /api/students/{id}/points` : Récupérer le solde actuel de l'élève.
*   `GET /api/students/{id}/points/history` : Récupérer l'historique complet des bonus/malus.

## 3. Interface Utilisateur (Frontend / Vues)

**Côté Professeur :**
*   **Modale d'attribution :** Lors de l'attribution de points, le prof doit en premier lieu sélectionner un `Label` (la catégorie) sous forme de tags visuels cliquables (vert pour les bonus, rouge pour les malus).
*   **Vue Liste de classe :** Possibilité de voir le total des élèves d'un coup d'œil.
*   **Action groupée (Bulk) :** Pouvoir cocher plusieurs élèves et leur appliquer le même label de bonus/malus en une seule action (ex: tout un groupe de travail).

**Côté Élève / Parent :**
*   **Dashboard :** Un widget très visuel mettant en avant le solde total de "Bons Points".
*   **Historique :** Une liste lisible détaillant chaque transaction. Ex : *"+1 point - Participation (M. Dupont) le 12/06"*.

## 4. Améliorations UX et Gamification (Optionnel)
*   **Paliers / Récompenses :** Définir des seuils (ex: 20 points) qui débloquent des images virtuelles ou badges pour l'élève.
*   **Micro-animations :** Effets visuels (confettis, sons) lorsqu'un élève consulte son profil et découvre qu'il a gagné de nouveaux points.
