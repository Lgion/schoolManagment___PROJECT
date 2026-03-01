# Story 2.2: Intégration de l'Intelligence Artificielle (Gemini Vision)

Status: done

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

- [x] Task 1: Create Secure Hub API Endpoint (`/api/school_ai/extract-notes`) (AC: 1, 2)
  - [x] Implement `checkRole` server validation using Clerk to restrict access to authenticated Teachers/Admins.
  - [x] Implement image parsing (base64 or file upload) from the API request.
  - [x] Connect to Google Gemini Vision API and pass the image along with a structured prompt.
- [x] Task 2: Implement Robust AI Data Validation (AC: 1)
  - [x] Define the strict JSON schema required from Gemini (Student name/ID, Grade, Confidence Score).
  - [x] Parse and sanitize the response, ensuring grades are valid bounds (e.g., 0-20) and confidence scores are mapped correctly for frontend Soft Warnings.
- [x] Task 3: Ensure Security and Data Privacy (NFR-SEC-2) (AC: 2)
  - [x] Delete or nullify the image buffer immediately after successful or failed extraction. Ensure the image is NEVER saved to a persistent database or permanent disk location.
- [x] Task 4: Frontend Integration
  - [x] Hook up the existing `ImageScanner` component (created in Story 2.1) to send the captured image payload to the new `/api/school_ai/extract-notes` endpoint.
  - [x] Handle the async transition state using the existing `<ProcessLoader />` component.
  - [x] Resolve the data into a state that will be used by the Split-Screen reviewer (Story 2.3).

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
- Implemented `/api/school_ai/extract-notes` backend AI logic
- Integrated `ImageScanner` with compression features to avoid OOM
- Fixed Buffer ephemerality and Gemini Markdown issues.

### Senior Developer Review (AI)
**🔥 CODE REVIEW FINDINGS**
Reviewed by ERP_school on 2026-03-01.
**Git vs Story Discrepancies:** 20 files found in git history, but 0 documented in the story File List.
**Issues Found & Resolved Auto:** 
- **[CRITICAL] Security/Stability (OOM Risk):** `ImageScanner.jsx` was sending 10MB+ raw camera files causing NextJS limits & V8 Out-Of-Memory crashes. FIXED by adding `browser-image-compression` targeting 1MB. 
- **[CRITICAL] False Claims:** Story `File List` was completely empty. FIXED.
- **[MEDIUM] Data Ephemerality Bypass (NFR-SEC-2):** `buffer.fill(0)` left the original `arrayBuffer` intact causing memory retention. FIXED by running `new Uint8Array(arrayBuffer).fill(0)`.
- **[MEDIUM] Resilience (JSON Parsing):** Gemini occasionally wrapped json in markdown fences throwing 502s. FIXED by regex stripping fences prior to parse.
- **[MEDIUM] Limit Bounds:** Max grade arbitrarily clamped at 20. FIXED by relaxing bounds for 0-100 logic.

### File List
- `app/api/school_ai/extract-notes/route.js`
- `app/api/school_ai/extract-notes/__tests__/route.test.js`
- `app/components/ui/ImageScanner.jsx`
- `app/assets/scss/components/FORMS/imageScanner.scss`
- `app/classes/[id]/page.jsx`
- `package.json`
- `pnpm-lock.yaml`
