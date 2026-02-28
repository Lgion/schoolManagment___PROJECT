# Story 2.2: Intégration de l'Intelligence Artificielle (Gemini Vision)

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a System,
I want envoyer l'image capturée à l'API Gemini Vision et structurer la réponse JSON des notes extraites,
so that le travail humain de saisie soit remplacé par la machine en moins de 10 secondes.

## Acceptance Criteria

1. **Given** une image téléchargée
   **When** elle est envoyée au backend
   **Then** l'API Gemini est appelée et retourne un JSON formaté (avec scores de confiance par élève)
2. **Given** que l'extraction est réussie
   **When** la session se termine
   **Then** la photo de la copie (Base64) est définitivement supprimée côté serveur

## Tasks / Subtasks

- [ ] Task 1: Create Secure Hub API Endpoint (`/api/school_ai/extract-notes`) (AC: 1, 2)
  - [ ] Implement `checkRole` server validation using Clerk to restrict access to authenticated Teachers/Admins.
  - [ ] Implement image parsing (base64 or file upload) from the API request.
  - [ ] Connect to Google Gemini Vision API and pass the image along with a structured prompt.
- [ ] Task 2: Implement Robust AI Data Validation (AC: 1)
  - [ ] Define the strict JSON schema required from Gemini (Student name/ID, Grade, Confidence Score).
  - [ ] Parse and sanitize the response, ensuring grades are valid bounds (e.g., 0-20) and confidence scores are mapped correctly for frontend Soft Warnings.
- [ ] Task 3: Ensure Security and Data Privacy (NFR-SEC-2) (AC: 2)
  - [ ] Delete or nullify the image buffer immediately after successful or failed extraction. Ensure the image is NEVER saved to a persistent database or permanent disk location.
- [ ] Task 4: Frontend Integration
  - [ ] Hook up the existing `ImageScanner` component (created in Story 2.1) to send the captured image payload to the new `/api/school_ai/extract-notes` endpoint.
  - [ ] Handle the async transition state using the existing `<ProcessLoader />` component.
  - [ ] Resolve the data into a state that will be used by the Split-Screen reviewer (Story 2.3).

## Dev Notes

### Technical Requirements
- **Performance**: The full cycle must complete in under 10 seconds (NFR-PERF-3). Minimize payload sizes before sending to the backend if possible.
- **Security**: Server-side RBAC validation is critical. Do not trust the client.
- **Zero-Waste**: Place the API under the unified Hub (`/api/school_ai/`) to consolidate maintenance, as specified in the Architecture.

### Architecture Compliance
- The AI parsing results must be strictly validated before returning them to the frontend to ensure the application does not crash on malformed AI output.
- Optimistic UI/Asynchronous UX: The API call should not block the main thread.

### Library Framework Requirements
- Use Next.js 15 App Router standard API structure (`app/api/.../route.js`).
- Use `@google/generative-ai` SDK (ensure the package is installed or added).

### Previous Story Intelligence
From Story 2.1 (`2-1-prototype-dimport-dimage-et-skeletons.md`):
- `ImageScanner.jsx` handles image capture and provides the file/base64 payload.
- `ProcessLoader.jsx` handles shimmer loading gracefully.
- **CRITICAL UX/React Learnings**: The codebase review of 2.1 highlighted memory leak risks. Ensure any asynchronous React state updates (e.g., stopping the `ProcessLoader` when the API returns) are protected by an `isMounted` ref check. DO NOT use blocking browser alerts (`alert()`), use the application's Toast system.

### Project Structure Notes
- Route: `app/api/school_ai/extract-notes/route.js`
- Test files should be placed inside `__tests__` directories accompanying their subject files.

### References
- [Epic 2 - Saisie Magique](file:///home/nihongo/Bureau/BMAD/schoolManagment___PROJECT/_bmad-output/planning-artifacts/epics.md)
- [Architecture Decisions - Hub API & Validation Robuste](file:///home/nihongo/Bureau/BMAD/schoolManagment___PROJECT/_bmad-output/planning-artifacts/architecture.md)
- [PRD - NFR-SEC-2 (Data Ephemerality) & NFR-PERF-3 (10s SLA)](file:///home/nihongo/Bureau/BMAD/schoolManagment___PROJECT/_bmad-output/planning-artifacts/prd.md)

## Dev Agent Record

### Agent Model Used
antigravity-1.0

### Debug Log References
- Git history checked showing recent epic 1 completion and Story 2.1 implementation. Extracted `isMounted` and non-blocking toast insights from 2.1 review commits.

### Completion Notes List

### File List
