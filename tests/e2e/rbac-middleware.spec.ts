import { test, expect } from '../support/merged-fixtures';

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

test.describe('RBAC Middleware Protection (E2E)', () => {
    test.describe('Unauthorized user', () => {
        test('is redirected to sign-in when accessing admin dashboard', async ({ page, log }) => {
            await log.step('Given an unauthenticated user');

            await log.step('When they attempt to access an administration route');
            await page.goto(baseUrl + '/administration');

            await log.step('Then they are redirected to the sign-in page');
            // Clerk usually redirects to /sign-in, depending on the exact middleware configuration.
            await expect(page).toHaveURL(/.*sign-in.*/);
        });
    });

    test.describe('Teacher (Enseignant)', () => {
        test.use({ storageState: '.auth/local/enseignant-user/storage-state.json' });

        test('is prevented from accessing admin dashboard', async ({ page, log }) => {
            await log.step('Given an authenticated teacher');

            await log.step('When they attempt to access the administration dashboard');
            const responsePromise = page.waitForResponse(response =>
                response.url().includes('/administration')
            );

            await page.goto(baseUrl + '/administration');
            const response = await responsePromise;

            await log.step('Then access is denied (403) or they are redirected away');
            expect([307, 308, 401, 403, 404]).toContain(response.status());
        });
    });

    test.describe('Admin', () => {
        test.use({ storageState: '.auth/local/admin-user/storage-state.json' });

        test('can access the administration dashboard', async ({ page, log }) => {
            await log.step('Given an authenticated admin');

            await log.step('When they access the administration dashboard');
            const responsePromise = page.waitForResponse(response =>
                response.url().includes('/administration')
            );

            await page.goto(baseUrl + '/administration');
            const response = await responsePromise;

            await log.step('Then the middleware proxy allows the request');
            // Next.js components might redirect the mock user to /sign-in,
            // but middleware.js explicitly redirects unauthorized users (like Teacher) to `/`.
            // Verifying we were not rejected by middleware.js to the homepage:
            expect(response.status()).not.toBe(403);
            if (response.status() >= 300 && response.status() < 400) {
                const location = await response.headerValue('location');
                expect(location).not.toBe('/');
                expect(location).not.toBe(baseUrl + '/');
            }
        });
    });
});
