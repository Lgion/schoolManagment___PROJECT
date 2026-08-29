# Spécification : Génération des Bulletins et Bilans Annuels

La génération de bulletins scolaires (trimestriels/semestriels) et de bilans annuels en PDF est une fonctionnalité majeure. Elle nécessite de consolider les notes, les appréciations, et de formater le tout de manière officielle.

## 1. Modèle de données (Prérequis)

L'architecture actuelle du projet utilise un modèle **imbriqué** où les notes sont stockées directement à l'intérieur de l'objet de l'Élève.
Nous n'avons donc pas besoin de collections `Evaluation` ou `Grade`.

**Structure actuelle des notes (Dans `Eleve`) :**
```javascript
eleve.compositions = {
  "2023-2024": [ // Année
    { // Trimestre 1 (Index 0)
      "_locked": true,
      "officiel": {
        "16987654321": { // Timestamp de l'évaluation
          "Matiere_ID_1": { "note": 14, "sur": 20 },
          "Matiere_ID_2": { "note": 8.5, "sur": 10 }
        }
      }
    }
  ]
}
```

**Nouvelle Collection `ReportCard` (Le Bulletin Officiel archivé) :**
Plutôt que de recalculer le bulletin à chaque fois qu'un parent clique dessus, il est indispensable de figer les données une fois générées.
*   `id` : Identifiant unique
*   `studentId` : Référence vers l'élève
*   `classId` : Référence vers la classe
*   `period` : Période concernée (ex: `"TRIMESTRE_1"`, `"ANNUEL"`)
*   `schoolYear` : Année scolaire (ex: `"2024-2025"`)
*   `globalAverage` : La moyenne générale de l'élève calculée à ce moment-là (très utile pour des requêtes statistiques ultérieures).
*   `subjectAppreciations` : Objet contenant l'appréciation du professeur pour chaque matière (ex: `{ "Maths_ID": "Bon travail", "Histoire_ID": "En progrès" }`).
*   `generalAppreciation` : Le commentaire global (personnalisé pour cet élève précis) pour ce trimestre ou ce bilan annuel.
*   `pdfUrl` : L'URL du fichier PDF généré et stocké de manière persistante.

## 2. Logique Backend (API & Génération PDF)

C'est ici que réside la complexité technique. Le backend doit calculer les moyennes depuis la structure imbriquée et dessiner le PDF.

*   `POST /api/classes/{classId}/report-cards/generate` : Déclenche la génération pour toute la classe.
    *   **Étape 1 (Calculs) :** Le backend boucle sur tous les élèves de la classe. Pour chaque élève, il calcule la moyenne par matière (en ramenant la note sur 20) et la moyenne générale. **Ensuite**, il consolide les statistiques de la classe (Moyenne de la classe, Meilleure note, Moins bonne note par matière) afin d'imprimer ces comparatifs sur le bulletin de chaque élève.
    *   **Étape 2 (Génération PDF) :** Le backend utilise une librairie (comme `Puppeteer` pour convertir un template HTML/CSS, ou `PDFKit`) pour créer un document visuel aux normes de l'école (Logo, En-tête, Tableau des notes, Signatures).
    *   **Étape 3 (Stockage) :** Le PDF de chaque élève est envoyé sur le stockage Cloud.
    *   **Étape 4 (Sauvegarde) :** L'URL du PDF est sauvegardée dans la collection `ReportCard`.

*   `GET /api/classes/{classId}/report-cards?period=T1` : Récupérer la liste des bulletins générés.
*   `POST /api/classes/{classId}/report-cards/download-zip` : (Optionnel) Compresser tous les PDF de la classe dans un fichier `.zip` pour que le prof puisse tout imprimer en un clic.

## 3. Interface Utilisateur (Frontend / Vues)

**Côté Professeur (Sur la page de la classe) :**
*   **Onglet "Bulletins & Évaluations" :**
*   **Saisie des appréciations :** Avant de générer les PDF, un écran de saisie liste tous les élèves de la classe. Pour chaque élève, le professeur peut :
    *   Saisir une appréciation pour chaque matière.
    *   Saisir l'appréciation globale du trimestre (ou de l'année) spécifiquement pour cet élève.
    *   *Banque de phrases (UI)* : Pour gagner du temps, l'interface propose une "banque d'appréciations" (menu déroulant ou tags cliquables avec des phrases comme "Bon trimestre", "Manque de concentration", "Élève appliqué"). Cliquer dessus insère le texte automatiquement, modifiable à souhait.
*   **Boutons d'action rapides :** 
    *   `[ Générer les bulletins du Trimestre ]` (Bouton d'action principal).
    *   `[ Générer le Bilan Annuel ]` (Bouton secondaire).
    *   Au clic, une modale de confirmation demande : "Êtes-vous sûr ? Cette action calculera les moyennes et créera les fichiers PDF."
*   **État de chargement :** La génération de 30 PDF peut prendre quelques secondes. Il faut un écran de chargement ("Génération en cours... 12/30").

**Côté Élève / Parent :**
*   **Onglet "Mes Bulletins" :** Une interface très épurée listant les années scolaires et les trimestres.
*   **Bouton de téléchargement :** Un clic sur "Trimestre 1" ouvre le PDF généré directement dans le navigateur ou lance le téléchargement.

## 4. Génération de grille de saisie vierge (PDF)
Afin de faciliter la saisie manuelle des notes pour les professeurs qui préfèrent utiliser le papier, le système doit permettre de générer une **grille de bilan vierge**.
*   **Fonctionnement :** Le professeur clique sur "Imprimer la grille de saisie". Le backend génère un PDF contenant un tableau avec le nom de tous les élèves de la classe en ligne, et des colonnes vides pour les matières (ou pour une composition spécifique).
*   **Intégration au flux existant :** Le professeur peut imprimer ce PDF, le remplir à la main (notes au stylo), puis utiliser la fonctionnalité *déjà existante* de l'application (le scanner IA) pour photographier cette grille. L'IA lira les notes inscrites et pré-remplira l'interface pour validation.

## 5. Bilan Synthétique de la Classe (Conseil de Classe)
En plus des bulletins individuels, le système génère un document global représentant la synthèse de toute la classe.
*   **Différence avec le bilan d'élève :** Le bulletin d'élève est destiné aux parents et se concentre sur un seul enfant. Le "Bilan de Classe" est un outil administratif (pour le conseil de classe, la direction, ou le professeur principal). Il ne liste pas seulement les notes, mais donne une vue d'ensemble : moyenne générale de la classe, distribution des moyennes (combien d'élèves ont >15, entre 10-15, etc.), liste des élèves avec les mentions (Félicitations, Encouragements) et le comportement global.
*   **Données (Modèle) :** Tout comme les bulletins individuels, ce bilan ne nécessite pas de nouvelle collection complexe. Le backend calcule cette synthèse à la volée à partir de `eleve.compositions`. On stockera uniquement le PDF final (et éventuellement l'appréciation globale du professeur sur l'ambiance de la classe) dans la collection de la classe ou dans `ReportCard` avec un flag `isClassSummary: true`.
*   **Implémentation Backend :** 
    *   L'API `POST /api/classes/{classId}/report-cards/class-summary` récupère tous les élèves.
    *   Elle calcule les moyennes par matière pour la classe entière, identifie la note la plus haute et la plus basse.
    *   Génère un PDF formaté sous forme de tableau de bord (avec éventuellement des graphiques de répartition) et un tableau récapitulatif des élèves.
*   **Implémentation UI :** Sur la page de la classe, un bloc dédié "Synthèse de classe" permet au professeur de taper un commentaire global ("Classe dynamique mais bavarde...") puis de cliquer sur `[ Générer le Bilan de la Classe ]`.
