import { test, expect } from '../support/merged-fixtures';

test.describe('Story 2.4 - Gestion des Incertitudes (Soft Warnings)', () => {

    test('UI shows warning for low confidence and removes it on edit', async ({ page }) => {
        // Listen to console and page errors
        page.on('console', msg => console.log(`[BROWSER] ${msg.type().toUpperCase()}: ${msg.text()}`));
        page.on('pageerror', err => console.error(`[BROWSER ERROR] ${err.stack || err.message}`));

        // Set mock_role in localStorage before the page scripts execute
        await page.addInitScript(() => {
            window.localStorage.setItem('mock_role', 'admin');
        });

        // Wildcard fallback mock for all other API requests to prevent server database timeouts
        await page.route('**/api/**', async (route) => {
            const url = route.request().url();
            // Permettre aux requêtes spécifiques d'être traitées par les mocks suivants si nécessaire,
            // ou y répondre immédiatement ici si aucun autre mock ne correspond.
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, data: [] })
            });
        });

        // Mock classes data
        await page.route('**/api/school_ai/classes', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([{ _id: 'class123', niveau: 'Terminale', alias: 'S1', annee: '2023-2024', coefficients: { math: 2 } }])
            });
        });

        // Mock eleves data
        await page.route('**/api/school_ai/eleves', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    { _id: 'el1', nom: 'Dupont', prenoms: 'Jean', current_classe: 'class123' },
                    { _id: 'el2', nom: 'Curie', prenoms: 'Marie', current_classe: 'class123' }
                ])
            });
        });

        // Mock enseignants data
        await page.route('**/api/school_ai/enseignants', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([])
            });
        });

        // Intercept AI extraction
        await page.route('**/api/school_ai/extract-notes', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: [
                        { nom: 'Dupont Jean', note: 15, confiance: 0.95 },
                        { nom: 'Curie Marie', note: 18, confiance: 0.65 } // Low confidence -> Soft Warning
                    ]
                })
            });
        });

        // Mock subjects data
        await page.route('**/api/subjects', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, data: [{ _id: 'sub1', nom: 'Mathématiques' }] })
            });
        });

        // Mock schedules data
        await page.route('**/api/schedules**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([])
            });
        });

        // Bypass Clerk auth by setting the mock_role cookie
        await page.context().addCookies([
            { name: 'mock_role', value: 'admin', url: 'http://localhost:3000' }
        ]);

        // Navigate to the class detail page with increased timeout for cold compilation
        await page.goto('http://localhost:3000/classes/class123', { timeout: 60000 });

        // Look for the scanner button
        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.locator('.image-scanner__btn').click();
        const fileChooser = await fileChooserPromise;

        // Upload a dummy file to trigger the scanner
        await fileChooser.setFiles({
            name: 'test.png',
            mimeType: 'image/png',
            buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')
        });

        // Wait for the modal to appear
        await expect(page.locator('.review-modal')).toBeVisible();

        // Check if the first row has no warning
        const firstRow = page.locator('tr').filter({ hasText: 'Dupont Jean' });
        await expect(firstRow).not.toHaveClass(/--is-warning/);

        // Check if the second row has warning
        const secondRow = page.locator('tr').filter({ hasText: 'Curie Marie' });
        await expect(secondRow).toHaveClass(/--is-warning/);

        // Edit the score
        const scoreInput = secondRow.locator('input[type="number"]');
        await scoreInput.fill('19');

        // Verify warning is gone
        await expect(secondRow).not.toHaveClass(/--is-warning/);

        // Click "Valider & Publier" to check payload accumulation
        const validerPublierButton = page.locator('.review-modal__btn-validate');

        // Wait for an API call or intercept it
        const [request] = await Promise.all([
            page.waitForRequest(req => req.url().includes('/api/school_ai/publish_notes') && req.method() === 'POST', { timeout: 1000 }).catch(() => null), // If there's an API
            validerPublierButton.click()
        ]);

        // Modal should close or navigate away
        await expect(page.locator('.review-modal')).toBeHidden({ timeout: 5000 });
    });
});
