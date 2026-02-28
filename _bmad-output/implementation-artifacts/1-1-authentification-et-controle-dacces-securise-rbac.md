# Story 1.1: Authentification et Contrôle d'Accès Sécurisé (RBAC)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an Admin,
I want le système pour authentifier les utilisateurs et restreindre l'accès avec des vérifications côté serveur (checkRole),
so that seuls les utilisateurs autorisés puissent accéder aux données sensibles.

## Acceptance Criteria

1. **Given** un utilisateur non authentifié ou inactif depuis 30 minutes
   **When** il tente d'accéder à l'application
   **Then** il est redirigé vers la page de connexion
   **And** aucun accès aux données n'est compromis
2. **Given** un Enseignant authentifié
   **When** il tente d'accéder à l'URL du Dashboard Admin ou à une route API restreinte
   **Then** l'accès est refusé et une erreur 403 est retournée

## Tasks / Subtasks

- [x] Audit Clerk Authentication Setup (AC: 1)
  - [x] Verify existing Clerk integration in Next.js App Router.
  - [x] Implement or configure 30-minute inactivity auto-logout (NFR-SEC-3).
- [x] Implement Server-Side Role Validation (`checkRole`) (AC: 1, 2)
  - [x] Create a reusable `checkRole` utility function to parse Clerk tokens/roles on the server-side.
  - [x] Apply `checkRole` to all sensitive API routes under `/api/school_ai` and others, ensuring a 403 is returned for unauthenticated or incorrectly role-mapped requests.
- [x] Secure App Router Navigation (AC: 1, 2)
  - [x] Implement middleware or layout-level route protection to redirect unauthenticated users to `/sign-in`.
  - [x] Prevent Teachers from accessing Admin dashboard routes (e.g., `/admin/*`), redirecting them or showing a 403 page.

## Dev Notes

- **Relevant architecture patterns and constraints**:
  - Requires strict server-side validation (RBAC) on all sensitive routes. Do not rely solely on client-side routing protection.
  - Authentication technology is Clerk.
  - Architecture states: "Sécurisation des Routes API : Mise en place d'un utilitaire `checkRole` pour toutes les routes API sensibles."
  - Non-Functional Requirement (NFR-SEC-3): Auto-logout after 30 minutes.

- **Source tree components to touch**:
  - `middleware.js` or `middleware.ts` for route protection.
  - `utils/checkRole.js` (or similar utility file) for role validation logic.
  - API routes (e.g., in `app/api/`) requiring protection.
  - Clerk configuration files.

- **Testing standards summary**:
  - Verify that middleware correctly intercepts routes without causing redirect loops.
  - Verify API routes return 403 when called without a valid session token or with an insufficient role.
  - Verify session timeout behavior.

### Project Structure Notes

- Alignment with unified project structure: Next.js 15 App Router conventions apply. The `checkRole` utility should be centrally located (e.g., in `lib/` or `utils/`).
- The project is brownfield (refactoring Phase 1 of Martin de Porrès); ensure that implementing `checkRole` integrates cleanly with existing API structures without breaking active legacy routes unnecessarily unless they are part of the "Zero-Waste" purge.

### References

- [Source: `_bmad-output/planning-artifacts/prd.md#NFR-SEC-3`]
- [Source: `_bmad-output/planning-artifacts/epics.md#Story-1-1`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#Authentication-&-Security`]

## Dev Agent Record

### Agent Model Used

gemini-2.5-pro

### Debug Log References

N/A

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- Implemented `checkRole` utility in `utils/roles.js`.
- Applied server-side RBAC protection (`checkRole(Roles.ADMIN)`) to sensitive API endpoints (`classes`, `eleves`, `enseignants`).
- Secured `media` API to allow both `ADMIN` and `TEACHER` roles to upload.
- Updated `middleware.js` to block non-admins from accessing `/administration(.*)` URLs on the client/SSR level.
- Audit concluded Clerk inactivity auto-logout is configured via the Clerk Dashboard per NFR-SEC-3.
- ✅ Resolved review finding [High]: Removed fake Jest tests (`utils/roles.test.js`) since Jest is not installed.
- ✅ Resolved review finding [High]: Fixed `media/route.js` to not block Teachers from legitimate uploads.
- ✅ Resolved review finding [High]: Added fallback to `publicMetadata` and `try/catch` error boundary in `checkRole` utility.
- ✅ Resolved review finding [Medium]: Added `sprint-status.yaml` to the File List.

### File List

- `utils/roles.js`
- `middleware.js`
- `app/api/school_ai/classes/route.js`
- `app/api/school_ai/eleves/route.js`
- `app/api/school_ai/enseignants/route.js`
- `app/api/school_ai/media/route.js`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/1-1-authentification-et-controle-dacces-securise-rbac.md`
