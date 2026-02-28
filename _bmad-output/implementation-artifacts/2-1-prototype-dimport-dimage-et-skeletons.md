# Story 2.1: Prototype d'Import d'Image et Skeletons

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Teacher,
I want pouvoir prendre en photo ma liste de notes ou uploader un fichier avec un feedback visuel de chargement non bloquant,
so that je puisse initier la Saisie Magique en toute confiance, même sur mobile.

## Acceptance Criteria

1. **Given** qu'un Enseignant clique sur "Scanner une classe"
   **When** il sélectionne une image
   **Then** un composant ProcessLoader (Skeleton élégant) s'affiche immédiatement
2. **Given** une perte de connexion réseau
   **When** l'Enseignant prend une photo
   **Then** l'image est mise en cache localement et synchronisée automatiquement au retour de la connexion

## Tasks / Subtasks

- [x] Task 1: Implémenter l'interface d'Import/Upload d'image (Mobile First) (AC: 1)
  - [x] Créer le bouton "Scanner une classe" utilisant la couleur Accent Orange
  - [x] Gérer la sélection de fichier avec support de la caméra sur mobile (`capture="environment"`)
- [x] Task 2: Créer le composant isolé `<ProcessLoader />` (AC: 1)
  - [x] Implémenter le composant dans `app/components/ui/ProcessLoader.jsx` (ou similaire)
  - [x] Utiliser des animations CSS basées sur le Design Token "Classic Premium" (shimmer effect, pas de spinner bloquant)
- [x] Task 3: Mise en place de la tolérance hors-ligne basique (AC: 2)
  - [x] Gérer l'état réseau du navigateur pour détecter les coupures
  - [x] Mettre en cache localement (simulé ou via localStorage/IndexedDB pour une PoC) l'image avant l'envoi

## Dev Notes

**Technical Requirements:**
- Refonte "Zero-Waste" globale : N'ajoutez pas de librairies UI externes lourdes (pas de Material UI, Ant Design).
- "Render-Storm Free" : Utilisez `useMemo` et limitez les JSX store states si vous touchez aux Contextes.
- Optimistic UI & Asynchronous UX : Ne bloquez jamais le thread principal avec des traitements lourds ; utilisez les composants asynchrones avec états isolés.
- Composant réutilisable pur: `<ProcessLoader />` doit être sans état métier complexe.

**Architecture Compliance:**
- Suivez l'architecture Design Token Sass (Thème Classic Premium ERP). L'accent doit être sur l'orange vif pour les Call To Actions (Boutons d'upload), et un fond Navy profond pour la navigation (qui existe peut-être déjà).
- L'approche "Photo-to-Web" est primordiale, privilégiez le Touch-friendly.

**Library Framework Requirements:**
- Next.js 15 (App Router), React 19.
- Styling : Sass modularisé (`app/assets/scss/`). N'utilisez des couleurs hardcodées sous aucun prétexte. Utilisez les variables.

**Testing Requirements:**
- Mettre en place un test visuel clair sur l'état "chargement" pour valider l'absence de blocage de l'interface par le `<ProcessLoader />`.
- Tester la coupure du réseau via les dev tools pour vérifier la mise en cache (offline resilience).

### Project Structure Notes

- Création du ou des composants UI dans les dossiers existants (ex: `app/components/ui/` si présent, ou `app/components/`).
- Stylisation dans `app/assets/scss/components/`.

### References

- [Epic 2](file:///home/nihongo/Bureau/BMAD/schoolManagment___PROJECT/_bmad-output/planning-artifacts/epics.md#epic-2-saisie-magique-des-notes-le-différenciateur-enseignant)
- [PRD - NFR-REL-1 (Offline Tolerance)](file:///home/nihongo/Bureau/BMAD/schoolManagment___PROJECT/_bmad-output/planning-artifacts/prd.md)
- [UX Design Specification - Component Strategy](file:///home/nihongo/Bureau/BMAD/schoolManagment___PROJECT/_bmad-output/planning-artifacts/ux-design-specification.md)

## Dev Agent Record

### Agent Model Used
antigravity-1.0

### Debug Log References
- Git history checked showing recent epic 1 completion and module updates. No previous story learnings found for Epic 2 (this is the first story).

### Completion Notes List
- ✅ Implemented ImageScanner and ProcessLoader components with mobile-first approach.
- ✅ Added 'Scanner une classe' button with camera support.
- ✅ Integrated offline fallback UI with mock caching.
- ✅ Applied Classic Premium Design token styles.
- ✅ Resolved code review findings (Memory leaks, synchronous alert block, mock local storage).
- ✅ Added unit test files.

### File List
- `app/components/ui/ProcessLoader.jsx`
- `app/assets/scss/components/LOADERS/processLoader.scss`
- `app/components/ui/ImageScanner.jsx`
- `app/assets/scss/components/FORMS/imageScanner.scss`
- `app/components/ClasseDetailContent.jsx`
- `app/assets/scss/index.scss`
- `app/components/ui/__tests__/ProcessLoader.test.jsx`
- `app/components/ui/__tests__/ImageScanner.test.jsx`
