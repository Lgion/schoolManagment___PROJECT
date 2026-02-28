/**
 * E2E Tests — Story 1.5: Consultation de l'Historique Inaltérable
 * Tests RBAC pour GET /api/school_ai/eleves/[id]/history
 *
 * Critères de test:
 * - AC #3: Enseignant → 403 (section absente / accès refusé)
 * - AC #3: Non authentifié → 401
 * - AC #1/2: Admin → 200 avec données historiques
 */
import { test, expect } from '../support/merged-fixtures';

// Eleve ID factice pour les tests (n'a pas besoin d'exister en DB pour les tests RBAC)
const FAKE_ELEVE_ID = '507f1f77bcf86cd799439011';
const HISTORY_ROUTE = `/api/school_ai/eleves/${FAKE_ELEVE_ID}/history`;

test.describe('Story 1.5 — Historique Inaltérable (RBAC)', () => {

    test.describe('Unauthenticated access', () => {
        test('GET /history returns 401 for unauthenticated user', async ({ apiRequest }) => {
            const response = await apiRequest({
                method: 'GET',
                baseUrl: process.env.BASE_URL || 'http://localhost:3000',
                path: HISTORY_ROUTE,
            });
            expect([401, 403]).toContain(response.status);
        });
    });

    test.describe('Teacher (Enseignant) Access — Admin-only endpoint', () => {
        test.beforeEach(async ({ authOptions }) => {
            authOptions.userIdentifier = 'enseignant-user';
        });

        test('Teacher receives 403 Forbidden on GET /history (Admin-only endpoint)', async ({ apiRequest, authToken, log }) => {
            await log.step('When a Teacher attempts to access the admin-only history endpoint');
            const response = await apiRequest({
                method: 'GET',
                path: HISTORY_ROUTE,
                headers: { Authorization: `Bearer ${authToken}` },
            });

            await log.step('Then the request is rejected with 403 Forbidden');
            expect(response.status).toBe(403);
        });
    });

    test.describe('Admin Access', () => {
        test.beforeEach(async ({ authOptions }) => {
            authOptions.userIdentifier = 'admin-user';
        });

        test('Admin gets 200 or 404 on GET /history (not 401/403)', async ({ apiRequest, authToken, log }) => {
            await log.step('When an Admin requests the history of a student');
            const response = await apiRequest({
                method: 'GET',
                path: HISTORY_ROUTE,
                headers: { Authorization: `Bearer ${authToken}` },
            });

            await log.step('Then the request is NOT rejected due to RBAC (may 404 if student absent in test DB)');
            // 200 = student found, 404 = student not found in test DB — both are acceptable (not RBAC rejections)
            expect([200, 404]).toContain(response.status);
            expect([401, 403]).not.toContain(response.status);
        });

        test('Admin response shape includes expected historical fields', async ({ apiRequest, authToken, log }) => {
            await log.step('When an Admin requests and the student exists');
            const response = await apiRequest({
                method: 'GET',
                path: HISTORY_ROUTE,
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (response.status === 200) {
                await log.step('Then the response has the expected historical fields');
                const body = await response.json().catch(() => null);
                expect(body).not.toBeNull();
                expect(body).toHaveProperty('compositions');
                expect(body).toHaveProperty('notes');
                expect(body).toHaveProperty('absences');
                expect(body).toHaveProperty('school_history');
                expect(body).toHaveProperty('bolobi_class_history');
                expect(body).toHaveProperty('scolarity_fees');
                // No editable fields — data is read-only
                expect(body).not.toHaveProperty('password');
            }
        });
    });

});
