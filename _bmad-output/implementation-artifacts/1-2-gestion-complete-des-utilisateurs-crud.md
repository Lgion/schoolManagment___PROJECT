# Story 1.2: Gestion Complète des Utilisateurs (CRUD)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an Admin,
I want créer, modifier et désactiver les profils (enseignants, élèves, parents, classes) via une interface "Render-Storm free",
so that je puisse gérer et maintenir à jour l'annuaire de l'école sans latence.

## Acceptance Criteria

1. **Given** que l'Admin est sur la vue de gestion des utilisateurs
   **When** il modifie ou ajoute un utilisateur
   **Then** l'interface se met à jour instantanément (Optimistic UI)
   **And** les données sont persistées en base
2. **Given** l'ancien code encombré
   **When** l'Admin navigue dans les listes
   **Then** l'utilisation CPU reste faible (<10%) avec la refonte propre du adminContext.js

## Tasks / Subtasks

- [x] Task 1: Refactor `adminContext.js` to eliminate "Render-Storms" (AC: 2)
  - [x] Extract component definitions (`<UpdateEleve />`, `<AjouterEleve />`, etc.) completely outside of the context Provider (never define components inside context).
  - [x] Use `useMemo` for context values to prevent unnecessary downstream re-renders across the dashboard.
  - [x] Purge orphaned legacy models (`Ecommerce.js`, `Donation.js`, `Slider.js`) from context to reduce bloat (Zero-Waste).
- [x] Task 2: Implement Optimistic UI for User Administration (AC: 1)
  - [x] Adopt optimistic state updates using React 19 / Context for adding, editing, and deleting users (Teachers, Students, Classes) before awaiting the network promise.
  - [x] Display non-blocking local Toasts (Success) for user feedback.
  - [x] Implement silent rollback with Error Toasts to revert optimistic UI on API rejection without locking the app.
- [x] Task 3: Migrate & Secure API Routes (AC: 1)
  - [x] Ensure CRUD operations for users rely on the `checkRole(Roles.ADMIN)` utility deployed in Story 1.1.
  - [x] Enforce backend Mongoose validation aligned with the frontend forms.
- [x] Task 4: UI/UX "Classic Premium ERP" Alignment (AC: 1)
  - [x] Migrate user lists to the standard airy data-table design tokens (Navy/Orange colors, use standard `<ProcessLoader />` skeletons instead of full-page blocking spinners during initial data fetch).

## Dev Notes

### Technical & Architecture Requirements
- **State Management & Optimistic UI**: The architectural constraint "Zéro Attente" (Zero-Wait) demands mutation Client-Side First. Edits and deletes must reflect instantly on the UI.
- **Render-Storm Free**: The project performance suffers from components declared inside providers holding JSX in state. Refactor these patterns strictly.
- **Styling**: Do not use hardcoded hex colors. Stick to the generated Sass Tokens (`_colors.scss` using Primary Navy `#1E3A8A` and Accent Orange `#F97316`). Maintain large Negative Spaces (Padding > 12px) in tables.

### Previous Story Intelligence
- Story 1.1 added strict RBAC validation via `utils/roles.js`. Any server requests interacting with the database MUST invoke `checkRole(Roles.ADMIN)` directly in the route handler, and handle `401/403` status codes elegantly in the frontend without breaking the Optimistic state.

### Testing Requirements
- The UI MUST function flawlessly under the mock Playwright conditions established in test architecture. The automated tests from earlier sprints intercept `NEXT_PUBLIC_MODE=test` to bypass real Clerk logins while testing `admin-user` API scenarios.

### Project Structure Notes
- Existing Next.js 15 App router conventions apply. Mongoose schemas are stored in `models/`.
- `stores/adminContext.js` is the primary target for the performance-related refactor. Consider abstracting logic if the file is too large.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story-1-2`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#UX-Driven-Architecture-Technical-Impacts`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Design-Direction-Decision`]

## Dev Agent Record

### Agent Model Used
gemini-2.5-pro

### Debug Log References
N/A

### Completion Notes List
- Ultimate context engine analysis completed - comprehensive developer guide created
- Extracted strict requirements around Optimistic UI and React Context Render-Storm eradication from Architecture and UX Docs.
- Referenced previous Story 1.1 RBAC utilities.

### File List
- `stores/adminContext.js`
- `app/api/school_ai/eleves/route.js` (and peers)
- Sass styling tokens
