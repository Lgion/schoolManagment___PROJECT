# Spécification : Jeux Pédagogiques

## 1. Concept et Accès
La plateforme proposera un écosystème de jeux et d'exercices pédagogiques adaptés au niveau scolaire des élèves, avec un accès simplifié et ouvert à tous :
*   **Accès depuis la liste des Classes :** Un bouton "Jeux pédagogiques" sera disponible sur la page générale listant toutes les classes, permettant d'accéder au catalogue global des jeux.
*   **Accès depuis la page d'une Classe :** Un bouton "Jeux pédagogiques" sera également inséré sur la page spécifique d'une classe. Les jeux affichés via ce point d'entrée seront automatiquement filtrés selon le niveau de ladite classe.
*   **Visibilité publique :** Il n'y aura aucune restriction basée sur les rôles. Tous les utilisateurs (élèves, parents, professeurs, administrateurs et visiteurs) y auront accès librement depuis ces emplacements.

## 2. Niveaux Scolaires et Génération de Contenu
Le contenu pédagogique variera en fonction du niveau de la classe :

*   **Cycle des apprentissages fondamentaux (CP1 au CE2) :**
    *   Les jeux pour ces niveaux seront des modules interactifs statiques et pré-définis (ex : calcul mental de base, jeux de lettres, logique).
    *   Ces modules seront directement intégrés au code source ou liés à une base de données d'exercices fixes.

*   **Cycle de consolidation (CM1 et CM2) - Génération par IA :**
    *   Le contenu pour ces classes plus avancées sera dynamique.
    *   Le professeur (ou l'administrateur) aura la possibilité d'ajouter (upload) des fichiers PDF correspondant à leurs cours, textes ou fiches d'exercices.
    *   **Traitement par l'IA :** Un module backend fera appel à une Intelligence Artificielle (LLM) pour lire et analyser le contenu de ces PDF.
    *   L'IA générera automatiquement des jeux pédagogiques sur-mesure (ex: QCM de compréhension de texte, textes à trous, quiz de culture générale/histoire).

## 3. Architecture et Modèles de Données (Base de données)

**Collection `EducationalGame` (Le Jeu / Quiz) :**
*   `id` : Identifiant unique.
*   `title` : Titre de l'exercice (ex: \"Quiz d'histoire - Révolution\").
*   `level` : Niveau ciblé (ex: `\"CE1\"`, `\"CM2\"`).
*   `type` : Le type de jeu (`\"STATIC\"` ou `\"AI_GENERATED\"`).
*   `classId` : (Optionnel) Si le jeu a été généré spécifiquement pour une classe via un PDF.
*   `content` : Un objet JSON contenant la configuration du jeu (questions, réponses, règles).
*   `sourcePdfId` : (Optionnel) Lien vers le document PDF ayant servi de source pour l'IA.

**Collection `StudentGameProgress` (Suivi de l'élève) :**
Afin de valoriser l'apprentissage, les scores seront enregistrés.
*   `studentId` : L'élève ayant joué.
*   `gameId` : Le jeu concerné.
*   `score` / `status` : Score obtenu, taux de réussite ou statut (`\"COMPLETED\"`).

## 4. Logique Backend (Flux de Génération IA)
1. **Upload** : Le professeur upload un PDF sur la page de sa classe CM1/CM2 (cela pourra réutiliser ou s'inspirer de la logique définie dans `pdf_uploads.md`).
2. **Extraction** : Le backend extrait le texte brut du PDF.
3. **Prompting LLM** : Le backend envoie le texte à une API d'IA avec un prompt strict demandant de renvoyer un format JSON structuré contenant des questions adaptées au niveau CM1/CM2.
4. **Enregistrement** : Le JSON reçu est sauvegardé dans la collection `EducationalGame` et devient immédiatement jouable dans la section de la classe.

## 5. Interface Utilisateur (UI)
*   **Accès Listes de Classes** : Un bouton global sur la page listant les classes pour accéder aux jeux.
*   **Composant `ClassGamesWidget`** : Un bloc ou bouton à intégrer sur la vue d'une classe.
    *   Pour les CM1/CM2, ce bloc comportera un bouton d'administration (visible uniquement pour les profs/admins) : `\"+ Générer un jeu via PDF (IA)\"`.
