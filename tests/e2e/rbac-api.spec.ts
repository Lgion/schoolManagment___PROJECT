import { test, expect } from '../support/merged-fixtures';

test.describe('RBAC API Protections (`checkRole`)', () => {

    const protectedAdminRoutes = [
        '/api/school_ai/classes',
        '/api/school_ai/eleves',
        '/api/school_ai/enseignants'
    ];

    test.describe('Unauthorized User Access', () => {
        for (const route of protectedAdminRoutes) {
            test(`Unauthorized user receives 401/403 on POST ${route}`, async ({ apiRequest, log }) => {
                await log.step('When an unauthenticated request is made to an admin route');
                const response = await apiRequest({
                    method: 'POST',
                    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
                    path: route,
                    body: { testData: 'should-fail' }
                });

                await log.step('Then the request is rejected as unauthorized');
                expect([401, 403]).toContain(response.status);
            });
        }

        test('Unauthorized user receives 401/403 on POST /media', async ({ apiRequest }) => {
            const response = await apiRequest({
                method: 'POST',
                baseUrl: process.env.BASE_URL || 'http://localhost:3000',
                path: '/api/school_ai/media',
                body: {}
            });
            expect([401, 403]).toContain(response.status);
        });
    });

    test.describe('Teacher (Enseignant) Access', () => {
        test.beforeEach(async ({ authOptions }) => {
            // Simulate auth for Teacher. This relies on the global auth provider being set up for Clerk.
            authOptions.userIdentifier = 'enseignant-user';
        });

        for (const route of protectedAdminRoutes) {
            test(`Teacher receives 403 Forbidden on POST ${route}`, async ({ apiRequest, authToken, log }) => {
                await log.step('When a Teacher attempts to post to an admin-only route');
                const response = await apiRequest({
                    method: 'POST',
                    path: route,
                    headers: { Authorization: `Bearer ${authToken}` },
                    body: { testData: 'should-fail' }
                });

                await log.step('Then the request is rejected as forbidden');
                expect(response.status).toBe(403);
            });
        }

        test('Teacher is permitted to upload on POST /media', async ({ apiRequest, authToken, log }) => {
            await log.step('When a Teacher attempts to upload media');
            const response = await apiRequest({
                method: 'POST',
                baseUrl: process.env.BASE_URL || 'http://localhost:3000',
                path: '/api/school_ai/media',
                headers: { Authorization: `Bearer ${authToken}` },
                body: { filename: 'test-upload.pdf' }
            });

            await log.step('Then the request is NOT rejected due to RBAC');
            // If the route logic fails for another reason (e.g., missing FormData), it might return 400.
            // But it should NOT return 401 or 403.
            expect([401, 403]).not.toContain(response.status);
        });
    });

    test.describe('Admin Access', () => {
        test.beforeEach(async ({ authOptions }) => {
            authOptions.userIdentifier = 'admin-user';
        });

        for (const route of protectedAdminRoutes) {
            test(`Admin is permitted on POST ${route}`, async ({ apiRequest, authToken, log }) => {
                await log.step('When an Admin posts to an admin-only route');
                const response = await apiRequest({
                    method: 'POST',
                    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
                    path: route,
                    headers: { Authorization: `Bearer ${authToken}` },
                    body: { testData: 'admin-action' }
                });

                await log.step('Then the request is NOT rejected due to RBAC');
                expect([401, 403]).not.toContain(response.status);
            });
        }
    });

});
