# Story 2.3: Interface de Validation Split-Screen (ReviewModal)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Teacher or Admin,
I want afficher simultanément la photo originale (avec zoom) et la grille extraite dans une Modale pleine page,
so that je puisse comparer visuellement le résultat de l'IA avec mon document original sans friction.

## Acceptance Criteria

1. **Given** le retour de Gemini Vision complet
   **When** la modale s'ouvre
   **Then** l'écran est divisé proprement (layout "Classic Premium" : image à gauche, liste extraite à droite)
2. **Given** l'Enseignant veut annuler l'import (s'il s'est trompé de classe ou si l'OCR a totalement échoué)
   **When** il clique sur "Basculer en Manuel" (ou Annuler)
   **Then** le processus IA est annulé, la modale se ferme, et il retourne à la DataTable standard

## Tasks / Subtasks

- [x] Task 1: Create the `<ReviewModal />` Component (AC: 1, 2)
  - [x] Implement a full-viewport modal overlay (`Fixed` or `Dialog` style).
  - [x] Create the Split-Screen layout using CSS Grid or Flexbox (Classic Premium Design System: Navy & Orange accents).
- [x] Task 2: Implement the Left Panel (Image Preview) (AC: 1)
  - [x] Accept the local `File` or `Blob` object from the `ImageScanner` component.
  - [x] Generate a local `URL.createObjectURL(file)` to display the image.
  - [x] Add basic zoom or scroll functionality so the teacher can read handwritten details clearly.
- [x] Task 3: Implement the Right Panel (Data Review) (AC: 1)
  - [x] Render the parsed `sanitizedData` (from Story 2.2) in a clean list or table format.
  - [x] Display the columns: Nom de l'élève, Note extraite.
  - [x] (Visual Prep only) Reserve space or visual indicators for the Soft Warnings (Story 2.4 will handle the actual logic and editing).
- [x] Task 4: Hook up State and Routing in Class Vue (`app/classes/[id]/page.jsx`) (AC: 2)
  - [x] Pass the successful AI extraction data from `ImageScanner` up to the parent `page.jsx`.
  - [x] Pass the localized image File reference from the client before dropping it.
  - [x] Mount `<ReviewModal />` conditionally based on the returned state.
  - [x] Implement the "Basculer en Manuel" handler to erase state and close the modal.

## Dev Notes

### Technical Requirements
- **NFR-SEC-2 (Data Ephemerality)**: The server immediately deletes the image buffer. Therefore, the frontend MUST use the local `File` object (which is picked by the user in `ImageScanner.jsx`) to display the preview. Do not attempt to fetch the image from the server.
- **Optimistic UI / Performance**: Do not use heavy React component libraries (No Material UI, No Antd) for the Modal. Use pure React and SCSS tokens.
- **Zero-Waste Component Lifecycle**: Clean up any object URLs (`URL.revokeObjectURL`) when the `<ReviewModal />` is closed or unmounted to prevent memory leaks.

### Architecture Compliance
- The `<ReviewModal />` should be an isolated component placed in `app/components/ui/`.
- Styling must follow the "Classic Premium ERP" direction outlined in the UX specs, utilizing Sass variables (`$primary-navy`, `$accent-orange`).

### Previous Story Intelligence
From Story 2.2 (`2-2-integration-de-lintelligence-artificielle-gemini-vision.md`):
- **OOM Prevention**: `ImageScanner` was modified to use `browser-image-compression`. You will need to extract both the `uploadFile` (the compressed file) or the original `file` from the `ImageScanner` state to pass it to the Modal.
- **JSON Structure**: The AI returns an array of objects: `[{nom: string, note: number, confiance: number}]`. Keep this structure in mind when designing the right panel data list.

### Project Structure Notes
- New component path: `app/components/ui/ReviewModal.jsx`
- New related SCSS path: `app/assets/scss/components/UI/reviewModal.scss` (or similar, keeping with the modular SCSS structure).

### References
- [Epic 2 - Saisie Magique](file:///home/nihongo/Bureau/BMAD/schoolManagment___PROJECT/_bmad-output/planning-artifacts/epics.md#epic-2-saisie-magique-des-notes-le-différenciateur-enseignant)
- [Architecture Decisions - Component Abstraction Strategy](file:///home/nihongo/Bureau/BMAD/schoolManagment___PROJECT/_bmad-output/planning-artifacts/architecture.md#component-abstraction-strategy)
- [UX Design - Component Strategy (ReviewModal)](file:///home/nihongo/Bureau/BMAD/schoolManagment___PROJECT/_bmad-output/planning-artifacts/ux-design-specification.md#1-reviewmodal--la-modale-split-screen-)

## Dev Agent Record

### Agent Model Used
antigravity-1.0

### Debug Log References
- Extracted local Blob URL constraints due to backend NFR-SEC-2 enforcement verified in Story 2.2 commits.

### Completion Notes List
- `<ReviewModal />` component created with Classic Premium styling scheme handling zero-waste lifecycle cleanly (`URL.revokeObjectURL(url)`).
- Modal features zooming functionality inside a grab container.
- Right panel maps out the AI extraction response preparing for actual conditional warnings in Story 2.4.
- Parent component `ImageScanner` passes the local uncompressed `file` fallback up to `ClasseDetailPage`, mitigating heavy memory footprint logic since backend deletes image blob immediately securely!

### File List
`app/components/ui/ReviewModal.jsx`
`app/assets/scss/components/MODALS/reviewModal.scss`
`app/assets/scss/index.scss`
`app/classes/[id]/page.jsx`
`app/components/ui/ImageScanner.jsx`

### Change Log
- Added `ReviewModal` component and `reviewModal` scss styling.
- Connected modal display conditionally based on `ImageScanner` result inside `classes/[id]/page.jsx`.
- **[Code Review Fix]** Refactored `<ReviewModal>` to use `createPortal` targeting `document.body` for robust stacking context, addressing styling conflict with strict `DetailPortal`.
- **[Code Review Fix]** Added `Escape` keypress listener and initial focus trap on mount for `ReviewModal` to comply with A11y expectations.
- **[Code Review Fix]** Renamed generic animation `@keyframes modal-fade-in` to `@keyframes review-modal-fade` to avoid project-level scoping conflict.
- **[Code Review Fix]** Added `ImageScanner.jsx` modification explicitly returning the full local File object into the changelog for transparency.
