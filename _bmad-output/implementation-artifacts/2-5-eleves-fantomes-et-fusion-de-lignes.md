# Story 2.5: Élèves Fantômes et Fusion de Lignes

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Teacher,
I want ignorer une ligne reconnue par erreur ou créer "à la volée" un élève absent de la base, depuis l'écran de révision,
so that je ne sois pas bloqué par une erreur de l'IA et puisse finaliser toute ma liste en une seule fois.

## Acceptance Criteria

1. **Given** une ligne "Fatoumata B." non reconnue dans la base (incertitude haute de l'IA sur le matching Élève/Nom)
   **When** l'Enseignant clique sur l'action de ligne dans la ReviewModal
   **Then** il peut ignorer la ligne (la retirer des résultats) ou l'associer à un profil existant/nouveau
2. **Given** la grille entièrement révisée
   **When** l'Enseignant clique sur "Valider & Publier"
   **Then** l'API `/api/school_ai/publish_notes` est appelée avec les notes validées
   **And** la modale se ferme élégamment et un Toast de Succès met fin au flux, mettant à jour la classe sans la recharger (Optimistic UI)

## Tasks / Subtasks

- [ ] Task 1: Action contextuelle d'Ignorer une ligne
  - [ ] Ajouter un bouton/icône "Ignorer" (corbeille ou croix) sur les lignes de la `ReviewModal` (ou dans `ReviewCell`).
  - [ ] Implémenter la suppression locale dans `extractedData` pour que la ligne disparaisse instantanément.

- [ ] Task 2: Création / Assignation "à la volée"
  - [ ] Pour les élèves "introuvables", afficher un UI (menu déroulant ou petit formulaire inline) proposant de lier cette note à un élève existant qui n'aurait pas été matché.
  - [ ] (Optionnel selon l'état du backend) Permettre la création d'un élève directement si l'API le supporte, ou au minium l'assignation manuelle.

- [ ] Task 3: Validation Finale et Publication ("Valider & Publier")
  - [ ] Brancher le bouton "Valider & Publier" de la `ReviewModal` pour envoyer le payload des notes propres au backend.
  - [ ] Gérer l'état de chargement asynchrone (Disable button + indicator) pendant l'appel API.
  - [ ] Afficher un toast de succès vert ("Notes publiées avec succès") en utilisant le design system.
  - [ ] Fermer la modale et déclencher le rafraîchissement optimiste des données de la classe parente.

## Dev Notes

### Technical Requirements
- **NFR-PERF-1**: L'action "Ignorer" doit être instantanée (modification du state local de la modale) sans aucun rechargement.
- **Payload Management**: S'assurer que les lignes ignorées ou les élèves non associés soient exclus ou traités correctement avant l'envoi du payload JSON final à l'API.

### Architecture Compliance
- **Component Abstraction Strategy**: Garder les modifications encapsulées. Si une petite interface de "matching" est nécessaire, créer un sous-composant plutôt que d'enfler `ReviewModal.jsx`. 
- **Optimistic UI**: La validation finale doit paraître instantanée dès la fermeture de la modale.

### Previous Story Intelligence
From Story 2.4 (`2-4-gestion-des-incertitudes-soft-warnings-et-edition-de-cellule-reviewcell.md`):
- `ReviewCell.jsx` gère déjà l'édition manuelle des notes. L'ajout d'actions de ligne (Ignorer/Associer) devrait idéalement se situer au niveau de la ligne parente dans `ReviewModal.jsx` ou via une extension de la cellule de *Nom* (pas la cellule de note). 
- **⚠️ Leçon retenue (Code Review 2.4) :** Assurez-vous de bien mettre à jour l'état *parent* (`extractedData` dans `ReviewModal`) si vous modifiez/supprimez une ligne, en gardant la synchronisation avec les `Refs` si elles sont utilisées pour pallier aux bugs de "stale state" identifiés précédemment.
- **⚠️ Règles de Validation :** La borne des notes est strictement validée en front (`0` à `20`). Assurez-vous que les associations à la volée ne brisent pas cette validation.

### Library & Framework Requirements
- Utiliser les utilitaires existants pour les Toasts si disponibles, sinon implémenter un composant discret en React Portal ou au sein du layout général.

### Testing Requirements
- Mettre à jour (ou créer) un test Playwright E2E pour couvrir le flux : Ouvrir modale -> Ignorer une ligne -> Valider & Publier -> Vérifier que la note ignorée n'est pas dans le payload.

### References
- [Epic 2 - Saisie Magique](file:///home/nihongo/Bureau/BMAD/schoolManagment___PROJECT/_bmad-output/planning-artifacts/epics.md#epic-2-saisie-magique-des-notes-le-différenciateur-enseignant)
- [UX Design Specification - User Journey Flows](file:///home/nihongo/Bureau/BMAD/schoolManagment___PROJECT/_bmad-output/planning-artifacts/ux-design-specification.md#1-le-parcours-saisie-magique-teacher-photo-to-web-flow)

## Dev Agent Record

### Agent Model Used
antigravity-1.0

### Debug Log References
- Extrait des epics pour la définition de la story 2.5
- Analyse de l'architecture "Zero-Wait" et de l'UX "Pardonner et Accompagner"
- Récupération des leçons de la Story 2.4 (bug de stale-state, validation)

### Completion Notes List
- Intégration des flux de sortie propres et asynchrones pour finaliser la Saisie Magique (Toast + Close Modal).
- Démonstration de l'exigence UX d'accompagnement (Human-in-the-Loop) face aux échecs IA.

### File List
- `app/components/ui/ReviewModal.jsx` (Modification pour Actions de Ligne et Submit)
- `tests/e2e/story-2-5-fantomes-fusion.spec.ts` (Nouveau test)
