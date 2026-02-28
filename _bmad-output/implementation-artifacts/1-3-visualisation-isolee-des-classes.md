# Story 1.3: Visualisation Isolée des Classes

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Teacher,
I want visualiser uniquement les listes d'élèves des classes qui me sont assignées,
so that je puisse me concentrer sur mon périmètre éducatif sans voir les autres classes.

## Acceptance Criteria

1. **Given** un Enseignant connecté
   **When** il accède à ses classes
   **Then** il ne voit que les élèves qui lui sont liés dans le système
   **And** toute donnée financière est masquée

## Tasks / Subtasks

- [x] Task 1: Backend Security - Implement strict filtering for Teacher class access
  - [x] Update `/api/school_ai/classes/route.js` (or relevant endpoints) to filter classes by the authenticated Teacher's ID when role is `Enseignant`.
  - [x] Ensure that financial data is completely omitted from the payload if the user is an `Enseignant`.
- [x] Task 2: Frontend Data Fetching - Scoped Class Views
  - [x] Ensure the frontend fetching logic correctly requests and displays only the assigned classes.
  - [x] Validate that the UI reflects the scoped data without exposing other classes.
- [x] Task 3: UI Adjustments for Teacher Profile
  - [x] Hide any administrative columns/widgets (especially financial) from the UI if the current user is a Teacher.
  - [x] Ensure the Class view utilizes the "Classic Premium ERP" design tokens (Navy/Orange) and Skeleton loaders from previous stories.

## Dev Notes

### Technical Requirements
- **Security**: The API must enforce RBAC (Role-Based Access Control) using `checkRole(Roles.ENSEIGNANT)` or similar to ensure Teachers cannot bypass frontend filters. Data filtering MUST happen on the server.
- **Data Privacy**: No financial data should ever cross the network to a Teacher's client.
- **Optimistic UI & Performance**: Maintain the "Render-Storm free" principles established in Story 1.2. Any interactions within the assigned classes should respond instantly.

### Architecture Compliance
- **Zero-Waste**: Do not introduce new libraries or heavy components. Use the existing React Context and Sass variables (`_colors.scss`).
- **Hub Unified API**: Ensure API calls are correctly routed through the `/api/school_ai/` hub.

### File Structure Requirements
- Modify existing API routes rather than creating duplicates for Teachers. The route should be smart enough to return restricted data for Teachers and full data for Admins.

### Testing Requirements
- The backend filtering must be vigorously tested. An authenticated Teacher requesting `/api/school_ai/classes` should only receive their assigned classes and no financial data.

### Previous Story Intelligence
- **Story 1.1**: Established the `checkRole` utility in `utils/roles.js`.
- **Story 1.2**: Extracted components from Context Providers to eliminate Render-Storms and established the Optimistic UI pattern. These patterns MUST be maintained.

### Project Context Reference
- **Frontend**: Next.js 15 App Router, React 19.
- **Backend/DB**: Next.js Server Actions/API Routes, Mongoose.
- **Styling**: Sass (`app/assets/scss`).

### References
- [Source: `_bmad-output/planning-artifacts/epics.md#Story-1-3`]
- [Source: `_bmad-output/planning-artifacts/prd.md#Functional-Requirements`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#Authentication--Security`]

## Dev Agent Record

### Agent Model Used

gemini-2.5-pro

### Debug Log References

N/A

### Completion Notes List

- ✅ Task 1: Backend Security implemented with single `await auth()` pattern.
- ✅ Task 1: Omitted financial data from API responses for Teachers.
- ✅ Task 2: Frontend Data Fetching relies on the `/api/*` hub.
- ✅ Task 3: Financial data computation guarded inside `<PermissionGate role="admin">`.
- ✅ Code Review: Fixed missing `await` on `auth()`, eliminated redundant Clerk round-trips, cleaned debug `console.log`s, restricted "Ajouter une classe" to admin-only.

### File List

- `app/api/school_ai/classes/route.js` (Filtered classes for teachers, single auth call)
- `app/api/school_ai/eleves/route.js` (Filtered students, removed financial data, cleaned debug logs)
- `app/eleves/[id]/page.jsx` (Financial data computation moved inside admin PermissionGate)
- `app/classes/layout.jsx` ("Ajouter une classe" button restricted to admin-only)
