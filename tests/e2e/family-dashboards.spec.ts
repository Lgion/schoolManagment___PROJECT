import { test, expect } from '../support/merged-fixtures';

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Family Dashboards and Role Redirection (E2E)', () => {

    test.describe('Parent Account', () => {
        test.use({ storageState: '.auth/local/parent-user/storage-state.json' });

        test.beforeEach(({ authOptions }) => {
            authOptions.userIdentifier = 'parent-user';
        });

        test('is redirected to the Parent Dashboard on home page', async ({ page, log }) => {
            await log.step('Given an authenticated parent');

            await log.step('When they access the home page');
            await page.goto(baseUrl + '/');

            await log.step('Then they see the Parent Dashboard');
            const container = page.locator('.familyHome--parent');
            await expect(container).toBeVisible();

            const header = page.locator('.familyHome__title');
            await expect(header).toContainText('Bonjour');
        });

        test('is prevented from accessing the admin page', async ({ page, log }) => {
            await log.step('Given an authenticated parent');

            await log.step('When they attempt to access the administration dashboard');
            const responsePromise = page.waitForResponse(response =>
                response.url().includes('/administration')
            );
            await page.goto(baseUrl + '/administration');
            const response = await responsePromise;

            await log.step('Then access is denied or redirected');
            expect([307, 308, 401, 403, 404]).toContain(response.status());
        });
    });

    test.describe('Student Account', () => {
        test.use({ storageState: '.auth/local/eleve-user/storage-state.json' });

        test.beforeEach(({ authOptions }) => {
            authOptions.userIdentifier = 'eleve-user';
        });

        test('is redirected to the Student Space on home page', async ({ page, log }) => {
            await log.step('Given an authenticated student');

            await log.step('When they access the home page');
            await page.goto(baseUrl + '/');

            await log.step('Then they see the Student Space');
            const container = page.locator('.familyHome--student');
            await expect(container).toBeVisible();

            const header = page.locator('.familyHome__title');
            await expect(header).toContainText('Salut');
        });

        test('is prevented from accessing the admin page', async ({ page, log }) => {
            await log.step('Given an authenticated student');

            await log.step('When they attempt to access the administration dashboard');
            const responsePromise = page.waitForResponse(response =>
                response.url().includes('/administration')
            );
            await page.goto(baseUrl + '/administration');
            const response = await responsePromise;

            await log.step('Then access is denied or redirected');
            expect([307, 308, 401, 403, 404]).toContain(response.status());
        });
    });

});
